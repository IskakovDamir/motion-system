import React from 'react';
import {AbsoluteFill} from 'remotion';
import {mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {splitText} from '../../engine/text';
import {scheme, type Tone} from '../../tokens/colors';
import {CAP_RATIO, FONT, fontSize, TYPE} from '../../tokens/type';
import type {DemoProps} from '../types';
import {FootageSlot} from '../footage/FootageSlot';
import {Keystone, type Quad} from './space';
import {spec} from './PerspectiveSwing.spec';

export type PerspectiveSwingProps = {
	variant?: string;
	tone?: Tone;
	/** taper / swingIn: one line or card; mirrorPair: a row (first and last turn, the rest stay level) */
	children: React.ReactNode;
	/** taper: mirror the keystone left-right (the opposite line of a counter-tapered pair) */
	flip?: boolean;
};

const rad = (deg: number) => (deg * Math.PI) / 180;

const Taper: React.FC<{variant?: string; flip: boolean; children: React.ReactNode}> = ({variant, flip, children}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant)('taper');
	const quad = (w: number, h: number): Quad => {
		const inset = (w * (1 - num(v, 'widthScale'))) / 2;
		const [near, far] = flip ? ['Right', 'Left'] : ['Left', 'Right'];
		const at = (key: string) => (mix(p, 0, num(v, key)) / 100) * h;
		const xl = mix(p, 0, inset);
		const xr = w - xl;
		return [
			[xl, at(`top${near}`)],
			[xr, at(`top${far}`)],
			[xr, h + at(`bottom${far}`)],
			[xl, h + at(`bottom${near}`)],
		];
	};
	return <Keystone quad={quad}>{children}</Keystone>;
};

const SwingIn: React.FC<{variant?: string; children: React.ReactNode}> = ({variant, children}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const angle = mix(p('rotate'), num(v, 'fromAngle'), 0);
	const scale = mix(p('scale'), num(v, 'fromScale'), 1);
	const from = num(v, 'typedFrom');
	let body: React.ReactNode = children;
	if (typeof children === 'string') {
		const pieces = splitText(children, 'char');
		const n = pieces.filter((x) => !x.space).length;
		const shown = (offset: number) => (from + (1 - from) * p('type', offset)) * n;
		const now = shown(0);
		const before = shown(num(v, 'freshFrames'));
		body = pieces.map((c, i) => {
			const visible = c.space || c.index < now;
			const fresh = !c.space && c.index >= before;
			return (
				<span key={i} style={{opacity: visible ? (fresh ? num(v, 'freshOpacity') : 1) : 0, whiteSpace: 'pre'}}>
					{c.text}
				</span>
			);
		});
	}
	// the line types on from its left end, which stays put while the line grows and levels (reference frames)
	return <div style={{transform: `rotate(${angle}deg) scale(${scale})`, transformOrigin: '0% 50%'}}>{body}</div>;
};

const MirrorPair: React.FC<{variant?: string; children: React.ReactNode}> = ({variant, children}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const turn = p('rotate');
	const back = p('back');
	const top = mix(back, mix(turn, num(v, 'fromAngle'), num(v, 'angle')), num(v, 'backAngle'));
	const bottom = mix(back, mix(turn, num(v, 'fromAngle'), num(v, 'bottomAngle')), num(v, 'backBottom'));
	const items = React.Children.toArray(children);
	return (
		<>
			{items.map((child, i) => {
				const sign = i === 0 ? 1 : i === items.length - 1 ? -1 : 0;
				if (sign === 0) return <div key={i}>{child}</div>;
				// side edges stay upright: only the top and bottom edges slope, about the card's centre
				const quad = (w: number, h: number): Quad => {
					const t = (w / 2) * Math.tan(rad(top)) * sign;
					const b = (w / 2) * Math.tan(rad(bottom)) * sign;
					return [
						[0, -t],
						[w, t],
						[w, h + b],
						[0, h - b],
					];
				};
				return (
					<Keystone key={i} quad={quad}>
						{child}
					</Keystone>
				);
			})}
		</>
	);
};

export const PerspectiveSwing: React.FC<PerspectiveSwingProps> = ({variant, children, flip = false}) => {
	const name = variant ?? spec.defaultVariant;
	if (name === 'swingIn') return <SwingIn variant={variant}>{children}</SwingIn>;
	if (name === 'mirrorPair') return <MirrorPair variant={variant}>{children}</MirrorPair>;
	return (
		<Taper variant={variant} flip={flip}>
			{children}
		</Taper>
	);
};

/** Isolated demo: wide caps lines (taper, swingIn) or a row of three gray plates with labels (mirrorPair). */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const s = scheme(spec.demoTone);
	const {height, w, h} = useFrame();
	const line = (size: number): React.CSSProperties => ({
		fontFamily: FONT.wide,
		fontWeight: 900,
		fontStretch: '125%',
		fontSize: size,
		lineHeight: CAP_RATIO.wide,
		color: s.ink,
		textTransform: 'uppercase',
		whiteSpace: 'nowrap',
		letterSpacing: '0.02em',
		display: 'block',
	});
	if (variant === 'swingIn') {
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={line(fontSize('display', height) * 0.87)}>
					<PerspectiveSwing variant={variant} tone={spec.demoTone}>
						move the line
					</PerspectiveSwing>
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'mirrorPair') {
		const card = (label: string) => (
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: h(2.4)}}>
				<div style={{width: w(18), height: h(42), borderRadius: h(2.6), overflow: 'hidden', position: 'relative'}}>
					<FootageSlot tone={spec.demoTone} />
				</div>
				<div style={{fontFamily: FONT.ui, fontWeight: 500, fontSize: fontSize('caption', height) * 0.7, color: s.inkSoft}}>{label}</div>
			</div>
		);
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{display: 'flex', gap: w(3.5), alignItems: 'flex-start'}}>
					<PerspectiveSwing variant={variant} tone={spec.demoTone}>
						{card('one')}
						{card('two')}
						{card('three')}
					</PerspectiveSwing>
				</div>
			</AbsoluteFill>
		);
	}
	const size = fontSize('display', height) * 0.9;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: h(TYPE.display.capHeight * 0.7)}}>
				<PerspectiveSwing variant={variant} tone={spec.demoTone} flip>
					<span style={line(size)}>shape</span>
				</PerspectiveSwing>
				<PerspectiveSwing variant={variant} tone={spec.demoTone}>
					<span style={line(size * 0.62)}>in depth</span>
				</PerspectiveSwing>
			</div>
		</AbsoluteFill>
	);
};
