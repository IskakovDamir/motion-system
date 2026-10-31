import type {Motion} from '../tokens/easing';

export type PrimitiveKind = 'text' | 'transition' | 'ui' | '3d' | 'footage' | 'shape' | 'camera' | 'fx' | 'layout';

export type VariantSpec = {
	/** property -> motion token the component animates that property with */
	motions: Record<string, Motion>;
	/** property -> technique ids (analysis/<video>/timeline.md) whose measured curve this property reproduces */
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
