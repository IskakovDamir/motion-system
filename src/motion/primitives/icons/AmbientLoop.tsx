import type React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {cyc, ellipseAt, fold, nums} from './geom';
import {Shape, Tile, type ShapeKind} from './shapes';
import {spec} from './AmbientLoop.spec';

export type AmbientLoopProps = {
	items: React.ReactNode[];
	tone?: Tone;
	variant?: string;
	/** grid layout of the held elements (default one row) */
	columns?: number;
	/** gap between held elements in px */
	gap?: number;
	/** ellipseOrbit: element box in px (not measured) */
	size?: number;
	/** audioLevel: level of bar `bar` at `frame`, 0 (a dot) .. 1 (the tallest bar); default a seeded random level every frame */
	level?: (frame: number, bar: number) => number;
	/** audioLevel: gap between bars in px (not measured; default one dot) */
	barGap?: number;
	seed?: string;
};

const mod = (a: number, m: number) => ((a % m) + m) % m;

export const AmbientLoop: React.FC<AmbientLoopProps> = ({items, tone = 'light', variant, columns, gap = 0, size, level, barGap, seed = 'loop'}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {width, height, w, h, px} = useFrame();
	const s = scheme(tone);
	const n = items.length;

	if (name === 'ellipseOrbit') {
		if (size === undefined) throw new Error('AmbientLoop/ellipseOrbit needs a size prop');
		const turn = frame * num(v, 'degPerFrame');
		return (
			<AbsoluteFill>
				{items.map((it, i) => {
					const [x, y] = ellipseAt((i * 360) / n + turn, w(num(v, 'rx')), h(num(v, 'ry')));
					return (
						<div key={i} style={{position: 'absolute', left: width / 2 + x - size / 2, top: height / 2 + y - size / 2, width: size, height: size}}>
							{it}
						</div>
					);
				})}
			</AbsoluteFill>
		);
	}

	const transformOf = (i: number): React.CSSProperties => {
		if (name === 'sineFloat') {
			// lowest point at the element's phase; the measured half-swing up, then the same half-swing mirrored
			const half = num(v, 'period') / 2;
			const u = fold(frame - cyc(nums(v, 'phases'), i), half);
			const a = h(num(v, 'amplitude'));
			return {transform: `translateY(${a - 2 * a * p('y', frame - u)}px)`};
		}
		if (name === 'pulseTurns') {
			const t = mod(frame - i * num(v, 'period'), n * num(v, 'period'));
			const k = p('scale', frame - t) - p('down', frame - t);
			return {transform: `scale(${mix(k, 1, num(v, 'peakScale'))})`};
		}
		if (name === 'squashPulse') {
			const period = num(v, 'period');
			const t = mod(frame - (i * period) / Math.max(1, n), period);
			const k = p('rise', frame - t) - p('fall', frame - t);
			return {transform: `scaleX(${mix(k, 1, num(v, 'peakScaleX'))})`};
		}
		return {};
	};

	const bars = (i: number) => {
		const count = num(v, 'bars');
		const dot = px(num(v, 'dot'));
		const g = barGap ?? dot;
		return (
			<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: g}}>
				{Array.from({length: count}, (_, b) => {
					const l = level ? level(frame, b) : random(`${seed}-${i}-${b}-${frame}`);
					return <div key={b} style={{width: dot, height: mix(Math.min(1, Math.max(0, l)), dot, px(num(v, 'maxHeight'))), borderRadius: dot / 2, backgroundColor: s.surface}} />;
				})}
			</div>
		);
	};

	return (
		<div style={{display: 'grid', gridTemplateColumns: `repeat(${columns ?? n}, auto)`, gap, alignItems: 'center', justifyItems: 'center'}}>
			{items.map((it, i) => (
				<div key={i} style={{position: 'relative', ...transformOf(i)}}>
					{it}
					{name === 'audioLevel' ? bars(i) : null}
				</div>
			))}
		</div>
	);
};

// ---- Demo ----

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const {px} = useFrame();
	const s = scheme('light');
	const kinds: ShapeKind[] = ['plus', 'disc', 'triangle', 'diamond', 'ring', 'square', 'hex', 'plus'];
	const tiles = (n: number, size: number) =>
		Array.from({length: n}, (_, i) => (
			<div key={i} style={{width: size, height: size}}>
				<Tile kind={cyc(kinds, i)} tile={cyc([s.ink, s.inkSoft, s.accent], i)} mark={s.surface} />
			</div>
		));
	const center = (node: React.ReactNode) => <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>{node}</AbsoluteFill>;
	switch (variant) {
		case 'pulseTurns':
			return center(<AmbientLoop variant={variant} columns={3} gap={px(90)} items={tiles(6, px(190))} />);
		case 'squashPulse':
			return center(
				<AmbientLoop
					variant={variant}
					gap={px(110)}
					items={(['disc', 'square', 'triangle', 'diamond'] as ShapeKind[]).map((k, i) => (
						<div key={i} style={{width: px(150), height: px(150)}}>
							<Shape kind={k} fill={cyc([s.ink, s.inkSoft, s.muted], i)} />
						</div>
					))}
				/>,
			);
		case 'audioLevel': {
			// a plain disc as the badge; a level that drops to silence for a while every so often
			const level = (f: number, b: number) => (Math.floor(f / 40) % 3 === 2 ? 0 : random(`demo-${b}-${f}`));
			return center(
				<AmbientLoop
					variant={variant}
					level={level}
					items={[
						<div key="b" style={{width: px(num(v, 'badge')), height: px(num(v, 'badge')), borderRadius: '50%', backgroundColor: s.ink}} />,
					]}
				/>,
			);
		}
		case 'ellipseOrbit':
			return <AmbientLoop variant={variant} size={px(96)} items={tiles(16, px(96))} />;
		default:
			return center(<AmbientLoop variant={variant} columns={4} gap={px(70)} items={tiles(8, px(170))} />);
	}
};
