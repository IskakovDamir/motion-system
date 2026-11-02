import type React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {FootageSlot} from '../../motion/primitives/footage/FootageSlot';
import {scheme, type Scheme, type Tone} from '../../motion/tokens/colors';
import {STAGGER} from '../../motion/tokens/timing';
import {CAP_RATIO, FONT, fontSize, TYPE, type FontRole, type TypeRole} from '../../motion/tokens/type';

// Static pieces the StyleDemo scenes are laid out with: placement in % of the frame, text set in a
// TYPE role, and plain geometric shapes. Nothing here moves; every motion comes from a primitive.

/** Cue spacing inside a shot, from the stagger tokens: one beat is a line apart, a step a word apart. */
export const BEAT = STAGGER.line;
export const STEP = STAGGER.word;

/** Starts its children `at` frames into the shot (their own frame 0 is then the cue). */
export const Cue: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => (
	<Sequence from={Math.round(at)} layout="none">
		{children}
	</Sequence>
);

/** A box placed at (x, y) % of the frame; ax / ay pick the box point that sits there (0 left/top, 1 right/bottom). */
export const At: React.FC<{x: number; y: number; ax?: number; ay?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
	x,
	y,
	ax = 0.5,
	ay = 0.5,
	style,
	children,
}) => (
	<div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: 'max-content', transform: `translate(${-ax * 100}%, ${-ay * 100}%)`, ...style}}>
		{children}
	</div>
);

/** Text in a measured TYPE role; `cap` overrides the role's cap height (% H), `font` its family. */
export const Txt: React.FC<{
	role: TypeRole;
	tone: Tone;
	color?: keyof Scheme;
	cap?: number;
	font?: FontRole;
	weight?: number;
	upper?: boolean;
	style?: React.CSSProperties;
	children: React.ReactNode;
}> = ({role, tone, color = 'ink', cap, font, weight, upper, style, children}) => {
	const {height} = useVideoConfig();
	const t = TYPE[role];
	const family = font ?? t.font;
	const size = cap === undefined ? fontSize(role, height) : ((cap / 100) * height) / CAP_RATIO[family];
	return (
		<span
			style={{
				fontFamily: FONT[family],
				fontWeight: weight ?? t.weight ?? 400,
				fontSize: size,
				letterSpacing: t.tracking === null ? undefined : `${t.tracking}em`,
				textTransform: upper ? 'uppercase' : undefined,
				fontStretch: family === 'wide' ? '125%' : undefined,
				color: scheme(tone)[color],
				whiteSpace: 'pre',
				lineHeight: 1.1,
				...style,
			}}
		>
			{children}
		</span>
	);
};

export const Disc: React.FC<{d: number; tone: Tone; fill?: keyof Scheme}> = ({d, tone, fill = 'ink'}) => (
	<div style={{width: d, height: d, borderRadius: d / 2, backgroundColor: scheme(tone)[fill]}} />
);

/** A moon: a disc with a disc of the ground colour cut out of one side. */
export const Moon: React.FC<{d: number; tone: Tone}> = ({d, tone}) => {
	const s = scheme(tone);
	return (
		<svg width={d} height={d} viewBox="0 0 100 100">
			<defs>
				<mask id="sd-moon">
					<rect width="100" height="100" fill="white" />
					<circle cx="68" cy="38" r="40" fill="black" />
				</mask>
			</defs>
			<circle cx="50" cy="50" r="48" fill={s.ink} mask="url(#sd-moon)" />
		</svg>
	);
};

/** A flat cloud: a pill with two bumps, outlined. */
export const Cloud: React.FC<{w: number; tone: Tone; fill?: keyof Scheme}> = ({w, tone, fill = 'surface'}) => {
	const s = scheme(tone);
	const h = w * 0.46;
	return (
		<svg width={w} height={h} viewBox="0 0 200 92" style={{display: 'block'}}>
			<path
				d="M30 90 a28 28 0 0 1 0 -56 a40 40 0 0 1 72 -16 a34 34 0 0 1 60 24 a25 25 0 0 1 8 48 z"
				fill={s[fill]}
				stroke={s.line}
				strokeWidth={2}
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
};

/** A rain streak filling its box: a short slanted line. */
export const Streak: React.FC<{tone: Tone}> = ({tone}) => (
	<svg width="100%" height="100%" viewBox="0 0 100 100">
		<line x1="58" y1="18" x2="42" y2="82" stroke={scheme(tone).inkSoft} strokeWidth={5} strokeLinecap="round" />
	</svg>
);

export const Bolt: React.FC<{h: number; tone: Tone}> = ({h, tone}) => (
	<svg width={h * 0.62} height={h} viewBox="0 0 62 100">
		<polygon points="36,0 4,58 28,58 20,100 58,36 34,36 46,0" fill={scheme(tone).ink} />
	</svg>
);

/** A triangle pointing down (a falling reading). */
export const Fall: React.FC<{d: number; tone: Tone}> = ({d, tone}) => (
	<svg width={d} height={d * 0.86} viewBox="0 0 100 86">
		<polygon points="0,0 100,0 50,86" fill={scheme(tone).ink} />
	</svg>
);

/** A rounded card carrying a gray footage plate (no footage file: the plate stands in). */
export const PlateCard: React.FC<{w: number; h: number; tone: Tone; label: string; radius?: number; children?: React.ReactNode}> = ({
	w,
	h,
	tone,
	label,
	radius = 28,
	children,
}) => (
	<div style={{position: 'relative', width: w, height: h, borderRadius: radius, overflow: 'hidden'}}>
		{children ?? <FootageSlot tone={tone} label={label} />}
	</div>
);

/** A pill with one line of text in it. */
export const Chip: React.FC<{tone: Tone; filled?: boolean; children: React.ReactNode}> = ({tone, filled, children}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	const pad = height * 0.016;
	return (
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: pad,
				padding: `${pad}px ${pad * 2}px`,
				borderRadius: 999,
				backgroundColor: filled ? s.surface : 'transparent',
				border: `2px solid ${s.line}`,
			}}
		>
			{children}
		</div>
	);
};

/** The frame's ground as one layer (scenes are transparent; StyleDemo lays the ground under them). */
export const Ground: React.FC<{tone: Tone; fill?: keyof Scheme}> = ({tone, fill = 'bg'}) => (
	<AbsoluteFill style={{backgroundColor: scheme(tone)[fill]}} />
);
