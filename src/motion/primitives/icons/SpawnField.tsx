import type React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {maybe, mix, num, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {cyc, ellipseAt, nums} from './geom';
import {Shape, Tile, type ShapeKind} from './shapes';
import {spec} from './SpawnField.spec';

export type SpawnFieldProps = {
	/** what fills each unit (cycled or picked when there are more units than items); an item fills its box */
	items: React.ReactNode[];
	tone?: Tone;
	variant?: string;
	/** unit box in px, for patterns whose element size is not measured (ring, lattice) */
	size?: number;
	/** grid patterns: gap between items in px */
	gap?: number;
	/** randomScatter: a band kept clear, [top, bottom] in % H (default: the two halves) */
	clear?: [number, number];
	/** units to place (scatter, ring, lattice: default the number of items; lattice counts the centre) */
	count?: number;
	/** latticeGrow: connector stroke in px (not measured) */
	lineWidth?: number;
	seed?: string;
};

type Unit = {x: number; y: number; w: number; h: number; offset: number; node: React.ReactNode; key: string};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// axial hex directions in the order v1's inner ring fills: right, left, lower-left, upper-left, lower-right, upper-right
const RING1: [number, number][] = [
	[1, 0],
	[-1, 0],
	[-1, 1],
	[0, -1],
	[0, 1],
	[1, -1],
];
const NEIGHBOURS: [number, number][] = [
	[1, 0],
	[0, 1],
	[-1, 1],
	[-1, 0],
	[0, -1],
	[1, -1],
];
const hexDist = (q: number, r: number) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;

export const SpawnField: React.FC<SpawnFieldProps> = ({items, tone = 'light', variant, size, gap = 0, clear, count, lineWidth = 2, seed = 'spawn'}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {width, height, w, h, px} = useFrame();
	const s = scheme(tone);
	const pattern = str(v, 'pattern');
	const box = (what: string) => {
		if (size === undefined) throw new Error(`SpawnField/${variant ?? spec.defaultVariant} needs a size prop for its ${what}`);
		return size;
	};

	// the pop every unit plays at its own offset
	const pop = (o: number) => {
		const fromScale = maybe(v, 'fromScale') ?? 1;
		let scale = v.motions.scale ? mix(p('scale', o), fromScale, 1) : 1;
		if (v.motions.creep) scale = mix(p('scale', o), fromScale, num(v, 'midScale')) + (1 - num(v, 'midScale')) * p('creep', o);
		const opacity = v.motions.opacity ? clamp01(mix(p('opacity', o), maybe(v, 'fromOpacity') ?? 0, 1)) : 1;
		return {scale, opacity, on: frame >= o};
	};

	if (pattern === 'grid') {
		const n = items.length;
		const cols = maybe(v, 'columns') ?? Math.ceil(n / num(v, 'rows'));
		return (
			<div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)`, gap, justifyContent: 'center', alignItems: 'center'}}>
				{items.map((it, i) => {
					const {scale, opacity, on} = pop(i * num(v, 'stagger'));
					return (
						<div key={i} style={{transform: `scale(${scale})`, opacity: on ? opacity : 0}}>
							{it}
						</div>
					);
				})}
			</div>
		);
	}

	const units: Unit[] = [];
	const lines: React.ReactNode[] = [];
	const cx = width / 2;
	const cy = height / 2;

	if (pattern === 'honeycomb') {
		// touching flat-top cells: columns 3/4 of a cell apart, every other column half a cell down
		const cw = px(num(v, 'cellW'));
		const ch = px(num(v, 'cellH'));
		const ox = w(num(v, 'originX'));
		const oy = h(num(v, 'originY'));
		const speed = w(num(v, 'frontSpeed'));
		const jit = num(v, 'jitter') * Math.sqrt(3); // uniform +-a has rms a / sqrt(3)
		const colP = cw * 0.75;
		const c0 = Math.floor(-ox / colP) - 1;
		const c1 = Math.ceil((width - ox) / colP) + 1;
		for (let c = c0; c <= c1; c++) {
			const odd = ((c % 2) + 2) % 2 === 1;
			const r0 = Math.floor(-oy / ch) - 1;
			const r1 = Math.ceil((height - oy) / ch) + 1;
			for (let r = r0; r <= r1; r++) {
				const x = ox + c * colP;
				const y = oy + r * ch + (odd ? ch / 2 : 0);
				const d = Math.hypot(x - ox, y - oy);
				const offset = d === 0 ? 0 : Math.max(0, d / speed - num(v, 'firstLag') + (random(`${seed}-j-${c}-${r}`) * 2 - 1) * jit);
				const node = items[Math.floor(random(`${seed}-i-${c}-${r}`) * items.length)] ?? items[0];
				units.push({x, y, w: cw, h: ch, offset, node, key: `${c}:${r}`});
			}
		}
	} else if (pattern === 'ring') {
		const n = count ?? items.length;
		const half = Math.ceil(n / 2);
		const b = box('ring icons');
		for (let i = 0; i < n; i++) {
			const [x, y] = ellipseAt((i * 360) / n, w(num(v, 'rx')), h(num(v, 'ry')));
			units.push({x: cx + x, y: cy + y, w: b, h: b, offset: (i % half) * num(v, 'stagger'), node: cyc(items, i), key: `${i}`});
		}
	} else if (pattern === 'scatter') {
		const n = count ?? items.length;
		const [top, bottom] = clear ?? [50, 50];
		for (let i = 0; i < n; i++) {
			const sz = px(mix(random(`${seed}-s-${i}`), num(v, 'minSize'), num(v, 'maxSize')));
			// whole elements inside the frame, alternating between the band above and the band below
			const x = sz / 2 + random(`${seed}-x-${i}`) * (width - sz);
			const ry = random(`${seed}-y-${i}`);
			const [y0, y1] = i % 2 === 0 ? [sz / 2, h(top) - sz / 2] : [h(bottom) + sz / 2, height - sz / 2];
			const y = y0 + ry * Math.max(0, y1 - y0);
			units.push({x, y, w: sz, h: sz, offset: Math.ceil(i * num(v, 'stagger')), node: cyc(items, i), key: `${i}`});
		}
	} else if (pattern === 'lattice') {
		const b = box('lattice cells');
		const pitch = b * (1 + num(v, 'lineGap'));
		const n = (count ?? items.length) - 1;
		const pos = (q: number, r: number): [number, number] => [cx + pitch * (q + r / 2), cy + pitch * r * (Math.sqrt(3) / 2)];
		// cells in spawn order: the measured inner ring, then the next rings clockwise from the right
		const order: [number, number][] = [...RING1];
		const outer: [number, number, number, number][] = [];
		for (let q = -8; q <= 8; q++)
			for (let r = -8; r <= 8; r++) {
				const d = hexDist(q, r);
				if (d < 2) continue;
				const [x, y] = pos(q, r);
				const ang = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
				outer.push([q, r, d, (ang + 360) % 360]);
			}
		outer.sort((a, b2) => a[2] - b2[2] || a[3] - b2[3]);
		order.push(...outer.map(([q, r]) => [q, r] as [number, number]));
		const ring1 = nums(v, 'ring1');
		const onset = new Map<string, number>([['0:0', -Infinity]]);
		const cells = order.slice(0, Math.max(0, n));
		cells.forEach(([q, r], k) => onset.set(`${q}:${r}`, k < ring1.length ? cyc(ring1, k) : num(v, 'ring2Start') + (k - ring1.length) * num(v, 'ring2Step')));
		// the centre mark is there from the start
		const [x0, y0] = pos(0, 0);
		units.push({x: x0, y: y0, w: b, h: b, offset: -Infinity, node: items[0], key: 'centre'});
		cells.forEach(([q, r], k) => {
			const o = onset.get(`${q}:${r}`) ?? 0;
			const [x, y] = pos(q, r);
			units.push({x, y, w: b, h: b, offset: o, node: cyc(items, k + 1), key: `${q}:${r}`});
			const lp = p('line', o);
			if (lp <= 0) return;
			for (const [dq, dr] of NEIGHBOURS) {
				const om = onset.get(`${q + dq}:${r + dr}`);
				if (om === undefined || om >= o) continue;
				const [nx, ny] = pos(q + dq, r + dr);
				const ux = (x - nx) / pitch;
				const uy = (y - ny) / pitch;
				const sx = nx + (ux * b) / 2;
				const sy = ny + (uy * b) / 2;
				const len = (pitch - b) * lp;
				lines.push(<line key={`${q}:${r}<${q + dq}:${r + dr}`} x1={sx} y1={sy} x2={sx + ux * len} y2={sy + uy * len} stroke={s.line} strokeWidth={px(lineWidth)} strokeLinecap="round" />);
			}
		});
	} else if (pattern === 'burst') {
		const n = count ?? items.length;
		const n0 = Math.min(n, num(v, 'firstCount'));
		const n1 = n - n0;
		// the measured extent is horizontal; the vertical one is not measured, so the field takes the same
		// fraction of the frame height (an ellipse in a wide frame)
		const E = mix(p('radius'), num(v, 'fromExtent'), num(v, 'toExtent'));
		const R = w(E) / 2;
		const Ry = h(E) / 2;
		const inner = num(v, 'fromExtent') / num(v, 'toExtent'); // the new ones fill the ring the field left
		const sz = w(num(v, 'fromSize')) * mix(p('scale'), 1, num(v, 'shrink'));
		for (let i = 0; i < n; i++) {
			const first = i < n0;
			const k = first ? i : i - n0;
			const ang = -90 + ((k + 0.5) * 360) / (first ? n0 : Math.max(1, n1)) + (first ? 0 : 180 / Math.max(1, n1));
			const rad = (ang * Math.PI) / 180;
			const k2 = first ? 1 : inner;
			units.push({x: cx + R * k2 * Math.cos(rad), y: cy + Ry * k2 * Math.sin(rad), w: sz, h: sz, offset: first ? -Infinity : 0, node: cyc(items, i), key: `${i}`});
		}
	}

	return (
		<AbsoluteFill>
			{lines.length ? (
				<svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0}}>
					{lines}
				</svg>
			) : null}
			{units.map((u) => {
				let scale = 1;
				let opacity = 1;
				if (pattern === 'burst') {
					opacity = u.offset === -Infinity ? 1 : p('appear');
				} else if (u.offset !== -Infinity) {
					const pp = pop(u.offset);
					if (!pp.on) return null;
					scale = pp.scale;
					opacity = pp.opacity;
				}
				if (opacity <= 0) return null;
				return (
					<div
						key={u.key}
						style={{position: 'absolute', left: u.x - u.w / 2, top: u.y - u.h / 2, width: u.w, height: u.h, transform: `scale(${scale})`, opacity}}
					>
						{u.node}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

// ---- Demo: plain hexagons, discs and tiles in a few grays ----

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const {px} = useFrame();
	const s = scheme('light');
	const grays = [s.ink, s.inkSoft, s.muted, s.accent, s.surfaceAlt, s.line];
	const kinds: ShapeKind[] = ['plus', 'disc', 'triangle', 'diamond', 'ring', 'square', 'hex', 'plus', 'disc'];
	const tile = (i: number, size: number) => (
		<div key={i} style={{width: size, height: size}}>
			<Tile kind={cyc(kinds, i)} tile={cyc([s.ink, s.inkSoft, s.accent], i)} mark={s.surface} />
		</div>
	);
	switch (variant) {
		case 'readingOrder':
			return (
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
					<SpawnField variant={variant} gap={px(56)} items={Array.from({length: 8}, (_, i) => tile(i, px(150)))} />
				</AbsoluteFill>
			);
		case 'gridOrder':
			return (
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
					<SpawnField variant={variant} gap={px(48)} items={Array.from({length: 9}, (_, i) => tile(i, px(130)))} />
				</AbsoluteFill>
			);
		case 'ringPairs':
			return <SpawnField variant={variant} size={px(96)} items={Array.from({length: 16}, (_, i) => tile(i, px(96)))} />;
		case 'latticeGrow':
			return (
				<SpawnField
					variant={variant}
					size={px(104)}
					count={37}
					items={Array.from({length: 37}, (_, i) =>
						i === 0 ? <Shape kind="hex" fill={s.ink} /> : <Tile kind={cyc(kinds, i)} tile={cyc([s.ink, s.inkSoft, s.muted], i)} mark={s.surface} round />,
					)}
				/>
			);
		case 'burstRing':
			return <SpawnField variant={variant} count={22} items={grays.slice(0, 4).map((g, i) => <Shape key={i} kind="disc" fill={g} />)} />;
		case 'randomScatter':
			return <SpawnField variant={variant} count={30} items={grays.slice(0, 4).map((g, i) => <Shape key={i} kind="hex" fill={g} />)} />;
		default:
			return <SpawnField variant={variant} items={grays.map((g, i) => <Shape key={i} kind="hex" fill={g} stretch />)} />;
	}
};
