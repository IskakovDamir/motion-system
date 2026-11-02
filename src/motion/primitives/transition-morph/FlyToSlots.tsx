import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {num, variantOf} from '../../engine/anim';
import {mix} from '../../engine/progress';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps, VariantSpec} from '../types';
import {At, clamp01, mot, prog, type Pt, Shape, Tile, useT, Word} from './kit';
import {spec} from './FlyToSlots.spec';

// Each item travels from its start to its slot: a per-item start offset (a fixed stagger, a launch
// wave from a centre, or none), a progress along the path (straight, or an arc that dips and levels
// before it rises into the slot), and a scale toward the slot size.

type Pose = {x: number; y: number; scale: number; morph: number};

/** y (% H) along an arc from fy to ty that dips `dip` below fy at `dipAt` of the x travel, level there. */
const arcY = (u: number, fy: number, ty: number, dip: number, dipAt: number): number => {
	const yd = fy + dip;
	if (u <= dipAt) return yd - dip * ((dipAt - u) / dipAt) ** 2;
	return yd - (yd - ty) * ((u - dipAt) / (1 - dipAt)) ** 2;
};

const offsets = (name: string, v: VariantSpec, from: Pt[], size: {width: number; height: number}): number[] => {
	if (name === 'gather') return from.map((_, i) => i * num(v, 'stagger'));
	if (name === 'swirl') {
		// launch wave: distance from the centre in px at 1080 over the wave speed
		const k = 1080 / size.height;
		return from.map(([x, y]) => {
			const dx = ((x - num(v, 'centreX')) / 100) * size.width * k;
			const dy = ((y - num(v, 'centreY')) / 100) * size.height * k;
			return Math.hypot(dx, dy) / num(v, 'waveSpeed');
		});
	}
	return from.map(() => 0);
};

const poseAt = (name: string, v: VariantSpec, t: number, i: number, from: Pt, slot: Pt): Pose => {
	const line = (p: number) => ({x: mix(p, from[0], slot[0]), y: mix(p, from[1], slot[1])});
	if (name === 'gather' || name === 'swirl') {
		const p = prog(v, 'progress', t);
		return {...line(p), scale: mix(clamp01(p), 1, name === 'gather' ? num(v, 'toScale') : 1), morph: 0};
	}
	if (name === 'converge') {
		const p = prog(v, 'y', t);
		return {...line(p), scale: mix(p, 1, num(v, 'toScale')), morph: prog(v, 'morph', t)};
	}
	if (name === 'riseIntoSlots') {
		const p = prog(v, 'y', t);
		return {...line(p), scale: mix(p, 1, i === 0 ? num(v, 'leadScale') : num(v, 'toScale')), morph: 0};
	}
	if (name === 'arcToSlot') {
		const u = prog(v, 'x', t);
		return {x: mix(u, from[0], slot[0]), y: arcY(u, from[1], slot[1], num(v, 'dip'), num(v, 'dipAt')), scale: mix(u, 1, num(v, 'toScale')), morph: 0};
	}
	if (name === 'swoopAcross') {
		const u = prog(v, 'x', t);
		const settle = mot(v, 'settle');
		const scale = t < settle.delay ? mix(prog(v, 'grow', t), 1, num(v, 'peakScale')) : mix(prog(v, 'settle', t), num(v, 'peakScale'), num(v, 'toScale'));
		return {x: mix(u, from[0], slot[0]), y: arcY(u, from[1], slot[1], num(v, 'dip'), num(v, 'dipAt')), scale, morph: 0};
	}
	throw new Error(`FlyToSlots has no variant ${name}`);
};

export type FlyToSlotsProps = {
	/** the travelling elements, each filling its box */
	items: React.ReactNode[];
	/** start centre of each item, % of the frame */
	from: Pt[];
	/** slot centre of each item, % of the frame */
	slots: Pt[];
	/** box of an item, px at 1080 */
	size: [number, number];
	/** what each item turns into in its slot (crossfaded where the variant morphs) */
	toItems?: React.ReactNode[];
	/** the incoming layout that holds the slots, drawn behind (faded in where the variant does) */
	to?: React.ReactNode;
	tone?: Tone;
	variant?: string;
};

