import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {num, variantOf} from '../../engine/anim';
import {mix} from '../../engine/progress';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps, VariantSpec} from '../types';
import {At, clamp01, keyAt, keys, mot, motionEnd, prog, type Pt, Shape, useT, Word} from './kit';
import {spec} from './ShapeSwap.spec';

// Each item is swapped in place for its partner in `to`: per item a start offset (a radial wave, a
// centre-out order or a fixed stagger), then the old shape's scale and opacity going out and the new
// shape's scale and opacity coming in, the new one drawn in front.

type Swap = {outShown: boolean; outScale: number; outOpacity: number; inShown: boolean; inScale: number; inOpacity: number};
type LabelPose = {scale: number; opacity: number; pivot: number};

/** Start offset (frames) of each item. */
const offsets = (name: string, v: VariantSpec, at: Pt[], size: {width: number; height: number}): number[] => {
	if (name === 'waveSwap') {
		// distance from the wave centre in px at 1080
		const k = 1080 / size.height;
		return at.map(([x, y]) => {
			const dx = ((x - num(v, 'waveX')) / 100) * size.width * k;
			const dy = ((y - num(v, 'waveY')) / 100) * size.height * k;
			return Math.hypot(dx, dy) * num(v, 'framesPerPx');
		});
	}
	if (name === 'centreOutSwap') {
		// centre-out, the nearer side first, alternating as the distances alternate
		const order = at.map(([x], i) => ({i, d: Math.abs(x - 50) + (x < 50 ? 0 : 1e-3)})).sort((a, b) => a.d - b.d);
		const out = at.map(() => 0);
		order.forEach(({i}, rank) => {
			out[i] = rank * num(v, 'stagger');
		});
		return out;
	}
	if (name === 'shrinkGrow') return at.map((_, i) => i * num(v, 'stagger'));
	return at.map(() => 0);
};

const swapAt = (name: string, v: VariantSpec, t: number): Swap => {
	if (name === 'waveSwap') {
		return {
			outShown: prog(v, 'outOpacity', t) < 1,
			outScale: mix(prog(v, 'outScale', t), 1, num(v, 'outTo')),
			outOpacity: 1 - prog(v, 'outOpacity', t),
			inShown: t > 0,
			inScale: mix(prog(v, 'inScale', t), num(v, 'fromScale'), 1),
			inOpacity: clamp01(prog(v, 'opacity', t)),
		};
	}
	if (name === 'centreOutSwap') {
		const m = mot(v, 'scale');
		return {
			outShown: t < motionEnd(m),
			outScale: keyAt(keys(v, 'outScale'), t),
			outOpacity: keyAt(keys(v, 'outDim'), t),
			inShown: t >= m.delay,
			inScale: mix(prog(v, 'scale', t), num(v, 'fromScale'), 1),
			inOpacity: clamp01(prog(v, 'opacity', t)),
		};
	}
	if (name === 'crossDissolve') {
		return {
			outShown: prog(v, 'outOpacity', t) < 1,
			outScale: 1,
			outOpacity: clamp01(1 - prog(v, 'outOpacity', t)),
			inShown: t > 0,
			inScale: 1,
			inOpacity: clamp01(prog(v, 'opacity', t)),
		};
	}
	if (name === 'shrinkGrow') {
		const po = prog(v, 'out', t);
		const pi = prog(v, 'scale', t);
		return {
			outShown: t < num(v, 'cut'),
			outScale: mix(po, 1, num(v, 'outTo')),
			outOpacity: clamp01(1 - po),
			inShown: t >= num(v, 'cut'),
			inScale: mix(pi, num(v, 'fromScale'), 1),
			inOpacity: clamp01(prog(v, 'opacity', t)),
		};
	}
	throw new Error(`ShapeSwap has no variant ${name}`);
};

const labelAt = (name: string, v: VariantSpec, t: number): LabelPose => {
	if (name === 'centreOutSwap') {
		return {scale: mix(prog(v, 'labelScale', t), 1, num(v, 'labelTo')), opacity: clamp01(1 - prog(v, 'labelOpacity', t)), pivot: num(v, 'labelPivot')};
	}
	if (name === 'waveSwap') return {scale: 1, opacity: clamp01(1 - prog(v, 'labels', t)), pivot: 0};
	return {scale: 1, opacity: 1, pivot: 0};
};

