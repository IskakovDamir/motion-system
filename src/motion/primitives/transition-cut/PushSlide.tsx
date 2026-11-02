import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {maybe, mix, num, variantOf} from '../../engine/anim';
import type {Tone} from '../../tokens/colors';
import type {DemoProps, VariantSpec} from '../types';
import {along, between, end, type Layer, list, makePresentation, mot, nth, type Plan, pct, planTiming, type Rig, type Size, Stage, still, useRefFrame} from './cut';
import {Columns, Panel, Phone, Thread} from './demo';
import {spec} from './PushSlide.spec';

/** The layers of a PushSlide variant. */
export const pushPlan = (v: VariantSpec, size: Size): Plan => {
	const {W, H} = pct(size);
	const shutter = maybe(v, 'shutter');
	const lengthOf = (extra = 0) => Math.max(extra, ...Object.values(v.motions).map(end));
	const travel = maybe(v, 'travel');

	if (travel !== undefined) {
		// one strip: the incoming scene sits `travel` below the outgoing one; with swapAt the swap is hidden
		const m = mot(v, 'y');
		const swap = maybe(v, 'swapAt');
		const dim = v.motions.dim;
		const blink = v.motions.blink;
		const from: Rig = (f, P) => ({...still(), y: -H(travel) * P(m, f)});
		const to: Rig = (f, P) => {
			const opacity =
				dim && blink
					? f < blink.delay
						? mix(P(dim, f), num(v, 'blinkFrom'), num(v, 'blinkFloor'))
						: mix(P(blink, f), num(v, 'blinkFloor'), 1)
					: 1;
			return {...still(), y: H(travel) * (1 - P(m, f)), opacity};
		};
		return {
			layers: [
				{side: 'from', rig: from, on: between(0, swap), shutter},
				{side: 'to', rig: to, on: between(swap ?? 0), shutter},
			],
			length: lengthOf(),
		};
	}

	const inY = num(v, 'inY');
	const outY = num(v, 'outY');

	if (v.motions.rise) {
		// easeInDrift: the curve is the outgoing drift, which runs on at its end speed until it is gone
		const m = mot(v, 'y');
		const rise = mot(v, 'rise');
		const land = mot(v, 'land');
		const gone = num(v, 'outGone');
		const from: Rig = (f) => ({...still(), y: H(outY) * along(m, f)});
		const to: Rig = (f, P) => ({
			...still(num(v, 'inPivotX'), num(v, 'inPivotY')),
			y: H(inY) * (1 - P(rise, f)),
			s: mix(P(land, f), num(v, 'inScale'), 1),
		});
		return {
			layers: [
				{side: 'from', rig: from, on: between(0, gone), shutter},
				{side: 'to', rig: to, on: between(rise.delay), shutter},
			],
			length: lengthOf(gone),
		};
	}

	const out = mot(v, 'out');
	const y = mot(v, 'y');
	const fade = v.motions.fade;
	// the exits never settle: the outgoing scene keeps its end speed (stacked fades it to a ghost)
	const from: Rig = (f, P) => ({...still(), y: H(outY) * along(out, f), opacity: fade ? 1 - P(fade, f) : 1});
	const fromLayer: Layer = {side: 'from', rig: from, on: between(0, fade ? end(fade) : Infinity), shutter};

	if (v.params?.columns !== undefined) {
		// rippleRise: the incoming scene in column bands, each rising `stagger` frames after the last
		const splits = list(v, 'columns');
		const edges = [0, ...splits, 100];
		const order = list(v, 'order');
		const stagger = num(v, 'stagger');
		const columns: Layer[] = order.map((c, k) => {
			const left = nth(edges, c);
			const right = nth(edges, c + 1);
			const rig: Rig = (f, P) => ({...still(), y: H(inY) * (1 - P(y, f - k * stagger))});
			return {side: 'to', rig, on: between(y.delay + k * stagger), shutter, clip: `inset(0 ${100 - right}% 0 ${left}%)`};
		});
		return {layers: [fromLayer, ...columns], length: lengthOf(y.delay + y.duration + stagger * (order.length - 1))};
	}

	const to: Rig = (f, P) => ({...still(), y: H(inY) * (1 - P(y, f))});
	return {layers: [fromLayer, {side: 'to', rig: to, on: between(y.delay), shutter}], length: lengthOf()};
};

export type PushSlideProps = {from: React.ReactNode; to: React.ReactNode; tone?: Tone; variant?: string};

export const PushSlide: React.FC<PushSlideProps> = ({from, to, tone = 'light', variant}) => {
	const f = useRefFrame();
	const size = useVideoConfig();
	return <Stage plan={pushPlan(variantOf(spec, variant), size)} f={f} nodes={{from, to}} tone={tone} />;
};

const planOf = (variant: string, size: Size) => pushPlan(variantOf(spec, variant), size);

/** TransitionSeries presentation: the outgoing scene is pushed up, the incoming one rises into place. */
export const pushSlidePresentation = makePresentation(planOf, spec.defaultVariant);

/** Its timing: a steady clock over the variant, until the incoming scene is at rest. */
export const pushSlideTiming = (variant?: string) => planTiming(planOf(variant ?? spec.defaultVariant, {width: 1920, height: 1080}).length);

// ---- Demo ----

const TONE: Tone = spec.demoTone;

/**
 * Isolated demo. stacked: a panel is pushed up and fades while an opaque page rises over it; dipRise and
 * sharedStrip: two layouts on the shared field; easeInDrift: a layout drifts out and a phone rises in;
 * rippleRise: a tall list scrolls away while three card columns rise in.
 */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const a = <Panel tone={TONE} word="north" number="24" shape={0} clear={variant !== 'stacked'} />;
	if (variant === 'easeInDrift') {
		return <PushSlide variant={variant} from={a} to={<Phone tone={TONE} x={num(v, 'inPivotX')} top={num(v, 'inPivotY')} />} />;
	}
	if (variant === 'rippleRise') {
		const xs = list(v, 'cards');
		const bands: [number, number][] = [0, 1, 2].map((c) => [nth(xs, 2 * c), nth(xs, 2 * c + 1)]);
		// the list is as tall as the scroll plus the place its bottom edge passes at the cut
		return (
			<PushSlide
				variant={variant}
				from={<Thread tone={TONE} tall={num(v, 'panelEdge') - num(v, 'outY')} />}
				to={<Columns tone={TONE} bands={bands} top={num(v, 'cardTop')} />}
			/>
		);
	}
	// stacked: an opaque page in the dark tone rises over the fading block
	const b =
		variant === 'stacked' ? (
			<Panel tone="dark" word="south" number="108" shape={1} flip />
		) : (
			<Panel tone={TONE} word="south" number="108" shape={1} alt flip clear />
		);
	return (
		<AbsoluteFill>
			<PushSlide variant={variant} from={a} to={b} />
		</AbsoluteFill>
	);
};
