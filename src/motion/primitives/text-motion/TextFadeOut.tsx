import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {maybe, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {motionLength} from '../../engine/progress';
import type {Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {spec} from './TextFadeOut.spec';
import {inkOf, numsOf, stepAt, TextCells, typeCss, typeOf, type Align, type Unit} from './textKit';

export type TextFadeOutProps = {text: string; tone?: Tone; variant?: string};

export const TextFadeOut: React.FC<TextFadeOutProps> = ({text, tone = 'light', variant}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, h, height} = useFrame();
	const stagger = maybe(v, 'stagger') ?? 0;
	const removeAt = maybe(v, 'removeAt');
	const indents = numsOf(v, 'indents');
	const pitch = maybe(v, 'pitch');
	const fade = v.motions.opacity;
	const opacityAt = (off: number) => {
		if (removeAt === undefined || !fade) return 1 - p('opacity', off);
		// fades to removeAt on the measured curve, then the text is gone (covered or removed)
		return frame >= off + motionLength(fade) ? 0 : 1 - p('opacity', off) * (1 - removeAt);
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
			lineCss={(line) => ({paddingLeft: w(indentAt(line)), lineHeight: pitch === undefined ? undefined : `${h(pitch)}px`})}
			look={(c) => ({style: {opacity: opacityAt(c.index * stagger)}})}
		/>
	);
};

// ---- Demo ----

const TEXT: Record<string, string> = {
	easeIn: 'All of us go out at once.',
	accelerating: 'One line, gone in a moment.',
	linear: 'Soon',
	slowFade: 'Page 3 overview',
	defocusLines: 'Then\nthe lines\nleave in order',
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const left = variant === 'slowFade' || variant === 'defocusLines';
	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: left ? 'flex-start' : 'center', paddingLeft: left ? '14%' : 0}}>
			<TextFadeOut variant={variant} tone={spec.demoTone} text={TEXT[variant] ?? 'plain words'} />
		</AbsoluteFill>
	);
};