export type ShapeSwapProps = {
	/** the shapes going out, each filling its box */
	items: React.ReactNode[];
	/** the shapes coming in, same order */
	to: React.ReactNode[];
	/** centre of each item, % of the frame */
	at: Pt[];
	/** box of an outgoing item, px at 1080 */
	size: [number, number];
	/** box of an incoming item, px at 1080 (default: size) */
	toSize?: [number, number];
	/** a label under each item: it leaves with its item (centreOutSwap) or fades with the others (waveSwap) */
	labels?: React.ReactNode[];
	/** px at 1080 from an item's centre down to its label's centre */
	labelBelow?: number;
	/** a layer removed in one frame when the swap starts (waveSwap) */
	detach?: React.ReactNode;
	tone?: Tone;
	variant?: string;
};

export const ShapeSwap: React.FC<ShapeSwapProps> = ({items, to, at, size, toSize, labels, labelBelow, detach, variant}) => {
	const t = useT();
	const {width, height} = useVideoConfig();
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const px = (n: number) => (n * height) / 1080;
	const offs = offsets(name, v, at, {width, height});
	const inBox = toSize ?? size;
	const below = labelBelow ?? size[1];
	return (
		<AbsoluteFill>
			{detach ? <AbsoluteFill style={{visibility: name === 'waveSwap' && t >= 1 ? 'hidden' : 'inherit'}}>{detach}</AbsoluteFill> : null}
			{at.map(([x, y], i) => {
				const off = offs[i] ?? 0;
				const sw = swapAt(name, v, t - off);
				const lp = labelAt(name, v, t - off);
				const label = labels?.[i];
				return (
					<div key={i}>
						<At x={x} y={y} w={px(size[0])} h={px(size[1])} style={{visibility: sw.outShown ? 'inherit' : 'hidden', opacity: sw.outOpacity, transform: `scale(${sw.outScale})`}}>
							{items[i]}
						</At>
						<At x={x} y={y} w={px(inBox[0])} h={px(inBox[1])} style={{visibility: sw.inShown ? 'inherit' : 'hidden', opacity: sw.inOpacity, transform: `scale(${sw.inScale})`}}>
							{to[i]}
						</At>
						{label ? (
							<div
								style={{
									position: 'absolute',
									left: `${x}%`,
									top: (y / 100) * height + px(below),
									transform: `translate(-50%, -50%) scale(${lp.scale})`,
									transformOrigin: `50% calc(50% - ${px(lp.pivot)}px)`,
									opacity: lp.opacity,
								}}
							>
								{label}
							</div>
						) : null}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

// ---- Demo ----

const Card: React.FC<{tone: Tone; kind: 'square' | 'disc' | 'plus' | 'diamond'; dark?: boolean}> = ({tone, kind, dark}) => {
	const s = scheme(tone);
	return (
		<div
			style={{
				width: '100%',
				height: '100%',
				borderRadius: '22%',
				backgroundColor: dark ? s.inkSoft : s.surface,
				border: `2px solid ${s.line}`,
				boxSizing: 'border-box',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<div style={{width: '40%', height: '60%'}}>
				<Shape kind={kind} fill={dark ? s.surface : s.muted} />
			</div>
		</div>
	);
};

const Pill: React.FC<{tone: Tone; text: string; dark?: boolean}> = ({tone, text, dark}) => {
	const s = scheme(tone);
	return (
		<div
			style={{
				width: '100%',
				height: '100%',
				borderRadius: 999,
				backgroundColor: dark ? s.accent : s.surfaceAlt,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Word tone={tone} role="ui" color={dark ? 'onAccent' : 'inkSoft'}>
				{text}
			</Word>
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const {height} = useVideoConfig();
	const v = variantOf(spec, variant);
	const hex = <Shape kind="hex" fill={s.ink} />;

	if (variant === 'centreOutSwap') {
		const xs = [11.6, 27.2, 42.2, 57.8, 73.3, 88.9];
		const kinds = ['disc', 'plus', 'diamond', 'square', 'disc', 'plus'] as const;
		const plate = num(v, 'plate');
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<ShapeSwap
					variant={variant}
					at={xs.map((x) => [x, 61.1] as Pt)}
					size={[plate, plate]}
					toSize={[num(v, 'cellW'), num(v, 'cellH')]}
					items={xs.map((_, i) => (
						<div key={i} style={{width: '100%', height: '100%', borderRadius: '50%', backgroundColor: i % 2 ? s.inkSoft : s.surface, border: `2px solid ${s.line}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<div style={{width: '40%', height: '40%'}}>
								<Shape kind={kinds[i] ?? 'disc'} fill={i % 2 ? s.surface : s.inkSoft} />
							</div>
						</div>
					))}
					to={xs.map(() => hex)}
					labels={['North', 'Plain', 'Field', 'Signal', 'Round', 'Seven'].map((w) => (
						<Word key={w} tone={tone} role="label" color="inkSoft">
							{w}
						</Word>
					))}
					labelBelow={num(v, 'labelBelow')}
				/>
			</AbsoluteFill>
		);
	}

	if (variant === 'crossDissolve') {
		const xs = [22, 50, 78];
		const kinds = ['disc', 'square', 'diamond'] as const;
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				{xs.map((x) => (
					<At key={x} x={x} y={50} w={height * 0.46} h={height * 0.5} style={{backgroundColor: s.surface, border: `2px solid ${s.line}`, borderRadius: 24}} />
				))}
				<ShapeSwap
					variant={variant}
					at={xs.map((x) => [x, 50] as Pt)}
					size={[height * 0.4, height * 0.42]}
					toSize={[height * 0.2, height * 0.2]}
					items={xs.map((x) => (
						<div key={x} style={{display: 'flex', flexDirection: 'column', gap: '9%', padding: '8%', height: '100%', boxSizing: 'border-box'}}>
							{[80, 55, 90, 65, 40].map((w, i) => (
								<div key={i} style={{width: `${w}%`, height: '7%', borderRadius: 999, backgroundColor: i ? s.line : s.inkSoft}} />
							))}
						</div>
					))}
					to={kinds.map((k) => (
						<Shape key={k} kind={k} fill={s.ink} />
					))}
				/>
			</AbsoluteFill>
		);
	}

	if (variant === 'shrinkGrow') {
		const ys = [26, 42, 58, 74];
		const pill = num(v, 'pill');
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				{ys.map((y, i) => (
					<At key={y} x={50} y={y} w={height * 1.2} h={height * 0.12} style={{backgroundColor: s.surface, border: `2px solid ${s.line}`, borderRadius: 20, display: 'flex', alignItems: 'center', paddingLeft: '4%', boxSizing: 'border-box'}}>
						<Word tone={tone} role="ui">{`Task ${i + 1}`}</Word>
					</At>
				))}
				<ShapeSwap
					variant={variant}
					at={ys.map((y) => [72, y] as Pt)}
					size={[pill, pill * 0.36]}
					items={ys.map((y) => (
						<Pill key={y} tone={tone} text="Open" />
					))}
					to={ys.map((y) => (
						<Pill key={y} tone={tone} text="Done" dark />
					))}
				/>
			</AbsoluteFill>
		);
	}

	// waveSwap: a field of tiles becomes a field of hexagons from the centre out
	const cols = 13;
	const rows = 7;
	const at: Pt[] = [];
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) at.push([7 + (c * 86) / (cols - 1), 14 + (r * 78) / (rows - 1)]);
	const kinds = ['square', 'disc', 'plus', 'diamond'] as const;
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<ShapeSwap
				variant={variant}
				at={at}
				size={[86, 50]}
				toSize={[num(v, 'cellW'), num(v, 'cellH')]}
				items={at.map((_, i) => (
					<Card key={i} tone={tone} kind={kinds[i % 4] ?? 'square'} dark={i % 9 === 4} />
				))}
				to={at.map((_, i) => (
					<Shape key={i} kind="hex" fill={s.ink} />
				))}
				labels={at.map((_, i) =>
					i % 9 === 4 ? (
						<Word key={i} tone={tone} role="caption" color="muted">
							{String(10 + i)}
						</Word>
					) : null,
				)}
				labelBelow={52}
				detach={
					<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute'}}>
						{at.slice(0, -1).map(([x, y], i) => {
							const n = at[i + 1] as Pt;
							return (i + 1) % cols ? <line key={i} x1={x} y1={y} x2={n[0]} y2={n[1]} stroke={s.muted} strokeWidth={3} vectorEffect="non-scaling-stroke" /> : null;
						})}
						{at.filter((_, i) => i % 5 === 2).map(([x, y], i) => (
							<circle key={i} cx={x + 3.3} cy={y} r={0.5} fill={s.muted} />
						))}
					</svg>
				}
			/>
		</AbsoluteFill>
	);
};
