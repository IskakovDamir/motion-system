import type React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {progressAt} from '../../engine/progress';
import {scheme, type Tone} from '../../tokens/colors';
import type {Motion} from '../../tokens/easing';
import {REF_FPS} from '../../tokens/timing';
import {FONT, fontSize, TYPE, type TypeRole} from '../../tokens/type';
import {FootageSlot} from '../footage/FootageSlot';
import type {VariantSpec} from '../types';

// Helpers of the transition-morph group: reading list params (keyframes, number lists), the time
// in 60 fps frames, a motion's end and exit speed, a zoom-streak layer, and the neutral demo pieces
// (scenes, hexagons, plates). Nothing here holds a measured number; the specs do.

/** Current frame on the 60 fps reference grid (specs are written at 60 fps). */
export const useT = (): number => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (frame * REF_FPS) / fps;
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** The motion of `prop`; throws when the variant does not define it. */
export const mot = (v: VariantSpec, prop: string): Motion => {
	const m = v.motions[prop];
	if (!m) throw new Error(`variant has no motion ${prop}`);
	return m;
};

/** Progress of `prop` at frame t (60 fps); a prop the variant does not animate is settled (1). */
export const prog = (v: VariantSpec, prop: string, t: number): number => {
	const m = v.motions[prop];
	return m ? progressAt(t, m) : 1;
};

/** Frame (60 fps) a motion ends at. */
export const motionEnd = (m: Motion | undefined): number => (m ? m.delay + m.duration : 0);

/** Progress per frame a motion leaves with: the slope over its last frame. */
export const exitSlope = (m: Motion): number => progressAt(m.delay + m.duration, m) - progressAt(m.delay + m.duration - 1, m);

