import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {flag, maybe, num, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FONT} from '../../tokens/type';
import type {DemoProps} from '../types';
import {Bar, Panel, Word} from './kit';
import {spec} from './BusyIndicator.spec';

export type BusyIndicatorProps = {
	tone?: Tone;
	variant?: string;
	/** glyph size, px at 1080 */
	size?: number;
	/** the mark a pulse or turn variant moves (default: a drawn neutral mark) */
	children?: React.ReactNode;
	/** blink: which placeholder this is (each later one runs `lag` frames behind) */
	index?: number;
	/** blink: placeholder size, px at 1080 */
	width?: number;
	height?: number;
	style?: React.CSSProperties;
};

// Unit glyphs, drawn on a 100 x 100 box: arms from the centre, the stroke weight tells them apart.
const STAR_ARMS: Record<string, {arms: number; turn: number; weight: number; len: number}> = {
	plus: {arms: 4, turn: 0, weight: 9, len: 30},
	thinStar: {arms: 8, turn: 0, weight: 5, len: 36},
	sixStar: {arms: 6, turn: 0, weight: 9, len: 38},
	asterisk: {arms: 8, turn: 22.5, weight: 11, len: 38},
	heavyAsterisk: {arms: 8, turn: 0, weight: 17, len: 40},
};

const StarGlyph: React.FC<{name: string; color: string; size: number}> = ({name, color, size}) => {
	const g = STAR_ARMS[name];
	return (
		<svg width={size} height={size} viewBox="0 0 100 100">
			{g ? (
				Array.from({length: g.arms}, (_, i) => {
					const a = ((g.turn + (i * 360) / g.arms) * Math.PI) / 180;
					return (
						<line
							key={i}
							x1={50}
							y1={50}
							x2={50 + Math.sin(a) * g.len}
							y2={50 - Math.cos(a) * g.len}
							stroke={color}
							strokeWidth={g.weight}
							strokeLinecap="round"
						/>
					);
				})
			) : (
				<circle cx={50} cy={50} r={9} fill={color} />
			)}
		</svg>
	);
};

const DotGlyph: React.FC<{cells: string; color: string; size: number}> = ({cells, color, size}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		{[1, 2, 3, 4, 5, 6].map((c) =>
			cells.includes(String(c)) ? <circle key={c} cx={c <= 3 ? 36 : 64} cy={22 + ((c - 1) % 3) * 28} r={10} fill={color} /> : null,
		)}
	</svg>
);

const Petals: React.FC<{color: string; mark: string; size: number}> = ({color, mark, size}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		{[0, 1, 2, 3, 4, 5].map((i) => (
			<ellipse key={i} cx={50} cy={27} rx={10} ry={21} fill={i === 0 ? mark : color} transform={`rotate(${i * 60} 50 50)`} />
		))}
	</svg>
);

