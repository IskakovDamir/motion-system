import type React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {maybe, mix, num, variantOf} from '../../engine/anim';
import type {Tone} from '../../tokens/colors';
import {REF_FPS} from '../../tokens/timing';
import type {DemoProps, VariantSpec} from '../types';
import {exitTiming, list, makeExitPresentation, mot, nth, points, RigLayer, type Rig, stepIndex, still, variantLength} from './camera';
import {spec} from './SteppedZoom.spec';
import {DemoCanvas, NextScene} from './demo';

export type SteppedZoomProps = {children: React.ReactNode; variant?: string};

/** Reference frames from the first picture to the last picture of the move (before the next scene, when there is one). */
export const steppedZoomLength = (variant?: string): number => {
	const v = variantOf(spec, variant);
	const next = maybe(v, 'nextAt');
	return next !== undefined ? next - 1 : variantLength(v);
};

/**
 * Envelope time of a stepped move: frozen between steps, and during step k swept from the end of
 * step k-1 to the end of step k, so each step lands on the envelope and holds there.
 */
const steppedTime = (f: number, starts: number[], ends: number[]): number => {
	let prev = 0;
	for (let k = 0; k < starts.length; k++) {
		const a = nth(starts, k);
		const b = nth(ends, k);
		if (f < a) return prev;
		if (f < b) return prev + ((f - a) / (b - a)) * (b - prev);
		prev = b;
	}
	return prev;
};

/** The camera of a SteppedZoom variant: reference frames -> layer state. */
export const steppedZoomRig = (v: VariantSpec): Rig => {
	const envelope = mot(v, 'scale');
	const to = num(v, 'toScale');
	if (v.params?.stepFocus !== undefined) {
		// crops: each picture holds the envelope's scale at its step frame about its own centre
		const at = list(v, 'stepAt');
		const focus = points(v, 'stepFocus');
		const last = num(v, 'lastScale');
		const empty = num(v, 'emptyAt');
		return (_f, P, phase) => {
			if (phase >= empty) return {...still(), opacity: 0};
			const k = stepIndex(at, phase);
			if (k < 0) return still();
			const scaleOf = (i: number) => (i < 0 ? 1 : i === at.length - 1 ? last : mix(P(envelope, nth(at, i)), 1, to));
			const s = scaleOf(k);
			// a held crop carries the smear of its jump from the previous picture
			const dt = nth(at, k) - (k > 0 ? nth(at, k - 1) : 0);
			const [fx, fy] = nth(focus, k);
			return {...still(fx, fy), s, smear: {x: 0, y: 0, s: (s - scaleOf(k - 1)) / dt}};
		};
	}
	const starts = list(v, 'stepStart');
	const ends = list(v, 'stepEnd');
	const pivot = still(num(v, 'pivotX'), num(v, 'pivotY'));
	return (f, P) => ({...pivot, s: mix(P(envelope, steppedTime(f, starts, ends)), 1, to)});
};

export const SteppedZoom: React.FC<SteppedZoomProps> = ({children, variant}) => {
	const v = variantOf(spec, variant);
	return (
		<RigLayer rig={steppedZoomRig(v)} shutter={maybe(v, 'shutter')}>
			{children}
		</RigLayer>
	);
};

/** TransitionSeries presentation: the outgoing scene runs the steps (and its empty field), the incoming one appears when it ends. */
export const steppedZoomPresentation = makeExitPresentation(
	spec,
	(variant) => {
		const v = variantOf(spec, variant);
		return {rig: steppedZoomRig(v), shutter: maybe(v, 'shutter')};
	},
	steppedZoomLength,
);

/** Timing for steppedZoomPresentation. */
export const steppedZoomTiming = (variant?: string) => exitTiming(steppedZoomLength(variant));

const TONE: Tone = spec.demoTone;

/** Isolated demo: the tiled canvas with its centre mark under the steps; a crop stutter cuts to a plain next scene. */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const {fps} = useVideoConfig();
	if (maybe(v, 'nextAt') === undefined) {
		return (
			<SteppedZoom variant={variant}>
				<DemoCanvas tone={TONE} />
			</SteppedZoom>
		);
	}
	const cut = Math.ceil(((steppedZoomLength(variant) + 1) * fps) / REF_FPS);
	return (
		<AbsoluteFill>
			<Sequence durationInFrames={cut}>
				<SteppedZoom variant={variant}>
					<DemoCanvas tone={TONE} />
				</SteppedZoom>
			</Sequence>
			<Sequence from={cut}>
				<NextScene tone={TONE} />
			</Sequence>
		</AbsoluteFill>
	);
};
