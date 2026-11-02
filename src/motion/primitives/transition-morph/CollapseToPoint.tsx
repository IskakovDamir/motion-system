import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {num, variantOf} from '../../engine/anim';
import {mix} from '../../engine/progress';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps, VariantSpec} from '../types';
import {At, clamp01, keyAt, keys, mot, motionEnd, nums, prog, type Pt, Shape, useT, Word} from './kit';
import {spec} from './CollapseToPoint.spec';

// A group of items folds into one point: per variant, cells shrink one by one into the centre cell,
// the whole field wraps into a disc and shrinks, rings fold inward step by step, the field blooms
// and implodes as one blob, a stack drops and shrinks away, or everything converges and snaps down.
// `to` is what the frame shows after (the next layout) or under (what the blob uncovers).

type Size = {width: number; height: number};
type ItemPose = {x: number; y: number; scale: number; shown: boolean};

export type CollapseToPointProps = {
	/** the items that collapse, each filling its box; items[0] is the centre cell where there is one */
	items: React.ReactNode[];
	/** centre of each item, % of the frame */
	at: Pt[];
	/** box of an item, px at 1080 */
	size: [number, number];
	/** ring of each item counted from the centre (ringFold); default: distance over the nearest one */
	rings?: number[];
	/** where the group collapses to, % of the frame (blobMerge; others use their centre cell or measured point) */
	point?: Pt;
	/** what follows (sphereWrap, meltImplode: from the cut) or lies under (blobMerge) */
	to?: React.ReactNode;
	tone?: Tone;
	variant?: string;
};

const ringsOf = (at: Pt[], size: Size): number[] => {
	const c = at[0] ?? [50, 50];
	const d = at.map(([x, y]) => Math.hypot(((x - c[0]) / 100) * size.width, ((y - c[1]) / 100) * size.height));
	const nearest = Math.min(...d.filter((x) => x > 1e-6));
	return d.map((x) => Math.round(x / nearest));
};

const poses = (name: string, v: VariantSpec, t: number, at: Pt[], rings: number[], point: Pt): ItemPose[] => {
	if (name === 'cellsInward') {
		const c = at[0] ?? point;
		return at.map((p, i) => {
			if (i === 0) return {x: p[0], y: p[1], scale: mix(prog(v, 'scale', t), 1, num(v, 'toScale')), shown: true};
			const k = 1 - prog(v, 'cell', t - (i - 1) * num(v, 'stepGap'));
			const pivot: Pt = [c[0] + (p[0] - c[0]) * num(v, 'pivot'), c[1] + (p[1] - c[1]) * num(v, 'pivot')];
			return {x: pivot[0] + (p[0] - pivot[0]) * k, y: pivot[1] + (p[1] - pivot[1]) * k, scale: k, shown: k > 0.001};
		});
	}
	if (name === 'ringFold') {
		const c = at[0] ?? point;
		const steps = nums(v, 'steps');
		const fold = mot(v, 'fold');
		const grow = prog(v, 'scale', t);
		return at.map((p, i) => {
			const ring = rings[i] ?? 0;
			if (ring === 0) return {x: p[0], y: p[1], scale: mix(grow, 1, num(v, 'centreTo')), shown: true};
			const step = ring <= steps.length ? (steps[steps.length - ring] ?? 0) : (steps[0] ?? 0);
			const pf = prog(v, 'fold', t - step);
			// survivors grow with the centre and the lattice opens with them; a folding cell keeps the
			// growth it had when its step began
			const g = mix(prog(v, 'scale', Math.min(t, step)), 1, num(v, 'cellTo'));
			const to = ring >= 2 ? (ring - 1) / ring : num(v, 'inward');
			const r = g * mix(pf, 1, to);
			return {x: c[0] + (p[0] - c[0]) * r, y: c[1] + (p[1] - c[1]) * r, scale: g * mix(pf, 1, num(v, 'dot')), shown: t < step + motionEnd(fold)};
		});
	}
	if (name === 'clusterSnap') {
		const p = prog(v, 'scale', t);
		return at.map(([x, y]) => ({x: mix(p, x, point[0]), y: mix(p, y, point[1]), scale: 1, shown: true}));
	}
	if (name === 'blobMerge') {
		const cx = at.reduce((a, p) => a + p[0], 0) / Math.max(1, at.length);
		const cy = at.reduce((a, p) => a + p[1], 0) / Math.max(1, at.length);
		const close = 1 - prog(v, 'stack', t);
		const ox = keyAt(keys(v, 'pathX'), t);
		const oy = keyAt(keys(v, 'pathY'), t);
		return at.map(([x, y]) => ({x: point[0] + ox + (x - cx) * close, y: point[1] + oy + (y - cy) * close, scale: 1, shown: true}));
	}
	// sphereWrap, meltImplode: the items stay in their places; the field around them moves
	return at.map(([x, y]) => ({x, y, scale: 1, shown: true}));
};