export const FlyToSlots: React.FC<FlyToSlotsProps> = ({items, from, slots, size, toItems, to, variant}) => {
	const t = useT();
	const {width, height} = useVideoConfig();
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const px = (n: number) => (n * height) / 1080;
	const offs = offsets(name, v, from, {width, height});
	const backdrop = name === 'riseIntoSlots' ? prog(v, 'panel', t) : 1;
	return (
		<AbsoluteFill>
			{to ? <AbsoluteFill style={{opacity: backdrop}}>{to}</AbsoluteFill> : null}
			{items.map((item, i) => {
				const f = from[i];
				const sl = slots[i];
				if (!f || !sl) return null;
				const pose = poseAt(name, v, t - (offs[i] ?? 0), i, f, sl);
				const morphTo = toItems?.[i];
				return (
					<At key={i} x={pose.x} y={pose.y} w={px(size[0])} h={px(size[1])} style={{transform: `scale(${pose.scale})`}}>
						<AbsoluteFill style={{opacity: morphTo ? 1 - pose.morph : 1}}>{item}</AbsoluteFill>
						{morphTo ? <AbsoluteFill style={{opacity: pose.morph}}>{morphTo}</AbsoluteFill> : null}
					</At>
				);
			})}
		</AbsoluteFill>
	);
};

// ---- Demo ----

