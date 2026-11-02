import type React from 'react';
import type {TransitionPresentation, TransitionPresentationComponentProps, TransitionTiming} from '@remotion/transitions';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {DirectionalBlur} from '../../engine/blur';
import {progressAt} from '../../engine/progress';
import {motionTiming} from '../../engine/transition';
import {scheme, type Tone} from '../../tokens/colors';
import {linear, motion, type Motion} from '../../tokens/easing';
import {REF_FPS} from '../../tokens/timing';
import type {VariantSpec} from '../types';

// The stage of this group: a transition is a list of layers, each a scene (outgoing or incoming)
// under its own camera, shown over a window of frames. The camera code (Cam, rigs, speed blur) is
// copied from camera-move/camera.tsx: every layer is smeared by its own speed through one measured
// shutter, so a whip blurs where it is fast and is sharp where it rests. The same layer list renders
// the isolated component (both scenes) and the TransitionSeries presentation (each side its own).

/**
 * One instant of a layer's camera: translation in px of the rendered frame, scale about the pivot
 * (% of frame), opacity, extra Gaussian blur in px; `smear` replaces the speed (a held picture has none).
 */
export type Cam = {x: number; y: number; s: number; px: number; py: number; opacity: number; blur: number; smear?: Vel};

/** Change of x / y (px) and s per reference frame. */
export type Vel = {x: number; y: number; s: number};

/** Progress of a motion at a time in reference frames. */
export type Prog = (m: Motion, f: number) => number;

/** A layer's camera at reference frame f (60 fps, 0 = the start of the transition). */
export type Rig = (f: number, P: Prog) => Cam;

export const still = (px = 50, py = 50): Cam => ({x: 0, y: 0, s: 1, px, py, opacity: 1, blur: 0});

/** Clamped progress: what the layer shows. */
export const clamped: Prog = (m, f) => progressAt(f, m);

/** End tangents are read over one reference frame, the way per-picture speeds are measured. */
const SLOPE_STEP = 1;

/** Progress continued past both ends of the motion along its end tangents, without limit. */
export const along: Prog = (m, f) => {
	const t = f - m.delay;
	if (t < 0) {
		const slope = (progressAt(m.delay + SLOPE_STEP, m) - progressAt(m.delay, m)) / SLOPE_STEP;
		return progressAt(m.delay, m) + slope * t;
	}
	if (t > m.duration) {
		const end = m.delay + m.duration;
		const slope = (progressAt(end, m) - progressAt(end - SLOPE_STEP, m)) / SLOPE_STEP;
		return progressAt(end, m) + slope * (t - m.duration);
	}
	return progressAt(f, m);
};

/** How far (reference frames) past its ends a motion is continued when its smear is read. */
const EDGE = 2;

/**
 * Progress for reading smear: continued along the end tangents within two frames of either end, so a
 * move cut at speed still smears on its last picture and one that arrives moving smears on its first.
 */
export const extended: Prog = (m, f) => {
	const t = f - m.delay;
	return t < -EDGE || t > m.duration + EDGE ? progressAt(f, m) : along(m, f);
};

/** State and speed of a rig at reference frame f; the speed is the displacement over the shutter window. */
export const sample = (rig: Rig, f: number, window = 1): {cam: Cam; vel: Vel} => {
	const cam = rig(f, clamped);
	if (cam.smear) return {cam, vel: cam.smear};
	const a = rig(f - window, extended);
	const b = rig(f, extended);
	return {cam, vel: {x: (b.x - a.x) / window, y: (b.y - a.y) / window, s: (b.s - a.s) / window}};
};

/** The current frame of the composition in reference frames (60 fps). */
export const useRefFrame = (): number => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (frame * REF_FPS) / fps;
};

/** The motion of a variant property; throws when the spec does not define it. */
export const mot = (v: VariantSpec, prop: string): Motion => {
	const m = v.motions[prop];
	if (!m) throw new Error(`variant has no motion ${prop}`);
	return m;
};

export const end = (m: Motion): number => m.delay + m.duration;

