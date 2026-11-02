import type React from 'react';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {DirectionalBlur} from '../../engine/blur';
import {progressAt} from '../../engine/progress';
import {motionTiming} from '../../engine/transition';
import {linear, motion, type Motion} from '../../tokens/easing';
import {REF_FPS} from '../../tokens/timing';
import type {PrimitiveSpec, VariantSpec} from '../types';

// The camera of this group: every primitive here moves one layer (the "scene") with a translation,
// a scale about a pivot, an opacity and an optional measured blur. A rig maps a time in reference
// frames (60 fps, 0 = the start of the move) to that state; CameraLayer renders it and smears the
// layer by its own speed, the way the references blur whatever moves fast.

/**
 * One instant of the camera: translation in px of the rendered frame, scale about the pivot (% of
 * frame), opacity, extra Gaussian blur in px; `smear` replaces the speed of a stepped move (a
 * picture that jumps carries the smear of its jump).
 */
export type Cam = {x: number; y: number; s: number; px: number; py: number; opacity: number; blur: number; smear?: Vel};

/** Change of x / y (px) and s per reference frame. */
export type Vel = {x: number; y: number; s: number};

/** Progress of a motion at a time in reference frames: clamped (positions) or extended past its ends (speeds). */
export type Prog = (m: Motion, f: number) => number;

/**
 * A camera rig: state at reference frame `f`, with progress read through `P`; `phase` picks the
 * discrete parts of a move (a re-frame picture, a step), so the speed around an instant never spans
 * a jump.
 */
export type Rig = (f: number, P: Prog, phase: number) => Cam;

export const still = (px = 50, py = 50): Cam => ({x: 0, y: 0, s: 1, px, py, opacity: 1, blur: 0});

/** Clamped progress: what the layer shows. */
export const clamped: Prog = (m, f) => progressAt(f, m);

/** End tangents are read over one reference frame, the way per-picture speeds are measured. */
const SLOPE_STEP = 1;

/**
 * Progress continued past both ends of the motion along its end tangents, without limit: a move
 * that keeps its speed into a jump, or one that was already moving before it is seen.
 */
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

/** How far (reference frames) past its ends a motion is continued when its smear is read (covers the shutter). */
const EDGE = 2;

/**
 * Progress for reading smear: continued along the end tangents only within two frames of either
 * end, so a move cut at speed still smears on its last picture and a move that arrives moving smears
 * on its first, while a motion that has not started yet (or ended long ago) adds no speed.
 */
export const extended: Prog = (m, f) => {
	const t = f - m.delay;
	return t < -EDGE || t > m.duration + EDGE ? progressAt(f, m) : along(m, f);
};

/**
 * State and speed of a rig at reference frame `f`. The speed is the layer's displacement over the
 * `window` frames before `f` (the shutter, which integrates the past), divided by the window.
 */
export const sample = (rig: Rig, f: number, window = 1): {cam: Cam; vel: Vel} => {
	const cam = rig(f, clamped, f);
	if (cam.smear) return {cam, vel: cam.smear};
	const a = rig(f - window, extended, f);
	const b = rig(f, extended, f);
	return {cam, vel: {x: (b.x - a.x) / window, y: (b.y - a.y) / window, s: (b.s - a.s) / window}};
};

/** The current frame of the composition in reference frames (60 fps), so tokens play at their measured speed at any fps. */
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

/** Frames (reference) until the last motion of a variant has settled. */
export const variantLength = (v: VariantSpec): number =>
	Math.max(0, ...Object.values(v.motions).map((m) => m.delay + m.duration));

/** A list param ('1, 2.5, 3') as numbers. */
export const list = (v: VariantSpec, key: string): number[] => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a list (${String(x)})`);
	return x.split(/[\s,]+/).filter(Boolean).map(Number);
};

/** Item i of a list param; throws past its end. */
export const nth = <T,>(xs: T[], i: number): T => {
	const x = xs[i];
	if (x === undefined) throw new Error(`list has no item ${i}`);
	return x;
};

/** Pairs param ('10.7 92.8, 94.8 93.1') as [x, y] points. */
export const points = (v: VariantSpec, key: string): [number, number][] => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a point list (${String(x)})`);
	return x.split(',').map((p) => {
		const xy = p.trim().split(/\s+/).map(Number);
		return [nth(xy, 0), nth(xy, 1)];
	});
};