export const CollapseToPoint: React.FC<CollapseToPointProps> = ({items, at, size, rings, point, to, tone = 'light', variant}) => {
	const t = useT();
	const {width, height} = useVideoConfig();
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const s = scheme(tone);
	const px = (n: number) => (n * height) / 1080;
	const target: Pt = point ?? (name === 'clusterSnap' ? [num(v, 'x'), num(v, 'y')] : [50, 50]);
	const ps = poses(name, v, t, at, rings ?? ringsOf(at, {width, height}), target);
	// draw the centre cell last, outer rings first
	const order = items.map((_, i) => i).sort((a, b) => (name === 'ringFold' ? ((rings ?? [])[b] ?? 0) - ((rings ?? [])[a] ?? 0) : 0) || (a === 0 ? 1 : b === 0 ? -1 : 0));
	// sphereWrap and meltImplode move the whole layer, its ground included
	const whole = name === 'sphereWrap' || name === 'meltImplode';
	const field = (
		<AbsoluteFill style={{backgroundColor: whole ? s.bg : undefined, overflow: whole ? 'hidden' : undefined}}>
			{order.map((i) => {
				const p = ps[i];
				if (!p) return null;
				return (
					<At key={i} x={p.x} y={p.y} w={px(size[0])} h={px(size[1])} style={{visibility: p.shown ? 'inherit' : 'hidden', transform: `scale(${p.scale})`}}>
						{items[i]}
					</At>
				);
			})}
		</AbsoluteFill>
	);

	if (name === 'sphereWrap') {
		const q = prog(v, 'wrap', t);
		// the outline curls from the frame into a disc as tall as the frame, the sides first
		const w = mix(q, width, height);
		const h = height;
		const r = mix(q, 0, height / 2);
		// the curve is the silhouette size (square root of the covered area over the frame's), so the
		// layer scale divides out the area the curl itself removes
		const area = Math.sqrt((w * h - (4 - Math.PI) * r * r) / (width * height));
		const k = (1 - prog(v, 'scale', t)) / area;
		const cut = t >= num(v, 'cut');
		return (
			<AbsoluteFill style={{backgroundColor: s.bgAlt}}>
				<AbsoluteFill style={{visibility: cut ? 'hidden' : 'inherit', transform: `scale(${Math.max(0, k)})`}}>
					<AbsoluteFill style={{clipPath: `inset(${(height - h) / 2}px ${(width - w) / 2}px round ${r}px)`}}>{field}</AbsoluteFill>
				</AbsoluteFill>
				{to ? <AbsoluteFill style={{visibility: cut ? 'inherit' : 'hidden'}}>{to}</AbsoluteFill> : null}
			</AbsoluteFill>
		);
	}

	if (name === 'meltImplode') {
		const blob = mot(v, 'scale');
		const cut = t >= num(v, 'cut');
		const inBlob = t >= blob.delay;
		const wash = num(v, 'wash') * prog(v, 'bloom', t);
		const rms = mix(prog(v, 'scale', t), num(v, 'radius'), num(v, 'toRadius'));
		// the layer keeps its own outline and shrinks with the core's RMS radius, relative to its start
		const k = rms / num(v, 'radius');
		const spin = num(v, 'spin') * prog(v, 'spin', t);
		return (
			<AbsoluteFill>
				{inBlob ? <AbsoluteFill style={{backgroundColor: scheme('dark').bg}} /> : null}
				<AbsoluteFill
					style={{
						visibility: cut ? 'hidden' : 'inherit',
						transform: inBlob ? `rotate(${spin}deg) scale(${k})` : 'none',
					}}
				>
					{field}
					<AbsoluteFill style={{backgroundColor: s.flash, opacity: wash}} />
				</AbsoluteFill>
				{to ? <AbsoluteFill style={{visibility: cut ? 'inherit' : 'hidden'}}>{to}</AbsoluteFill> : null}
			</AbsoluteFill>
		);
	}

	if (name === 'blobMerge') {
		const area = 1 - prog(v, 'area', t);
		const k = Math.sqrt(clamp01(area));
		const ox = keyAt(keys(v, 'pathX'), t);
		const oy = keyAt(keys(v, 'pathY'), t);
		const ox0 = ((target[0] + ox) / 100) * width;
		const oy0 = ((target[1] + oy) / 100) * height;
		return (
			<AbsoluteFill>
				{to ? <AbsoluteFill>{to}</AbsoluteFill> : null}
				<AbsoluteFill style={{visibility: area > 0.001 ? 'inherit' : 'hidden', transform: `scale(${k})`, transformOrigin: `${ox0}px ${oy0}px`}}>{field}</AbsoluteFill>
			</AbsoluteFill>
		);
	}

	if (name === 'clusterSnap') {
		const snap = keys(v, 'snap');
		const k = keyAt(snap, t);
		return (
			<AbsoluteFill>
				{to ? <AbsoluteFill>{to}</AbsoluteFill> : null}
				<AbsoluteFill style={{transform: `scale(${k})`, transformOrigin: `${(target[0] / 100) * width}px ${(target[1] / 100) * height}px`}}>{field}</AbsoluteFill>
			</AbsoluteFill>
		);
	}

	return (
		<AbsoluteFill>
			{to ? <AbsoluteFill>{to}</AbsoluteFill> : null}
			{field}
		</AbsoluteFill>
	);
};

