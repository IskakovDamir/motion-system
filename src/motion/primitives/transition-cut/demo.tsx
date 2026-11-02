import type React from 'react';
import {AbsoluteFill, random, useVideoConfig} from 'remotion';
import {scheme, type Tone} from '../../tokens/colors';
import {FONT, TYPE, fontSize} from '../../tokens/type';
import {FootageSlot} from '../footage/FootageSlot';

// Neutral demo content for the cut primitives: plain words, numbers, simple shapes and gray plates in
// the grayscale roles. Free layout: nothing here is measured, except where a Demo passes a measured
// param in. Canvases reach one frame past every edge, so a whip always has content to cross.

const WORDS = ['north', 'level', 'field', 'plain', 'grid', 'line', 'stone', 'point', 'river', 'cloud', 'shelf', 'frame'];
const NUMBERS = ['24', '108', '3.5', '07', '512', '61', '9', '240'];

export const Shape: React.FC<{kind: number; color: string; size?: string}> = ({kind, color, size = '44%'}) => (
	<svg viewBox="0 0 100 100" width={size} height={size}>
		{kind === 0 ? <circle cx="50" cy="50" r="42" fill={color} /> : null}
		{kind === 1 ? <rect x="10" y="10" width="80" height="80" rx="10" fill={color} /> : null}
		{kind === 2 ? <polygon points="50,8 94,90 6,90" fill={color} /> : null}
		{kind === 3 ? <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="10" /> : null}
	</svg>
);

const Tile: React.FC<{i: number; tone: Tone; seed: string; alt: boolean}> = ({i, tone, seed, alt}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	const pick = (key: string, n: number) => Math.floor(random(`${seed}${key}${i}`) * n);
	const kind = pick('kind', 4);
	const box: React.CSSProperties = {
		position: 'absolute',
		inset: '7%',
		borderRadius: height * 0.022,
		overflow: 'hidden',
		backgroundColor: alt ? s.surfaceAlt : s.surface,
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
			<Shape kind={pick('shape', 4)} color={alt ? s.ink : s.accent} />
		</div>
	);
};

/**
 * An opaque canvas of tiles, 3 x 3 frames around the visible frame, with a large word on the frame
 * centre so a cut, a re-frame or a zoom reads. `alt` is the second look (darker ground and tiles).
 */
