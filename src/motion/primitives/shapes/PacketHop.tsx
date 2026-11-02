import type React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {flag, maybe, mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Scheme, type Tone} from '../../tokens/colors';
import type {DemoProps, VariantSpec} from '../types';
import {contrastGrey, cyc, lumaOf, mod, nums, type Pt} from './kit';
import {spec} from './PacketHop.spec';

/** One hop between two nodes (indexes into `nodes`); `at`: frame the dot pops on (default from the variant). */
export type Hop = {from: number; to: number; at?: number; grey?: boolean};
/** A connector between two nodes; a third entry 'grey' gives its ping-pong dot the soft shade. */
export type Link = [number, number] | [number, number, 'grey'];

export type PacketHopProps = {
	tone?: Tone;
	variant?: string;
	/** node centres in % of frame width / height */
	nodes: Pt[];
	/** easedHop, straightCarry, dispatch: the hops, in order */
	hops?: Hop[];
	/** relay: node paths; each path is relayed hop by hop, the paths start on the variant's offsets */
	chains?: number[][];
	/** dwellHop: how many dots wander the links */
	walkers?: number;
	/** connectors drawn under everything (easedHop darkens the one carrying a packet) */
	links?: Link[];
	/** connector stroke in px at 1080 (not measured) */
	linkWidth?: number;
	/** dot diameter in px at 1080 where the variant does not measure it (dwellHop, pingPong) */
	dot?: number;
	/** the node layer, drawn over the connectors; over the dots too where the variant says the nodes cover them */
	children?: React.ReactNode;
	seed?: string;
};

const lerp = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

const motionOf = (v: VariantSpec, prop: string) => {
	const m = v.motions[prop];
	if (!m) throw new Error(`PacketHop: the variant has no motion ${prop}`);
	return m;
};

/** Frame (from the primitive's start) at which the hop popped on at `at` has landed: the frame a receiver updates. */
export const landingFrame = (variant: string | undefined, at: number): number => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	if (name === 'dispatch') return at + num(v, 'arrive');
	if (name === 'relay') return at + num(v, 'hop');
	const key = name === 'dwellHop' ? 'hop' : 'x';
	const m = motionOf(v, key);
	return at + m.delay + m.duration + (maybe(v, 'restOut') ?? 0);
};

/** Default pop-on frame of hop i in the variant's own cadence. */
export const hopStart = (variant: string | undefined, i: number): number => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	if (name === 'easedHop') return i * num(v, 'stagger');
	if (name === 'dispatch') {
		// the measured sequence of sends, repeated after its last arrival
		const st = nums(v, 'starts');
		return cyc(st, i) + Math.floor(i / st.length) * (cyc(st, -1) + num(v, 'arrive'));
	}
	return 0;
};

type Dot = {at: Pt; grey: boolean};

