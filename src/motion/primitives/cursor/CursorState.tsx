import type React from 'react';
import {AbsoluteFill} from 'remotion';
import {maybe, mix, num, useFrame, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {at as prog, type Anchor, Block, Pointer, pointerHeight, stepPoint, stepValue, useRefFrame, Word} from './kit';
import {spec} from './CursorState.spec';

export type CursorStateProps = {
	tone?: Tone;
	variant?: string;
	/** pointer position (tip) or ripple centre, [x % W, y % H] (default: the variant's measured centre, else the frame centre) */
	at?: [number, number];
	/** pointer height, px at 1080 (default: the variant's measured size) */
	size?: number;
	/** hiddenSwap: height of the 2D arrow that comes in, px at 1080 (not measured; default: size) */
	flatSize?: number;
	anchor?: Anchor;
	/** glowMorph: the scene the camera pulse scales with the pointer */
	children?: React.ReactNode;
};

export const CursorState: React.FC<CursorStateProps> = ({tone = 'dark', variant, at, size, flatSize, anchor = 'tip', children}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const f = useRefFrame();
	const {w, h, px, width, height} = useFrame();
	const s = scheme(tone);
	const pos: [number, number] = at ?? [maybe(v, 'x') ?? 50, maybe(v, 'y') ?? 50];
	const x = w(pos[0]);
	const y = h(pos[1]);
	const H = size !== undefined ? px(size) : pointerHeight(v, width, height);

	if (name === 'pressRipple') {
		if (f < 0 || f >= num(v, 'goneAt')) return null;
		const r = px(stepValue(v, 'ring', f, 0));
		const d = px(num(v, 'dot'));
		const rw = px(num(v, 'ringW'));
		const a = num(v, 'dotAlpha');
		const box = r + rw;
		return (
			<AbsoluteFill style={{pointerEvents: 'none'}}>
				<svg width={2 * box} height={2 * box} style={{position: 'absolute', left: x - box, top: y - box}}>
					<circle cx={box} cy={box} r={r} fill="none" stroke={s.flash} strokeOpacity={a} strokeWidth={rw} />
					<circle cx={box} cy={box} r={d} fill={s.flash} fillOpacity={a} />
				</svg>
			</AbsoluteFill>
		);
	}

	if (H === undefined) throw new Error(`CursorState ${name}: pass size`);

	if (name === 'hiddenSwap') {
		const swapped = f >= num(v, 'swapAt');
		const sigma = px(stepValue(v, 'soft', f, 0));
		const [jx, jy] = stepPoint(v, 'jump', f, [0, 0]);
		return (
			<AbsoluteFill style={{pointerEvents: 'none'}}>
				<Pointer
					tone={tone}
					h={swapped ? (flatSize !== undefined ? px(flatSize) : H) : H}
					look={swapped ? 'flat' : 'solid3d'}
					anchor={anchor}
					x={x + px(jx)}
					y={y + px(jy)}
					blur={swapped ? {x: sigma, y: sigma} : undefined}
				/>
			</AbsoluteFill>
		);
	}

	// glowMorph: a halo ramps up on the outline cursor, the 3D pointer replaces it in one picture and its
	// brightness and halo decay on the measured curve; the scene and pointer ride the camera pulse about
	// the pointer
	const swapped = f >= num(v, 'swapAt');
	const glow = swapped ? mix(prog(v, 'opacity', f), 1, num(v, 'restGlow')) : num(v, 'rampTo') * prog(v, 'ramp', f);
	const creepFrom = num(v, 'creepFrom');
	const pushTo = num(v, 'pushTo');
	const scale =
		creepFrom +
		(1 - creepFrom) * prog(v, 'creep', f) +
		(pushTo - 1) * prog(v, 'push', f) +
		(num(v, 'pullTo') - pushTo) * prog(v, 'pull', f);
	return (
		<AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: `${x}px ${y}px`}}>
			{children}
			<Pointer tone={tone} h={H} look={swapped ? 'solid3d' : 'outline'} anchor={anchor} x={x} y={y} glow={glow} brightness={swapped ? glow : 1} />
		</AbsoluteFill>
	);
};

// ---- Demo ----

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const {px, w, h, height} = useFrame();
	if (variant === 'pressRipple') {
		const d = scheme('dark');
		const cx = num(v, 'x');
		const cy = num(v, 'y');
		// three chips in a row; the tap lands on the third
		return (
			<AbsoluteFill>
				<div style={{position: 'absolute', left: w(18), top: h(30), width: w(64), height: h(44), borderRadius: px(36), backgroundColor: d.bgAlt}} />
				{['All', 'New', 'Saved'].map((label, i) => (
					<div key={label} style={{position: 'absolute', left: w(cx - (2 - i) * 13) - px(100), top: h(cy) - px(34)}}>
						<Block tone="dark" w={px(200)} h={px(68)} fill={i === 0 ? 'muted' : 'surfaceAlt'} radius={px(34)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<Word tone="dark" height={height} role="label">
								{label}
							</Word>
						</Block>
					</div>
				))}
				<CursorState variant={variant} />
			</AbsoluteFill>
		);
	}
	if (variant === 'hiddenSwap') {
		const l = scheme('light');
		return (
			<AbsoluteFill style={{backgroundColor: l.bg}}>
				<div style={{position: 'absolute', left: w(36), top: h(22), width: w(22), height: h(30), borderRadius: px(28), backgroundColor: l.surfaceAlt}} />
				<div style={{position: 'absolute', left: w(36), top: h(56)}}>
					<Word tone="light" height={height} role="label">
						clip 04
					</Word>
				</div>
				<CursorState variant={variant} tone="light" at={[57, 50]} flatSize={170} />
			</AbsoluteFill>
		);
	}
	const d = scheme('dark');
	// a dim row of chips behind the pointer: the scene the camera pulse scales
	return (
		<AbsoluteFill>
			<CursorState variant={variant} at={[47, 40]}>
				<AbsoluteFill>
					{[0, 1, 2, 3].map((i) => (
						<div key={i} style={{position: 'absolute', left: w(14 + i * 19), top: h(12), width: w(15), height: h(8), borderRadius: px(40), backgroundColor: d.surfaceAlt, filter: `blur(${px(6)}px)`}} />
					))}
					<div style={{position: 'absolute', left: w(20), top: h(64), width: w(60), height: h(22), borderRadius: px(36), backgroundColor: d.surface}} />
				</AbsoluteFill>
			</CursorState>
		</AbsoluteFill>
	);
};
