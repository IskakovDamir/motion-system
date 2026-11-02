import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {num, variantOf} from '../../engine/anim';
import {mix, progressAt} from '../../engine/progress';
import {scheme, type Tone} from '../../tokens/colors';
import type {Motion} from '../../tokens/easing';
import {fontSize, FONT, TYPE} from '../../tokens/type';
import type {DemoProps, VariantSpec} from '../types';
import {greyOf, useRefFrame} from './light';
import {spec} from './ToneShift.spec';

// The tone is set as the wrapper's `color`: text inherits it, and fills drawn with currentColor
// take it too, so the element keeps its own layout and only its ink or fill changes.

export type ToneShiftProps = {
	/** focusShift: one child per line, the last one the new line */
	children: React.ReactNode;
	tone?: Tone;
	variant?: string;
};

const mot = (v: VariantSpec, prop: string): Motion => {
	const m = v.motions[prop];
	if (!m) throw new Error(`ToneShift variant has no motion ${prop}`);
	return m;
};

export const ToneShift: React.FC<ToneShiftProps> = ({children, tone = 'light', variant}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const f = useRefFrame();
	const {height} = useVideoConfig();
	const s = scheme(tone);
	const p = (prop: string) => progressAt(f, mot(v, prop));
	const from = () => num(v, 'fromTone');
	const to = () => num(v, 'toTone');
	const inked = (l: number, node: React.ReactNode, style?: React.CSSProperties) => <div style={{color: greyOf(s, l), ...style}}>{node}</div>;

	switch (name) {
		case 'twoStage':
			return inked(from() + (num(v, 'midTone') - from()) * p('stage1') + (to() - num(v, 'midTone')) * p('opacity'), children);
		case 'darkenIn':
			return inked(mix(p('opacity'), from(), to()), children);
		case 'lighten':
			return inked(mix(p('tone'), from(), to()), children);
		case 'dimToggle':
			return inked(from() + (to() - from()) * (p('dim') - p('back')), children);
		case 'focusShift': {
			const lines = React.Children.toArray(children);
			return (
				<>
					{lines.map((line, i) => {
						const age = lines.length - 1 - i;
						const l =
							age === 0
								? mix(p('fresh'), num(v, 'freshFrom'), to())
								: age === 1
									? mix(p('near'), num(v, 'nearFrom'), num(v, 'nearTo'))
									: mix(p('far'), num(v, 'farFrom'), num(v, 'farTo'));
						return <React.Fragment key={i}>{inked(l, line)}</React.Fragment>;
					})}
				</>
			);
		}
		default: {
			// sweep: the new tone is a copy of the element revealed behind a soft front running left to right
			const k = p('front');
			const front = (num(v, 'frontPx') * height) / 1080;
			const mask = `linear-gradient(90deg, black calc(${k * 100}% - ${(1 - k) * front}px), transparent calc(${k * 100}% + ${k * front}px))`;
			return (
				<div style={{position: 'relative', color: greyOf(s, from())}}>
					{children}
					<div style={{position: 'absolute', inset: 0, color: greyOf(s, to()), maskImage: mask, WebkitMaskImage: mask}}>{children}</div>
				</div>
			);
		}
	}
};

// ---- Demo: plain words, a label box and a small panel ----

const Words: React.FC<{text: string; role?: 'display' | 'headline'; weight?: number}> = ({text, role = 'display', weight = 700}) => {
	const {height} = useVideoConfig();
	return (
		<div style={{fontFamily: FONT.display, fontWeight: weight, fontSize: fontSize(role, height), letterSpacing: `${TYPE[role].tracking}em`, lineHeight: 1.15, whiteSpace: 'nowrap'}}>
			{text}
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const {height} = useVideoConfig();
	const l = scheme('light');
	const d = scheme('dark');
	const centre = (tone: Tone, node: React.ReactNode) => (
		<AbsoluteFill style={{backgroundColor: scheme(tone).bg, alignItems: 'center', justifyContent: 'center'}}>{node}</AbsoluteFill>
	);
	switch (variant) {
		case 'twoStage':
			return centre(
				'light',
				<ToneShift variant={variant}>
					<div style={{backgroundColor: 'currentColor', padding: '28px 64px', borderRadius: 6}}>
						<div style={{color: l.flash}}>
							<Words text="Seven Notes" role="headline" />
						</div>
					</div>
				</ToneShift>,
			);
		case 'darkenIn':
			return centre(
				'dark',
				<ToneShift variant={variant} tone="dark">
					<div style={{backgroundColor: 'currentColor', width: 560, padding: '30px 40px', borderRadius: 22, display: 'flex', flexDirection: 'column', gap: 26}}>
						{['Small', 'Medium', 'Large'].map((t) => (
							<div key={t} style={{color: d.ink, fontFamily: FONT.ui, fontSize: fontSize('ui', height) * 1.4}}>
								{t}
							</div>
						))}
					</div>
				</ToneShift>,
			);
		case 'lighten':
			return centre(
				'light',
				<ToneShift variant={variant}>
					<Words text="Harbor" />
				</ToneShift>,
			);
		case 'dimToggle':
			return centre(
				'light',
				<div style={{display: 'flex', gap: fontSize('display', height) * 0.3, color: l.ink}}>
					<Words text="open" />
					<ToneShift variant={variant}>
						<Words text="field" />
					</ToneShift>
				</div>,
			);
		case 'focusShift':
			return centre(
				'light',
				<div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
					<ToneShift variant={variant}>
						<Words text="1  sort the list" role="headline" weight={500} />
						<Words text="2  check the totals" role="headline" weight={500} />
						<Words text="3  send the summary" role="headline" weight={500} />
					</ToneShift>
				</div>,
			);
		default:
			return centre(
				'light',
				<div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
					<div style={{color: l.ink}}>
						<Words text="Plain words" />
					</div>
					<ToneShift variant={variant}>
						<Words text="turn a quiet grey" />
					</ToneShift>
				</div>,
			);
	}
};