const dotsAt = (name: string, v: VariantSpec, frame: number, p: (prop: string, off?: number) => number, props: PacketHopProps): Dot[] => {
	const {nodes} = props;
	const node = (i: number): Pt => {
		const n = nodes[i];
		if (!n) throw new Error(`PacketHop: no node ${i}`);
		return n;
	};
	const out: Dot[] = [];
	if (name === 'easedHop' || name === 'straightCarry' || name === 'dispatch') {
		const prop = name === 'dispatch' ? 'progress' : 'x';
		(props.hops ?? []).forEach((hop, i) => {
			const at = hop.at ?? hopStart(name, i);
			if (frame < at || frame >= landingFrame(name, at)) return;
			out.push({at: lerp(node(hop.from), node(hop.to), p(prop, at)), grey: hop.grey ?? name === 'straightCarry'});
		});
	}
	if (name === 'relay') {
		const offsets = nums(v, 'chains');
		const visible = num(v, 'hop') + num(v, 'rest');
		(props.chains ?? []).forEach((path, c) => {
			const start = cyc(offsets, c);
			for (let k = 0; k + 1 < path.length; k++) {
				const at = start + k * num(v, 'handoff');
				if (frame < at || frame >= at + visible) continue;
				out.push({at: lerp(node(cyc(path, k)), node(cyc(path, k + 1)), p('x', at)), grey: (k + c) % 2 === 1});
			}
		});
	}
	if (name === 'dwellHop') {
		const links = props.links ?? [];
		const m = motionOf(v, 'hop');
		const cycle = num(v, 'dwell') + m.duration;
		const seed = props.seed ?? 'walk';
		const next = (from: number, w: number, n: number): number => {
			const ends = links.filter((l) => l[0] === from || l[1] === from).map((l) => (l[0] === from ? l[1] : l[0]));
			if (ends.length === 0) return from;
			return cyc(ends, Math.floor(random(`${seed}-${w}-${n}`) * ends.length));
		};
		for (let w = 0; w < (props.walkers ?? 0); w++) {
			const offset = Math.floor(random(`${seed}-phase-${w}`) * cycle);
			let at = Math.floor(random(`${seed}-start-${w}`) * nodes.length);
			const t = frame + offset;
			const n = Math.floor(t / cycle);
			for (let k = 0; k < n; k++) at = next(at, w, k);
			const to = next(at, w, n);
			out.push({at: lerp(node(at), node(to), p('hop', frame - mod(t, cycle))), grey: false});
		}
	}
	if (name === 'pingPong') {
		const period = num(v, 'period');
		const phases = nums(v, 'phases');
		(props.links ?? []).forEach((l, i) => {
			// triangle wave: at the hub end (near) on the line's phase, at the far end half a period later
			const u = mod(frame - cyc(phases, i), period) / (period / 2);
			const k = u <= 1 ? u : 2 - u;
			out.push({at: lerp(node(l[0]), node(l[1]), mix(k, num(v, 'near'), num(v, 'far'))), grey: l.length === 3});
		});
	}
	return out;
};

/** How much darker a connector is while it carries a packet (easedHop): 0 at rest, 1 fully darkened. */
const carryOf = (name: string, link: Link, p: (prop: string, off?: number) => number, hops: Hop[]): number => {
	if (name !== 'easedHop') return 0;
	let k = 0;
	hops.forEach((hop, i) => {
		const on = (hop.from === link[0] && hop.to === link[1]) || (hop.from === link[1] && hop.to === link[0]);
		if (!on) return;
		const at = hop.at ?? hopStart(name, i);
		k = Math.max(k, p('carry', at) - p('release', landingFrame(name, at)));
	});
	return k;
};

const linkLevels = (s: Scheme) => Math.abs(lumaOf(s.bg) - lumaOf(s.line)) * 255;

export const PacketHop: React.FC<PacketHopProps> = (props) => {
	const {tone = 'light', variant, links = [], linkWidth, children} = props;
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {width, height, w, h, px} = useFrame();
	const s = scheme(tone);
	const size = maybe(v, 'dot') ?? props.dot;
	if (size === undefined) throw new Error(`PacketHop/${name} needs a dot prop (dot size not measured)`);
	if (links.length > 0 && linkWidth === undefined) throw new Error('PacketHop: links need a linkWidth');
	const dots = dotsAt(name, v, frame, p, props);
	const base = linkLevels(s);
	const carry = maybe(v, 'carry') ?? 1;
	const linkLayer = (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
			{links.map((l, i) => {
				const a = props.nodes[l[0]];
				const b = props.nodes[l[1]];
				if (!a || !b) return null;
				const k = carryOf(name, l, p, props.hops ?? []);
				return (
					<line
						key={i}
						x1={w(a[0])}
						y1={h(a[1])}
						x2={w(b[0])}
						y2={h(b[1])}
						stroke={k > 0 ? contrastGrey(s, base * mix(k, 1, carry)) : s.line}
						strokeWidth={px(linkWidth ?? 0)}
					/>
				);
			})}
		</svg>
	);
	const dotLayer = (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
			{dots.map((d, i) => (
				<circle key={i} cx={w(d.at[0])} cy={h(d.at[1])} r={px(size) / 2} fill={d.grey ? s.muted : s.ink} />
			))}
		</svg>
	);
	const under = flag(v, 'under');
	return (
		<AbsoluteFill>
			{linkLayer}
			{under ? dotLayer : null}
			{children ? <AbsoluteFill>{children}</AbsoluteFill> : null}
			{under ? null : dotLayer}
		</AbsoluteFill>
	);
};

