import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {maybe, mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {cyc, keyframesAt, makeArc, makePath, nums, points} from './geom';
import {Shape, Tile, type ShapeKind} from './shapes';
import {spec} from './IconFlyIn.spec';

export type IconFlyInProps = {
	/** the flying elements; each is centred on its position. chainArc: items[0] leads, the rest follow */
	items: React.ReactNode[];
	tone?: Tone;
	variant?: string;
	/** rest positions [x % W, y % H] per item (default: the variant's measured rest, or the frame centre) */
	targets?: [number, number][];
	/** dropBounce: y (% H) of the card's top edge; the element is hidden above it */
	clipTop?: number;
};

export const IconFlyIn: React.FC<IconFlyInProps> = ({items, variant, targets, clipTop}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, h} = useFrame();
	const n = items.length;
	const target = (i: number): [number, number] => targets?.[i] ?? targets?.[0] ?? [maybe(v, 'toX') ?? 50, maybe(v, 'toY') ?? 50];
	const offsets = (key: string): [number, number][] => points(v, key).map(([x, y]) => [w(x), h(y)]);

	type Placed = {x: number; y: number; node: React.ReactNode; key: number};
	const placed: Placed[] = [];

	if (name === 'arcIn') {
		const path = makePath(offsets('path'));
		const at = path.at(mix(p('progress'), num(v, 'fromAlong'), 1));
		items.forEach((node, i) => {
			const [tx, ty] = target(i);
			placed.push({x: w(tx) + at[0], y: h(ty) + at[1], node, key: i});
		});
	} else if (name === 'dart') {
		const pts = offsets('path');
		const arr = nums(v, 'arrivals');
		const last = arr.length - 1;
		const gap = (arr[last] ?? 0) - (arr[last - 1] ?? 0);
		items.forEach((node, i) => {
			const off = arr[i] ?? (arr[last] ?? 0) + (i - last) * gap;
			if (frame < off) return;
			const [dx, dy] = keyframesAt(pts, p('progress', off));
			const [tx, ty] = target(i);
			placed.push({x: w(tx) + dx, y: h(ty) + dy, node, key: i});
		});
	} else if (name === 'dropBounce') {
		const dy = h(mix(p('y'), num(v, 'fromY'), 0));
		const dx = w(num(v, 'fromX') + (num(v, 'swingX') - num(v, 'fromX')) * p('swing') - num(v, 'swingX') * p('back'));
		items.forEach((node, i) => {
			const [tx, ty] = target(i);
			placed.push({x: w(tx) + dx, y: h(ty) + dy, node, key: i});
		});
	} else if (name === 'curvedStagger') {
		const st = num(v, 'stagger');
		const lx = num(v, 'leftToX');
		const rx = num(v, 'rightToX');
		items.forEach((node, i) => {
			const isRight = n > 1 && i === n - 1;
			const isLeft = n > 2 ? i === 0 : n === 2 && i === 0;
			const restX = targets?.[i]?.[0] ?? (n === 1 ? (lx + rx) / 2 : mix(i / (n - 1), lx, rx));
			const restY = targets?.[i]?.[1] ?? num(v, 'rowY');
			let x = restX;
			let y = restY;
			if (isRight) {
				x = mix(p('x'), num(v, 'rightFromX'), restX);
			} else {
				if (frame < st) return; // still above the top edge
				y = mix(p('y', st), num(v, 'fromY'), restY);
				if (isLeft) x = mix(p('drift', st), restX - (lx - num(v, 'leftFromX')), restX);
			}
			placed.push({x: w(x), y: h(y), node, key: i});
		});
	} else if (name === 'chainArc') {
		const [a, b, c] = offsets('path') as [[number, number], [number, number], [number, number]];
		const path = makeArc(a, b, c);
		const lag = w(num(v, 'spacing')) / path.length;
		const lead = p('progress');
		const [tx, ty] = target(0);
		// followers first, so the lead is drawn on top
		for (let k = n - 1; k >= 0; k--) {
			const sink = k === 0 ? 1 : p('sink', (k - 1) * num(v, 'sinkStagger'));
			const at = path.at(lead - k * lag * (1 - sink));
			placed.push({x: w(tx) + at[0], y: h(ty) + at[1], node: items[k], key: k});
		}
	}

	return (
		<AbsoluteFill style={{clipPath: clipTop !== undefined ? `inset(${h(clipTop)}px 0 0 0)` : undefined}}>
			{placed.map((u) => (
				<div key={u.key} style={{position: 'absolute', left: u.x, top: u.y, transform: 'translate(-50%, -50%)'}}>
					{u.node}
				</div>
			))}
		</AbsoluteFill>
	);
};

