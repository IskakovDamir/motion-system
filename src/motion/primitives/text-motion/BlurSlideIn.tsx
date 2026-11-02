import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {maybe, mix, num, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import type {Tone} from '../../tokens/colors';
import {REVEAL} from '../../tokens/type';
import type {DemoProps} from '../types';
import {spec} from './BlurSlideIn.spec';
import {inkOf, numsOf, sideAt, sizeOf, speedOf, stepAt, streakOf, TextCells, TypeOn, typeCss, typeOf, type Align, type Unit} from './textKit';

export type BlurSlideInProps = {text: string; tone?: Tone; variant?: string};

type Inner = {text: string; tone: Tone; variant?: string};

// Units slide in from the frame sides: the curve's side on `x`, the other side on `xOther` (or `x`).
const Edges: React.FC<Inner> = ({text, tone, variant}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, height} = useFrame();
	const t = typeOf(v);
	const sides = str(v, 'sides');
	const curveSide = str(v, 'curveSide');
	const travel = num(v, 'travel');
	const travelOther = maybe(v, 'travelOther') ?? travel;
	const stagger = maybe(v, 'stagger') ?? 0;
	const exposure = maybe(v, 'exposure');
	const typeRate = maybe(v, 'typeRate');
	const capOther = maybe(v, 'capHeightOther');
	const leadWeight = maybe(v, 'leadWeight');
	const lines = text.split('\n').length;
	const hasOther = 'xOther' in v.motions;
	return (
		<TextCells
			text={text}
			unit={str(v, 'unit') as Unit}
			css={{...typeCss(t, height), color: inkOf(v, 'ink', tone)}}
			align={str(v, 'align') as Align}
			blurred={exposure !== undefined}
			lineCss={(line) => (lines > 1 && line === 0 ? {color: inkOf(v, 'leadInk', tone), fontWeight: leadWeight} : {})}
			look={(c) => {
				const side = sideAt(sides, c.index);
				const onCurve = side === curveSide;
				const prop = onCurve || !hasOther ? 'x' : 'xOther';
				const dist = w(onCurve ? travel : travelOther) * (side === 'L' ? -1 : 1);
				const off = c.index * stagger;
				return {
					style: {
						transform: `translateX(${dist * (1 - p(prop, off))}px)`,
						fontSize: !onCurve && capOther !== undefined ? sizeOf(t, height, capOther) : undefined,
						// a later unit is not in the picture until its own move starts
						opacity: frame >= (v.motions[prop]?.delay ?? 0) + off ? 1 : 0,
					},
					blurX: exposure === undefined ? 0 : streakOf(speedOf(p, prop, off) * Math.abs(dist), exposure),
					content: typeRate === undefined ? undefined : <TypeOn text={c.text} start={off} rate={typeRate} fade={REVEAL.fadeChar.framesPerUnit} />,
				};
			}}
		/>
	);
};

// A line that landed stretched tightens into place: letter i starts offsets[i] (% W) right of rest.
const Track: React.FC<Inner> = ({text, tone, variant}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, height} = useFrame();
	const offsets = numsOf(v, 'offsets');
	const typeFrom = num(v, 'typeFrom');
	const typeRate = num(v, 'typeRate');
	return (
		<TextCells
			text={text}
			unit={str(v, 'unit') as Unit}
			css={{...typeCss(typeOf(v), height), color: inkOf(v, 'ink', tone)}}
			align={str(v, 'align') as Align}
			look={(c) => ({
				style: {
					transform: `translateX(${w(stepAt(offsets, c.index) ?? 0) * (1 - p('x'))}px)`,
					opacity: c.index < typeFrom || frame >= (c.index - typeFrom + 1) * typeRate ? 1 : 0,
				},
			})}
		/>
	);
};