// ---- Demo ----

const ring = (n: number, cx: number, cy: number, rx: number, ry: number, turn = 0): Pt[] =>
	Array.from({length: n}, (_, i) => {
		const a = ((i * 360) / n + turn) * (Math.PI / 180);
		return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
	});

/** Plain node marks for the demos: a filled rounded square, a disc or a ring, drawn at node centres. */
const Marks: React.FC<{nodes: Pt[]; size: number; kinds: ('square' | 'disc' | 'ring' | 'box')[]; tone?: Tone; cover?: number}> = ({
	nodes,
	size,
	kinds,
	tone = 'light',
	cover,
}) => {
	const {width, height, w, h, px} = useFrame();
	const s = scheme(tone);
	const r = px(size) / 2;
	return (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
			{nodes.map((n, i) => {
				const x = w(n[0]);
				const y = h(n[1]);
				const k = cyc(kinds, i);
				return (
					<g key={i}>
						{cover ? <rect x={x - px(cover) / 2} y={y - px(cover) / 2} width={px(cover)} height={px(cover)} fill={s.bg} /> : null}
						{k === 'square' ? <rect x={x - r} y={y - r} width={2 * r} height={2 * r} rx={r * 0.3} fill={s.ink} /> : null}
						{k === 'box' ? <rect x={x - r} y={y - r} width={2 * r} height={2 * r} rx={r * 0.3} fill={s.surface} stroke={s.line} strokeWidth={px(2)} /> : null}
						{k === 'disc' ? <circle cx={x} cy={y} r={r} fill={s.inkSoft} /> : null}
						{k === 'ring' ? <circle cx={x} cy={y} r={r * 0.8} fill={s.surface} stroke={s.ink} strokeWidth={r * 0.25} /> : null}
					</g>
				);
			})}
		</svg>
	);
};

