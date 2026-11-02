import type React from 'react';
import {AbsoluteFill} from 'remotion';
import {flag, maybe, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {TYPE} from '../../tokens/type';
import type {DemoProps} from '../types';
import {spec} from './RiseFade.spec';
import {inkOf, TextCells, typeCss, typeOf, type Align, type Unit} from './textKit';

export type RiseFadeProps = {
	/** the text; split into the variant's units */
	text?: string;
	/** a block (a mark, a shape) that moves as one unit, with the first unit of the text when both are given */
	children?: React.ReactNode;
	tone?: Tone;
	variant?: string;
};

export const RiseFade: React.FC<RiseFadeProps> = ({text, children, tone = 'light', variant}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {h, height} = useFrame();
	const rise = maybe(v, 'rise') ?? 0;
	const stagger = maybe(v, 'stagger') ?? 0;
	const dim = maybe(v, 'lastOpacity');
	const unit = str(v, 'unit') as Unit;
	const look = (index: number, count: number): React.CSSProperties => {
		const off = index * stagger;
		const dy = h(rise) * (1 - p('y', off));
		const last = dim !== undefined && count > 1 && index === count - 1 ? dim : 1;
		return {transform: `translateY(${flag(v, 'snap') ? Math.round(dy) : dy}px)`, opacity: p('opacity', off) * last};
	};
	return (
		<div style={{color: inkOf(v, 'ink', tone)}}>
			{children ? <div style={{...look(0, 1), display: 'flex', justifyContent: 'center'}}>{children}</div> : null}
			{text ? (
				<TextCells
					text={text}
					unit={unit}
					css={typeCss(typeOf(v), height)}
					align={str(v, 'align') as Align}
					look={(c, n) => ({style: look(c.index, n)})}
				/>
			) : null}
		</div>
	);
};

// ---- Demo: neutral words, one variant alone on a 1920 x 1080 frame ----

const TEXT: Record<string, string> = {
	wordRise: 'Small steps add up to\nsomething you can see.',
	letterRise: 'Harbor',
	softBlockRise: 'Made slowly, one careful piece at a time',
	dropIn: 'Every part has a place, and a reason.',
	steepStagger: 'Make it move',
	blockRise: 'The first draft is ready. Open it when you have\na minute and leave a few notes.',
	cascade: 'Four steps to begin\n1   Open the folder\n2   Pick a size\n3   Press start',
	fadeInPlace: 'version 2.4',
};

const Mark: React.FC<{color: string; size: number}> = ({color, size}) => (
	<svg width={size} height={size * 0.62} viewBox="0 0 100 62">
		<path d="M0 62 L30 0 L60 62 Z" fill={color} />
		<path d="M40 62 L70 0 L100 62 Z" fill={color} opacity={0.6} />
	</svg>
);

const Cross: React.FC<{color: string; size: number}> = ({color, size}) => (
	<svg width={size} height={size} viewBox="0 0 10 10">
		<path d="M1 1 L9 9 M9 1 L1 9" stroke={color} strokeWidth={0.7} />
	</svg>
);

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = spec.demoTone;
	const s = scheme(tone);
	const {height} = useFrame();
	const v = variantOf(spec, variant);
	const left = str(v, 'align') === 'left';
	if (variant === 'quickFade') {
		const label = typeCss(TYPE.label, height);
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{display: 'flex', alignItems: 'center', gap: height * 0.04, color: s.ink, ...label}}>
					<span>Left</span>
					<RiseFade variant={variant} tone={tone}>
						<Cross color={s.muted} size={height * 0.035} />
					</RiseFade>
					<span>Right</span>
				</div>
			</AbsoluteFill>
		);
	}
	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: left ? 'flex-start' : 'center', paddingLeft: left ? '9%' : 0}}>
			{variant === 'fadeInPlace' ? (
				<RiseFade variant={variant} tone={tone} text={TEXT[variant]}>
					<div style={{paddingBottom: height * 0.03}}>
						<Mark color={s.ink} size={height * 0.06} />
					</div>
				</RiseFade>
			) : (
				<RiseFade variant={variant} tone={tone} text={TEXT[variant] ?? 'Plain words'} />
			)}
		</AbsoluteFill>
	);
};