/** A param written as a space-separated number list ("0 1 8 11"). */
export const nums = (v: VariantSpec, key: string): number[] => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a number list (${String(x)})`);
	return x.trim().split(/\s+/).map(Number);
};

export type Key = [number, number];

/** A param written as frame:value pairs ("0:1 4:1.36 10:1.73"). */
export const keys = (v: VariantSpec, key: string): Key[] => {
	const x = v.params?.[key];
	if (typeof x !== 'string') throw new Error(`variant param ${key} is not a keyframe list (${String(x)})`);
	return x
		.trim()
		.split(/\s+/)
		.map((pair) => {
			const [a, b] = pair.split(':').map(Number);
			return [a ?? 0, b ?? 0] as Key;
		});
};

/**
 * Piecewise-linear value through measured pictures. Before the first key it holds the first value;
 * after the last it holds, or with `extend` keeps the last segment's slope (a move still running
 * when the measurement stops).
 */
export const keyAt = (k: Key[], t: number, extend = false): number => {
	const first = k[0];
	const last = k[k.length - 1];
	if (!first || !last) throw new Error('empty keyframe list');
	if (t <= first[0]) return first[1];
	if (t >= last[0]) {
		const prev = k[k.length - 2];
		if (!extend || !prev) return last[1];
		return last[1] + ((last[1] - prev[1]) / (last[0] - prev[0])) * (t - last[0]);
	}
	let i = 1;
	while (i < k.length - 1 && (k[i] as Key)[0] < t) i++;
	const a = k[i - 1] as Key;
	const b = k[i] as Key;
	return a[1] + ((b[1] - a[1]) * (t - a[0])) / (b[0] - a[0]);
};

export type Pt = [number, number];

/**
 * Zoom streaks: copies of a layer scaled toward `origin` (px in the layer) down to (1 - length) of
 * its size, mixed with equal weights over the sharp layer, so every point is smeared inward along
 * its radius over `length` of its distance from the origin (the measured "streak length / outer
 * radius"). The sharp layer stays at the bottom and opaque, so the frame edges stay covered.
 */
export const ZoomStreaks: React.FC<{length: number; origin: Pt; copies?: number; children: React.ReactNode}> = ({length, origin, copies = 9, children}) => {
	// the sharp copy keeps its place in the tree, so the scene never remounts when streaks start
	const on = length > 0.002;
	const extra = on ? Array.from({length: copies - 1}, (_, i) => i + 1) : [];
	const layer = (i: number): React.CSSProperties => ({
		transform: `scale(${1 - (length * i) / (copies - 1)})`,
		transformOrigin: `${origin[0]}px ${origin[1]}px`,
		opacity: 1 / (i + 1),
	});
	return (
		<AbsoluteFill>
			<AbsoluteFill key="sharp">{children}</AbsoluteFill>
			{extra.map((i) => (
				<AbsoluteFill key={i} style={layer(i)}>
					{children}
				</AbsoluteFill>
			))}
		</AbsoluteFill>
	);
};

// ---- neutral demo pieces ----

const HEX_FLAT = '25,3 75,3 98,50 75,97 25,97 2,50';

export type ShapeKind = 'hex' | 'disc' | 'square' | 'ring' | 'plus' | 'diamond' | 'triangle' | 'bars';

/** A plain geometric mark filling its box (flat-top hexagon, disc, rounded square ...). */
export const Shape: React.FC<{kind: ShapeKind; fill: string; style?: React.CSSProperties}> = ({kind, fill, style}) => (
	<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{display: 'block', overflow: 'visible', ...style}}>
		{kind === 'hex' ? <polygon points={HEX_FLAT} fill={fill} /> : null}
		{kind === 'disc' ? <circle cx="50" cy="50" r="48" fill={fill} /> : null}
		{kind === 'square' ? <rect x="4" y="4" width="92" height="92" rx="22" fill={fill} /> : null}
		{kind === 'ring' ? <circle cx="50" cy="50" r="40" fill="none" stroke={fill} strokeWidth="14" /> : null}
		{kind === 'plus' ? <path d="M40 8h20v32h32v20H60v32H40V60H8V40h32z" fill={fill} /> : null}
		{kind === 'diamond' ? <polygon points="50,4 96,50 50,96 4,50" fill={fill} /> : null}
		{kind === 'triangle' ? <polygon points="50,8 95,90 5,90" fill={fill} /> : null}
		{kind === 'bars' ? (
			<g fill={fill}>
				<rect x="8" y="22" width="84" height="12" rx="6" />
				<rect x="8" y="44" width="60" height="12" rx="6" />
				<rect x="8" y="66" width="72" height="12" rx="6" />
			</g>
		) : null}
	</svg>
);

/** A shape on a rounded tile, the neutral stand-in for a badge or an app tile. */
export const Tile: React.FC<{kind: ShapeKind; tile: string; mark: string; round?: boolean}> = ({kind, tile, mark, round}) => (
	<div style={{width: '100%', height: '100%', borderRadius: round ? '50%' : '22%', backgroundColor: tile, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
		<div style={{width: '46%', height: '46%'}}>
			<Shape kind={kind} fill={mark} />
		</div>
	</div>
);

export const Word: React.FC<{
	tone: Tone;
	children: React.ReactNode;
	role?: TypeRole;
	color?: 'ink' | 'inkSoft' | 'muted' | 'onAccent';
	weight?: number;
	style?: React.CSSProperties;
}> = ({tone, children, role = 'headline', color = 'ink', weight, style}) => {
	const {height} = useVideoConfig();
	const s = scheme(tone);
	const t = TYPE[role];
	return (
		<span
			style={{
				fontFamily: FONT[t.font],
				fontWeight: weight ?? t.weight ?? 400,
				fontSize: fontSize(role, height),
				letterSpacing: t.tracking === null ? undefined : `${t.tracking}em`,
				color: s[color],
				lineHeight: 1.1,
				whiteSpace: 'nowrap',
				...style,
			}}
		>
			{children}
		</span>
	);
};

/** Box placed by its centre, in % of the frame, sized in px. */
export const At: React.FC<{x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({x, y, w, h, style, children}) => (
	<div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2, ...style}}>{children}</div>
);

/** Demo scene A: a light field with a mark at the centre, a word, a plate and a number. */
export const SceneA: React.FC<{tone?: Tone; word?: string; mark?: ShapeKind}> = ({tone = 'light', word = 'Ready', mark = 'ring'}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<At x={50} y={50} w={height * 0.26} h={height * 0.26}>
				<Shape kind={mark} fill={s.ink} />
			</At>
			<At x={50} y={74} w={height * 1.2} h={height * 0.14} style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
				<Word tone={tone}>{word}</Word>
			</At>
			<div style={{position: 'absolute', left: '6%', top: '10%', width: '22%', height: '30%', borderRadius: 24, overflow: 'hidden'}}>
				<FootageSlot tone={tone} label="plate" />
			</div>
			<div style={{position: 'absolute', right: '6%', top: '10%', fontFamily: FONT.mono, fontSize: fontSize('label', height), color: s.muted}}>04</div>
			<div style={{position: 'absolute', right: '6%', bottom: '10%', width: '18%', height: '6%'}}>
				<Shape kind="bars" fill={s.line} />
			</div>
		</AbsoluteFill>
	);
};

/** Demo scene B: a three-plate row under a word, a different layout from scene A. */
export const SceneB: React.FC<{tone?: Tone; word?: string}> = ({tone = 'dark', word = 'Next'}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<At x={50} y={24} w={height * 1.2} h={height * 0.16} style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
				<Word tone={tone} role="display">
					{word}
				</Word>
			</At>
			{[22, 50, 78].map((x, i) => (
				<At key={x} x={x} y={62} w={height * 0.46} h={height * 0.34} style={{borderRadius: 20, overflow: 'hidden'}}>
					<FootageSlot tone={tone} label={`0${i + 1}`} />
				</At>
			))}
			<At x={50} y={90} w={height * 0.05} h={height * 0.05}>
				<Shape kind="diamond" fill={s.muted} />
			</At>
		</AbsoluteFill>
	);
};
