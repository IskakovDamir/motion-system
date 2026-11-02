import type React from 'react';
import {useCurrentFrame} from 'remotion';
import {DirectionalBlur} from '../../engine/blur';
import {splitText} from '../../engine/text';
import type {VariantSpec} from '../types';
import {scheme, type Scheme, type Tone} from '../../tokens/colors';
import {CAP_RATIO, FONT, TYPE, type FontRole, type TextCase, type TypeRole, type TypeStyle} from '../../tokens/type';

// Shared by the text-motion primitives: the measured type of a variant (a TYPE role plus the
// overrides its typography rows give), text split into the units a variant animates, one renderer
// that lays those units out and styles each one, and motion blur from speed.

/** What moves as one: the catalogue's unit names. A glyph is a character too. */
export type Unit = 'letter' | 'word' | 'line' | 'block' | 'glyph';

export type Align = 'left' | 'center' | 'right' | 'split';

/** p(prop, offsetFrames): progress of a variant motion, from useProgress. */
export type P = (prop: string, offset?: number) => number;

const param = (v: VariantSpec, key: string) => v.params?.[key];
const strParam = <T extends string>(v: VariantSpec, key: string, fallback: T): T => {
	const x = param(v, key);
	return typeof x === 'string' ? (x as T) : fallback;
};
const numParam = (v: VariantSpec, key: string): number | undefined => {
	const x = param(v, key);
	return typeof x === 'number' ? x : undefined;
};

/**
 * The type a variant sets: params.type names the TYPE role; font, weight, capHeight (% H), tracking
 * (em), case and stretch (%) override it with what the variant's typography rows measured.
 */
export const typeOf = (v: VariantSpec): TypeStyle => {
	const base: TypeStyle = TYPE[strParam<TypeRole>(v, 'type', 'headline')];
	return {
		font: strParam<FontRole>(v, 'font', base.font),
		weight: numParam(v, 'weight') ?? base.weight,
		capHeight: numParam(v, 'capHeight') ?? base.capHeight,
		tracking: numParam(v, 'tracking') ?? base.tracking,
		case: strParam<TextCase>(v, 'case', base.case),
		stretch: numParam(v, 'stretch') ?? base.stretch,
	};
};

/** Font size (px) that gives `t` a cap height of `capHeight` % of a frame `height` px tall. */
export const sizeOf = (t: TypeStyle, height: number, capHeight = t.capHeight) => ((capHeight / 100) * height) / CAP_RATIO[t.font];

/** CSS of a type style on a frame `height` px tall. */
export const typeCss = (t: TypeStyle, height: number, capHeight = t.capHeight): React.CSSProperties => ({
	fontFamily: FONT[t.font],
	fontWeight: t.weight ?? undefined,
	fontSize: sizeOf(t, height, capHeight),
	letterSpacing: t.tracking === null ? undefined : `${t.tracking}em`,
	textTransform: t.case === 'upper' ? 'uppercase' : t.case === 'lower' ? 'lowercase' : undefined,
	fontStretch: t.stretch ? `${t.stretch}%` : undefined,
	whiteSpace: 'pre',
	lineHeight: 'normal',
});

/** Colour of a scheme role named by a param (ink when the param is absent). */
export const inkOf = (v: VariantSpec, key: string, tone: Tone): string => {
	const s: Scheme = scheme(tone);
	return s[strParam<keyof Scheme>(v, key, 'ink')];
};

/** A comma-separated list param (step lists: per-letter offsets, sides, delays). */
export const listOf = (v: VariantSpec, key: string): string[] => {
	const x = param(v, key);
	return typeof x === 'string' && x.length > 0 ? x.split(',').map((s) => s.trim()) : [];
};
export const numsOf = (v: VariantSpec, key: string): number[] => listOf(v, key).map(Number);

/** The i-th entry of a step list, holding its last entry past the end. */
export const stepAt = <T,>(list: T[], i: number): T | undefined => (list.length ? list[Math.min(i, list.length - 1)] : undefined);

export type Cell = {
	text: string;
	/** index among animated units across all lines (spaces excluded); -1 for a space */
	index: number;
	line: number;
	space: boolean;
};

