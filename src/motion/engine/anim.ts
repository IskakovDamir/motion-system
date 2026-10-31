import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {PrimitiveSpec, VariantSpec} from '../primitives/types';
import {mix, progressAt} from './progress';

// What every primitive component uses to read its spec: one variant, its motions as progress at
// the current frame, its measured params, and sizes relative to the frame. Components hold no
// timing or geometry numbers of their own; they come from here.

export const variantOf = (spec: PrimitiveSpec, variant?: string): VariantSpec => {
	const name = variant ?? spec.defaultVariant;
	const v = spec.variants[name];
	if (!v) throw new Error(`${spec.name} has no variant ${name}`);
	return v;
};

/** A measured param of the variant; throws when the spec does not define it. */
export const num = (v: VariantSpec, key: string): number => {
	const x = v.params?.[key];
	if (typeof x !== 'number') throw new Error(`variant param ${key} is not a number (${String(x)})`);
	return x;
};

export const str = (v: VariantSpec, key: string): string => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a string (${String(x)})`);
	return x;
};

export const flag = (v: VariantSpec, key: string): boolean => v.params?.[key] === true;

/** Optional param: the spec decides whether it exists; absent means the feature is off. */
export const maybe = (v: VariantSpec, key: string): number | undefined => {
	const x = v.params?.[key];
	return typeof x === 'number' ? x : undefined;
};

/**
 * Progress (0..1, may overshoot) of the variant's motion `prop` at the current frame, with frame 0
 * the start of the primitive. `offset` delays one instance (staggered words, cards ...).
 * A prop the variant does not animate is settled (1).
 */
export const useProgress = (spec: PrimitiveSpec, variant?: string) => {
	const frame = useCurrentFrame();
	const v = variantOf(spec, variant);
	return (prop: string, offset = 0): number => {
		const m = v.motions[prop];
		return m ? progressAt(frame - offset, m) : 1;
	};
};

/** Frame size helpers: params are % of frame width / height or px at 1080p; this turns them into px. */
export const useFrame = () => {
	const {width, height} = useVideoConfig();
	return {
		width,
		height,
		/** % of frame width -> px */
		w: (pct: number) => (pct / 100) * width,
		/** % of frame height -> px */
		h: (pct: number) => (pct / 100) * height,
		/** px measured on a 1080-high frame -> px at this frame height */
		px: (at1080: number) => (at1080 * height) / 1080,
	};
};

export {mix};