// ---- Demo ----

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const {px, w, h} = useFrame();
	const s = scheme('light');
	const disc = (size: number, fill: string, key?: number) => (
		<div key={key} style={{width: size, height: size}}>
			<Shape kind="disc" fill={fill} />
		</div>
	);
	const tile = (k: ShapeKind, size: number, key?: number) => (
		<div key={key} style={{width: size, height: size}}>
			<Tile kind={k} tile={s.ink} mark={s.surface} round />
		</div>
	);
	switch (variant) {
		case 'dart': {
			// a list of rows; each row's marker darts in from the lower left
			const tx = num(v, 'toX');
			const rows = [0, 1, 2, 3, 4].map((i) => num(v, 'toY') - 24 + i * 12);
			return (
				<AbsoluteFill>
					{rows.map((y, i) => (
						<div key={i} style={{position: 'absolute', left: w(tx + 5), top: h(y) - px(14), width: w(40), height: px(28), borderRadius: px(14), backgroundColor: s.surfaceAlt}} />
					))}
					<IconFlyIn variant={variant} targets={rows.map((y) => [tx, y])} items={rows.map((_, i) => tile(cyc(['plus', 'disc', 'diamond', 'triangle', 'ring'] as ShapeKind[], i), px(84), i))} />
				</AbsoluteFill>
			);
		}
		case 'dropBounce': {
			// a card; the element drops in through its top edge and settles at its centre
			const top = 44;
			return (
				<AbsoluteFill>
					<div style={{position: 'absolute', left: w(32), top: h(top), width: w(36), height: h(40), borderRadius: px(36), backgroundColor: s.surface, border: `${px(2)}px solid ${s.line}`}} />
					<IconFlyIn variant={variant} clipTop={top} targets={[[50, 54]]} items={[tile('plus', px(150))]} />
				</AbsoluteFill>
			);
		}
		case 'curvedStagger':
			return (
				<AbsoluteFill>
					<IconFlyIn variant={variant} items={[s.inkSoft, s.ink, s.muted].map((c, i) => disc(px(170), c, i))} />
				</AbsoluteFill>
			);
		case 'chainArc': {
			const ball = w(num(v, 'ball'));
			return (
				<AbsoluteFill>
					<div
						style={{
							position: 'absolute',
							left: w(num(v, 'toX')) - px(150),
							top: h(num(v, 'toY')) - px(55),
							width: px(300),
							height: px(110),
							borderRadius: px(20),
							backgroundColor: s.ink,
						}}
					/>
					<IconFlyIn variant={variant} items={[s.ink, s.inkSoft, s.muted, s.line, s.surfaceAlt].map((c, i) => disc(ball, c, i))} />
				</AbsoluteFill>
			);
		}
		default:
			return (
				<AbsoluteFill>
					<div
						style={{
							position: 'absolute',
							left: w(num(v, 'toX')) - px(260),
							top: h(num(v, 'toY')) - px(90),
							width: px(520),
							height: px(180),
							borderRadius: px(28),
							backgroundColor: s.surface,
							border: `${px(2)}px solid ${s.line}`,
						}}
					/>
					<IconFlyIn variant={variant} items={[tile('diamond', px(108))]} />
				</AbsoluteFill>
			);
	}
};