/** The text split into the units a variant animates, line by line (splitText inside each line). */
export const cellsOf = (text: string, unit: Unit): Cell[][] => {
	if (unit === 'block') return [[{text, index: 0, line: 0, space: false}]];
	let i = 0;
	return text.split('\n').map((ln, line) => {
		if (unit === 'line') return [{text: ln, index: i++, line, space: false}];
		return splitText(ln, unit === 'word' ? 'word' : 'char').map((pc) => ({text: pc.text, index: pc.space ? -1 : i++, line, space: pc.space}));
	});
};

export const unitTotal = (cells: Cell[][]) => cells.flat().filter((c) => !c.space).length;

export type CellLook = {
	style?: React.CSSProperties;
	blurX?: number;
	blurY?: number;
	/** drawn inside the unit before its text (a blob, a marker) */
	before?: React.ReactNode;
	/** replaces the unit's text (a type-on that shows it letter by letter) */
	content?: React.ReactNode;
};

const lineAlign = (align: Align, line: number): React.CSSProperties['textAlign'] =>
	align === 'split' ? (line % 2 === 0 ? 'left' : 'right') : align;

/**
 * Lays the units out in their final places (no reflow while they move) and styles each one.
 * `blurred` wraps every unit in DirectionalBlur, so a variant with blur keeps one tree throughout.
 */
export const TextCells: React.FC<{
	text: string;
	unit: Unit;
	css: React.CSSProperties;
	align: Align;
	/** extra style of one line (its own size, weight, ink or indent) */
	lineCss?: (line: number) => React.CSSProperties;
	look: (cell: Cell, count: number) => CellLook;
	blurred?: boolean;
	style?: React.CSSProperties;
}> = ({text, unit, css, align, lineCss, look, blurred, style}) => {
	const cells = cellsOf(text, unit);
	const count = unitTotal(cells);
	return (
		<div style={{...css, ...style}}>
			{cells.map((row, li) => (
				<div key={li} style={{textAlign: lineAlign(align, li), position: 'relative', ...lineCss?.(li)}}>
					{row.map((c, ci) => {
						if (c.space) return <span key={ci}>{c.text}</span>;
						const l = look(c, count);
						const s: React.CSSProperties = {display: 'inline-block', position: 'relative', textAlign: lineAlign(align, li), ...l.style};
						return blurred ? (
							<DirectionalBlur key={ci} x={l.blurX ?? 0} y={l.blurY ?? 0} style={s}>
								{l.before}
								{l.content ?? c.text}
							</DirectionalBlur>
						) : (
							<span key={ci} style={s}>
								{l.before}
								{l.content ?? c.text}
							</span>
						);
					})}
				</div>
			))}
		</div>
	);
};

/** Side of unit `i` from a pattern of side letters: it cycles, or holds its last letter when it ends with '*'. */
export const sideAt = (pattern: string, i: number): string => {
	const hold = pattern.endsWith('*');
	const chars = Array.from(hold ? pattern.slice(0, -1) : pattern);
	if (!chars.length) return '';
	return (hold ? chars[Math.min(i, chars.length - 1)] : chars[i % chars.length]) ?? '';
};

/** |progress per frame| of a motion at this frame, from the progress half a frame either side. */
export const speedOf = (p: P, prop: string, offset = 0) => Math.abs(p(prop, offset - 0.5) - p(prop, offset + 0.5));

/**
 * Gaussian deviation (px) of the motion blur of a unit moving `pxPerFrame`: a streak `exposure`
 * frames long (measured streak length over measured speed), drawn as the Gaussian of the same
 * variance (a streak of length L has deviation L / sqrt(12)).
 */
export const streakOf = (pxPerFrame: number, exposure: number) => (pxPerFrame * exposure) / Math.sqrt(12);

/**
 * Letters of `text` typed on from frame `start`, `rate` frames apart, at their final places; each fades
 * in over `fade` frames (0: a hard step).
 */
export const TypeOn: React.FC<{text: string; start: number; rate: number; fade: number}> = ({text, start, rate, fade}) => {
	const frame = useCurrentFrame();
	return (
		<>
			{splitText(text, 'char').map((pc, k) => {
				const t = frame - start - k * rate;
				return (
					<span key={k} style={{opacity: fade > 0 ? Math.min(1, Math.max(0, t / fade)) : t >= 0 ? 1 : 0}}>
						{pc.text}
					</span>
				);
			})}
		</>
	);
};
