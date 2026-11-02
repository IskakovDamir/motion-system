import type React from 'react';
import type {Motion} from '../../tokens/easing';
import {scheme, type Tone} from '../../tokens/colors';
import {FONT, fontSize, TYPE, type TypeRole} from '../../tokens/type';

// Helpers of the ui-feed group: two motion helpers the components use (a move that keeps going at its
// exit speed, a point along a bent path) and the neutral demo pieces (bars, discs, words, panels).

/** Progress per frame (60 fps) a bezier motion leaves with at its end: the end slope / duration. */
export const exitRate = (m: Motion): number => {
	if (m.ease.kind !== 'bezier') return 0;
	const {x2, y2} = m.ease;
	return x2 >= 1 ? 0 : (1 - y2) / (1 - x2) / m.duration;
};

/** Frame (60 fps) a motion ends at. */
export const motionEnd = (m: Motion): number => m.delay + m.duration;

/**
 * Point on a quadratic path from `from` to (0, 0) at `s` = share of the path length (0..1), in px.
 * The control point sits at from + bend * (to - from) per axis, so bend (0, 1) is a path that drops
 * to the end height first and slides in x after.
 */
export const bentPathAt = (s: number, from: [number, number], bend: [number, number]): [number, number] => {
	const [fx, fy] = from;
	const cx = fx * (1 - bend[0]);
	const cy = fy * (1 - bend[1]);
	const at = (t: number): [number, number] => {
		const a = (1 - t) * (1 - t);
		const b = 2 * t * (1 - t);
		return [a * fx + b * cx, a * fy + b * cy];
	};
	const n = 64;
	const pts: [number, number][] = [];
	const len: number[] = [0];
	for (let i = 0; i <= n; i++) {
		pts.push(at(i / n));
		if (i > 0) {
			const p = pts[i - 1] as [number, number];
			const q = pts[i] as [number, number];
			len.push((len[i - 1] as number) + Math.hypot(q[0] - p[0], q[1] - p[1]));
		}
	}
	const total = len[n] as number;
	if (total === 0) return [0, 0];
	const target = Math.max(0, s) * total;
	if (s >= 1) {
		// past the end (an overshooting ease): keep going along the end tangent
		const p = pts[n - 1] as [number, number];
		const q = pts[n] as [number, number];
		const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
		const over = target - total;
		return [q[0] + ((q[0] - p[0]) / d) * over, q[1] + ((q[1] - p[1]) / d) * over];
	}
	let i = 1;
	while (i < n && (len[i] as number) < target) i++;
	const l0 = len[i - 1] as number;
	const l1 = len[i] as number;
	const u = l1 > l0 ? (target - l0) / (l1 - l0) : 0;
	const p = pts[i - 1] as [number, number];
	const q = pts[i] as [number, number];
	return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
};

// ---- demo pieces (neutral content: bars for text lines, discs, short words) ----

export const Bar: React.FC<{tone: Tone; w: number; h: number; strong?: boolean; style?: React.CSSProperties}> = ({tone, w, h, strong, style}) => {
	const s = scheme(tone);
	return <div style={{width: w, height: h, borderRadius: h / 2, backgroundColor: strong ? s.inkSoft : s.line, flexShrink: 0, ...style}} />;
};

export const Disc: React.FC<{tone: Tone; d: number; fill?: 'ink' | 'muted' | 'line' | 'accent' | 'surface'; style?: React.CSSProperties}> = ({
	tone,
	d,
	fill = 'ink',
	style,
}) => {
	const s = scheme(tone);
	return <div style={{width: d, height: d, borderRadius: d / 2, backgroundColor: s[fill], flexShrink: 0, ...style}} />;
};

export const Word: React.FC<{
	tone: Tone;
	children: React.ReactNode;
	role?: TypeRole;
	height: number;
	color?: 'ink' | 'inkSoft' | 'muted' | 'onAccent';
	mono?: boolean;
	style?: React.CSSProperties;
}> = ({tone, children, role = 'ui', height, color = 'ink', mono, style}) => {
	const s = scheme(tone);
	const t = TYPE[role];
	return (
		<span
			style={{
				fontFamily: mono ? FONT.mono : FONT[t.font],
				fontWeight: t.weight ?? 400,
				fontSize: fontSize(role, height),
				letterSpacing: t.tracking === null ? undefined : `${t.tracking}em`,
				color: s[color],
				lineHeight: 1.2,
				whiteSpace: 'nowrap',
				...style,
			}}
		>
			{children}
		</span>
	);
};

export const Panel: React.FC<{tone: Tone; style?: React.CSSProperties; children?: React.ReactNode; alt?: boolean}> = ({tone, style, children, alt}) => {
	const s = scheme(tone);
	return (
		<div style={{backgroundColor: alt ? s.surfaceAlt : s.surface, border: `1px solid ${s.line}`, borderRadius: 24, ...style}}>{children}</div>
	);
};