/** Index of the last step whose frame has been reached (-1 before the first). */
export const stepIndex = (at: number[], phase: number): number => {
	let k = -1;
	at.forEach((a, i) => {
		if (phase >= a) k = i;
	});
	return k;
};

const BOX_TO_SIGMA = 1 / Math.sqrt(12);
/** Zoom smear: one copy per this many px of radial smear at the farthest frame corner. */
const ZOOM_PX_PER_COPY = 4;
const ZOOM_MAX_COPIES = 24;

/**
 * Renders the scene under a camera state. With `shutter` (frames of travel smeared into one
 * picture, a measured box length), the layer is blurred along its travel (DirectionalBlur, the box
 * as a Gaussian of equal variance) and, while it scales fast, smeared radially from the pivot by
 * stacking copies across the shutter (the average of the scales the layer passes through). The
 * zoom smear averages correctly for an opaque scene.
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
	// a Gaussian of half the gap between copies (at the farthest corner) blends the copies into one smear
	const blend = copies > 1 ? zoomSmear / (copies - 1) / 2 : 0;
	const bx = Math.hypot(box * BOX_TO_SIGMA * Math.abs(vel.x), cam.blur, blend);
	const by = Math.hypot(box * BOX_TO_SIGMA * Math.abs(vel.y), cam.blur, blend);
	const scales =
		copies === 1 ? [cam.s] : Array.from({length: copies}, (_, k) => cam.s + vel.s * box * (k / (copies - 1) - 1));
	return (
		<AbsoluteFill style={{opacity: cam.opacity}}>
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

/** A rig played on the composition clock: the scene under its camera at the current frame. */
export const RigLayer: React.FC<{rig: Rig; shutter?: number; children: React.ReactNode}> = ({rig, shutter, children}) => {
	const f = useRefFrame();
	const {cam, vel} = sample(rig, f, shutter);
	return (
		<CameraLayer cam={cam} vel={vel} shutter={shutter}>
			{children}
		</CameraLayer>
	);
};

// Exit into a cut as a TransitionSeries presentation. The timing is a linear clock over the
// variant's length (motionTiming of that clock motion), so the presentation can rebuild the frame
// and play every motion of the variant at its measured speed: the outgoing scene runs the rig and
// the incoming one appears only when the transition ends, which is the cut. The incoming scene's
// first frames run hidden under the overlap, as with every TransitionSeries transition.

export type ExitPresentationProps = {length: number; spec: string; variant: string};

/** Reference frames a variant's exit clock runs. */
export const clockMotion = (length: number): Motion => motion(length, linear);

/** The exit clock covers frames 0..length: the last one is the cut picture, where the move ends. */
export const exitTiming = (length: number) => motionTiming(clockMotion(length + 1));

export const makeExitPresentation = (
	spec: PrimitiveSpec,
	rigOf: (variant: string, size: {width: number; height: number}) => {rig: Rig; shutter?: number},
	lengthOf: (variant: string) => number,
) => {
	const Component: React.FC<TransitionPresentationComponentProps<ExitPresentationProps>> = ({
		presentationProgress,
		presentationDirection,
		passedProps,
		children,
	}) => {
		const {width, height} = useVideoConfig();
		if (presentationDirection === 'entering') {
			return <AbsoluteFill style={{opacity: presentationProgress >= 1 ? 1 : 0}}>{children}</AbsoluteFill>;
		}
		const {rig, shutter} = rigOf(passedProps.variant, {width, height});
		const {cam, vel} = sample(rig, presentationProgress * (passedProps.length + 1), shutter);
		return (
			<CameraLayer cam={cam} vel={vel} shutter={shutter}>
				{children}
			</CameraLayer>
		);
	};
	return (variant?: string): TransitionPresentation<ExitPresentationProps> => {
		const name = variant ?? spec.defaultVariant;
		return {component: Component, props: {length: lengthOf(name), spec: spec.name, variant: name}};
	};
};
