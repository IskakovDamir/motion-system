import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {flag, maybe, mix, str, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FONT, fontSize} from '../../tokens/type';
import type {DemoProps, VariantSpec} from '../types';
import {along, between, end, type Layer, makePresentation, type Plan, pct, planTiming, type Rig, type Size, Stage, still, useRefFrame} from './cut';
import {Canvas, Panel, Window} from './demo';
import {spec} from './WhipCut.spec';

/** The layers of a WhipCut variant: the outgoing scene into the cut, the incoming one out of it. */
export const whipPlan = (v: VariantSpec, size: Size): Plan => {
	const {W, H} = pct(size);
	const axis = str(v, 'axis');
	const shutter = maybe(v, 'shutter');
	const strip = maybe(v, 'strip');

	if (strip !== undefined) {
		// one rigid canvas: both scenes ride the curve `strip` apart, both on screen throughout
		const m = v.motions[axis];
		if (!m) throw new Error(`WhipCut strip variant has no motion ${axis}`);
		const d = axis === 'x' ? W(strip) : H(strip);
		const at = (off: number): Cam0 => (axis === 'x' ? {x: off, y: 0} : {x: 0, y: off});
		const from: Rig = (f, P) => ({...still(), ...at(-d * P(m, f))});
		const to: Rig = (f, P) => ({...still(), ...at(d * (1 - P(m, f)))});
		return {
			layers: [
				{side: 'from', rig: from, on: between(0), shutter},
				{side: 'to', rig: to, on: between(0), shutter},
			],
			length: end(m),
		};
	}

	const outCurve = flag(v, 'outCurve');
	const outM = outCurve ? v.motions[axis] : v.motions.out;
	const inM = outCurve ? v.motions.in : v.motions[axis];
	if (!inM) throw new Error('WhipCut variant has no incoming motion');
	const blend = v.motions.blend;
	const grow = v.motions.grow;
	const blurM = v.motions.blur;
	const cut = blend ? blend.delay : inM.delay;
	const outEnd = outM ? end(outM) : 0;
	const run = maybe(v, 'outRun');
	const hold = maybe(v, 'hold');
	const outX = maybe(v, 'outX') ?? 0;
	const outY = maybe(v, 'outY') ?? 0;
	const outScale = maybe(v, 'outScale') ?? 1;
	const blurPeak = maybe(v, 'blurPeak');
	const outPivot = still(maybe(v, 'outPivotX'), maybe(v, 'outPivotY'));

	const from: Rig = (f, P) => {
		if (!outM) return outPivot;
		// a blend keeps the outgoing moving along its end speed; a streak runs on at its measured speed
		const p = blend ? along(outM, f) : P(outM, f);
		const runOn = run !== undefined && f > outEnd ? Math.sign(outX) * W(run) * (f - outEnd) : 0;
		const cam = {
			...outPivot,
			x: W(outX) * p + runOn,
			y: H(outY) * p,
			s: mix(p, 1, outScale),
			blur: blurPeak !== undefined ? W(blurPeak) * P(outM, f) : 0,
			opacity: blend ? 1 - P(blend, f) : 1,
		};
		// a stop-hold: the last pictures before the cut are crisp
		return hold !== undefined && f >= outEnd ? {...cam, smear: {x: 0, y: 0, s: 0}} : cam;
	};

	const inX = maybe(v, 'inX') ?? 0;
	const inY = maybe(v, 'inY') ?? 0;
	const inScale = maybe(v, 'inScale') ?? 1;
	const zoom = axis === 'scale' ? maybe(v, 'scaleJump') ?? 1 : undefined;
	const inPivot = zoom !== undefined ? still(maybe(v, 'pivotX'), maybe(v, 'pivotY')) : still(maybe(v, 'inPivotX'), maybe(v, 'inPivotY'));

	const to: Rig = (f, P) => {
		// inside a blend the incoming shot is already moving: its curve continued back along its start speed
		const p = blend && f < inM.delay ? along(inM, f) : P(inM, f);
		return {
			...inPivot,
			x: W(inX) * (1 - p),
			y: H(inY) * (1 - p),
			// the zoom variant ends at rest at x1: it enters at 1 / scaleJump of its rest framing
			s: zoom !== undefined ? zoom ** (p - 1) : grow ? mix(P(grow, f), inScale, 1) : 1,
			blur: blurPeak !== undefined && blurM ? W(blurPeak) * (1 - P(blurM, f)) : 0,
			opacity: blend ? P(blend, f) : 1,
		};
	};

	const fromOn = between(0, blend ? end(blend) : maybe(v, 'outGone') ?? cut);
	const toShutter = flag(v, 'sharpIn') ? undefined : shutter;
	const layers: Layer[] = [
		{side: 'from', rig: from, on: fromOn, shutter},
		{side: 'from', part: 'chrome', rig: from, on: fromOn},
		{side: 'to', rig: to, on: between(cut), shutter: toShutter},
		{side: 'to', part: 'chrome', rig: to, on: between(cut)},
	];
	const motions = Object.values(v.motions);
	const length = Math.max(...motions.map(end), maybe(v, 'outGone') ?? 0);
	// the same layout re-framed (when no `to` is given): its last outgoing camera, then the jump
	const reframe = {
		x: W(outX),
		y: H(outY),
		s: outScale,
		px: outPivot.px,
		py: outPivot.py,
		scale: ((maybe(v, 'scaleJump') ?? 1) * (maybe(v, 'punchRate') ?? 1)) / inScale,
		spx: maybe(v, 'pivotX') ?? 50,
		spy: maybe(v, 'pivotY') ?? 50,
	};
	return {layers, length, reframe: zoom === undefined ? reframe : undefined};
};

