import type React from 'react';
import {AbsoluteFill} from 'remotion';
import {maybe, mix, num, str, useFrame, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {at as at_, atSpeed, Block, makePath, mot, onward, type P, Pointer, pointerHeight, points, type PointerLook, type Anchor, streak, useRefFrame, Word, yAtX} from './kit';
import {spec} from './CursorPath.spec';

export type CursorPathProps = {
	tone?: Tone;
	variant?: string;
	/** pointer height, px at 1080 (default: the variant's measured size; required where none is measured) */
	size?: number;
	/** rest point [x % W, y % H] the measured path ends on (windUp, flyOut: the start point); the path keeps its measured shape */
	at?: [number, number];
	look?: PointerLook;
};

type Read = (prop: string, f: number) => number;
type State = {x: number; y: number; rot: number; scale: number; show: boolean};

export const CursorPath: React.FC<CursorPathProps> = ({tone = 'light', variant, size, at, look}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const f = useRefFrame();
	const {w, h, px, width, height} = useFrame();
	const H = size !== undefined ? px(size) : pointerHeight(v, width, height);
	if (H === undefined) throw new Error(`CursorPath ${name}: pass size (no pointer size is measured for this variant)`);

	const pathPx = (key: string): P[] => points(v, key).map(([x, y]) => [w(x), h(y)]);
	const rest: [number, number] = at ?? [maybe(v, 'toX') ?? 50, maybe(v, 'toY') ?? 50];
	const still = (x: number, y: number): State => ({x, y, rot: 0, scale: 1, show: true});

	const state = (t: number, rd: Read): State => {
		switch (name) {
			case 'flyUp': {
				const p = rd('y', t);
				return still(w(rest[0] + num(v, 'fromX') * (1 - p)), h(rest[1] + num(v, 'fromY') * (1 - p)));
			}
			case 'diagonalIn': {
				const path = makePath(pathPx('path'));
				const [dx, dy] = path.at(rd('progress', t));
				return {...still(w(rest[0]) + dx, h(rest[1]) + dy), rot: num(v, 'tilt') * (1 - rd('tilt', t))};
			}
			case 'dive':
			case 'glideClick': {
				const prop = name === 'dive' ? 'x' : 'y';
				const p = rd(prop, t);
				const ox = rest[0] - num(v, 'toX');
				const oy = rest[1] - num(v, 'toY');
				let x = mix(p, num(v, 'fromX'), num(v, 'toX')) + ox;
				let y = mix(p, num(v, 'fromY'), num(v, 'toY')) + oy;
				if (name === 'dive') return still(w(x), h(y));
				const e = rd('exit', t);
				x = mix(e, x, num(v, 'exitX') + ox);
				y = mix(e, y, num(v, 'exitY') + oy);
				const squash = rd('press', t) - rd('release', t);
				return {x: w(x), y: h(y), rot: 0, scale: 1 - (1 - num(v, 'pressTo')) * squash, show: t < num(v, 'goneAt')};
			}
			case 'throw':
			case 'constant': {
				const path = makePath(pathPx('path'));
				const [dx, dy] = path.at(rd('progress', t));
				return still(w(rest[0]) + dx, h(rest[1]) + dy);
			}
			case 'windUp': {
				const pts = points(v, 'path');
				const first = pts[0] ?? [num(v, 'fromX'), 0];
				const start: [number, number] = at ?? [first[0], first[1]];
				const ox = start[0] - first[0];
				const oy = start[1] - first[1];
				const p = rd('x', t);
				const from = num(v, 'fromX');
				const xr = mix(p, from, num(v, 'toX'));
				const x = xr + num(v, 'windX') * rd('wind', t) * (1 - p);
				const y = yAtX(pts, Math.max(from, xr));
				return still(w(x + ox), h(y + oy));
			}
			case 'flyOut': {
				const path = makePath(pathPx('path'));
				const start: [number, number] = at ?? [num(v, 'fromX'), num(v, 'fromY')];
				const [dx, dy] = path.at(onward(v, 'progress', t));
				return still(w(start[0]) + dx, h(start[1]) + dy);
			}
			default:
				return still(w(rest[0]), h(rest[1]));
		}
	};

	const plain: Read = (prop, t) => at_(v, prop, t);
	const now = state(f, plain);
	if (!now.show) return null;
	const a = state(f - 1, (prop, t) => atSpeed(v, prop, t));
	const b = state(f, (prop, t) => atSpeed(v, prop, t));
	const shutter = maybe(v, 'shutter');
	const trail = shutter ? streak(shutter, b.x - a.x, b.y - a.y) : undefined;

	let rot = now.rot;
	if (name === 'windUp') {
		// the tilt follows the speed: tiltMax at the fastest frame of the swoop, upright at rest
		const m = mot(v, 'x');
		const speedAt = (t: number) => {
			const p = state(t, plain);
			const q = state(t - 1, plain);
			return Math.hypot(p.x - q.x, p.y - q.y);
		};
		let peak = 0;
		for (let t = Math.floor(m.delay); t <= m.delay + m.duration; t++) peak = Math.max(peak, speedAt(t));
		rot = peak > 0 ? num(v, 'tiltMax') * Math.min(1, speedAt(f) / peak) : 0;
	}

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<Pointer
				tone={tone}
				h={H}
				look={look ?? (str(v, 'look') as PointerLook)}
				anchor={str(v, 'anchor') as Anchor}
				x={now.x}
				y={now.y}
				rotate={rot}
				scale={now.scale}
				smear={trail}
			/>
		</AbsoluteFill>
	);
};

