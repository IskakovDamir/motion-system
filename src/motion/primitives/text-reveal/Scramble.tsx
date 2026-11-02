import type React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {num, useFrame, variantOf} from '../../engine/anim';
import {splitText} from '../../engine/text';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {colorOf, listOf, seededOrder, toneOf, typeCss, typeOf} from './kit';
import {spec} from './Scramble.spec';

export type ScrambleProps = {text: string; tone?: Tone; variant?: string; delay?: number; style?: React.CSSProperties};

// Letters fill in a seeded order: the k-th letter of that order shows a placeholder from k * framesPerLetter
// and its own glyph one interval later. The word is pre-laid, so nothing shifts while it resolves.
export const Scramble: React.FC<ScrambleProps> = ({text, tone = 'light', variant, delay = 0, style}) => {
	const v = variantOf(spec, variant);
	const frame = useCurrentFrame() - delay;
	const {height} = useFrame();
	const type = typeOf(v);
	const ink = colorOf(v, 'color', tone);
	const pieces = splitText(text, 'char');
	const letters = pieces.filter((p) => !p.space).length;
	const order = seededOrder(letters, `scramble-${text}`);
	const rank = new Map(order.map((idx, k) => [idx, k]));
	const per = num(v, 'framesPerLetter');
	const glyphs = listOf(v, 'glyphs');
	return (
		<div style={{...typeCss(type, height), color: ink, ...style}}>
			{pieces.map((piece, i) => {
				if (piece.space) return <span key={i}>{piece.text}</span>;
				const k = rank.get(piece.index) ?? 0;
				const placed = frame >= (k + 1) * per;
				const holding = !placed && frame >= k * per;
				const g = glyphs[Math.floor(random(`scramble-glyph-${text}-${piece.index}`) * glyphs.length)] ?? '';
				return (
					<span key={i} style={{position: 'relative', display: 'inline-block'}}>
						<span style={{opacity: placed ? 1 : 0}}>{piece.text}</span>
						{holding ? <span style={{position: 'absolute', inset: 0, textAlign: 'center'}}>{g}</span> : null}
					</span>
				);
			})}
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const tone = toneOf(v);
	const s = scheme(tone);
	const {px} = useFrame();
	return (
		<AbsoluteFill style={{backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center'}}>
			<div style={{backgroundColor: s.accent, padding: `${px(40)}px ${px(110)}px`}}>
				<Scramble text="Riverbank" tone={tone} variant={variant} />
			</div>
		</AbsoluteFill>
	);
};