/** A plain panel with a few grey bars; `lines` bars from the top, the last one darker when `fresh`. */
const Panel: React.FC<{x: number; y: number; wPct: number; hPct: number; lines: number; fresh?: boolean; dark?: boolean}> = ({x, y, wPct, hPct, lines, fresh, dark}) => {
	const {w, h, px} = useFrame();
	const s = scheme('light');
	return (
		<div
			style={{
				position: 'absolute',
				left: w(x - wPct / 2),
				top: h(y - hPct / 2),
				width: w(wPct),
				height: h(hPct),
				borderRadius: px(22),
				backgroundColor: dark ? s.ink : s.surface,
				border: dark ? undefined : `${px(2)}px solid ${s.line}`,
				padding: px(34),
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
				gap: px(20),
			}}
		>
			{Array.from({length: lines}, (_, i) => (
				<div
					key={i}
					style={{
						height: px(18),
						width: `${[62, 84, 48, 70][i % 4]}%`,
						borderRadius: px(9),
						backgroundColor: fresh && i === lines - 1 ? (dark ? s.surface : s.ink) : dark ? s.inkSoft : s.surfaceAlt,
					}}
				/>
			))}
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const frame = useCurrentFrame();
	switch (variant) {
		case 'straightCarry': {
			const nodes: Pt[] = [[37, 47], [62, 38]];
			const land = landingFrame(variant, 0);
			return (
				<AbsoluteFill>
					<Panel x={24} y={50} wPct={26} hPct={34} lines={3} dark />
					<Panel x={76} y={50} wPct={26} hPct={34} lines={frame >= land ? 2 : 1} fresh={frame >= land} />
					<PacketHop variant={variant} nodes={nodes} hops={[{from: 0, to: 1, at: 0}]} />
				</AbsoluteFill>
			);
		}
		case 'dispatch': {
			const nodes: Pt[] = [[30, 40], [70, 62]];
			const hops = [0, 1, 2, 3].map((i) => ({from: i % 2, to: (i + 1) % 2, at: hopStart(variant, i)}));
			const got = (side: number) => hops.filter((hp) => hp.to === side && frame >= landingFrame(variant, hp.at)).length;
			return (
				<AbsoluteFill>
					<Panel x={20} y={50} wPct={30} hPct={52} lines={2 + got(0)} fresh={got(0) > 0} />
					<Panel x={80} y={50} wPct={30} hPct={52} lines={1 + got(1)} fresh={got(1) > 0} />
					<PacketHop variant={variant} nodes={nodes} hops={hops} />
				</AbsoluteFill>
			);
		}
		case 'relay': {
			const nodes: Pt[] = [[14, 64], [32, 34], [50, 64], [68, 34], [86, 64]];
			const there = [0, 1, 2, 3, 4, 3, 2, 1];
			const path = (from: number) => Array.from({length: 16}, (_, k) => cyc(there, k + from));
			const links: Link[] = [[0, 1], [1, 2], [2, 3], [3, 4]];
			return (
				<PacketHop variant={variant} nodes={nodes} links={links} linkWidth={3} chains={[path(0), path(4)]}>
					<Marks nodes={nodes} size={130} kinds={['ring', 'square', 'ring', 'square', 'ring']} />
				</PacketHop>
			);
		}
		case 'dwellHop': {
			const cols = 9;
			const rows = 5;
			const nodes: Pt[] = [];
			for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) nodes.push([10 + c * 10 + (r % 2) * 5, 18 + r * 16]);
			const links: Link[] = [];
			nodes.forEach((a, i) =>
				nodes.forEach((b, j) => {
					if (j > i && Math.hypot((a[0] - b[0]) * 1.78, a[1] - b[1]) < 19) links.push([i, j]);
				}),
			);
			return (
				<PacketHop variant={variant} nodes={nodes} links={links} linkWidth={2} dot={14} walkers={14}>
					<Marks nodes={nodes} size={74} kinds={['disc', 'ring', 'square', 'ring', 'disc', 'square', 'ring']} />
				</PacketHop>
			);
		}
		case 'pingPong': {
			const outer = ring(8, 50, 54, 36, 38, 22.5);
			const hub: Pt = [50, 54];
			const nodes: Pt[] = [hub, ...outer.map((o, i): Pt => (i % 2 === 1 ? [50 + (o[0] - 50) * 0.55, 54 + (o[1] - 54) * 0.55] : o))];
			const links: Link[] = outer.map((_, i): Link => (i % 2 === 1 ? [0, i + 1, 'grey'] : [0, i + 1]));
			return (
				<PacketHop variant={variant} nodes={nodes} links={links} linkWidth={2} dot={16}>
					<Marks nodes={nodes.slice(1)} size={84} kinds={['square', 'disc']} cover={170} />
					<Marks nodes={[hub]} size={150} kinds={['square']} />
				</PacketHop>
			);
		}
		default: {
			// easedHop: a hub sends one packet to each of six nodes on the measured cascade, then they answer
			const hub: Pt = [50, 52];
			const outer = ring(6, 50, 52, 30, 34, 30);
			const nodes: Pt[] = [hub, ...outer];
			const v = variantOf(spec, variant);
			const out: Hop[] = outer.map((_, i) => ({from: 0, to: i + 1, at: hopStart(variant, i)}));
			const back: Hop[] = outer.map((_, i) => ({from: i + 1, to: 0, at: num(v, 'returnAt') + i * num(v, 'returnStagger'), grey: i % 2 === 1}));
			const links: Link[] = outer.map((_, i): Link => [0, i + 1]);
			return (
				<PacketHop variant={variant} nodes={nodes} hops={[...out, ...back]} links={links} linkWidth={3}>
					<Marks nodes={outer} size={120} kinds={['box', 'square', 'box', 'square', 'box', 'square']} />
					<Marks nodes={[hub]} size={150} kinds={['ring']} />
				</PacketHop>
			);
		}
	}
};
