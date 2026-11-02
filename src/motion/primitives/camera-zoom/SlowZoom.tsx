import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {maybe, num, variantOf} from '../../engine/anim';
import type {Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {exitTiming, makeExitPresentation, RigLayer, variantLength} from './camera';
import {DemoCanvas, Ground, Lockup, Panel, StaticLine} from './demo';
import {spec} from './SlowZoom.spec';
import {zoomRig} from './zoom';

export type SlowZoomProps = {children: React.ReactNode; variant?: string};

/** Moves the whole layer it wraps: an eased push-in, a creep, or a linear drift at the measured rate. */
export const SlowZoom: React.FC<SlowZoomProps> = ({children, variant}) => {
	const v = variantOf(spec, variant);
	const size = useVideoConfig();
	return (
		<RigLayer rig={zoomRig(v, size)} shutter={maybe(v, 'shutter')}>
			{children}
		</RigLayer>
	);
};

/** Reference frames from the start of the zoom until it has settled (a drift: its measured span). */
export const slowZoomLength = (variant?: string): number => variantLength(variantOf(spec, variant));

/** TransitionSeries presentation: the outgoing scene keeps zooming up to the cut, the incoming one is cut in when it ends. */
export const slowZoomPresentation = makeExitPresentation(
	spec,
	(variant, size) => {
		const v = variantOf(spec, variant);
		return {rig: zoomRig(v, size), shutter: maybe(v, 'shutter')};
	},
	slowZoomLength,
);

/** Timing for slowZoomPresentation. */
export const slowZoomTiming = (variant?: string) => exitTiming(slowZoomLength(variant));

const TONE: Tone = spec.demoTone;

/**
 * Isolated demo. A layer zoom keeps a headline screen-fixed above a panel centred on the pivot; a
 * group zoom scales a lockup on the pivot over a still dot ground; a camera zoom moves the tiled
 * canvas with its centre mark.
 */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const at: [number, number] = [num(v, 'pivotX'), num(v, 'pivotY')];
	if (v.params?.still === 'headline') {
		return (
			<AbsoluteFill>
				<Ground tone={TONE} />
				<SlowZoom variant={variant}>
					<Panel tone={TONE} at={at} />
				</SlowZoom>
				<StaticLine tone={TONE} text="one plain field" at={[50, 11]} />
			</AbsoluteFill>
		);
	}
	if (v.params?.still === 'background') {
		return (
			<AbsoluteFill>
				<Ground tone={TONE} />
				<SlowZoom variant={variant}>
					<Lockup tone={TONE} at={at} />
				</SlowZoom>
			</AbsoluteFill>
		);
	}
	return (
		<SlowZoom variant={variant}>
			<DemoCanvas tone={TONE} />
		</SlowZoom>
	);
};
