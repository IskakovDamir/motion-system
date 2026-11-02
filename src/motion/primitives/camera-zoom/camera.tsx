import type React from 'react';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {DirectionalBlur} from '../../engine/blur';
import {progressAt} from '../../engine/progress';
import {motionTiming} from '../../engine/transition';
import {linear, motion, type Motion} from '../../tokens/easing';
import {REF_FPS} from '../../tokens/timing';
import type {PrimitiveSpec, VariantSpec} from '../types';

// The camera of this group, copied from camera-move/camera.tsx so both camera groups read the same:
// every primitive here moves one layer (the "scene") with a translation, a scale about a pivot, an
// opacity and an optional measured blur. A rig maps a time in reference frames (60 fps, 0 = the start
// of the move) to that state; CameraLayer renders it and smears the layer by its own speed, the way
// the references blur whatever moves fast.

/**
 * One instant of the camera: translation in px of the rendered frame, scale about the pivot (% of
 * frame), opacity, extra Gaussian blur in px; `smear` replaces the speed of a stepped move.
 */
export type Cam = {x: number; y: number; s: number; px: number; py: number; opacity: number; blur: number; smear?: Vel};

/** Change of x / y (px) and s per reference frame. */
export type Vel = {x: number; y: number; s: number};

/** Progress of a motion at a time in reference frames: clamped (positions) or extended past its ends (speeds). */
export type Prog = (m: Motion, f: number) => number;

/** A camera rig: state at reference frame `f`, with progress read through `P`. */
export type Rig = (f: number, P: Prog, phase: number) => Cam;

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

/** How far (reference frames) past its ends a motion is continued when its smear is read (covers the shutter). */
const EDGE = 2;

/**
 * Progress for reading smear: continued along the end tangent within two frames past the end, so a
 * zoom cut at speed still smears on its last picture. Unlike camera-move (whose cut-in moves arrive
 * moving), every smeared zoom here starts from rest, so nothing is continued before the start: the
 * first picture is sharp however steep the curve leaves it.
 */
export const extended: Prog = (m, f) => {
	const t = f - m.delay;
	return t < 0 || t > m.duration + EDGE ? progressAt(f, m) : along(m, f);
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

/** Frames (reference) until the last motion of a variant has settled. */
export const variantLength = (v: VariantSpec): number =>
	Math.max(0, ...Object.values(v.motions).map((m) => m.delay + m.duration));

const BOX_TO_SIGMA = 1 / Math.sqrt(12);
/** Zoom smear: one copy per this many px of radial smear at the farthest frame corner. */
const ZOOM_PX_PER_COPY = 4;
const ZOOM_MAX_COPIES = 24;

/**
 * Renders the scene under a camera state. With `shutter` (frames of travel smeared into one
 * picture, a measured box length), the layer is blurred along its travel (DirectionalBlur, the box
 * as a Gaussian of equal variance) and, while it scales fast, smeared radially from the pivot by
 * stacking copies across the shutter (the average of the scales the layer passes through).
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

// A zoom into a cut as a TransitionSeries presentation. The timing is a linear clock over the
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
