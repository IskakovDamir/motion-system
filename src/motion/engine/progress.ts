import {Easing, interpolate, spring} from 'remotion';
import type {Ease, Motion} from '../tokens/easing';
import {REF_FPS} from '../tokens/timing';

// Every animated value in the primitives goes through progressAt(): the curve sampler
// (scripts/sample_curves.ts) calls the same function, so what verify.py measures is the code path
// the renders use.

const toRef = (frame: number, fps: number) => (frame * REF_FPS) / fps;

export const easeAt = (frame: number, duration: number, ease: Ease, fps = REF_FPS): number => {
	const f = toRef(frame, fps);
	if (ease.kind === 'bezier') {
		return interpolate(f, [0, duration], [0, 1], {
			easing: Easing.bezier(ease.x1, ease.y1, ease.x2, ease.y2),
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
	}
	if (ease.kind === 'linear') {
		return interpolate(f, [0, duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	}
	return spring({
		frame: Math.max(0, f),
		fps: REF_FPS,
		config: {stiffness: ease.stiffness, damping: ease.damping, mass: ease.mass},
	});
};

/** 0..1 progress of a motion token, `frame` counted from the moment the motion starts. */
export const progressAt = (frame: number, motion: Motion, fps = REF_FPS): number =>
	easeAt(frame - motion.delay, motion.duration, motion.ease, fps);

export const mix = (p: number, from: number, to: number) => from + (to - from) * p;

/** Frames (at the composition fps) a motion token needs before it is settled. */
export const motionLength = (motion: Motion, fps = REF_FPS) =>
	Math.ceil(((motion.delay + motion.duration) * fps) / REF_FPS);
