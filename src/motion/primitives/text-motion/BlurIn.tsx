import type React from 'react';
import {AbsoluteFill} from 'remotion';
import {maybe, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {spec} from './BlurIn.spec';
import {inkOf, numsOf, stepAt, TextCells, typeCss, typeOf, type Align, type Unit} from './textKit';

export type BlurInProps = {text: string; tone?: Tone; variant?: string};

export const BlurIn: React.FC<BlurInProps> = ({text, tone = 'dark', variant}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {w, h, height} = useFrame();
	const has = (prop: string) => prop in v.motions;
	const rise = maybe(v, 'rise') ?? 0;
	const stagger = maybe(v, 'stagger') ?? 0;
	const blur = maybe(v, 'blur');
	const vertical = v.params?.blurAxis === 'y';
	const spreadL = maybe(v, 'spreadLeft');
	const spreadR = maybe(v, 'spreadRight');
	const indents = numsOf(v, 'indents');
	const pitch = maybe(v, 'pitch');
	// start of unit `index` of `count`: a fixed stagger, or middle-out when the variant measured spreads
	const startOf = (index: number, count: number) => {
		if (spreadL === undefined || spreadR === undefined || count < 2) return index * stagger;
		const mid = (count - 1) / 2;
		return index < mid ? ((mid - index) / mid) * spreadL : ((index - mid) / mid) * spreadR;
	};
	const indentAt = (line: number) => {
		let x = 0;
		for (let k = 0; k < line; k++) x += stepAt(indents, k) ?? 0;
		return x;
	};
	return (
		<TextCells
			text={text}
			unit={str(v, 'unit') as Unit}
			css={{...typeCss(typeOf(v), height), color: inkOf(v, 'ink', tone)}}
			align={str(v, 'align') as Align}
			blurred={blur !== undefined}
			lineCss={(line) => ({paddingLeft: w(indentAt(line)), lineHeight: pitch === undefined ? undefined : `${h(pitch)}px`})}
			look={(c, n) => {
				const off = startOf(c.index, n);
				const sigma = blur === undefined ? 0 : w(blur) * (1 - p('blur', off));
				const out = has('out') ? p('out', off) : 0;
				return {
					style: {opacity: p('opacity', off) * (1 - out), transform: `translateY(${h(rise) * (1 - p('y', off))}px)`},
					blurX: vertical ? 0 : sigma,
					blurY: sigma,
				};
			}}
		/>
	);
};

// ---- Demo ----

const TEXT: Record<string, string> = {
	wordRise: 'we keep the light on',
	overlapWords: 'Sketch a room. Add a lamp and a chair',
	inPlace: 'Sorting 128 items...',
	letterSweep: 'Light moves\nslowly here',
	focusRoll: 'Hold the\nfocus right\nhere',
	verticalBlur: 'five small words in line',
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = spec.demoTone;
	const s = scheme(tone);
	const {height} = useFrame();
	const text = TEXT[variant] ?? 'plain words';
	if (variant === 'overlapWords') {
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div
					style={{
						width: '62%',
						padding: `${height * 0.035}px ${height * 0.045}px`,
						borderRadius: height * 0.06,
						backgroundColor: s.surface,
						border: `2px solid ${s.line}`,
					}}
				>
					<BlurIn variant={variant} tone={tone} text={text} />
				</div>
			</AbsoluteFill>
		);
	}
	const left = variant === 'letterSweep' || variant === 'focusRoll' || variant === 'inPlace';
	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: left ? 'flex-start' : 'center', paddingLeft: left ? '18%' : 0}}>
			<BlurIn variant={variant} tone={tone} text={text} />
		</AbsoluteFill>
	);
};