// One indicator. Steps run on frame clocks from the variant: state = floor(frame / stepFrames), so the
// first step comes one interval after the indicator appears.
export const BusyIndicator: React.FC<BusyIndicatorProps> = ({tone = 'light', variant, size = 64, children, index = 0, width, height, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {px} = useFrame();
	const s = scheme(tone);
	const kind = str(v, 'kind');
	const box = px(size);
	let mark: React.ReactNode = null;
	if (kind === 'stars') {
		const names = str(v, 'glyphs').split(' ');
		const seq = flag(v, 'pingPong') ? [...names, ...names.slice(1, -1).reverse()] : names;
		mark = <StarGlyph name={seq[Math.floor(frame / num(v, 'stepFrames')) % seq.length] ?? ''} color={s.ink} size={box} />;
	} else if (kind === 'dots') {
		const pats = str(v, 'patterns').split(' ');
		mark = <DotGlyph cells={pats[Math.floor(frame / num(v, 'stepFrames')) % pats.length] ?? ''} color={s.ink} size={box} />;
	} else if (kind === 'arc') {
		const arc = num(v, 'arc');
		const a = ((arc / 2) * Math.PI) / 180;
		const r = 38;
		mark = (
			<svg width={box} height={box} viewBox="0 0 100 100" style={{transform: `rotate(${num(v, 'startDeg') + num(v, 'degPerFrame') * frame}deg)`}}>
				<circle cx={50} cy={50} r={r} fill="none" stroke={s.line} strokeWidth={10} />
				<path
					d={`M ${50 - Math.sin(a) * r} ${50 - Math.cos(a) * r} A ${r} ${r} 0 ${arc > 180 ? 1 : 0} 1 ${50 + Math.sin(a) * r} ${50 - Math.cos(a) * r}`}
					fill="none"
					stroke={s.ink}
					strokeWidth={10}
					strokeLinecap="round"
				/>
			</svg>
		);
	} else if (kind === 'spokes') {
		const n = num(v, 'spokes');
		const rate = maybe(v, 'degPerFrame') ?? 0;
		mark = (
			<svg width={box} height={box} viewBox="0 0 100 100" style={{transform: `rotate(${rate * frame}deg)`}}>
				{Array.from({length: n}, (_, i) => (
					<line key={i} x1={50} y1={22} x2={50} y2={8} stroke={s.muted} strokeWidth={9} strokeLinecap="round" transform={`rotate(${(i * 360) / n} 50 50)`} />
				))}
			</svg>
		);
	} else if (kind === 'pulse') {
		// the pulse restarts every period: offset each loop by the frames already played
		const loopStart = frame - (frame % num(v, 'period'));
		const pulse = p('rise', loopStart) - p('fall', loopStart);
		mark = <div style={{opacity: 1 - num(v, 'fade') * pulse}}>{children ?? <svg width={box} height={box} viewBox="0 0 100 100"><circle cx={50} cy={50} r={44} fill={s.ink} /></svg>}</div>;
	} else if (kind === 'turn') {
		mark = <div style={{transform: `rotate(${num(v, 'turn') * p('rotate')}deg)`, width: box, height: box}}>{children ?? <Petals color={s.ink} mark={s.muted} size={box} />}</div>;
	} else if (kind === 'blink') {
		const t = frame - index * num(v, 'lag');
		const on = t >= 0 && t % num(v, 'period') < num(v, 'onFrames');
		mark = <div style={{width: px(width ?? size), height: px(height ?? size), borderRadius: px(size) / 4, backgroundColor: s.muted, opacity: on ? 1 : 0}} />;
	}
	const timerFrames = maybe(v, 'timerFrames');
	return (
		<div style={{display: 'inline-flex', alignItems: 'center', gap: box / 3, ...style}}>
			{mark}
			{timerFrames === undefined ? null : (
				<span style={{fontFamily: FONT.mono, fontSize: box * 0.5, color: s.muted}}>
					{`${(Math.floor(frame / timerFrames) * num(v, 'timerStep')).toFixed(num(v, 'timerStep') < 1 ? 1 : 0)}s`}
				</span>
			)}
		</div>
	);
};

// ---- isolated demo ----

const H = 1080;

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const kind = str(v, 'kind');
	const tone: Tone = kind === 'arc' || kind === 'blink' || kind === 'turn' ? 'dark' : 'light';
	const s = scheme(tone);
	if (kind === 'blink') {
		// a track with two gaps between clips; a placeholder blinks in each gap
		return (
			<AbsoluteFill style={{backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center'}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 28}}>
					<div style={{width: 360, height: 180, borderRadius: 16, backgroundColor: s.surfaceAlt}} />
					<BusyIndicator tone={tone} variant={variant} index={0} size={180} width={240} height={180} />
					<div style={{width: 300, height: 180, borderRadius: 16, backgroundColor: s.surfaceAlt}} />
					<BusyIndicator tone={tone} variant={variant} index={1} size={180} width={240} height={180} />
					<div style={{width: 260, height: 180, borderRadius: 16, backgroundColor: s.surfaceAlt}} />
				</div>
			</AbsoluteFill>
		);
	}
	const label = kind === 'turn' ? 'drawing' : kind === 'arc' ? 'saving' : 'working';
	return (
		<AbsoluteFill style={{backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center'}}>
			<Panel tone={tone} style={{padding: '60px 90px', display: 'flex', alignItems: 'center', gap: 50, borderRadius: 40}}>
				<BusyIndicator tone={tone} variant={variant} size={kind === 'arc' || kind === 'spokes' ? 150 : 170} />
				<div style={{display: 'flex', flexDirection: 'column', gap: 22}}>
					<Word tone={tone} height={H} role="headline">
						{label}
					</Word>
					<Bar tone={tone} w={360} h={20} />
				</div>
			</Panel>
		</AbsoluteFill>
	);
};
