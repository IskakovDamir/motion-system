import React from 'react';
import {AbsoluteFill} from 'remotion';
import {maybe, mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FONT, fontSize} from '../../tokens/type';
import type {DemoProps} from '../types';
import {spec} from './CardSpin3D.spec';

export type CardSpin3DProps = {
	variant?: string;
	tone?: Tone;
	/** the card; halfTurn takes two children: the face seen at the start and the face it comes to rest on */
	children: React.ReactNode;
};

export const CardSpin3D: React.FC<CardSpin3DProps> = ({variant, children}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {w} = useFrame();
	const persp = maybe(v, 'perspective');
	const stage: React.CSSProperties = {perspective: persp === undefined ? undefined : w(persp)};

	if (name === 'halfTurn') {
		const [first, second] = React.Children.toArray(children);
		const angle = mix(p('rotate'), num(v, 'fromAngle'), num(v, 'toAngle'));
		const face: React.CSSProperties = {backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden'};
		return (
			<div style={stage}>
				<div style={{position: 'relative', transformStyle: 'preserve-3d', transform: `rotateY(${angle}deg)`}}>
					<div style={face}>{first}</div>
					<div style={{...face, position: 'absolute', inset: 0, transform: 'rotateY(180deg)'}}>{second ?? first}</div>
				</div>
			</div>
		);
	}
	if (name === 'yawRecede') {
		const angle = mix(p('rotate'), 0, num(v, 'angle'));
		const q = p('recede');
		const s = mix(q, 1, num(v, 'toScale'));
		return (
			<div style={stage}>
				<div style={{transform: `translateX(${w(mix(q, 0, num(v, 'shiftX')))}px) scale3d(${s}, ${s}, ${s}) rotateY(${angle}deg)`}}>{children}</div>
			</div>
		);
	}
	if (name === 'lightUp') {
		return <div style={{filter: `brightness(${mix(p('opacity'), num(v, 'fromLevel'), 1)})`}}>{children}</div>;
	}
	return <div style={{transform: `scale(${mix(p('scale'), num(v, 'fromScale'), 1)})`}}>{children}</div>;
};

/** Isolated demo: a plain rounded slab with a ring mark on one face and two words on the other. */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const s = scheme(spec.demoTone);
	const {height, w, h} = useFrame();
	const v = variantOf(spec, variant);
	// measured card widths where the variant has one; lightUp is a close-up of the same slab (its size before the push back)
	const width = w(maybe(v, 'width') ?? num(variantOf(spec, 'halfTurn'), 'width'));
	const slab = (content: React.ReactNode): React.ReactNode => (
		<div
			style={{
				width,
				height: width / 1.45,
				borderRadius: h(3),
				backgroundColor: s.accent,
				border: `${h(0.25)}px solid ${s.inkSoft}`,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: h(3),
			}}
		>
			{content}
		</div>
	);
	const ring = (
		<svg width={h(16)} height={h(16)} viewBox="0 0 100 100">
			<circle cx="50" cy="50" r="38" fill="none" stroke={s.onAccent} strokeWidth="12" />
			<circle cx="50" cy="50" r="12" fill={s.onAccent} />
		</svg>
	);
	const words = (
		<>
			<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: fontSize('headline', height), color: s.onAccent}}>Second side</div>
			<div style={{width: w(24), height: h(0.8), backgroundColor: s.muted}} />
			<div style={{fontFamily: FONT.ui, fontSize: fontSize('ui', height), color: s.muted}}>level 2 of 4</div>
		</>
	);
	const card =
		variant === 'halfTurn' ? (
			<CardSpin3D variant={variant} tone={spec.demoTone}>
				{slab(ring)}
				{slab(words)}
			</CardSpin3D>
		) : (
			<CardSpin3D variant={variant} tone={spec.demoTone}>
				{slab(words)}
			</CardSpin3D>
		);
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{transform: maybe(v, 'centerX') === undefined ? undefined : `translateX(${w((maybe(v, 'centerX') ?? 0) - 50)}px)`}}>{card}</div>
		</AbsoluteFill>
	);
};
