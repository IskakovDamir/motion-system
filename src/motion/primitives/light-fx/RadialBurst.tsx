import type React from 'react';
import {AbsoluteFill, random, useVideoConfig} from 'remotion';
import {num, variantOf} from '../../engine/anim';
import {mix, progressAt} from '../../engine/progress';
import {scheme, type Scheme, type Tone} from '../../tokens/colors';
import type {Motion} from '../../tokens/easing';
import {fontSize, FONT} from '../../tokens/type';
import type {DemoProps, VariantSpec} from '../types';
import {DRAW} from './draw';
import {CENTRE, clamp01, darkest, lumaOf, type Origin, useRefFrame, withAlpha} from './light';
import {spec} from './RadialBurst.spec';

export type RadialBurstProps = {
	tone?: Tone;
	variant?: string;
	/** burst centre, % of the frame */
	origin?: Origin;
	/** outline weight of tiles and echo rings, px at 1080p (not measured: DRAW default) */
	linePx?: number;
};

const mot = (v: VariantSpec, prop: string): Motion => {
	const m = v.motions[prop];
	if (!m) throw new Error(`RadialBurst variant has no motion ${prop}`);
	return m;
};
const end = (m: Motion) => m.delay + m.duration;

type Ctx = {v: VariantSpec; f: number; s: Scheme; width: number; height: number; ox: number; oy: number; line: number};

/** Glowing square tiles on a grid, each lit as the ring front reaches it and fading behind it. */
const TileRing: React.FC<Ctx> = ({v, f, s, width, height, ox, oy, line}) => {
	const px = (at1080: number) => (at1080 * height) / 1080;
	const radius = mot(v, 'radius');
	const fade = mot(v, 'fade');
	const R = (t: number) => (num(v, 'toRadius') / 100) * width * progressAt(t, radius);
	// the front's radius at every frame of the move, to find when it reached a tile
	const frames = Array.from({length: Math.ceil(end(radius)) + 1}, (_, t) => t);
	const front = frames.map(R);
	const litAt = (d: number): number | null => {
		for (let k = 1; k < front.length; k++) {
			const a = front[k - 1] ?? 0;
			const b = front[k] ?? 0;
			if (d <= b) return b > a ? k - 1 + (d - a) / (b - a) : k - 1;
		}
		return null;
	};
	const pitch = px(num(v, 'tileMax'));
	const cols = Math.ceil(width / pitch);
	const rows = Math.ceil(height / pitch);
	const tiles: React.ReactNode[] = [];
	for (let j = 0; j < rows; j++) {
		for (let i = 0; i < cols; i++) {
			const cx = (i + 0.5) * pitch;
			const cy = (j + 0.5) * pitch;
			const t0 = litAt(Math.hypot(cx - ox, cy - oy));
			if (t0 === null || f < t0) continue;
			const a = num(v, 'tilePeak') * (1 - clamp01(progressAt(f - t0, fade)));
			if (a <= 1e-3) continue;
			const size = px(mix(random(`tile-size-${i}-${j}`), num(v, 'tileMin'), num(v, 'tileMax')));
			const filled = random(`tile-fill-${i}-${j}`) < 0.5;
			tiles.push(
				<div
					key={`${i}-${j}`}
					style={{
						position: 'absolute',
						left: cx - size / 2,
						top: cy - size / 2,
						width: size,
						height: size,
						boxSizing: 'border-box',
						border: `${line}px solid ${s.flash}`,
						backgroundColor: filled ? s.flash : 'transparent',
						opacity: a * (filled ? random(`tile-luma-${i}-${j}`) : 1),
					}}
				/>,
			);
		}
	}
	return <AbsoluteFill>{tiles}</AbsoluteFill>;
};