// ---- Demo ----

/** Flat-top honeycomb round (cx, cy) % of the frame: centres and ring numbers, nearest first. */
const honeycomb = (cx: number, cy: number, pitch: number, maxRing: number, width: number, height: number, keep?: (p: Pt) => boolean) => {
	const out: {p: Pt; ring: number; a: number}[] = [];
	const k = height / 1080;
	for (let q = -maxRing; q <= maxRing; q++) {
		for (let r = -maxRing; r <= maxRing; r++) {
			const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
			if (ring > maxRing) continue;
			const x = pitch * k * (Math.sqrt(3) / 2) * q;
			const y = pitch * k * (r + q / 2);
			const p: Pt = [cx + (x / width) * 100, cy + (y / height) * 100];
			if (keep && !keep(p)) continue;
			out.push({p, ring, a: Math.atan2(y, x)});
		}
	}
	return out.sort((a, b) => a.ring - b.ring || a.a - b.a);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const {width, height} = useVideoConfig();
	const v = variantOf(spec, variant);
	// demo cells are discs, not the references' hexagons, and the cellsInward cluster sits off the measured
	// spot, so no demo frame lays out like a reference picture (verify.py clean check)
	const hex = (fill: string) => <Shape kind="disc" fill={fill} />;
	const next = (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<At x={50} y={50} w={height * 0.9} h={height * 0.5} style={{backgroundColor: s.surface, border: `2px solid ${s.line}`, borderRadius: 28}}>
				<div style={{position: 'absolute', left: '10%', top: '22%', width: '60%', height: '10%', borderRadius: 999, backgroundColor: s.inkSoft}} />
				<div style={{position: 'absolute', left: '10%', top: '48%', width: '80%', height: '8%', borderRadius: 999, backgroundColor: s.line}} />
				<div style={{position: 'absolute', left: '10%', top: '66%', width: '50%', height: '8%', borderRadius: 999, backgroundColor: s.line}} />
			</At>
		</AbsoluteFill>
	);

	if (variant === 'cellsInward') {
		// centre, then counter-clockwise from the upper right (screen angles, y down)
		const p = num(v, 'pitch');
		const cx = 64;
		const cy = 58;
		const cell = (deg: number): Pt => [cx + ((((p * height) / 1080) * Math.cos((deg * Math.PI) / 180)) / width) * 100, cy + ((p * Math.sin((deg * Math.PI) / 180)) / 1080) * 100];
		const at: Pt[] = [[cx, cy], cell(-30), cell(-90), cell(-150), cell(150), cell(90), cell(30)];
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<CollapseToPoint variant={variant} items={at.map((_, i) => hex(i === 0 ? s.ink : s.inkSoft))} at={at} point={[cx, cy]} size={[num(v, 'cellW'), num(v, 'cellH')]} />
			</AbsoluteFill>
		);
	}

	if (variant === 'ringFold') {
		const cells = honeycomb(50, 50, num(v, 'pitch'), 5, width, height, (p) => p[1] > 6 && p[1] < 94);
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<CollapseToPoint
					variant={variant}
					items={cells.map((c, i) => hex(c.ring === 0 ? s.ink : i % 5 === 2 ? s.muted : s.inkSoft))}
					at={cells.map((c) => c.p)}
					rings={cells.map((c) => c.ring)}
					size={[num(v, 'cell'), num(v, 'cell') * 0.9]}
				/>
			</AbsoluteFill>
		);
	}

	if (variant === 'clusterSnap') {
		// a loose field of small tiles, spread unevenly across the frame
		const at: Pt[] = Array.from({length: 18}, (_, i) => {
			const a = i * 2.39996;
			const r = 18 + ((i * 37) % 23);
			return [50 + r * Math.cos(a) * 1.25, 50 + r * Math.sin(a) * 1.5] as Pt;
		});
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<CollapseToPoint
					variant={variant}
					items={at.map((_, i) => (
						<div key={i} style={{width: '100%', height: '100%', borderRadius: '30%', backgroundColor: i % 3 ? s.surfaceAlt : s.inkSoft, border: `2px solid ${s.line}`, boxSizing: 'border-box'}} />
					))}
					at={at}
					size={[150, 150]}
				/>
			</AbsoluteFill>
		);
	}

	if (variant === 'blobMerge') {
		const d = num(v, 'sphere');
		const off = (d / 1080) * 100 * 0.35;
		const at: Pt[] = [
			[50 - off * (height / width), 50],
			[50 + off * (height / width), 50 - off * 0.6],
			[50, 50 - off * 1.4],
		];
		const chip = (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<At x={50} y={62} w={height * 0.6} h={height * 0.1} style={{backgroundColor: s.surface, border: `2px solid ${s.line}`, borderRadius: 999}}>
					<div style={{position: 'absolute', left: '7%', top: '30%', width: height * 0.04, height: height * 0.04}}>
						<Shape kind="plus" fill={s.inkSoft} />
					</div>
					<div style={{position: 'absolute', left: '30%', top: '18%'}}>
						<Word tone={tone} role="ui">
							Go
						</Word>
					</div>
					<div style={{position: 'absolute', left: '60%', top: '42%', width: '30%', height: '16%', borderRadius: 999, backgroundColor: s.line}} />
				</At>
			</AbsoluteFill>
		);
		return (
			<CollapseToPoint
				variant={variant}
				items={at.map((_, i) => (
					<Shape key={i} kind="disc" fill={i === 1 ? s.inkSoft : s.ink} />
				))}
				at={at}
				point={[45.5, 62]}
				size={[d, d]}
				to={chip}
			/>
		);
	}

	// sphereWrap, meltImplode: a whole field of cells goes, the next layout follows
	const cells = honeycomb(50, 50, 120, 11, width, height, (p) => p[0] > -4 && p[0] < 104 && p[1] > -6 && p[1] < 106);
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<CollapseToPoint
				variant={variant}
				items={cells.map((_, i) => hex(i % 4 === 1 ? s.muted : s.inkSoft))}
				at={cells.map((c) => c.p)}
				size={[100, 90]}
				to={next}
			/>
		</AbsoluteFill>
	);
};
