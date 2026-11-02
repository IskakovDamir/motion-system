import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {maybe, num, variantOf} from '../../engine/anim';
import type {Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {exitTiming, makeExitPresentation, RigLayer, variantLength} from './camera';
import {DemoCanvas, StaticLine, WordLine} from './demo';
import {spec} from './PullBack.spec';
import {zoomRig} from './zoom';

export type PullBackProps = {children: React.ReactNode; variant?: string};

/** Moves the whole layer it wraps: a pull-back about the variant's measured pivot, smeared on its fast pictures. */
export const PullBack: React.FC<PullBackProps> = ({children, variant}) => {
	const v = variantOf(spec, variant);
	const size = useVideoConfig();
	return (
		<RigLayer rig={zoomRig(v, size)} shutter={maybe(v, 'shutter')}>
			{children}
		</RigLayer>
	);
};

/** Reference frames from the start of the pull-back until its last motion has settled. */
export const pullBackLength = (variant?: string): number => variantLength(variantOf(spec, variant));

/**
 * TransitionSeries presentation (the pull-back that carries a scene change, v4's T04 / T05): the
 * outgoing scene pulls back, the incoming one, laid out at the wide framing, takes over when it ends.
 */
export const pullBackPresentation = makeExitPresentation(
	spec,
	(variant, size) => {
		const v = variantOf(spec, variant);
		return {rig: zoomRig(v, size), shutter: maybe(v, 'shutter')};
	},
	pullBackLength,
);

/** Timing for pullBackPresentation. */
export const pullBackTiming = (variant?: string) => exitTiming(pullBackLength(variant));

const TONE: Tone = spec.demoTone;
/** Below this end scale the pull-back shows more than three frames of canvas. */
const WIDE = 0.45;

/**
 * Isolated demo: the tiled canvas with its centre mark pulls back (five frames of it for the widest
 * pull-backs); with a screen-fixed headline when the reference keeps one; a close-up zoom-out lands
 * on one line of words at its measured rest size.
 */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const cap = maybe(v, 'lineCap');
	if (cap !== undefined) {
		return (
			<PullBack variant={variant}>
				<WordLine tone={TONE} cap={cap} at={[num(v, 'pivotX'), num(v, 'pivotY')]} text="one plain stone field" />
			</PullBack>
		);
	}
	const span = (maybe(v, 'toScale') ?? 1) < WIDE ? 5 : 3;
	return (
		<AbsoluteFill>
			<PullBack variant={variant}>
				<DemoCanvas tone={TONE} span={span} />
			</PullBack>
			{v.params?.still === 'headline' ? <StaticLine tone={TONE} text="one plain field" at={[50, 11]} /> : null}
		</AbsoluteFill>
	);
};