/** Concentric rounded-square outlines zooming out of the source, the outer ones turning. */
const EchoZoom: React.FC<Ctx> = ({v, f, s, width, height, ox, oy, line}) => {
	const scale = mot(v, 'scale');
	const outer = f <= end(scale) ? mix(progressAt(f, scale), 1, num(v, 'toScale')) : num(v, 'toScale') * num(v, 'exitRate') ** (f - end(scale));
	const base = (num(v, 'size') * height) / 1080;
	const n = num(v, 'count');
	const twist = num(v, 'twist') * progressAt(f, mot(v, 'twist'));
	const reach = Math.hypot(width, height);
	return (
		<AbsoluteFill>
			{Array.from({length: n}, (_, i) => {
				const k = (i + 1) / n;
				const size = base * (1 + (outer - 1) * k);
				if (size > reach + line) return null;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: ox - size / 2,
							top: oy - size / 2,
							width: size,
							height: size,
							boxSizing: 'border-box',
							border: `${line}px solid ${s.flash}`,
							borderRadius: size * DRAW.ringCorner,
							transform: `rotate(${twist * k}deg)`,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

/** Soft rings born at the centre in turn, expanding at a steady rate until they leave. */
const ShockRings: React.FC<Ctx> = ({v, f, s, width, height, ox, oy}) => {
	const half = (DRAW.shockPx * height) / 1080;
	return (
		<AbsoluteFill>
			{Array.from({length: num(v, 'count')}, (_, i) => {
				const m = mot(v, `ring${i + 1}`);
				if (f < m.delay || f >= end(m)) return null;
				const r = (num(v, `ring${i + 1}To`) / 100) * width * progressAt(f, m);
				const c = withAlpha(s.flash, DRAW.shockAlpha);
				return (
					<AbsoluteFill
						key={i}
						style={{background: `radial-gradient(circle at ${ox}px ${oy}px, transparent ${Math.max(0, r - half)}px, ${c} ${r}px, transparent ${r + half}px)`}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

/** Angular flat shards flying out from the centre and growing; light, then dark after the flip. */
const ShardSpray: React.FC<Ctx> = ({v, f, s, width, height, ox, oy}) => {
	const p = progressAt(f, mot(v, 'fly'));
	const n = num(v, 'count');
	const color = f < num(v, 'flipAt') ? s.flash : darkest(s);
	const base = (DRAW.shardPx * height) / 1080;
	return (
		<AbsoluteFill>
			{Array.from({length: n}, (_, i) => {
				const angle = ((i + random(`shard-a-${i}`)) / n) * 2 * Math.PI;
				const r = (mix(p, mix(random(`shard-r0-${i}`), num(v, 'fromMin'), num(v, 'fromMax')), mix(random(`shard-r1-${i}`), num(v, 'toMin'), num(v, 'toMax'))) / 100) * width;
				const size = base * mix(p, 1, mix(random(`shard-g-${i}`), num(v, 'growMin'), num(v, 'growMax')));
				// four corners at irregular radii: a flat, angular shard
				const pts = [0, 1, 2, 3]
					.map((c) => {
						const a = (c / 4) * 2 * Math.PI + random(`shard-c-${i}-${c}`);
						const d = 50 * mix(random(`shard-d-${i}-${c}`), 0.35, 1);
						return `${50 + d * Math.cos(a)},${50 + d * Math.sin(a)}`;
					})
					.join(' ');
				return (
					<svg
						key={i}
						viewBox="0 0 100 100"
						style={{position: 'absolute', left: ox + r * Math.cos(angle) - size / 2, top: oy + r * Math.sin(angle) - size / 2, width: size, height: size, overflow: 'visible'}}
					>
						<polygon points={pts} fill={color} />
					</svg>
				);
			})}
		</AbsoluteFill>
	);
};

/** A soft ring band of halftone dots over a static grid, its inner edge running out on the curve. */
const DotRing: React.FC<Ctx> = ({v, f, s, width, ox, oy}) => {
	const pct = (x: number) => (x / 100) * width;
	const rin = pct(mix(progressAt(f, mot(v, 'progress')), num(v, 'fromRadius'), num(v, 'toRadius')));
	const rout = rin * num(v, 'outerRatio');
	const soft = Math.min(pct(num(v, 'soft')), rout - rin);
	const pitch = pct(num(v, 'pitch'));
	const dot = pitch / 4; // dot radius: the dots fill pi / 16 of the grid
	const contrast = num(v, 'deficit') / (Math.PI / 16);
	const bg = lumaOf(s.bg);
	const dark = bg > lumaOf(s.flash) / 2;
	const color = dark ? darkest(s) : s.flash;
	const alpha = dark ? contrast / (bg - lumaOf(darkest(s))) : contrast / (lumaOf(s.flash) - bg);
	const mask = `radial-gradient(circle at ${ox}px ${oy}px, transparent ${rin}px, black ${rin + soft}px, black ${rout}px, transparent ${rout}px)`;
	return (
		<AbsoluteFill
			style={{
				backgroundImage: `radial-gradient(circle, ${withAlpha(color, alpha)} ${dot}px, transparent ${dot + 1}px)`,
				backgroundSize: `${pitch}px ${pitch}px`,
				backgroundPosition: `${(ox % pitch) - pitch / 2}px ${(oy % pitch) - pitch / 2}px`,
				maskImage: mask,
				WebkitMaskImage: mask,
			}}
		/>
	);
};

const PARTS: Record<string, React.FC<Ctx>> = {tileRing: TileRing, echoZoom: EchoZoom, shockRings: ShockRings, shardSpray: ShardSpray, dotRing: DotRing};

export const RadialBurst: React.FC<RadialBurstProps> = ({tone = 'dark', variant, origin = CENTRE, linePx = DRAW.linePx}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const f = useRefFrame();
	const {width, height} = useVideoConfig();
	const Part = PARTS[name];
	if (!Part) throw new Error(`RadialBurst has no drawing for ${name}`);
	return (
		<Part
			v={v}
			f={f}
			s={scheme(tone)}
			width={width}
			height={height}
			ox={(origin.x / 100) * width}
			oy={(origin.y / 100) * height}
			line={(linePx * height) / 1080}
		/>
	);
};

// ---- Demo: the burst from a plain source in the middle of the frame ----

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const {height} = useVideoConfig();
	const tone: Tone = variant === 'dotRing' ? 'light' : 'dark';
	const s = scheme(tone);
	const bg = variant === 'shardSpray' ? scheme('light').plate : s.bg;
	const source =
		variant === 'echoZoom' ? (
			<div style={{width: 146, height: 146, borderRadius: 146 * DRAW.ringCorner, backgroundColor: s.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<svg width="64" height="64" viewBox="0 0 64 64">
					<path d="M32 52 V14 M16 28 L32 12 L48 28" fill="none" stroke={s.ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</div>
		) : variant === 'dotRing' ? (
			<div style={{width: 56, height: 12, borderRadius: 6, backgroundColor: s.inkSoft}} />
		) : variant === 'shardSpray' ? null : (
			<div style={{padding: '22px 60px', borderRadius: 999, backgroundColor: s.surfaceAlt, fontFamily: FONT.ui, fontWeight: 600, fontSize: fontSize('ui', height) * 1.6, color: s.ink}}>Go</div>
		);
	return (
		<AbsoluteFill style={{backgroundColor: bg}}>
			<RadialBurst variant={variant} tone={tone} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>{source}</AbsoluteFill>
		</AbsoluteFill>
	);
};
