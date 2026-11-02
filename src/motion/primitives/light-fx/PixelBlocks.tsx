import type React from 'react';
import {AbsoluteFill, random, useVideoConfig} from 'remotion';
import {num, variantOf} from '../../engine/anim';
import {mix, progressAt} from '../../engine/progress';
import {scheme, type Tone} from '../../tokens/colors';
import type {Motion} from '../../tokens/easing';
import {fontSize, FONT} from '../../tokens/type';
import type {DemoProps, VariantSpec} from '../types';
import {DRAW} from './draw';
import {clamp01, darkest, lumaOf, pose, useRefFrame, withAlpha} from './light';
import {spec} from './PixelBlocks.spec';

export type PixelBlocksProps = {
	tone?: Tone;
	variant?: string;
	/** parkSweep / smearSweep: band centre, % of frame height (the element it runs through) */
	y?: number;
	/** parkSweep: squares in the cluster (not measured: DRAW default) */
	count?: number;
	/** pairConverge: each square, px at 1080p (not measured: DRAW default) */
	pairPx?: number;
	/** outline weight of the luminous squares, px at 1080p (not measured: DRAW default) */
	linePx?: number;
};

const mot = (v: VariantSpec, prop: string): Motion => {
	const m = v.motions[prop];
	if (!m) throw new Error(`PixelBlocks variant has no motion ${prop}`);
	return m;
};

const Square: React.FC<{x: number; y: number; size: number; style: React.CSSProperties}> = ({x, y, size, style}) => (
	<div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, boxSizing: 'border-box', ...style}} />
);

export const PixelBlocks: React.FC<PixelBlocksProps> = ({
	tone = 'dark',
	variant,
	y = 50,
	count = DRAW.clusterCount,
	pairPx = DRAW.pairPx,
	linePx = DRAW.linePx,
}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const f = useRefFrame();
	const {width, height} = useVideoConfig();
	const s = scheme(tone);
	const w = (pct: number) => (pct / 100) * width;
	const h = (pct: number) => (pct / 100) * height;
	const px = (at1080: number) => (at1080 * height) / 1080;
	const p = (prop: string, at = f) => progressAt(at, mot(v, prop));

	if (name === 'parkSweep') {
		// a cluster of luminous squares on a grid one tile apart, sweeping and then dimming in place
		const cx = w(num(v, 'fromX') + num(v, 'travel') * p('x'));
		const pitch = px(num(v, 'tileMax'));
		const a = 1 - clamp01(p('dim'));
		return (
			<AbsoluteFill>
				{Array.from({length: count}, (_, i) => {
					const col = Math.floor(random(`px-col-${i}`) * 4) - 1.5;
					const row = Math.floor(random(`px-row-${i}`) * 2) - 0.5;
					const size = px(mix(random(`px-size-${i}`), num(v, 'tileMin'), num(v, 'tileMax')));
					const filled = random(`px-fill-${i}`) < 0.5;
					return (
						<Square
							key={i}
							x={cx + col * pitch}
							y={h(y) + row * pitch}
							size={size}
							style={{
								border: `${px(linePx)}px solid ${s.flash}`,
								backgroundColor: filled ? s.flash : 'transparent',
								opacity: a * (filled ? random(`px-luma-${i}`) : 1),
							}}
						/>
					);
				})}
			</AbsoluteFill>
		);
	}

	if (name === 'smearSweep') {
		// soft grey squares across the band, darkening what they pass by the measured amount
		const cx = w(num(v, 'fromX') + num(v, 'travel') * p('x'));
		const size = px(num(v, 'tile'));
		const band = w(num(v, 'width'));
		const n = Math.max(1, Math.round(band / size));
		const energy = clamp01(p('energy') - p('fade'));
		const under = lumaOf(s.surface) - lumaOf(darkest(s));
		return (
			<AbsoluteFill>
				{Array.from({length: n}, (_, i) => (
					<Square
						key={i}
						x={cx - band / 2 + (i + 0.5) * (band / n)}
						y={h(y) + (random(`smear-y-${i}`) - 0.5) * size}
						size={size}
						style={{backgroundColor: withAlpha(darkest(s), (num(v, 'deficit') / under) * energy * random(`smear-a-${i}`))}}
					/>
				))}
			</AbsoluteFill>
		);
	}

	// pairConverge: two squares slide diagonally into a corner-to-corner pair, a new pose every `step` frames
	const k = clamp01(progressAt(pose(f, num(v, 'step')), mot(v, 'converge')));
	const size = px(pairPx);
	const meetX = w(num(v, 'meetX'));
	const meetY = h(num(v, 'meetY'));
	const style: React.CSSProperties = {backgroundColor: s.muted};
	return (
		<AbsoluteFill>
			<Square x={mix(k, w(num(v, 'ax')), meetX - size / 2)} y={mix(k, h(num(v, 'ay')), meetY - size / 2)} size={size} style={style} />
			<Square x={mix(k, w(num(v, 'bx')), meetX + size / 2)} y={mix(k, h(num(v, 'by')), meetY + size / 2)} size={size} style={style} />
		</AbsoluteFill>
	);
};

// ---- Demo: a plain input pill for the sweeps, an empty corner for the pair ----

const Pill: React.FC<{tone: Tone; left: string; width: string; text?: string; bare?: boolean}> = ({tone, left, width, text, bare}) => {
	const s = scheme(tone);
	const {height} = useVideoConfig();
	return (
		<div
			style={{
				position: 'absolute',
				left,
				width,
				top: '50%',
				height: '9%',
				transform: 'translateY(-50%)',
				borderRadius: 999,
				backgroundColor: bare ? 'transparent' : s.surface,
				border: `2px solid ${bare ? 'transparent' : s.line}`,
				display: 'flex',
				alignItems: 'center',
				padding: '0 3%',
				fontFamily: FONT.ui,
				fontSize: fontSize('ui', height) * 1.3,
				color: s.inkSoft,
			}}
		>
			{text}
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = variant === 'parkSweep' ? 'dark' : 'light';
	const s = scheme(tone);
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			{variant === 'parkSweep' ? <Pill tone={tone} left="10.9%" width="62%" /> : null}
			{variant === 'smearSweep' ? <Pill tone={tone} left="24%" width="44%" /> : null}
			<PixelBlocks variant={variant} tone={tone} />
			{variant === 'smearSweep' ? (
				<>
					<Pill tone={tone} left="24%" width="44%" text="Plan a short trip for two." bare />
					<div style={{position: 'absolute', left: '62.6%', top: '50%', width: 64, height: 64, marginLeft: -32, marginTop: -32, borderRadius: 32, backgroundColor: s.ink}} />
				</>
			) : null}
		</AbsoluteFill>
	);
};
