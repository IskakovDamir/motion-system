import type React from 'react';
import {useVideoConfig} from 'remotion';
import {maybe, mix, num, variantOf} from '../../engine/anim';
import type {Tone} from '../../tokens/colors';
import type {DemoProps, VariantSpec} from '../types';
import {along, mot, RigLayer, type Rig, still} from './camera';
import {spec} from './CanvasPan.spec';
import {DemoCanvas, HeadlineCanvas} from './demo';

export type CanvasPanProps = {children: React.ReactNode; variant?: string};

type Size = {width: number; height: number};

/** The camera of a CanvasPan variant: reference frames -> layer state. */
export const canvasPanRig = (v: VariantSpec, {width, height}: Size): Rig => {
	const W = (pct: number) => (pct / 100) * width;
	const H = (pct: number) => (pct / 100) * height;
	const pivot = still(maybe(v, 'pivotX'), maybe(v, 'pivotY'));

	const reframeAt = maybe(v, 'reframeAt');
	if (reframeAt !== undefined) {
		// whip with a hidden re-frame on its jump picture: the old framing keeps the ease-in's speed up to
		// the jump, the new framing (scaled, shifted) arrives moving and settles. How far along the canvas
		// the jump lands is not measured: the new framing starts where the old one is on the jump picture.
		const xIn = mot(v, 'x');
		const settle = mot(v, 'settle');
		const oldX = (f: number) => W(num(v, 'travelIn')) * along(xIn, f);
		const out = W(num(v, 'travelOut'));
		const landing = oldX(reframeAt) - out * (1 - along(settle, reframeAt));
		return (f, P, phase) => {
			if (phase < reframeAt) return {...pivot, x: oldX(f)};
			const p = f < settle.delay ? along(settle, f) : P(settle, f);
			return {...pivot, x: landing + out * (1 - p), y: H(num(v, 'reframeY')), s: num(v, 'toScale')};
		};
	}

	return (f, P) => {
		const m = v.motions;
		const x = m.x ? W(num(v, 'travelX')) * P(m.x, f) : 0;
		let y = m.y ? H(num(v, 'travelY')) * P(m.y, f) : 0;
		let s = m.scale ? mix(P(m.scale, f), 1, num(v, 'toScale')) : 1;
		if (m.drift) {
			y += H(num(v, 'driftY')) * P(m.drift, f);
			s *= mix(P(m.drift, f), 1, num(v, 'driftScale'));
		}
		const rate = maybe(v, 'driftPerFrame');
		if (rate !== undefined && m.y) y += H(rate) * Math.max(0, f - (m.y.delay + m.y.duration));
		return {...pivot, x, y, s};
	};
};

export const CanvasPan: React.FC<CanvasPanProps> = ({children, variant}) => {
	const v = variantOf(spec, variant);
	const size = useVideoConfig();
	return (
		<RigLayer rig={canvasPanRig(v, size)} shutter={maybe(v, 'shutter')}>
			{children}
		</RigLayer>
	);
};

const TONE: Tone = spec.demoTone;

/** Isolated demo: the tiled canvas (or, for the headline pan, a row of huge words) under the variant's camera. */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const cap = maybe(v, 'capHeight');
	return (
		<CanvasPan variant={variant}>
			{cap !== undefined ? <HeadlineCanvas tone={TONE} capHeight={cap} words={['plain', 'words', 'move', 'across']} /> : <DemoCanvas tone={TONE} />}
		</CanvasPan>
	);
};
