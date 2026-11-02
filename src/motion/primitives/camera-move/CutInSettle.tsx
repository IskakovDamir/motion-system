import type React from 'react';
import {useVideoConfig} from 'remotion';
import {maybe, mix, num, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps, VariantSpec} from '../types';
import {RigLayer, type Rig, still} from './camera';
import {spec} from './CutInSettle.spec';
import {DemoCanvas} from './demo';

export type CutInSettleProps = {
	children: React.ReactNode;
	variant?: string;
	tone?: Tone;
	/** fixed point of a punch-in framing, % of frame (else the variant's pivot) */
	focus?: [number, number];
};

type Size = {width: number; height: number};

/** The camera of a CutInSettle variant: reference frames from the cut -> layer state. */
export const cutInSettleRig = (v: VariantSpec, {width, height}: Size, focus?: [number, number]): Rig => {
	const W = (pct: number) => (pct / 100) * width;
	const H = (pct: number) => (pct / 100) * height;
	const pivot = focus ? still(focus[0], focus[1]) : still(maybe(v, 'pivotX'), maybe(v, 'pivotY'));
	const punch = maybe(v, 'punchScale');
	return (f, P) => {
		const m = v.motions;
		const x = m.x ? W(num(v, 'fromX')) * (1 - P(m.x, f)) : 0;
		const y = m.y ? H(num(v, 'fromY')) * (1 - P(m.y, f)) : 0;
		let s = m.scale ? mix(P(m.scale, f), num(v, 'fromScale'), 1) : 1;
		if (punch !== undefined) s *= punch;
		const opacity = m.opacity ? Math.min(1, Math.max(0, P(m.opacity, f))) : 1;
		const blur = m.blur ? W(num(v, 'fromBlur')) * Math.max(0, 1 - P(m.blur, f)) : 0;
		return {...pivot, x, y, s, opacity, blur};
	};
};

/** A pale band of the previous layout carried at the top of the new one (ghostCarry). */
const GhostBand: React.FC<{v: VariantSpec; tone: Tone}> = ({v, tone}) => (
	<div
		style={{
			position: 'absolute',
			left: `${num(v, 'ghostLeft')}%`,
			top: 0,
			width: `${num(v, 'ghostWidth')}%`,
			height: `${num(v, 'ghostHeight')}%`,
			backgroundColor: scheme(tone).surfaceAlt,
		}}
	/>
);

export const CutInSettle: React.FC<CutInSettleProps> = ({children, variant, tone = spec.demoTone, focus}) => {
	const v = variantOf(spec, variant);
	const size = useVideoConfig();
	return (
		<RigLayer rig={cutInSettleRig(v, size, focus)} shutter={maybe(v, 'shutter')}>
			{children}
			{v.params?.ghostLeft !== undefined ? <GhostBand v={v} tone={tone} /> : null}
		</RigLayer>
	);
};

const TONE: Tone = spec.demoTone;

/**
 * Isolated demo: frame 0 is the cut; the tiled canvas arrives under the variant's camera and
 * settles (with the ghost band, the top of the canvas is left to the band).
 */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const band = maybe(v, 'ghostHeight');
	return (
		<CutInSettle variant={variant} tone={TONE}>
			<DemoCanvas tone={TONE} clearTop={band !== undefined ? band / 100 : undefined} />
		</CutInSettle>
	);
};