// Leading glyphs come in from the left, trailing glyphs from the right; the text between holds, or
// scales up from a dot on `scale`.
const Glyphs: React.FC<Inner> = ({text, tone, variant}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, height} = useFrame();
	const m = text.match(/^([^\p{L}\p{N}\s]*)(\s*)([\s\S]*?)(\s*)([^\p{L}\p{N}\s]*)$/u);
	const [left, gapL, mid, gapR, right] = [m?.[1] ?? '', m?.[2] ?? '', m?.[3] ?? text, m?.[4] ?? '', m?.[5] ?? ''];
	const stagger = maybe(v, 'stagger') ?? 0;
	const otherStagger = maybe(v, 'otherStagger') ?? stagger;
	const rightProp = 'xOther' in v.motions ? 'xOther' : 'x';
	const glyph = (ch: string, k: number, prop: string, dist: number, off: number) => {
		const started = frame >= (v.motions[prop]?.delay ?? 0) + off;
		return (
			<span
				key={`${prop}${k}`}
				style={{display: 'inline-block', color: inkOf(v, 'glyphInk', tone), opacity: started ? 1 : 0, transform: `translateX(${dist * (1 - p(prop, off))}px)`}}
			>
				{ch}
			</span>
		);
	};
	const scale = 'scale' in v.motions ? p('scale') : 1;
	const align = str(v, 'align') as Align;
	return (
		<div style={{...typeCss(typeOf(v), height), color: inkOf(v, 'ink', tone), textAlign: align === 'split' ? 'center' : align}}>
			{Array.from(left).map((ch, k) => glyph(ch, k, 'x', -w(num(v, 'travel')), k * stagger))}
			<span>{gapL}</span>
			<span style={{display: 'inline-block', transform: `scale(${scale})`}}>{mid}</span>
			<span>{gapR}</span>
			{Array.from(right).map((ch, k) => glyph(ch, k, rightProp, w(maybe(v, 'travelOther') ?? num(v, 'travel')), k * otherStagger))}
		</div>
	);
};

// Letters fly in from the frame edges (sides: L R T B per letter) onto a low line at a wider spacing;
// the spacing converges (`spread`) and the line rises into place (`y`).
const Letters: React.FC<Inner> = ({text, tone, variant}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {w, h, height} = useFrame();
	const t = typeOf(v);
	const size = sizeOf(t, height);
	const sides = str(v, 'sides');
	const delays = numsOf(v, 'delays');
	const s = mix(p('spread'), num(v, 'spread'), 1);
	const lift = h(num(v, 'lowLine')) * (1 - p('y'));
	return (
		<TextCells
			text={text}
			unit={str(v, 'unit') as Unit}
			css={{...typeCss(t, height), color: inkOf(v, 'ink', tone)}}
			align={str(v, 'align') as Align}
			style={{transform: `scaleX(${s})`}}
			look={(c) => {
				const side = sideAt(sides, c.index);
				const f = p('fly', stepAt(delays, c.index) ?? 0);
				const sx = side === 'L' ? -(w(num(v, 'edgeX')) + size) : side === 'R' ? w(num(v, 'edgeX')) + size : 0;
				const sy = side === 'T' ? -(h(num(v, 'edgeY')) + size) : side === 'B' ? h(num(v, 'edgeY')) + size : 0;
				// inside the spread container x is scaled by s, so the fly offset is divided by it and
				// each letter is scaled back to its own width
				return {style: {transform: `translate(${(sx * (1 - f)) / s}px, ${sy * (1 - f) + lift}px) scaleX(${1 / s})`}};
			}}
		/>
	);
};

export const BlurSlideIn: React.FC<BlurSlideInProps> = ({text, tone = 'dark', variant}) => {
	const mode = str(variantOf(spec, variant), 'mode');
	const C = mode === 'track' ? Track : mode === 'glyphs' ? Glyphs : mode === 'letters' ? Letters : Edges;
	return <C text={text} tone={tone} variant={variant} />;
};

// ---- Demo ----

const TEXT: Record<string, string> = {
	oppositeEdges: 'OPEN UP\nTO ALL',
	overshoot: 'FIRST\nAND SECOND',
	converge: 'FAST AND CLEAN',
	typeAlong: 'READY\nWHEN YOU ARE',
	whipIn: 'ONE TWO\nTHREE',
	trackingSettle: 'IT IS LIGHTER',
	glyphConverge: '‹‹ Go on ››',
	edgeSpring: '{ map }',
	allEdges: 'CONVERGE',
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const text = TEXT[variant] ?? 'PLAIN WORDS';
	const left = variant === 'typeAlong' || variant === 'whipIn';
	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: left ? 'flex-start' : 'center', paddingLeft: left ? '20%' : 0, overflow: 'hidden'}}>
			<div style={{width: variant === 'overshoot' ? '94%' : undefined}}>
				<BlurSlideIn variant={variant} tone={spec.demoTone} text={text} />
			</div>
		</AbsoluteFill>
	);
};
