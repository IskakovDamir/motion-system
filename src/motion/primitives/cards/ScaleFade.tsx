import type React from 'react';
import {AbsoluteFill} from 'remotion';
import {flag, maybe, mix, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {Disc, Lines, Surface, Word, perItem} from './kit';
import {spec} from './ScaleFade.spec';

export type ScaleFadeProps = {
	items: React.ReactNode[];
	tone?: Tone;
	variant?: string;
	/** how the items sit when they scale about their own centres (layout, not motion) */
	direction?: 'row' | 'column';
	/** space between items, px at 1080 */
	gap?: number;
	style?: React.CSSProperties;
};

// Entrance: each item fades in on the opacity motion, scales fromScale -> 1 on the scale motion and rises
// `rise` % H into place on the y motion, `stagger` frames after the previous one. Exit (exit): opacity
// 1 -> 0, scale 1 -> toScale (reached at cutAt when the exit is cut), rising `rise` % H away; with cutAt
// the item is gone once the opacity progress passes it. Origin 'own' scales each item about its own
// centre inside a flex group; origin 'frame' makes every item a full-frame layer scaled about the frame
// centre (the caller positions content inside the layer).
export const ScaleFade: React.FC<ScaleFadeProps> = ({items, variant, direction = 'row', gap = 0, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {h, px} = useFrame();
	const exit = flag(v, 'exit');
	const frameOrigin = str(v, 'origin') === 'frame';
	const stagger = maybe(v, 'stagger') ?? 0;
	const cutAt = maybe(v, 'cutAt');
	const layers = items.map((item, i) => {
		const off = i * stagger;
		const po = p('opacity', off);
		const ps = p('scale', off);
		const py = p('y', off);
		const rise = h(perItem(v, 'rise', i) ?? 0);
		let opacity: number;
		let scale: number;
		let y: number;
		if (exit) {
			opacity = cutAt !== undefined && po >= cutAt ? 0 : 1 - po;
			scale = mix(cutAt !== undefined ? ps / cutAt : ps, 1, perItem(v, 'toScale', i) ?? 1);
			y = -rise * py;
		} else {
			opacity = po;
			scale = mix(ps, perItem(v, 'fromScale', i) ?? 1, 1);
			y = rise * (1 - py);
		}
		const t: React.CSSProperties = {opacity, transform: `translateY(${y}px) scale(${scale})`, transformOrigin: '50% 50%'};
		return frameOrigin ? (
			<AbsoluteFill key={i} style={t}>
				{item}
			</AbsoluteFill>
		) : (
			<div key={i} style={{...t, flexShrink: 0}}>
				{item}
			</div>
		);
	});
	if (frameOrigin) return <AbsoluteFill style={style}>{layers}</AbsoluteFill>;
	return <div style={{display: 'flex', flexDirection: direction, gap: px(gap), alignItems: 'center', ...style}}>{layers}</div>;
};

// ---- isolated demo ----

const centre: React.CSSProperties = {alignItems: 'center', justifyContent: 'center'};

const Terminal: React.FC<{tone: Tone; w: number; h: number; lines: string[]}> = ({tone, w, h, lines}) => {
	const s = scheme(tone);
	return (
		<Surface tone={tone} w={w} h={h} fill="ink" line={false} radius={22} style={{padding: 34, display: 'flex', flexDirection: 'column', gap: 18}}>
			<div style={{display: 'flex', gap: 10, marginBottom: 10}}>
				{[0, 1, 2].map((i) => (
					<div key={i} style={{width: 16, height: 16, borderRadius: 8, backgroundColor: s.inkSoft}} />
				))}
			</div>
			{lines.map((l, i) => (
				<Word key={i} tone={tone} role="code" mono color={i === 0 ? 'onAccent' : 'muted'}>
					{l}
				</Word>
			))}
		</Surface>
	);
};

const Chat: React.FC<{tone: Tone; w: number; h: number}> = ({tone, w, h}) => {
	const s = scheme(tone);
	return (
		<Surface tone={tone} w={w} h={h} style={{padding: 34, display: 'flex', flexDirection: 'column', gap: 24}}>
			<div style={{display: 'flex', alignItems: 'center', gap: 14}}>
				<Disc tone={tone} d={40} fill="muted" />
				<Word tone={tone}>notes</Word>
			</div>
			<div style={{alignSelf: 'flex-end', backgroundColor: s.surfaceAlt, borderRadius: 24, padding: '16px 24px'}}>
				<Word tone={tone}>sort them</Word>
			</div>
			<Lines tone={tone} widths={[w - 140, w - 220, w - 180]} />
			<div style={{flex: 1}} />
			<div style={{height: 70, borderRadius: 35, border: `2px solid ${s.line}`, display: 'flex', alignItems: 'center', padding: '0 24px'}}>
				<Word tone={tone} color="muted">
					reply
				</Word>
			</div>
		</Surface>
	);
};

const Prompt: React.FC<{tone: Tone}> = ({tone}) => {
	const s = scheme(tone);
	return (
		<div style={{width: 980, height: 190, borderRadius: 40, backgroundColor: s.surface, border: `2px solid ${s.line}`, padding: '30px 34px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
			<Word tone={tone} color="muted">
				ask for a plan
			</Word>
			<div style={{display: 'flex', justifyContent: 'flex-end'}}>
				<div style={{width: 64, height: 64, borderRadius: 32, backgroundColor: s.ink, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
					<svg width="30" height="30" viewBox="0 0 30 30">
						<path d="M15 24 L15 7 M8 13 L15 6 L22 13" fill="none" stroke={s.onAccent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</div>
			</div>
		</div>
	);
};

/** A ring of simple shapes around the frame centre (the icon layer). */
const ShapeRing: React.FC<{tone: Tone}> = ({tone}) => {
	const s = scheme(tone);
	const pts = Array.from({length: 8}, (_, i) => {
		const a = (i / 8) * 2 * Math.PI + 0.3;
		return [960 + Math.cos(a) * 640, 540 + Math.sin(a) * 380] as const;
	});
	return (
		<svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
			{pts.map(([x, y], i) => (
				<g key={i} transform={`translate(${x} ${y})`}>
					<rect x={-56} y={-56} width={112} height={112} rx={28} fill={s.surface} stroke={s.line} strokeWidth={2} />
					{i % 3 === 0 ? <circle r={24} fill={s.inkSoft} /> : i % 3 === 1 ? <rect x={-22} y={-22} width={44} height={44} rx={6} fill={s.inkSoft} /> : <path d="M0 -26 L26 20 L-26 20 Z" fill={s.inkSoft} />}
				</g>
			))}
		</svg>
	);
};

const Team: React.FC<{tone: Tone; n: number}> = ({tone, n}) => {
	const s = scheme(tone);
	const r = 120;
	const tiles = Array.from({length: 6}, (_, i) => {
		const a = (i / 6) * 2 * Math.PI;
		return [Math.cos(a) * r, Math.sin(a) * r] as const;
	});
	return (
		<svg width="340" height="320" viewBox="-170 -160 340 320">
			{tiles.map(([x, y], i) => (
				<line key={`l${i}`} x1={0} y1={0} x2={x} y2={y} stroke={s.line} strokeWidth={4} />
			))}
			{tiles.map(([x, y], i) => (
				<rect key={`t${i}`} x={x - 30} y={y - 30} width={60} height={60} rx={14} fill={s.ink} />
			))}
			<circle r={48} fill={s.surface} stroke={s.inkSoft} strokeWidth={5} />
			<text y={14} textAnchor="middle" fontFamily="Inter Variable, sans-serif" fontSize={40} fill={s.ink}>
				{n}
			</text>
		</svg>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	if (variant === 'centreGrowIn') {
		return (
			<AbsoluteFill>
				<ScaleFade
					variant={variant}
					items={[
						<AbsoluteFill key="p" style={centre}>
							<Prompt tone={tone} />
						</AbsoluteFill>,
					]}
				/>
			</AbsoluteFill>
		);
	}
	if (variant === 'riseZoomOut') {
		return (
			<AbsoluteFill>
				<ScaleFade
					variant={variant}
					items={[
						<AbsoluteFill key="p" style={centre}>
							<Prompt tone={tone} />
						</AbsoluteFill>,
						<ShapeRing key="r" tone={tone} />,
					]}
				/>
			</AbsoluteFill>
		);
	}
	if (variant === 'zoomOut') {
		return (
			<AbsoluteFill>
				<ScaleFade
					variant={variant}
					items={[
						<AbsoluteFill key="l" style={{...centre, flexDirection: 'column', gap: 40}}>
							<Word tone={tone} role="display">
								All of it
							</Word>
							<div style={{display: 'flex', gap: 60}}>
								{[0, 1, 2, 3, 4, 5].map((i) => (
									<Surface key={i} tone={tone} w={150} h={150} fill={i % 2 ? 'surface' : 'ink'} radius={34} />
								))}
							</div>
						</AbsoluteFill>,
					]}
				/>
			</AbsoluteFill>
		);
	}
	if (variant === 'staggerIn') {
		const teams = [0, 1, 2, 3, 4, 5].map((i) => <Team key={i} tone={tone} n={i + 1} />);
		// a plain 3 x 2 grid, row by row, one team every `stagger` frames
		return (
			<AbsoluteFill style={centre}>
				<ScaleFade variant={variant} items={teams} gap={60} style={{flexWrap: 'wrap', width: 3 * 340 + 2 * 120, columnGap: 120, justifyContent: 'center'}} />
			</AbsoluteFill>
		);
	}
	if (variant === 'riseGrowIn' || variant === 'shrinkEach') {
		return (
			<AbsoluteFill style={centre}>
				<ScaleFade variant={variant} items={[<Chat key="c" tone={tone} w={760} h={720} />, <Terminal key="t" tone={tone} w={760} h={720} lines={['$ count rows', '48 rows', 'done in 2 s']} />]} gap={80} />
			</AbsoluteFill>
		);
	}
	if (variant === 'shrinkCut') {
		const card = (k: string, label: string) => (
			<Surface key={k} tone={tone} w={820} h={540} fill="accent" line={false} style={{padding: 48, display: 'flex', flexDirection: 'column', gap: 34}}>
				<Word tone={tone} role="label" color="onAccent">
					{label}
				</Word>
				<Lines tone={tone} widths={[560, 640, 420, 520]} fill="onAccent" />
			</Surface>
		);
		return (
			<AbsoluteFill style={centre}>
				<ScaleFade variant={variant} items={[card('a', 'Left desk'), card('b', 'Right desk')]} gap={60} />
			</AbsoluteFill>
		);
	}
	// growIn (default) and shrinkOut: a chat panel and two terminals
	return (
		<AbsoluteFill style={centre}>
			<ScaleFade
				variant={variant ?? spec.defaultVariant}
				items={[
					<Chat key="c" tone={tone} w={600} h={760} />,
					<Terminal key="t" tone={tone} w={980} h={360} lines={['$ make a list', 'three items', 'saved']} />,
					<Terminal key="b" tone={tone} w={980} h={360} lines={['$ check it', 'all good']} />,
				]}
				direction="column"
				gap={40}
				style={{flexWrap: 'wrap', height: 760, alignContent: 'center'}}
			/>
		</AbsoluteFill>
	);
};
