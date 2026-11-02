import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DirectionalBlur} from '../../engine/blur';
import {maybe, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {spec} from './EdgeRise.spec';
import {inkOf, speedOf, streakOf, TextCells, typeCss, typeOf, type Align, type Unit} from './textKit';

export type EdgeRiseProps = {
	text: string;
	tone?: Tone;
	variant?: string;
	/** a mark that leads the text (its own rise, leadY / leadRise), set left of it */
	children?: React.ReactNode;
};

export const EdgeRise: React.FC<EdgeRiseProps> = ({text, tone = 'light', variant, children}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {h, height} = useFrame();
	const t = typeOf(v);
	const rise = maybe(v, 'rise') ?? 0;
	const leadRise = maybe(v, 'leadRise') ?? rise;
	const stagger = maybe(v, 'stagger') ?? 0;
	const exposure = maybe(v, 'exposure');
	const typeRate = maybe(v, 'typeRate');
	// a unit is not in the picture before its own move starts (it comes from beyond the frame edge)
	const startOf = (prop: string, off: number) => (v.motions[prop]?.delay ?? 0) + off;
	const blurOf = (prop: string, off: number, travel: number) =>
		exposure === undefined ? 0 : streakOf(speedOf(p, prop, off) * Math.abs(h(travel)), exposure);
	const lead = children ? (
		<DirectionalBlur
			y={blurOf('leadY', 0, leadRise)}
			style={{transform: `translateY(${h(leadRise) * (1 - p('leadY'))}px)`, opacity: frame >= startOf('leadY', 0) ? 1 : 0}}
		>
			{children}
		</DirectionalBlur>
	) : null;
	return (
		<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			{lead}
			<TextCells
				text={text}
				unit={str(v, 'unit') as Unit}
				css={{...typeCss(t, height), color: inkOf(v, 'ink', tone)}}
				align={str(v, 'align') as Align}
				blurred={exposure !== undefined}
				look={(c) => {
					const off = c.index * stagger;
					const typed = (typeRate === undefined || frame >= c.index * typeRate) && frame >= startOf('y', off);
					return {
						style: {transform: `translateY(${h(rise) * (1 - p('y', off))}px)`, opacity: typed ? 1 : 0},
						blurY: blurOf('y', off, rise),
					};
				}}
			/>
		</div>
	);
};

// ---- Demo ----

const TEXT: Record<string, string> = {
	springUp: 'Field notes',
	dropBounce: 'Quiet hours',
	typeRise: 'Plan-Build-Check',
	popDrop: 'map',
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = spec.demoTone;
	const s = scheme(tone);
	const {height} = useFrame();
	const mark = height * 0.1;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
			{variant === 'springUp' ? (
				<EdgeRise variant={variant} tone={tone} text={TEXT[variant] ?? ''}>
					<svg width={mark} height={mark} viewBox="0 0 10 10" style={{marginRight: mark * 0.3}}>
						<circle cx="5" cy="5" r="5" fill={s.ink} />
						<circle cx="5" cy="5" r="2" fill={s.bg} />
					</svg>
				</EdgeRise>
			) : (
				<EdgeRise variant={variant} tone={tone} text={TEXT[variant] ?? 'plain words'} />
			)}
		</AbsoluteFill>
	);
};