/** Flat-top honeycomb cell centres round (cx, cy) % of the frame, nearest first; pitch in px. */
const honeycomb = (cx: number, cy: number, pitch: number, count: number, width: number, height: number): Pt[] => {
	const cells: {p: Pt; d: number}[] = [];
	const n = 8;
	for (let q = -n; q <= n; q++) {
		for (let r = -n; r <= n; r++) {
			// axial coordinates of a flat-top lattice
			const x = pitch * (Math.sqrt(3) / 2) * q;
			const y = pitch * (r + q / 2);
			cells.push({p: [cx + (x / width) * 100, cy + (y / height) * 100], d: Math.hypot(x, y) + Math.atan2(y, x) * 1e-3});
		}
	}
	return cells
		.sort((a, b) => a.d - b.d)
		.slice(0, count)
		.map((c) => c.p);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const {width, height} = useVideoConfig();
	const v = variantOf(spec, variant);
	const hex = (fill: string) => <Shape kind="hex" fill={fill} />;

	if (variant === 'converge') {
		const kinds = ['disc', 'square', 'plus', 'diamond', 'triangle', 'ring', 'disc', 'square', 'plus'] as const;
		const from: Pt[] = kinds.map((_, i) => [26 + (i % 3) * 24 + (Math.floor(i / 3) % 2) * 6, num(v, 'fromY') - 22 + Math.floor(i / 3) * 11]);
		const slotXs = [27.5, 36.5, 45.5, 54.5, 63.5, 72.5];
		const pick = [0, 1, 2, 3, 4, 5, 1, 3, 5];
		const slots: Pt[] = pick.map((k) => [slotXs[k] ?? 50, num(v, 'toY')]);
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<FlyToSlots
					variant={variant}
					items={kinds.map((k, i) => (
						<Tile key={i} kind={k} tile={s.surfaceAlt} mark={s.inkSoft} />
					))}
					toItems={kinds.map((_, i) => (
						<div key={i} style={{width: '100%', height: '100%'}}>
							{hex(i % 2 ? s.muted : s.ink)}
						</div>
					))}
					from={from}
					slots={slots}
					size={[150, 150]}
				/>
			</AbsoluteFill>
		);
	}

	if (variant === 'riseIntoSlots') {
		const n = 6;
		const from: Pt[] = Array.from({length: n}, (_, i) => [24 + i * 10.4, num(v, 'fromY')]);
		const slots: Pt[] = from.map((_, i) => (i === 0 ? [50, num(v, 'toY')] : [38.5, 30 + (i - 1) * 9]));
		const panel = (
			<AbsoluteFill>
				<div style={{position: 'absolute', left: '33%', top: '6%', width: '34%', height: '78%', backgroundColor: s.surface, border: `2px solid ${s.line}`, borderRadius: 28}}>
					<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: '19%', borderBottom: `2px solid ${s.line}`}} />
					{[0, 1, 2, 3, 4].map((r) => (
						<div key={r} style={{position: 'absolute', left: '28%', width: `${40 + ((r * 17) % 30)}%`, top: `${30.5 + r * 11.5}%`, height: '3%', borderRadius: 999, backgroundColor: s.line}} />
					))}
				</div>
			</AbsoluteFill>
		);
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<FlyToSlots
					variant={variant}
					to={panel}
					items={from.map((_, i) => (
						<div key={i} style={{width: '100%', height: '100%'}}>
							{hex(i === 0 ? s.ink : s.muted)}
						</div>
					))}
					from={from}
					slots={slots}
					size={[num(v, 'cell'), num(v, 'cell') * 0.9]}
				/>
			</AbsoluteFill>
		);
	}

	if (variant === 'swirl') {
		const cols = 12;
		const rows = 7;
		const from: Pt[] = [];
		for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) from.push([4 + (c * 92) / (cols - 1), 8 + (r * 84) / (rows - 1)]);
		const cx = num(v, 'centreX');
		const cy = num(v, 'centreY');
		const cells = honeycomb(cx, cy, 73, from.length, width, height);
		// pair by distance rank, and inside each ring by angle turned by the measured swirl
		const ang = (p: Pt) => Math.atan2(((p[1] - cy) / 100) * height, ((p[0] - cx) / 100) * width);
		const dist = (p: Pt) => Math.hypot(((p[1] - cy) / 100) * height, ((p[0] - cx) / 100) * width);
		const byD = from.map((p, i) => ({i, d: dist(p)})).sort((a, b) => a.d - b.d);
		const slots: Pt[] = from.map(() => [cx, cy]);
		const turn = (num(v, 'turn') * Math.PI) / 180;
		let k = 0;
		for (const size of [1, 6, 12, 18, 24, 30]) {
			const group = byD.slice(k, k + size);
			const ring = cells.slice(k, k + size);
			const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
			const items = group.map((g) => ({i: g.i, a: wrap(ang(from[g.i] as Pt) + turn)})).sort((a, b) => a.a - b.a);
			const rs = ring.map((p) => ({p, a: ang(p)})).sort((a, b) => a.a - b.a);
			items.forEach((it, j) => {
				slots[it.i] = (rs[j] ?? rs[0])?.p ?? [cx, cy];
			});
			k += size;
			if (k >= from.length) break;
		}
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<FlyToSlots
					variant={variant}
					items={from.map((_, i) => (
						<div key={i} style={{width: '100%', height: '100%'}}>
							{hex(i % 7 === 3 ? s.muted : s.ink)}
						</div>
					))}
					from={from}
					slots={slots}
					size={[58, 52]}
				/>
			</AbsoluteFill>
		);
	}

	if (variant === 'arcToSlot' || variant === 'swoopAcross') {
		const from: Pt = [num(v, 'fromX'), num(v, 'fromY')];
		const slot: Pt = [num(v, 'toX'), num(v, 'toY')];
		const box = num(v, 'size');
		const landed = (box * num(v, 'toScale') * height) / 1080;
		const layout =
			variant === 'arcToSlot' ? (
				<AbsoluteFill>
					<div style={{position: 'absolute', left: `${slot[0] + 3}%`, top: `${slot[1] - 2.2}%`}}>
						<Word tone={tone} role="ui" color="inkSoft">
							Ready to start
						</Word>
					</div>
					<div style={{position: 'absolute', left: `${slot[0] + 3}%`, top: `${slot[1] + 3}%`, width: '44%', height: '3%', borderRadius: 999, backgroundColor: s.line}} />
					<div style={{position: 'absolute', left: `${slot[0] + 3}%`, top: `${slot[1] + 8}%`, width: '30%', height: '3%', borderRadius: 999, backgroundColor: s.line}} />
				</AbsoluteFill>
			) : (
				<AbsoluteFill>
					<div style={{position: 'absolute', left: `${slot[0]}%`, top: `${slot[1]}%`, width: landed, height: landed, marginLeft: -landed / 2, marginTop: -landed / 2, border: `2px dashed ${s.line}`, borderRadius: '24%'}} />
				</AbsoluteFill>
			);
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<FlyToSlots
					variant={variant}
					to={layout}
					items={[<Tile key="a" kind={variant === 'arcToSlot' ? 'triangle' : 'disc'} tile={s.surfaceAlt} mark={s.ink} />]}
					from={[from]}
					slots={[slot]}
					size={[box, box]}
				/>
			</AbsoluteFill>
		);
	}

	// gather: discs scattered over two low rows (two from just off the frame) into a 7-cell honeycomb,
	// in launch order, nearest first
	const from: Pt[] = [
		[38, 84], [62, 76], [24, 76], [76, 84], [12, 84], [88, 76], [-4, 80], [104, 80],
	];
	const p = num(v, 'pitch');
	const sx = num(v, 'slotX');
	const sy = num(v, 'slotY');
	// neighbour cell at a screen angle (deg, y down), pitch in px at 1080
	const nb = (deg: number): Pt => [sx + ((((p * height) / 1080) * Math.cos((deg * Math.PI) / 180)) / width) * 100, sy + ((p * Math.sin((deg * Math.PI) / 180)) / 1080) * 100];
	const slots: Pt[] = [[sx, sy], nb(30), nb(90), nb(150), nb(210), nb(270), nb(330), nb(330)];
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<FlyToSlots
				variant={variant}
				items={from.map((_, i) => (
					<div key={i} style={{width: '100%', height: '100%'}}>
						<Shape kind="disc" fill={i === 0 ? s.ink : s.inkSoft} />
					</div>
				))}
				from={from}
				slots={slots}
				size={[num(v, 'cellH'), num(v, 'cellH')]}
			/>
		</AbsoluteFill>
	);
};
