import type React from 'react';
import {AbsoluteFill, random, useVideoConfig} from 'remotion';
import {scheme, type Tone} from '../../tokens/colors';
import {CAP_RATIO, FONT, TYPE, fontSize} from '../../tokens/type';
import {FootageSlot} from '../footage/FootageSlot';

// Neutral demo content for the camera primitives: one opaque canvas, three frames wide and three
// high around the visible frame, tiled with gray plates, short plain words, numbers and simple
// shapes, so a pan, tilt or zoom in any direction always has content to cross. A centre mark sits
// on the frame centre so scale moves read. Free layout (nothing here is measured).

const WORDS = ['north', 'level', 'field', 'plain', 'grid', 'line', 'stone', 'point', 'river', 'cloud', 'shelf', 'frame'];
const NUMBERS = ['24', '108', '3.5', '07', '512', '61', '9', '240'];
const COLS = 12;
const ROWS = 12;
/** canvas origin, in frames, relative to the visible frame */
const FROM = -1;
const SPAN = 3;

const Shape: React.FC<{kind: number; color: string}> = ({kind, color}) => (
	<svg viewBox="0 0 100 100" width="44%" height="44%">
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
 * The demo canvas: opaque, 3 x 3 frames of tiles around the visible frame, with a centre mark.
 * `clearTop` (fraction of the frame height) leaves the top of the visible frame empty.
 */
export const DemoCanvas: React.FC<{tone: Tone; mark?: boolean; clearTop?: number; children?: React.ReactNode}> = ({
	tone,
	mark = true,
	clearTop,
	children,
}) => {
	const s = scheme(tone);
	const {width, height} = useVideoConfig();
	const cw = (width * SPAN) / COLS;
	const ch = (height * SPAN) / ROWS;
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<div style={{position: 'absolute', left: FROM * width, top: FROM * height, width: width * SPAN, height: height * SPAN}}>
				{Array.from({length: COLS * ROWS}, (_, i) => {
					const c = i % COLS;
					const r = Math.floor(i / COLS);
					if (clearTop !== undefined && r * ch + FROM * height < clearTop * height) return null;
					return (
						<div key={i} style={{position: 'absolute', left: c * cw, top: r * ch, width: cw, height: ch}}>
							<Tile i={i} tone={tone} />
						</div>
					);
				})}
			</div>
			{mark ? <CentreMark tone={tone} /> : null}
			{children}
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

/** A second, plain scene for the shot after a cut: one word and a shape on the background. */
export const NextScene: React.FC<{tone: Tone}> = ({tone}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill style={{backgroundColor: s.bgAlt, alignItems: 'center', justifyContent: 'center', gap: height * 0.04, flexDirection: 'row'}}>
			<svg viewBox="0 0 100 100" width={height * 0.12} height={height * 0.12}>
				<rect x="8" y="8" width="84" height="84" rx="14" fill={s.accent} />
			</svg>
			<div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: fontSize('display', height), color: s.ink, letterSpacing: `${TYPE.display.tracking}em`}}>
				next
			</div>
		</AbsoluteFill>
	);
};

/** A canvas row of huge words, wider than the frame (for pans across a headline). */
export const HeadlineCanvas: React.FC<{tone: Tone; capHeight: number; words: string[]}> = ({tone, capHeight, words}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	const size = ((capHeight / 100) * height) / CAP_RATIO.display;
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<div
				style={{
					position: 'absolute',
					left: '8%',
					top: '50%',
					transform: 'translateY(-50%)',
					whiteSpace: 'nowrap',
					fontFamily: FONT.display,
					fontWeight: 800,
					fontSize: size,
					lineHeight: 1,
					letterSpacing: `${TYPE.display.tracking}em`,
					color: s.ink,
				}}
			>
				{words.join(' ')}
			</div>
		</AbsoluteFill>
	);
};
