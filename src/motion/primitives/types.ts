import type {Motion} from '../tokens/easing';

export type PrimitiveKind = 'text' | 'transition' | 'ui' | '3d' | 'footage' | 'shape' | 'camera' | 'fx' | 'layout';

/** Measured geometry of a variant: travel in % of frame width or height, scales, degrees, px at 1080p. */
export type Params = Record<string, number | string | boolean>;

export type VariantSpec = {
	/** property -> motion token the component animates that property with */
	motions: Record<string, Motion>;
	/** measured amplitudes and options the component reads (no timing here: timing lives in motions) */
	params?: Params;
	/** property -> technique ids (the timelines' technique index) whose measured curve this property reproduces */
	reproduces?: Record<string, string[]>;
	/** technique ids that map to this variant without a per-frame curve (layout rules, hard cuts ...) */
	covers?: string[];
};

export type PrimitiveSpec = {
	name: string;
	kind: PrimitiveKind;
	description: string;
	defaultVariant: string;
	variants: Record<string, VariantSpec>;
	/** frames the isolated demo needs in MotionShowcase and PrimitiveProbe (60 fps) */
	demoFrames: number;
	/** background of the isolated demo */
	demoTone: 'light' | 'dark';
};

export type DemoProps = {variant: string};
