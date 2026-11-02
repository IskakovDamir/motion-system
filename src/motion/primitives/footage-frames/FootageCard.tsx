import type React from 'react';
import {AbsoluteFill} from 'remotion';
import {flag, maybe, mix, num, str, useFrame, variantOf} from '../../engine/anim';
import {DirectionalBlur} from '../../engine/blur';
import {type Tone} from '../../tokens/colors';
import type {Footage} from '../footage/FootageSlot';
import type {DemoProps, VariantSpec} from '../types';
import {type Box, edgeSigma, Ground, PlateMark, progOf, rate, type Shot, ShotFill, shutterSigma, stepAt, useRefFrame} from './kit';
import {spec} from './FootageCard.spec';

export type FootageCardItem = Shot & {
	/** where the card sits when the variant does not measure it (centre and size, % of frame) */
	box?: Partial<Box>;
};

export type FootageCardProps = {
	footage?: Footage;
	tone?: Tone;
	variant?: string;
	/** small caption on the gray plate */
	label?: string;
	/** neutral overlay drawn on the card's footage */
	content?: React.ReactNode;
	/** placement where the variant does not measure it */
	box?: Partial<Box>;
	/** multi-card variants (depthGrow, scatterZoom): one card per item */
	items?: FootageCardItem[];
};

/** One card at one frame: centre and unscaled size in px, its scale and transform origin, corner radius and blur. */
type CardState = {cx: number; cy: number; w: number; h: number; s: number; origin: string; radius: number; bx: number; by: number};

type Size = {width: number; height: number};

const pct = (x: number, of: number) => (x / 100) * of;

// Every variant is a function of the reference frame f: the card's geometry and the speed blur of its
// edges (read from the geometry one frame earlier, the way the per-picture blur was measured).
const stateAt = (name: string, v: VariantSpec, f: number, size: Size, box: Partial<Box> | undefined, i: number): CardState => {
	const {width: W, height: H} = size;
	const P = (prop: string, at = f) => progOf(v, prop, at);
	const radiusOf = (w: number) => pct(maybe(v, 'radius') ?? 0, w);
	switch (name) {
		case 'zoomToFull': {
			const sAt = (at: number) => mix(P('scale', at), num(v, 'fromScale'), num(v, 'toScale'));
			const ds = rate(sAt, f);
			const ratio = num(v, 'edgeBlur');
			return {
				cx: pct(num(v, 'cx'), W),
				cy: pct(num(v, 'cy'), H),
				w: W,
				h: H,
				s: sAt(f),
				origin: '50% 50%',
				radius: 0,
				bx: edgeSigma(ratio, (ds * W) / 2),
				by: edgeSigma(ratio, (ds * H) / 2),
			};
		}
		case 'zoomFill': {
			const sAt = (at: number) => mix(P('scale', at), 1, num(v, 'toScale'));
			const ds = rate(sAt, f);
			const w = pct(num(v, 'fromW'), W);
			const h = pct(num(v, 'fromW'), H);
			const ratio = num(v, 'edgeBlur');
			return {
				cx: pct(num(v, 'cx'), W),
				cy: pct(num(v, 'cy'), H),
				w,
				h,
				s: sAt(f),
				origin: '50% 50%',
				// the card ends full-bleed: its corners square off as it fills (not measured: on the zoom's progress)
				radius: radiusOf(w) * Math.max(0, 1 - P('scale')),
				bx: edgeSigma(ratio, (ds * w) / 2),
				by: edgeSigma(ratio, (ds * h) / 2),
			};
		}
		case 'zoomToCentre': {
			const p = P('scale');
			const w = pct(num(v, 'fromW'), W);
			const top = pct(mix(p, num(v, 'fromTop'), num(v, 'toTop')), H);
			// the card's bottom is never seen: it reaches the frame's bottom edge at the start and stays below it
			const h = H - pct(num(v, 'fromTop'), H);
			return {
				cx: pct(mix(p, num(v, 'fromX'), num(v, 'toX')), W),
				cy: top + h / 2,
				w,
				h,
				s: mix(p, 1, num(v, 'toScale')),
				origin: '50% 0%',
				radius: radiusOf(w),
				bx: 0,
				by: 0,
			};
		}
		case 'diagonalSnap': {
			const m = v.motions.x;
			const delay = m ? m.delay : 0;
			// held drift pictures beyond the start, then the curve
			const q = (at: number) => (at < delay ? -stepAt(str(v, 'drift'), at, 0) : P('x', at));
			const posAt = (at: number) => ({x: pct(mix(q(at), num(v, 'fromX'), num(v, 'toX')), W), y: pct(mix(q(at), num(v, 'fromY'), num(v, 'toY')), H)});
			// speed: over the frame before; on a held picture, the drift's mean speed to the next picture
			const speedAt = (at: number) => {
				if (at < delay) {
					const steps = str(v, 'drift')
						.trim()
						.split(/\s+/)
						.map((s) => s.split(':').map(Number) as [number, number]);
					const k = steps.findIndex(([a], j) => at >= a && (j === steps.length - 1 || at < (steps[j + 1]?.[0] ?? Infinity)));
					const [a0, v0] = steps[Math.max(0, k)] ?? [0, 0];
					const next = steps[k + 1];
					const [a1, v1] = next ?? [delay, 0];
					return {dq: (v0 - v1) / Math.max(1, a1 - a0)};
				}
				return {dq: q(at) - q(at - 1)};
			};
			const {dq} = speedAt(f);
			const pos = posAt(f);
			const shutter = num(v, 'shutter');
			return {
				cx: pos.x,
				cy: pos.y,
				w: pct(num(v, 'cardW'), W),
				h: pct(num(v, 'cardH'), H),
				s: 1,
				origin: '50% 50%',
				radius: 0,
				bx: shutterSigma(shutter, pct(dq * (num(v, 'toX') - num(v, 'fromX')), W)),
				by: shutterSigma(shutter, pct(dq * (num(v, 'toY') - num(v, 'fromY')), H)),
			};
		}
		case 'shrinkToNode': {
			const p = P('scale');
			return {
				cx: pct(num(v, 'cx'), W),
				cy: pct(mix(p, num(v, 'fromY'), num(v, 'toY')), H),
				w: pct(num(v, 'cardW'), W),
				h: pct(num(v, 'cardH'), H),
				s: mix(p, 1, num(v, 'toScale')),
				origin: '50% 50%',
				radius: 0,
				bx: 0,
				by: 0,
			};
		}
		case 'depthGrow':
		case 'scatterZoom': {
			const off = i * (maybe(v, 'stagger') ?? 0);
			const p = Math.max(0, P('scale', f - off));
			const w = maybe(v, 'toW') !== undefined ? pct(num(v, 'toW'), W) : pct(box?.w ?? 0, W);
			return {
				cx: pct(box?.x ?? 50, W),
				cy: pct(box?.y ?? 50, H),
				w,
				h: pct(box?.h ?? 0, H),
				s: flag(v, 'area') ? Math.sqrt(p) : p,
				origin: '50% 50%',
				radius: 0,
				bx: 0,
				by: 0,
			};
		}
		default:
			throw new Error(`FootageCard has no variant ${name}`);
	}
};

