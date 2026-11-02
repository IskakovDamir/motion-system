import type React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {maybe, mix, num, str, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {CAP_RATIO, FONT} from '../../tokens/type';
import {REF_FPS} from '../../tokens/timing';
import type {DemoProps, VariantSpec} from '../types';
import {exitTiming, list, makeExitPresentation, nth, RigLayer, type Rig, stepIndex, still, variantLength} from './camera';
import {spec} from './AccelerateExit.spec';
import {DemoCanvas, NextScene} from './demo';

export type AccelerateExitProps = {children: React.ReactNode; variant?: string};

type Size = {width: number; height: number};

/** Reference frames from the start of the exit to its last picture (the cut, or the picture where the layer is gone). */
export const accelerateExitLength = (variant?: string): number => {
	const v = variantOf(spec, variant);
	return maybe(v, 'goneAt') ?? variantLength(v);
};

/** The camera of an AccelerateExit variant: reference frames -> layer state. */
export const accelerateExitRig = (v: VariantSpec, {width, height}: Size): Rig => {
	const W = (pct: number) => (pct / 100) * width;
	const H = (pct: number) => (pct / 100) * height;
	const pivot = still(maybe(v, 'pivotX'), maybe(v, 'pivotY'));

	if (v.params?.stepAt !== undefined) {
		// a stepped exit with no curve: each picture holds its measured offset and carries the smear of its jump
		const at = list(v, 'stepAt');
		const dy = list(v, 'stepY').map(H);
		const gone = num(v, 'goneAt');
		return (_f, _P, phase) => {
			const k = stepIndex(at, phase);
			if (k < 0) return pivot;
			// the smear of a picture is its jump over the step interval (the first step uses the next interval)
			const dt = k > 0 ? nth(at, k) - nth(at, k - 1) : nth(at, Math.min(1, at.length - 1)) - nth(at, 0) || 1;
			const jump = nth(dy, k) - (k > 0 ? nth(dy, k - 1) : 0);
			return {...pivot, y: nth(dy, k), opacity: phase >= gone ? 0 : 1, smear: {x: 0, y: jump / dt, s: 0}};
		};
	}

	return (f, P) => {
		const m = v.motions;
		const x = m.x ? W(num(v, 'travelX')) * P(m.x, f) : 0;
		// an anticipation dip is where the exit starts from
		const y = m.y ? mix(P(m.y, f), m.dip ? H(num(v, 'dipY')) * P(m.dip, f) : 0, H(num(v, 'travelY'))) : 0;
		let s = m.scale ? mix(P(m.scale, f), 1, num(v, 'toScale')) : 1;
		if (m.punch) s *= mix(P(m.punch, f), 1, num(v, 'punchScale'));
		if (m.drift) s *= mix(P(m.drift, f), 1, num(v, 'driftScale'));
		return {...pivot, x, y, s};
	};
};

export const AccelerateExit: React.FC<AccelerateExitProps> = ({children, variant}) => {
	const v = variantOf(spec, variant);
	const size = useVideoConfig();
	return (
		<RigLayer rig={accelerateExitRig(v, size)} shutter={maybe(v, 'shutter')}>
			{children}
		</RigLayer>
	);
};

/** TransitionSeries presentation: the outgoing scene runs the exit, the incoming one is cut in when it ends. */
export const accelerateExitPresentation = makeExitPresentation(
	spec,
	(variant, size) => {
		const v = variantOf(spec, variant);
		return {rig: accelerateExitRig(v, size), shutter: maybe(v, 'shutter')};
	},
	accelerateExitLength,
);

/** Timing for accelerateExitPresentation: the variant's exit up to and including its cut picture. */
export const accelerateExitTiming = (variant?: string) => exitTiming(accelerateExitLength(variant));

const TONE: Tone = spec.demoTone;

/** A line of capitals placed so only the lowest `peek` % H of its `glyph` % H letters is in frame. */
const PeekLine: React.FC<{peek: number; glyph: number}> = ({peek, glyph}) => {
	const {width, height} = useVideoConfig();
	const s = scheme(TONE);
	return (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
			<text
				x={width / 2}
				y={(peek / 100) * height}
				textAnchor="middle"
				fontFamily={FONT.display}
				fontWeight={800}
				fontSize={((glyph / 100) * height) / CAP_RATIO.display}
				fill={s.ink}
			>
				LEVEL
			</text>
		</svg>
	);
};

/**
 * Isolated demo: the tiled canvas exits and is cut to a plain next scene on its last picture; for
 * the stepped peek exit, only a line cut off by the top edge leaves while the canvas stays.
 */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const {fps} = useVideoConfig();
	if (v.params?.stepAt !== undefined) {
		return (
			<AbsoluteFill>
				<DemoCanvas tone={TONE} mark={false} clearTop={0.2} />
				<AccelerateExit variant={variant}>
					<PeekLine peek={num(v, 'peek')} glyph={num(v, 'glyph')} />
				</AccelerateExit>
			</AbsoluteFill>
		);
	}
	const cut = Math.ceil(((accelerateExitLength(variant) + 1) * fps) / REF_FPS);
	return (
		<AbsoluteFill>
			<Sequence durationInFrames={cut}>
				<AccelerateExit variant={variant}>
					<DemoCanvas tone={TONE} mark={str(v, 'axis') === 'scale'} />
				</AccelerateExit>
			</Sequence>
			<Sequence from={cut}>
				<NextScene tone={TONE} />
			</Sequence>
		</AbsoluteFill>
	);
};
