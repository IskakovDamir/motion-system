import type {PrimitiveSpec} from '../motion/primitives/types';

/** Frames of rest before a primitive starts in PrimitiveProbe (comparison sheets align on this). */
export const PROBE_LEAD = 12;

/** Probe length of one variant: long enough for its demo and for its slowest motion to settle and hold. */
export const probeLength = (spec: PrimitiveSpec, variant: string): number => {
	const motions = Object.values(spec.variants[variant]?.motions ?? {});
	const settle = Math.max(0, ...motions.map((m) => Math.ceil(m.delay + m.duration))) + 30;
	return PROBE_LEAD + Math.max(spec.demoFrames, settle);
};
