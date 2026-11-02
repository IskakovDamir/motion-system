import type React from 'react';
import {AbsoluteFill, random, useVideoConfig} from 'remotion';
import {scheme, type Tone} from '../../tokens/colors';
import {CAP_RATIO, FONT, TYPE, fontSize} from '../../tokens/type';
import {FootageSlot} from '../footage/FootageSlot';

// Neutral demo content for the zoom primitives, copied from camera-move/demo.tsx (the tiled canvas
// and centre mark) so both camera groups read the same, plus the few layouts a layer zoom needs: a
// panel, a lockup, a device card and a word line, and a screen-fixed headline that stays while the
// layer under it zooms. Free layout (nothing here is measured unless a variant param places it).

const WORDS = ['north', 'level', 'field', 'plain', 'grid', 'line', 'stone', 'point', 'river', 'cloud', 'shelf', 'frame'];
const NUMBERS = ['24', '108', '3.5', '07', '512', '61', '9', '240'];
/** tiles per frame width and height */
const DENSITY = 4;

const Shape: React.FC<{kind: number; color: string; size?: string}> = ({kind, color, size = '44%'}) => (
	<svg viewBox="0 0 100 100" width={size} height={size}>
		{kind === 0 ? <circle cx="50" cy="50" r="42" fill={color} /> : null}
		{kind === 1 ? <rect x="10" y="10" width="80" height="80" rx="10" fill={color} /> : null}
		{kind === 2 ? <polygon points="50,8 94,90 6,90" fill={color} /> : null}
		{kind === 3 ? <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="10" /> : null}
	</svg>
);

const Tile: React.FC<{i: number; tone: Tone}> = ({i, tone}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	// seeded, so the canvas has no short period and every move crosses different content
	const pick = (key: string, n: number) => Math.floor(random(`${key}${i}`) * n);
	const kind = pick('kind', 4);
	const box: React.CSSProperties = {
		position: 'absolute',
		inset: '6%',
		borderRadius: height * 0.022,
		overflow: 'hidden',
		backgroundColor: s.surface,
		border: `${Math.max(1, height / 540)}px solid ${s.line}`,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	};
	if (kind === 0) {
		return (
			<div style={box}>
				<FootageSlot tone={tone} />
			</div>
		);
	}
	if (kind === 1) {
		return (
			<div style={{...box, fontFamily: FONT[TYPE.headline.font], fontWeight: 600, fontSize: fontSize('headline', height), color: s.ink}}>
				{WORDS[pick('word', WORDS.length)]}
			</div>
		);
	}
	if (kind === 2) {
		return (
			<div style={{...box, fontFamily: FONT.mono, fontWeight: 600, fontSize: fontSize('headline', height) * 1.3, color: s.inkSoft}}>
				{NUMBERS[pick('num', NUMBERS.length)]}
			</div>
		);
	}
	return (
		<div style={box}>
			<Shape kind={pick('shape', 4)} color={s.accent} />
		</div>
	);
};

/**
 * The demo canvas: opaque, `span` x `span` frames of tiles centred on the visible frame (span 3 for
 * pushes and short pull-backs, 5 where a pull-back shows more than three frames), with a centre mark.
 */
export const DemoCanvas: React.FC<{tone: Tone; span?: number; mark?: boolean}> = ({tone, span = 3, mark = true}) => {
	const s = scheme(tone);
	const {width, height} = useVideoConfig();
	const from = -(span - 1) / 2;
	const n = span * DENSITY;
	const cw = width / DENSITY;
	const ch = height / DENSITY;
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<div style={{position: 'absolute', left: from * width, top: from * height, width: width * span, height: height * span}}>
				{Array.from({length: n * n}, (_, i) => (
					<div key={i} style={{position: 'absolute', left: (i % n) * cw, top: Math.floor(i / n) * ch, width: cw, height: ch}}>
						<Tile i={i} tone={tone} />
					</div>
				))}
			</div>
			{mark ? <CentreMark tone={tone} /> : null}
		</AbsoluteFill>
	);
};

/** A ring and a dot on the frame centre. */
export const CentreMark: React.FC<{tone: Tone}> = ({tone}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	const d = height * 0.16;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<div
				style={{
					width: d,
					height: d,
					borderRadius: '50%',
					border: `${d * 0.09}px solid ${s.ink}`,
					backgroundColor: s.bg,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<div style={{width: d * 0.3, height: d * 0.3, borderRadius: '50%', backgroundColor: s.ink}} />
			</div>
		</AbsoluteFill>
	);
};

/** A plain background with a faint dot grid: the still ground under a group that zooms on its own. */
export const Ground: React.FC<{tone: Tone}> = ({tone}) => {
	const s = scheme(tone);
	const {width, height} = useVideoConfig();
	const step = height / 12;
	const cols = Math.ceil(width / step);
	const rows = Math.ceil(height / step);
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<svg width={width} height={height}>
				{Array.from({length: (cols + 1) * (rows + 1)}, (_, i) => (
					<circle key={i} cx={(i % (cols + 1)) * step} cy={Math.floor(i / (cols + 1)) * step} r={height / 160} fill={s.line} />
				))}
			</svg>
		</AbsoluteFill>
	);
};

