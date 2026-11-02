import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {flag, maybe, num, str, useFrame, variantOf} from '../../engine/anim';
import {splitText} from '../../engine/text';
import {scheme, type Tone} from '../../tokens/colors';
import {REVEAL} from '../../tokens/type';
import type {DemoProps} from '../types';
import {gapOnsets, numsOf, optStr, toneOf, typeCss, typeOf, uniformOnsets} from './kit';
import {spec} from './WordPop.spec';

export type WordPopProps = {
	/** words on one line, or lines separated by \n for a line unit */
	text: string;
	tone?: Tone;
	variant?: string;
	/** frames before the first unit */
	delay?: number;
	style?: React.CSSProperties;
};

/** Frame each unit appears at: the measured gap list (cycling), else the variant's frames per unit. */
const onsetsOf = (variant: string | undefined, n: number): number[] => {
	const v = variantOf(spec, variant);
	const gaps = numsOf(v, 'gaps');
	if (gaps.length) return gapOnsets(n, gaps);
	const per = maybe(v, 'framesPerWord') ?? REVEAL.popWord.framesPerUnit;
	return uniformOnsets(n, per);
};

export const WordPop: React.FC<WordPopProps> = ({text, tone = 'light', variant, delay = 0, style}) => {
	const v = variantOf(spec, variant);
	const frame = useCurrentFrame() - delay;
	const {height, h} = useFrame();
	const s = scheme(tone);
	const type = typeOf(v);
	const unit = str(v, 'unit') === 'line' ? 'line' : 'word';
	const pieces = splitText(text, unit);
	const bullet = flag(v, 'bullet');
	const units = pieces.filter((x) => !x.space).length + (bullet ? 1 : 0);
	const onsets = onsetsOf(variant, units);
	const flow = flag(v, 'flow');
	const ghost = maybe(v, 'ghostFrames');
	const shift = bullet ? 1 : 0;

	const look = (k: number): React.CSSProperties | null => {
		const at = onsets[k] ?? Infinity;
		if (frame < at) return flow ? null : {opacity: 0};
		if (ghost !== undefined && frame - at < ghost) {
			return {opacity: num(v, 'ghostInk'), display: 'inline-block', transform: `translateY(${h(num(v, 'ghostDrop'))}px)`};
		}
		return {opacity: 1};
	};

	const pitch = maybe(v, 'linePitch');
	if (unit === 'line') {
		return (
			<div style={{...typeCss(type, height), color: s.ink, textAlign: optStr(v, 'align') === 'center' ? 'center' : 'left', ...style}}>
				{pieces.map((piece) => {
					const css = look(piece.index);
					return css === null ? null : (
						<div key={piece.index} style={{...css, height: pitch === undefined ? undefined : h(pitch), lineHeight: pitch === undefined ? undefined : `${h(pitch)}px`}}>
							{piece.text}
						</div>
					);
				})}
			</div>
		);
	}

	const bulletCss = bullet ? look(0) : null;
	return (
		<div style={{...typeCss(type, height), whiteSpace: 'pre-wrap', color: s.ink, textAlign: optStr(v, 'align') === 'center' ? 'center' : 'left', ...style}}>
			{bulletCss ? <span style={{...bulletCss, color: s.muted}}>{'● '}</span> : null}
			{pieces.map((piece, i) => {
				if (piece.space) {
					// in flow, a space waits for the word after it, so the line (and its pill) only spans shown words
					const next = pieces[i + 1];
					return flow && next && look(next.index + shift) === null ? null : <span key={i}>{piece.text}</span>;
				}
				const css = look(piece.index + shift);
				return css === null ? null : (
					<span key={i} style={css}>
						{piece.text}
					</span>
				);
			})}
		</div>
	);
};

// ---- isolated demo ----

const DEMO: Record<string, string> = {
	brisk: 'Small steps add up.',
	even: 'the quiet room fills with light.',
	spaced: 'Start small and keep a steady pace.',
	rapid: 'Reading the notes and listing each open task for the week ahead',
	lineSteps: [
		'> sync started',
		'  reading 12 folders',
		'  found 48 new files',
		'  + notes/plan.md',
		'  + notes/list.md',
		'  ~ notes/todo.md',
		'  checking sizes',
		'  2 files skipped',
		'  copying 46 files',
		'  done in 4.2 s',
		'  all folders in sync',
		'> ready',
	].join('\n'),
	ghostSnap: 'Draw a calm wave across the page',
	allAtOnce: 'More news coming next week',
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const tone = toneOf(v);
	const s = scheme(tone);
	const {w, px} = useFrame();
	const text = DEMO[variant] ?? 'Plain words';
	const pop = <WordPop text={text} tone={tone} variant={variant} />;
	let body: React.ReactNode = pop;
	if (variant === 'rapid') {
		body = <div style={{width: w(46), backgroundColor: s.surface, borderRadius: px(28), padding: `${px(48)}px ${px(56)}px`}}>{pop}</div>;
	} else if (variant === 'lineSteps') {
		body = <div style={{width: w(40), backgroundColor: s.surface, borderRadius: px(20), padding: `${px(36)}px ${px(44)}px`}}>{pop}</div>;
	} else if (variant === 'ghostSnap') {
		body = (
			<div style={{width: w(80), display: 'flex'}}>
				<div style={{backgroundColor: s.surfaceAlt, borderRadius: px(200), padding: `${px(28)}px ${px(48)}px`}}>{pop}</div>
			</div>
		);
	}
	return <AbsoluteFill style={{backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center'}}>{body}</AbsoluteFill>;
};