/** A list param ('1, 2.5, 3') as numbers. */
export const list = (v: VariantSpec, key: string): number[] => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a list (${String(x)})`);
	return x.split(/[\s,]+/).filter(Boolean).map(Number);
};

export const nth = <T,>(xs: T[], i: number): T => {
	const x = xs[i];
	if (x === undefined) throw new Error(`list has no item ${i}`);
	return x;
};

const BOX_TO_SIGMA = 1 / Math.sqrt(12);
/** Zoom smear: one copy per this many px of radial smear at the farthest frame corner. */
const ZOOM_PX_PER_COPY = 4;
const ZOOM_MAX_COPIES = 24;

/**
 * A scene under a camera state. With `shutter` (frames of travel smeared into one picture) the layer
 * is blurred along its travel (the box as a Gaussian of equal variance) and, while it scales fast,
 * smeared radially from the pivot by stacking copies across the shutter.
 */
export const CameraLayer: React.FC<{cam: Cam; vel?: Vel; shutter?: number; children: React.ReactNode}> = ({
	cam,
	vel = {x: 0, y: 0, s: 0},
	shutter,
	children,
}) => {
	const {width, height} = useVideoConfig();
	const box = shutter ?? 0;
	const ox = (cam.px / 100) * width;
	const oy = (cam.py / 100) * height;
	const reach = Math.max(Math.hypot(ox, oy), Math.hypot(width - ox, oy), Math.hypot(ox, height - oy), Math.hypot(width - ox, height - oy));
	const zoomSmear = box * Math.abs(vel.s) * reach;
	const copies = Math.min(ZOOM_MAX_COPIES, Math.max(1, Math.ceil(zoomSmear / ZOOM_PX_PER_COPY)));
	const blend = copies > 1 ? zoomSmear / (copies - 1) / 2 : 0;
	const bx = Math.hypot(box * BOX_TO_SIGMA * Math.abs(vel.x), cam.blur, blend);
	const by = Math.hypot(box * BOX_TO_SIGMA * Math.abs(vel.y), cam.blur, blend);
	const scales = copies === 1 ? [cam.s] : Array.from({length: copies}, (_, k) => cam.s + vel.s * box * (k / (copies - 1) - 1));
	return (
		<AbsoluteFill style={{opacity: Math.max(0, Math.min(1, cam.opacity))}}>
			<DirectionalBlur x={bx} y={by} style={{position: 'absolute', inset: 0}}>
				{scales.map((s, k) => (
					<div
						key={k}
						style={{
							position: 'absolute',
							inset: 0,
							transform: `translate(${cam.x}px, ${cam.y}px) scale(${s})`,
							transformOrigin: `${cam.px}% ${cam.py}%`,
							opacity: 1 / (k + 1),
						}}
					>
						{children}
					</div>
				))}
			</DirectionalBlur>
		</AbsoluteFill>
	);
};

// ---- layers and plans ----

/** Which node a layer shows: the scene of its side, that scene's sharp chrome, a title or an overlay. */
export type Part = 'scene' | 'chrome' | 'title' | 'overlay';

/** The same layout re-framed: the outgoing picture's last camera, then a scale about a pivot (% of frame). */
export type Reframe = {x: number; y: number; s: number; px: number; py: number; scale: number; spx: number; spy: number};

export type Layer = {
	side: 'from' | 'to';
	part?: Part;
	rig: Rig;
	/** frames (reference) in which the layer is on screen */
	on: (f: number) => boolean;
	/** speed blur: frames of travel smeared into one picture */
	shutter?: number;
	/** clip-path in frame space (a column band) */
	clip?: string;
};

export type Plan = {
	layers: Layer[];
	/** reference frames from the first change until the incoming scene stands alone at rest */
	length: number;
	/** how the incoming scene frames the outgoing layout when no `to` is given */
	reframe?: Reframe;
};

export type Size = {width: number; height: number};

export type Nodes = {
	from?: React.ReactNode;
	to?: React.ReactNode;
	fromChrome?: React.ReactNode;
	toChrome?: React.ReactNode;
	title?: React.ReactNode;
	overlay?: React.ReactNode;
};

/** The outgoing layout as the incoming scene: its last camera, then the measured re-frame. */
const Reframed: React.FC<{r: Reframe; children: React.ReactNode}> = ({r, children}) => (
	<AbsoluteFill style={{transform: `scale(${r.scale})`, transformOrigin: `${r.spx}% ${r.spy}%`}}>
		<AbsoluteFill style={{transform: `translate(${r.x}px, ${r.y}px) scale(${r.s})`, transformOrigin: `${r.px}% ${r.py}%`}}>{children}</AbsoluteFill>
	</AbsoluteFill>
);

const nodeOf = (layer: Layer, nodes: Nodes, reframe?: Reframe): React.ReactNode => {
	const part = layer.part ?? 'scene';
	if (part === 'title') return nodes.title;
	if (part === 'overlay') return nodes.overlay;
	if (layer.side === 'from') return part === 'chrome' ? nodes.fromChrome : nodes.from;
	if (part === 'chrome') return nodes.toChrome;
	if (nodes.to !== undefined) return nodes.to;
	return reframe ? <Reframed r={reframe}>{nodes.from}</Reframed> : nodes.from;
};

export const LayerView: React.FC<{layer: Layer; f: number; node: React.ReactNode}> = ({layer, f, node}) => {
	const {cam, vel} = layer.shutter ? sample(layer.rig, f, layer.shutter) : {cam: layer.rig(f, clamped), vel: undefined};
	return (
		<AbsoluteFill style={{visibility: layer.on(f) ? 'visible' : 'hidden', clipPath: layer.clip}}>
			<CameraLayer cam={cam} vel={vel} shutter={layer.shutter}>
				{node}
			</CameraLayer>
		</AbsoluteFill>
	);
};

/** Every layer of a plan at reference frame f over the tone's background (the isolated component). */
export const Stage: React.FC<{plan: Plan; f: number; nodes: Nodes; tone: Tone}> = ({plan, f, nodes, tone}) => (
	<AbsoluteFill style={{backgroundColor: scheme(tone).bg}}>
		{plan.layers.map((l, i) => {
			const node = nodeOf(l, nodes, plan.reframe);
			return node === undefined || node === null ? null : <LayerView key={i} layer={l} f={f} node={node} />;
		})}
	</AbsoluteFill>
);

// ---- TransitionSeries ----
// The timing is a steady clock over the plan's length (motionTiming of a linear motion), so the
// presentation rebuilds the frame and plays every measured motion of the variant at its own speed:
// the exiting side draws the background and the outgoing layers, the entering side the incoming
// ones. As with every TransitionSeries transition, the incoming sequence's own first frames run under
// the overlap. A plan of length 0 is a plain cut.

export type CutPresentationProps = {variant: string; tone: Tone; title?: React.ReactNode};

export const makePresentation = (planOf: (variant: string, size: Size) => Plan, defaultVariant: string) => {
	const Component: React.FC<TransitionPresentationComponentProps<CutPresentationProps>> = ({
		children,
		presentationDirection,
		presentationProgress,
		passedProps,
	}) => {
		const {width, height} = useVideoConfig();
		const plan = planOf(passedProps.variant, {width, height});
		const f = presentationProgress * plan.length;
		const side = presentationDirection === 'exiting' ? 'from' : 'to';
		const nodes: Nodes = side === 'from' ? {from: children} : {from: null, to: children, title: passedProps.title};
		const layers = plan.layers.filter((l) => l.side === side && (l.part ?? 'scene') !== 'chrome' && (l.part ?? 'scene') !== 'overlay');
		return (
			<AbsoluteFill style={side === 'from' ? {backgroundColor: scheme(passedProps.tone).bg} : undefined}>
				{layers.map((l, i) => {
					const node = nodeOf(l, nodes);
					return node === undefined || node === null ? null : <LayerView key={i} layer={l} f={f} node={node} />;
				})}
			</AbsoluteFill>
		);
	};
	return (variant?: string, tone: Tone = 'light', title?: React.ReactNode): TransitionPresentation<CutPresentationProps> => ({
		component: Component,
		props: {variant: variant ?? defaultVariant, tone, title},
	});
};

/** A steady clock over `length` reference frames. */
export const planTiming = (length: number): TransitionTiming => motionTiming(motion(length, linear));

// ---- small helpers for rigs ----

export const pct = (size: Size) => ({
	W: (p: number) => (p / 100) * size.width,
	H: (p: number) => (p / 100) * size.height,
});

/** A layer that is on screen from frame a (inclusive) to b (exclusive). */
export const between = (a: number, b = Infinity) => (f: number) => f >= a && f < b;