// ---- Demo ----

/** A plain target the pointer lands on: a rounded block with a short word. */
const Target: React.FC<{x: number; y: number; w: number; h: number; label: string; fill?: 'surface' | 'ink'}> = ({x, y, w, h, label, fill = 'surface'}) => {
	const {px, w: W, h: H, height} = useFrame();
	return (
		<div style={{position: 'absolute', left: W(x) - px(w) / 2, top: H(y) - px(h) / 2}}>
			<Block tone="light" w={px(w)} h={px(h)} fill={fill} radius={px(h / 2)} line={fill === 'surface'} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<Word tone="light" height={height} role="label" color={fill === 'ink' ? 'onAccent' : 'ink'}>
					{label}
				</Word>
			</Block>
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const s = scheme('light');
	const flat = 64;
	const solid = 130;
	switch (variant) {
		case 'flyUp':
			return (
				<AbsoluteFill>
					{[0, 1, 2].map((i) => (
						<div key={i} style={{position: 'absolute', left: `${36 + i * 10}%`, top: '24%', width: '8%', height: '14%', borderRadius: 18, backgroundColor: s.surfaceAlt}} />
					))}
					<CursorPath variant={variant} size={solid} at={[44, 36]} />
				</AbsoluteFill>
			);
		case 'diagonalIn':
		case 'windUp':
			return (
				<AbsoluteFill>
					<div style={{position: 'absolute', left: '34%', top: '44%', width: '28%', height: '30%', borderRadius: 32, backgroundColor: s.surface, border: `2px solid ${s.line}`}} />
					{variant === 'windUp' ? <Target x={num(v, 'toX') - 4} y={42.8} w={200} h={64} label="next" /> : null}
					<CursorPath variant={variant} />
				</AbsoluteFill>
			);
		case 'dive':
			return (
				<AbsoluteFill>
					<Target x={num(v, 'toX')} y={num(v, 'toY') + 4} w={360} h={110} label="Go" />
					<CursorPath variant={variant} size={170} />
				</AbsoluteFill>
			);
		case 'throw':
			return (
				<AbsoluteFill>
					<div style={{position: 'absolute', left: '30%', top: '33%', width: '12%', height: '15%', borderRadius: 16, backgroundColor: s.surfaceAlt}} />
					<div style={{position: 'absolute', left: '62%', top: '76%', width: '16%', height: '12%', borderRadius: 16, backgroundColor: s.surface, border: `2px solid ${s.line}`}} />
					<CursorPath variant={variant} size={flat} />
				</AbsoluteFill>
			);
		case 'glideClick':
			return (
				<AbsoluteFill>
					<div style={{position: 'absolute', left: '60%', top: '44%', width: '18%', height: '22%', borderRadius: 24, backgroundColor: s.surfaceAlt}} />
					<Target x={num(v, 'toX')} y={num(v, 'toY')} w={150} h={70} label="Send" />
					<CursorPath variant={variant} size={solid} />
				</AbsoluteFill>
			);
		case 'constant':
			return (
				<AbsoluteFill>
					{[0, 1, 2, 3].map((i) => (
						<div key={i} style={{position: 'absolute', left: '10%', top: `${20 + i * 14}%`, width: '64%', height: '6%', borderRadius: 14, backgroundColor: s.surfaceAlt}} />
					))}
					<CursorPath variant={variant} size={flat} />
				</AbsoluteFill>
			);
		case 'flyOut':
		default:
			return (
				<AbsoluteFill>
					<Target x={num(v, 'fromX') - 4} y={num(v, 'fromY') + 6} w={220} h={70} label="Open" />
					<CursorPath variant={variant} size={solid} />
				</AbsoluteFill>
			);
	}
};