const Card: React.FC<{state: CardState; shot: Shot; tone: Tone}> = ({state, shot, tone}) => (
	<DirectionalBlur x={state.bx} y={state.by} style={{position: 'absolute', inset: 0}}>
		<div
			style={{
				position: 'absolute',
				left: state.cx - state.w / 2,
				top: state.cy - state.h / 2,
				width: state.w,
				height: state.h,
				transform: `scale(${state.s})`,
				transformOrigin: state.origin,
				borderRadius: state.radius,
				overflow: 'hidden',
			}}
		>
			<ShotFill shot={shot} tone={tone} />
		</div>
	</DirectionalBlur>
);

// A card carrying footage, moved as one unit by its variant. Single-card variants take footage / label /
// content; depthGrow and scatterZoom take items, one card each, placed by their boxes (depthGrow's width is
// measured, so only the centre and height come from the box), each `stagger` frames after the previous one.
export const FootageCard: React.FC<FootageCardProps> = ({footage, tone = 'light', variant, label, content, box, items}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, name);
	const f = useRefFrame();
	const {width, height} = useFrame();
	const cards: FootageCardItem[] = items ?? [{footage, label, content, box}];
	return (
		<AbsoluteFill>
			{cards.map((c, i) => (
				<Card key={i} state={stateAt(name, v, f, {width, height}, c.box, i)} shot={c} tone={tone} />
			))}
		</AbsoluteFill>
	);
};

// ---- isolated demo ----

const DARK = new Set(['diagonalSnap', 'shrinkToNode', 'depthGrow']);

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = DARK.has(variant) ? 'dark' : 'light';
	const plate = (n: number, shape: 'disc' | 'square' | 'triangle' | 'bar' = 'disc'): Shot => ({content: <PlateMark tone={tone} n={n} shape={shape} />});
	if (variant === 'depthGrow') {
		// three 16:9 thumbnails in a row (on a 16:9 frame a 16:9 card's height in % H equals its width in % W)
		const items: FootageCardItem[] = [0, 1, 2].map((i) => ({...plate(i + 1, (['disc', 'square', 'triangle'] as const)[i]), box: {x: 22 + i * 28, y: 52, h: 25.52}}));
		return (
			<Ground tone={tone}>
				<FootageCard variant={variant} tone={tone} items={items} />
			</Ground>
		);
	}
	if (variant === 'scatterZoom') {
		const items: FootageCardItem[] = [0, 1, 2, 3, 4].map((i) => ({...plate(i + 1, (['disc', 'square', 'triangle', 'bar', 'disc'] as const)[i]), box: {x: 14 + i * 18, y: 50, w: 16, h: 50}}));
		return (
			<Ground tone={tone}>
				<FootageCard variant={variant} tone={tone} items={items} />
			</Ground>
		);
	}
	return (
		<Ground tone={tone}>
			<FootageCard variant={variant} tone={tone} {...plate(1)} label="footage" />
		</Ground>
	);
};