type Cam0 = {x: number; y: number};

export type WhipCutProps = {
	from: React.ReactNode;
	/** the incoming scene at rest; omitted, the outgoing layout is re-framed (the punch variants' closer framing) */
	to?: React.ReactNode;
	tone?: Tone;
	variant?: string;
	/** layerBlur: chrome that rides with each scene but stays sharp */
	fromChrome?: React.ReactNode;
	toChrome?: React.ReactNode;
};

export const WhipCut: React.FC<WhipCutProps> = ({from, to, tone = 'light', variant, fromChrome, toChrome}) => {
	const f = useRefFrame();
	const size = useVideoConfig();
	return <Stage plan={whipPlan(variantOf(spec, variant), size)} f={f} nodes={{from, to, fromChrome, toChrome}} tone={tone} />;
};

const planOf = (variant: string, size: Size) => whipPlan(variantOf(spec, variant), size);

/** TransitionSeries presentation: the outgoing scene whips into the cut, the incoming one arrives moving. */
export const whipCutPresentation = makePresentation(planOf, spec.defaultVariant);

/** Its timing: a steady clock over the variant, from the first move to the incoming scene at rest. */
export const whipCutTiming = (variant?: string) => planTiming(planOf(variant ?? spec.defaultVariant, {width: 1920, height: 1080}).length);

// ---- Demo ----

const TONE: Tone = spec.demoTone;

/** The window that fills the frame at the cut, drawn at its rest framing: scaleJump about the zoom's fixed point. */
const ZoomedWindow: React.FC<{v: VariantSpec}> = ({v}) => (
	<AbsoluteFill style={{backgroundColor: scheme(TONE).bgAlt}}>
		<AbsoluteFill style={{transform: `scale(${maybe(v, 'scaleJump') ?? 1})`, transformOrigin: `${maybe(v, 'pivotX') ?? 50}% ${maybe(v, 'pivotY') ?? 50}%`}}>
			<Window tone="dark" title="river" inset={0} action="share" />
		</AbsoluteFill>
	</AbsoluteFill>
);

/** A full-frame card (edges 3% inside the frame) on the canvas. */
const FullCard: React.FC = () => (
	<AbsoluteFill>
		<Canvas tone={TONE} seed="card" word="north" />
		<div style={{position: 'absolute', inset: '3%', borderRadius: 24, overflow: 'hidden'}}>
			<Panel tone={TONE} word="north" number="24" shape={0} />
		</div>
	</AbsoluteFill>
);

/**
 * Isolated demo: canvas "one" whips into canvas "two"; the punch and re-frame variants cut to a closer
 * or wider framing of the same canvas (no `to`); the zoom variant cuts from a full-frame card to a
 * window; layerBlur keeps the incoming window's chrome sharp over its smeared grid.
 */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const one = <Canvas tone={TONE} seed="one" word="one" />;
	const two = <Canvas tone={TONE} seed="two" word="two" alt />;
	if (variant === 'diagonalZoom') return <WhipCut variant={variant} from={<FullCard />} to={<ZoomedWindow v={v} />} />;
	if (variant === 'layerBlur') {
		return (
			<WhipCut
				variant={variant}
				from={<Panel tone={TONE} word="plain" number="61" shape={2} />}
				to={
					<AbsoluteFill style={{backgroundColor: 'transparent'}}>
						<Window tone={TONE} title="grid" contentOnly />
					</AbsoluteFill>
				}
				toChrome={<Window tone={TONE} title="grid" chromeOnly />}
			/>
		);
	}
	if (variant === 'canvasDown') {
		// one canvas: two layouts on the shared field, one strip apart
		return (
			<WhipCut
				variant={variant}
				from={<Panel tone={TONE} word="north" number="24" shape={0} clear />}
				to={<Panel tone={TONE} word="south" number="108" shape={1} alt flip clear />}
			/>
		);
	}
	if (variant === 'punchZoom') {
		// a value where the camera zooms in, so the closer framing lands on it
		const value = (
			<AbsoluteFill>
				{one}
				<ValueChip x={maybe(v, 'outPivotX') ?? 50} y={maybe(v, 'outPivotY') ?? 50} />
			</AbsoluteFill>
		);
		return <WhipCut variant={variant} from={value} />;
	}
	const reframed = (maybe(v, 'scaleJump') ?? 1) !== 1;
	return <WhipCut variant={variant} from={one} to={reframed ? undefined : two} />;
};

/** A number with a unit word, centred at (x, y) % of the frame. */
const ValueChip: React.FC<{x: number; y: number}> = ({x, y}) => {
	const s = scheme(TONE);
	const {height} = useVideoConfig();
	return (
		<div
			style={{
				position: 'absolute',
				left: `${x}%`,
				top: `${y}%`,
				transform: 'translate(-50%, -50%)',
				padding: `${height * 0.012}px ${height * 0.025}px`,
				borderRadius: height * 0.015,
				backgroundColor: s.ink,
				color: s.surface,
				fontFamily: FONT.mono,
				fontWeight: 600,
				fontSize: fontSize('headline', height),
				whiteSpace: 'nowrap',
			}}
		>
			3.5 m
		</div>
	);
};
