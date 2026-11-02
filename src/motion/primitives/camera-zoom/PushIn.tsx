import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {maybe, num, variantOf} from '../../engine/anim';
import type {Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {RigLayer} from './camera';
import {DemoCanvas, Device, Ground, StaticLine} from './demo';
import {spec} from './PushIn.spec';
import {zoomRig} from './zoom';

export type PushInProps = {children: React.ReactNode; variant?: string};

/** Moves the whole layer it wraps: a push-in about the variant's measured pivot, smeared on its fast pictures. */
export const PushIn: React.FC<PushInProps> = ({children, variant}) => {
	const v = variantOf(spec, variant);
	const size = useVideoConfig();
	return (
		<RigLayer rig={zoomRig(v, size)} shutter={maybe(v, 'shutter')}>
			{children}
		</RigLayer>
	);
};

const TONE: Tone = spec.demoTone;

/**
 * Isolated demo: the tiled canvas with its centre mark under the push; for a layer punch, a device
 * card with its upper middle on the pivot punches in while a line of words beside it keeps its size.
 */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	if (v.params?.still === 'headline') {
		return (
			<AbsoluteFill>
				<Ground tone={TONE} />
				<PushIn variant={variant}>
					<Device tone={TONE} at={[num(v, 'pivotX'), num(v, 'pivotY')]} />
				</PushIn>
				<StaticLine tone={TONE} text="stone" at={[8, 50]} align="left" />
				<StaticLine tone={TONE} text="river" at={[74, 50]} align="left" />
			</AbsoluteFill>
		);
	}
	return (
		<PushIn variant={variant}>
			<DemoCanvas tone={TONE} />
		</PushIn>
	);
};