export const Canvas: React.FC<{tone: Tone; seed: string; alt?: boolean; word: string; cols?: number}> = ({tone, seed, alt = false, word, cols = 12}) => {
	const s = scheme(tone);
	const {width, height} = useVideoConfig();
	const cw = (width * 3) / cols;
	const ch = (height * 3) / cols;
	const centre = height * 0.2;
	return (
		<AbsoluteFill style={{backgroundColor: alt ? s.bgAlt : s.bg}}>
			<div style={{position: 'absolute', left: -width, top: -height, width: width * 3, height: height * 3}}>
				{Array.from({length: cols * cols}, (_, i) => (
					<div key={i} style={{position: 'absolute', left: (i % cols) * cw, top: Math.floor(i / cols) * ch, width: cw, height: ch}}>
						<Tile i={i} tone={tone} seed={seed} alt={alt} />
					</div>
				))}
			</div>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div
					style={{
						padding: `${centre * 0.12}px ${centre * 0.3}px`,
						borderRadius: centre * 0.16,
						backgroundColor: alt ? s.ink : s.surface,
						border: `${Math.max(2, height / 360)}px solid ${s.ink}`,
						fontFamily: FONT.display,
						fontWeight: 700,
						fontSize: fontSize('display', height),
						letterSpacing: `${TYPE.display.tracking}em`,
						lineHeight: 1.05,
						color: alt ? s.surface : s.ink,
					}}
				>
					{word}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** A frame-sized layout: a gray plate, a word, a shape and a number on the background (opaque unless `clear`). */
export const Panel: React.FC<{tone: Tone; word: string; number: string; shape: number; alt?: boolean; clear?: boolean; flip?: boolean}> = ({
	tone,
	word,
	number,
	shape,
	alt = false,
	clear = false,
	flip = false,
}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	const side = flip ? 'right' : 'left';
	const other = flip ? 'left' : 'right';
	return (
		<AbsoluteFill style={{backgroundColor: clear ? undefined : alt ? s.bgAlt : s.bg}}>
			<div style={{position: 'absolute', [side]: '8%', top: '14%', width: '36%', height: '44%', borderRadius: height * 0.025, overflow: 'hidden'}}>
				<FootageSlot tone={tone} label="footage" />
			</div>
			<div
				style={{
					position: 'absolute',
					[side]: '8%',
					top: '64%',
					fontFamily: FONT.display,
					fontWeight: 700,
					fontSize: fontSize('display', height),
					letterSpacing: `${TYPE.display.tracking}em`,
					lineHeight: 1,
					color: s.ink,
				}}
			>
				{word}
			</div>
			<div style={{position: 'absolute', [other]: '10%', top: '18%', width: '30%', height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<Shape kind={shape} color={alt ? s.ink : s.accent} size="100%" />
			</div>
			<div style={{position: 'absolute', [other]: '10%', bottom: '12%', fontFamily: FONT.mono, fontSize: fontSize('headline', height), color: s.muted}}>{number}</div>
		</AbsoluteFill>
	);
};

/** A window: a title bar with three dots and a word, a sidebar of short words, a grid of plates. */
export const Window: React.FC<{tone: Tone; title: string; chromeOnly?: boolean; contentOnly?: boolean; inset?: number; action?: string}> = ({
	tone,
	title,
	chromeOnly = false,
	contentOnly = false,
	inset = 4,
	action,
}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	const bar = 9;
	const side = 20;
	const r = height * 0.03;
	const label: React.CSSProperties = {fontFamily: FONT.ui, fontSize: fontSize('label', height), color: s.inkSoft};
	return (
		<div style={{position: 'absolute', inset: `${inset}%`, borderRadius: r, overflow: 'hidden', backgroundColor: chromeOnly ? undefined : s.surface}}>
			{chromeOnly ? null : (
				<div style={{position: 'absolute', left: `${side}%`, top: `${bar}%`, right: 0, bottom: 0, padding: '2%'}}>
					<div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4%', width: '100%', height: '100%'}}>
						{Array.from({length: 12}, (_, i) => (
							<div key={i} style={{position: 'relative', borderRadius: r * 0.5, overflow: 'hidden'}}>
								{i % 3 === 1 ? (
									<div style={{position: 'absolute', inset: 0, backgroundColor: s.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
										<Shape kind={i % 4} color={s.ink} size="46%" />
									</div>
								) : (
									<FootageSlot tone={tone} />
								)}
							</div>
						))}
					</div>
				</div>
			)}
			{contentOnly ? null : (
				<>
					<div
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: 0,
							height: `${bar}%`,
							backgroundColor: s.bgAlt,
							borderBottom: `${Math.max(1, height / 540)}px solid ${s.line}`,
							display: 'flex',
							alignItems: 'center',
							gap: height * 0.012,
							paddingLeft: '2%',
						}}
					>
						{[0, 1, 2].map((k) => (
							<div key={k} style={{width: height * 0.018, height: height * 0.018, borderRadius: '50%', backgroundColor: s.muted}} />
						))}
						<div style={{...label, marginLeft: '2%', color: s.ink}}>{title}</div>
						{action ? (
							<div style={{...label, marginLeft: 'auto', marginRight: '2%', display: 'flex', alignItems: 'center', gap: height * 0.01, color: s.ink}}>
								{action}
								<Shape kind={2} color={s.ink} size={`${height * 0.022}px`} />
							</div>
						) : null}
					</div>
					<div
						style={{
							position: 'absolute',
							left: 0,
							top: `${bar}%`,
							bottom: 0,
							width: `${side}%`,
							backgroundColor: s.bg,
							borderRight: `${Math.max(1, height / 540)}px solid ${s.line}`,
							padding: '1.6% 2%',
							display: 'flex',
							flexDirection: 'column',
							gap: height * 0.022,
						}}
					>
						{WORDS.slice(0, 7).map((w) => (
							<div key={w} style={label}>
								{w}
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
};

/** A tall list of rows, `tall` % H high from the top of the frame (it scrolls past the frame). */
export const Thread: React.FC<{tone: Tone; tall: number}> = ({tone, tall}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	const row = 16;
	const n = Math.floor(tall / row);
	return (
		<div style={{position: 'absolute', left: '22%', width: '56%', top: 0, height: `${tall}%`, backgroundColor: s.surface, borderRadius: height * 0.03, border: `${Math.max(1, height / 540)}px solid ${s.line}`}}>
			{Array.from({length: n}, (_, i) => (
				<div key={i} style={{position: 'absolute', left: '5%', right: '5%', top: `${((i * row + 3) / tall) * 100}%`, height: `${((row - 6) / tall) * 100}%`, display: 'flex', gap: '3%', alignItems: 'center'}}>
					<div style={{width: height * 0.08, height: height * 0.08, borderRadius: '50%', backgroundColor: i % 2 ? s.inkSoft : s.plate, flexShrink: 0}} />
					<div style={{display: 'flex', flexDirection: 'column', gap: height * 0.012, flex: 1}}>
						<div style={{fontFamily: FONT.ui, fontWeight: 600, fontSize: fontSize('label', height), color: s.ink}}>{WORDS[i % WORDS.length]}</div>
						<div style={{height: height * 0.014, width: `${60 + ((i * 17) % 35)}%`, backgroundColor: s.line, borderRadius: 4}} />
						<div style={{height: height * 0.014, width: `${40 + ((i * 29) % 45)}%`, backgroundColor: s.line, borderRadius: 4}} />
					</div>
					<div style={{fontFamily: FONT.mono, fontSize: fontSize('label', height), color: s.muted}}>{NUMBERS[i % NUMBERS.length]}</div>
				</div>
			))}
		</div>
	);
};

/** Three columns of cards between the given % W bands, their first card's top at `top` % H. */
export const Columns: React.FC<{tone: Tone; bands: [number, number][]; top: number}> = ({tone, bands, top}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill>
			{bands.map(([a, b], c) => (
				<div key={c} style={{position: 'absolute', left: `${a}%`, width: `${b - a}%`, top: `${top}%`, display: 'flex', flexDirection: 'column', gap: height * 0.03}}>
					{[0, 1].map((k) => (
						<div key={k} style={{height: height * 0.5, borderRadius: height * 0.025, backgroundColor: s.accent, padding: '6%', display: 'flex', flexDirection: 'column', gap: height * 0.02}}>
							<div style={{display: 'flex', alignItems: 'center', gap: '5%'}}>
								<div style={{width: height * 0.05, height: height * 0.05, borderRadius: '50%', backgroundColor: s.muted}} />
								<div style={{fontFamily: FONT.ui, fontWeight: 600, fontSize: fontSize('label', height), color: s.onAccent}}>{WORDS[(c * 2 + k + 3) % WORDS.length]}</div>
							</div>
							<div style={{position: 'relative', flex: 1, borderRadius: height * 0.015, overflow: 'hidden'}}>
								<FootageSlot tone="dark" />
							</div>
						</div>
					))}
				</div>
			))}
		</AbsoluteFill>
	);
};

/** A centred overlay: one word over a ring, on no background. */
export const Overlay: React.FC<{tone: Tone; word: string}> = ({tone, word}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: height * 0.03}}>
			<Shape kind={3} color={s.flash} size={`${height * 0.16}px`} />
			<div style={{fontFamily: FONT.display, fontWeight: 800, fontSize: fontSize('display', height), color: s.flash, letterSpacing: `${TYPE.display.tracking}em`, lineHeight: 1}}>{word}</div>
		</AbsoluteFill>
	);
};

/** A full-frame gray plate (footage stand-in) in the plate tone of `tone`. */
export const Plate: React.FC<{tone: Tone; label: string}> = ({tone, label}) => <FootageSlot tone={tone} label={label} />;

/** A headline word near the top of the frame, on no background. */
export const Headline: React.FC<{tone: Tone; word: string}> = ({tone, word}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill style={{alignItems: 'center'}}>
			<div style={{marginTop: '6%', fontFamily: FONT.display, fontSize: fontSize('headline', height), letterSpacing: `${TYPE.headline.tracking}em`, color: s.ink}}>{word}</div>
		</AbsoluteFill>
	);
};

/** A rounded phone outline with a plate inside, standing on its top edge at `top` % H, centred at `x` % W. */
export const Phone: React.FC<{tone: Tone; x: number; top: number}> = ({tone, x, top}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	const w = height * 0.32;
	return (
		<div
			style={{
				position: 'absolute',
				left: `calc(${x}% - ${w / 2}px)`,
				top: `${top}%`,
				width: w,
				height: w * 2,
				borderRadius: w * 0.16,
				border: `${height * 0.012}px solid ${s.ink}`,
				backgroundColor: s.surface,
				overflow: 'hidden',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: height * 0.03,
			}}
		>
			<div style={{position: 'relative', width: '80%', height: '40%', borderRadius: w * 0.06, overflow: 'hidden'}}>
				<FootageSlot tone={tone} />
			</div>
			<div style={{fontFamily: FONT.wide, fontWeight: 800, fontSize: fontSize('label', height), color: s.ink}}>{NUMBERS[1]}</div>
		</div>
	);
};