/** One line of words, screen-fixed, at the top of the frame or beside a layer (`at` in % of the frame). */
export const StaticLine: React.FC<{tone: Tone; text: string; at: [number, number]; align?: 'center' | 'left'}> = ({tone, text, at, align = 'center'}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	return (
		<div
			style={{
				position: 'absolute',
				left: `${at[0]}%`,
				top: `${at[1]}%`,
				transform: align === 'center' ? 'translate(-50%, -50%)' : 'translateY(-50%)',
				whiteSpace: 'nowrap',
				fontFamily: FONT.display,
				fontWeight: TYPE.headline.weight,
				fontSize: fontSize('headline', height),
				letterSpacing: `${TYPE.headline.tracking}em`,
				color: s.ink,
				backgroundColor: s.bg,
				padding: `${height * 0.012}px ${height * 0.03}px`,
				borderRadius: height * 0.016,
			}}
		>
			{text}
		</div>
	);
};

/** A panel with a title row, a plate and three rows of short words, centred on `at` (% of the frame). */
export const Panel: React.FC<{tone: Tone; at: [number, number]}> = ({tone, at}) => {
	const s = scheme(tone);
	const {width, height} = useVideoConfig();
	const w = width * 0.46;
	const h = height * 0.6;
	const row = (word: string, k: number) => (
		<div key={word} style={{display: 'flex', alignItems: 'center', gap: h * 0.04, height: h * 0.12}}>
			<Shape kind={k} color={s.accent} size={`${h * 0.07}px`} />
			<div style={{fontFamily: FONT.ui, fontSize: fontSize('ui', height), color: s.inkSoft}}>{word}</div>
			<div style={{flex: 1, height: h * 0.012, backgroundColor: s.line}} />
			<div style={{fontFamily: FONT.mono, fontSize: fontSize('ui', height), color: s.muted}}>{NUMBERS[k]}</div>
		</div>
	);
	return (
		<div
			style={{
				position: 'absolute',
				left: (at[0] / 100) * width - w / 2,
				top: (at[1] / 100) * height - h / 2,
				width: w,
				height: h,
				boxSizing: 'border-box',
				padding: h * 0.06,
				borderRadius: height * 0.022,
				backgroundColor: s.surface,
				border: `${Math.max(1, height / 540)}px solid ${s.line}`,
				display: 'flex',
				flexDirection: 'column',
				gap: h * 0.03,
			}}
		>
			<div style={{fontFamily: FONT.ui, fontWeight: 600, fontSize: fontSize('ui', height) * 1.2, color: s.ink}}>shelf</div>
			<div style={{position: 'relative', flex: 1, borderRadius: height * 0.012, overflow: 'hidden'}}>
				<FootageSlot tone={tone} />
			</div>
			{['north', 'river', 'stone'].map(row)}
		</div>
	);
};

/** A held group centred on `at` (% of the frame): a lockup (a shape and a word) over a row of three plates. */
export const Lockup: React.FC<{tone: Tone; at: [number, number]}> = ({tone, at}) => {
	const s = scheme(tone);
	const {width, height} = useVideoConfig();
	return (
		<div
			style={{
				position: 'absolute',
				left: `${at[0]}%`,
				top: `${at[1]}%`,
				transform: 'translate(-50%, -50%)',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: height * 0.06,
			}}
		>
			<div style={{display: 'flex', alignItems: 'center', gap: height * 0.04}}>
				<Shape kind={1} color={s.accent} size={`${height * 0.16}px`} />
				<div
					style={{
						fontFamily: FONT.display,
						fontWeight: 700,
						fontSize: fontSize('display', height),
						letterSpacing: `${TYPE.display.tracking}em`,
						color: s.ink,
						whiteSpace: 'nowrap',
					}}
				>
					level
				</div>
			</div>
			<div style={{display: 'flex', gap: width * 0.025}}>
				{[0, 1, 2].map((k) => (
					<div
						key={k}
						style={{
							position: 'relative',
							width: width * 0.2,
							height: height * 0.3,
							borderRadius: height * 0.022,
							overflow: 'hidden',
							border: `${Math.max(1, height / 540)}px solid ${s.line}`,
						}}
					>
						<FootageSlot tone={tone} />
					</div>
				))}
			</div>
		</div>
	);
};

/** A tall rounded card holding a plate, with its upper middle on `at` (% of the frame). */
export const Device: React.FC<{tone: Tone; at: [number, number]}> = ({tone, at}) => {
	const s = scheme(tone);
	const {width, height} = useVideoConfig();
	const w = height * 0.42;
	const h = height * 0.86;
	return (
		<div
			style={{
				position: 'absolute',
				left: (at[0] / 100) * width - w / 2,
				top: (at[1] / 100) * height - h * 0.2,
				width: w,
				height: h,
				boxSizing: 'border-box',
				padding: w * 0.05,
				borderRadius: w * 0.14,
				backgroundColor: s.ink,
			}}
		>
			<div style={{position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.1, overflow: 'hidden'}}>
				<FootageSlot tone={tone} />
			</div>
		</div>
	);
};

/** One centred line of large words with the cap height `cap` (% of the frame height), centred on `at`. */
export const WordLine: React.FC<{tone: Tone; cap: number; at: [number, number]; text: string}> = ({tone, cap, at, text}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<div
				style={{
					position: 'absolute',
					left: `${at[0]}%`,
					top: `${at[1]}%`,
					transform: 'translate(-50%, -50%)',
					whiteSpace: 'nowrap',
					fontFamily: FONT.display,
					fontWeight: 700,
					fontSize: ((cap / 100) * height) / CAP_RATIO.display,
					lineHeight: 1,
					letterSpacing: `${TYPE.display.tracking}em`,
					color: s.ink,
				}}
			>
				{text}
			</div>
		</AbsoluteFill>
	);
};
