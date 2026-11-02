import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {maybe, mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FONT, fontSize} from '../../tokens/type';
import type {DemoProps} from '../types';
import {FootageSlot} from '../footage/FootageSlot';
import {clamp01, normalCdf} from './space';
import {boxOf, deckSlot, diagonalStack, PoseLayer, type Pose, projectedWidth, screenStack} from './stacks';
import {spec} from './LayerStack.spec';

export type LayerStackProps = {
	/** the layers, back first (the last item is the front layer or the newest card) */
	items: React.ReactNode[];
	tone?: Tone;
	variant?: string;
};

const cos = (deg: number) => Math.cos((deg * Math.PI) / 180);

const Layers: React.FC<{poses: Pose[]; items: React.ReactNode[]}> = ({poses, items}) => (
	<>
		{poses.map((pose, i) => (
			<PoseLayer key={i} pose={pose}>
				{items[i]}
			</PoseLayer>
		))}
	</>
);

export const LayerStack: React.FC<LayerStackProps> = ({items, tone = 'light', variant}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {width, height, w, h} = useFrame();
	const n = items.length;
	const persp = maybe(v, 'perspective');
	const stage: React.CSSProperties = {perspective: persp === undefined ? undefined : w(persp)};

	if (name === 'explode' || name === 'collapse' || name === 'layerSink') {
		const dx = w(num(v, 'spreadX'));
		const dy = h(num(v, 'spreadY'));
		let yaw = num(v, 'yaw');
		let spread = 1;
		if (name === 'explode') {
			yaw = mix(p('turn'), 0, yaw);
			spread = p('spread');
		}
		if (name === 'collapse') {
			const q = p('refan');
			yaw = mix(q, mix(p('spread'), yaw, 0), num(v, 'refanYaw'));
			spread = 1 - p('spread') + q;
		}
		// the closed phone is taller than the exploded layers (explode only)
		const lh = h(mix(spread, maybe(v, 'layerHFrom') ?? num(v, 'layerH'), num(v, 'layerH')));
		const lw = lh * num(v, 'aspect');
		// the turn decides the side the layers fan to: right side receding -> the back layers go left
		const side = yaw < 0 ? -1 : 1;
		const right = maybe(v, 'frontRight');
		const frontX = (right === undefined ? width / 2 : w(right)) - (lw * Math.abs(cos(yaw))) / 2;
		let poses = diagonalStack({n, spread, yaw, frontX, frontY: height / 2 + dy / 2, dx: dx * side, dy, w: lw, h: lh});
		if (name === 'collapse') {
			// it closes about the middle of the stack: keep the stack's box centred
			const b = boxOf(poses);
			const sx = width / 2 - (b.left + b.right) / 2;
			const sy = height / 2 - (b.top + b.bottom) / 2;
			poses = poses.map((x) => ({...x, x: x.x + sx, y: x.y + sy}));
		}
		if (name === 'layerSink') {
			const y = p('y');
			poses = poses.map((x, i) => ({...x, y: x.y + (i === 1 ? h(num(v, 'sink')) * y : i === 0 ? h(num(v, 'sinkBehind')) * y : 0)}));
		}
		return (
			<AbsoluteFill style={stage}>
				<Layers poses={poses} items={items} />
			</AbsoluteFill>
		);
	}

	if (name === 'fanOut') {
		const lh = h(num(v, 'layerH'));
		const lw = lh * num(v, 'aspect');
		const yaw = num(v, 'yaw');
		const front = w(num(v, 'frontLeft'));
		const pw = lw * cos(yaw);
		const far = w(mix(p('x'), num(v, 'farFrom'), num(v, 'farTo')));
		const fullSpread = w(num(v, 'farTo')) - front - pw;
		const rise = h(num(v, 'rise')) * clamp01((far - front - pw) / fullSpread);
		const poses = screenStack({n, frontLeft: front, farRight: far, cy: h(num(v, 'centerY')), rise, w: lw, h: lh, yaw});
		const b = boxOf(poses);
		const final = num(v, 'haloFinal');
		const level = p('halo') / final + ((1 - 1 / final) / 2) * (p('haloStep1') + p('haloStep2'));
		// a blurred dark silhouette: outside its edge the darkening is plateau x Phi(-d / sigma); the two measured points
		// (haloDark at haloAt, haloTail at the reach, both at the final level) give sigma and the plateau
		const at = w(num(v, 'haloAt'));
		const reach = w(num(v, 'haloReach'));
		// Phi(-reach / sigma) / Phi(-at / sigma) grows with sigma: bisect for tail / dark
		const want = num(v, 'haloTail') / num(v, 'haloDark');
		let lo = at / 10;
		let hi = reach * 2;
		for (let i = 0; i < 60; i++) {
			const mid = (lo + hi) / 2;
			if (normalCdf(-reach / mid) / normalCdf(-at / mid) < want) lo = mid;
			else hi = mid;
		}
		const sigma = (lo + hi) / 2;
		const plateau = num(v, 'haloDark') / normalCdf(-at / sigma);
		return (
			<AbsoluteFill style={stage}>
				<div
					style={{
						position: 'absolute',
						left: b.left,
						top: b.top,
						width: b.right - b.left,
						height: b.bottom - b.top,
						backgroundColor: scheme(tone).ink,
						opacity: plateau * level,
						filter: `blur(${sigma}px)`,
					}}
				/>
				<Layers poses={poses} items={items} />
			</AbsoluteFill>
		);
	}

	// fold, slamOn: the card deck
	const left0 = w(num(v, 'frontLeft'));
	const cardW = w(num(v, 'frontRight')) - left0;
	const farScale = num(v, 'farScale');
	const card = (key: number, left: number, s: number, child: React.ReactNode) => (
		<div
			key={key}
			style={{
				position: 'absolute',
				left: left0,
				top: h(num(v, 'frontTop')),
				width: cardW,
				transformOrigin: '0% 50%',
				transform: `translateX(${left - left0}px) scale(${s})`,
			}}
		>
			{child}
		</div>
	);
	if (name === 'fold') {
		const q = p('fold');
		return (
			<AbsoluteFill>
				{items.map((child, i) => {
					const slot = deckSlot(n - 1 - i, n, left0, farScale);
					return card(i, mix(q, slot.left, left0), mix(q, slot.s, 1), child);
				})}
			</AbsoluteFill>
		);
	}
	const interval = num(v, 'interval');
	const present = Math.min(n, Math.floor(frame / interval) + 1);
	return (
		<AbsoluteFill>
			{items.slice(0, present).map((child, k) => {
				const d = present - 1 - k;
				const slot = deckSlot(d, n, left0, farScale);
				// the newest card: one picture oversized and further right, then in its slot
				const q = d === 0 ? p('land', k * interval) : 1;
				return card(k, slot.left + w(mix(q, num(v, 'slamShift'), 0)), slot.s * mix(q, num(v, 'slamScale'), 1), child);
			})}
		</AbsoluteFill>
	);
};

/** Isolated demo: plain panels (lines, a ring, numbers, a gray plate) as the layers, or a deck of simple cards. */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone = spec.demoTone;
	const s = scheme(tone);
	const {height, h} = useFrame();
	const ui = fontSize('ui', height);
	const bar = (wPct: number, color: string, key?: number) => (
		<div key={key} style={{width: `${wPct}%`, height: '3.2%', borderRadius: 99, backgroundColor: color}} />
	);
	const panel = (dark: boolean, content: React.ReactNode): React.ReactNode => (
		<div
			style={{
				width: '100%',
				height: '100%',
				borderRadius: h(1.6),
				backgroundColor: dark ? s.ink : s.surface,
				border: `1px solid ${s.line}`,
				padding: '9%',
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
				gap: '4%',
				overflow: 'hidden',
			}}
		>
			{content}
		</div>
	);
	const lines = (color: string) => [70, 45, 85, 60, 75, 40, 65].map((x, i) => bar(x, color, i));
	const ring = (
		<svg viewBox="0 0 100 100" style={{width: '55%', alignSelf: 'center'}}>
			<circle cx="50" cy="50" r="38" fill="none" stroke={s.surfaceAlt} strokeWidth="9" />
			<path d="M50 12 A38 38 0 1 1 14 62" fill="none" stroke={s.bg} strokeWidth="9" />
		</svg>
	);
	const plate = (
		<div style={{width: '100%', height: '100%', borderRadius: h(1.6), overflow: 'hidden', position: 'relative'}}>
			<FootageSlot tone={tone} />
		</div>
	);

	if (variant === 'fold' || variant === 'slamOn') {
		const cards = Array.from({length: 22}, (_, i) => (
			<div
				key={i}
				style={{
					height: h(86),
					borderRadius: h(2.4),
					backgroundColor: s.ink,
					padding: h(3.2),
					boxSizing: 'border-box',
					display: 'flex',
					flexDirection: 'column',
					gap: h(2),
				}}
			>
				<div style={{display: 'flex', alignItems: 'center', gap: h(1.6)}}>
					<div style={{width: h(6), height: h(6), borderRadius: h(1.2), backgroundColor: s.muted}} />
					<div style={{fontFamily: FONT.ui, fontWeight: 600, fontSize: ui, color: s.bg}}>note {i + 1}</div>
				</div>
				{bar(88, s.muted)}
				{bar(64, s.muted)}
				<div style={{flex: 1, borderRadius: h(1.6), overflow: 'hidden', position: 'relative'}}>
					<FootageSlot tone="dark" />
				</div>
			</div>
		));
		return <LayerStack variant={variant} tone={tone} items={cards} />;
	}
	if (variant === 'fanOut') {
		const screens = Array.from({length: 11}, (_, i) =>
			i === 10
				? plate
				: panel(
						i % 3 !== 1,
						<>
							<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: ui * 0.9, color: i % 3 !== 1 ? s.bg : s.ink}}>{`0${i + 1}`.slice(-2)}</div>
							{lines(i % 3 !== 1 ? s.inkSoft : s.surfaceAlt).slice(0, 4)}
						</>,
					),
		);
		return <LayerStack variant={variant} tone={tone} items={screens} />;
	}
	const layers = [
		panel(true, lines(s.inkSoft)),
		panel(
			true,
			<>
				{ring}
				<div style={{fontFamily: FONT.mono, fontSize: ui * 0.9, color: s.bg, alignSelf: 'center'}}>38.2</div>
				{lines(s.inkSoft).slice(0, 4)}
			</>,
		),
		panel(false, lines(s.surfaceAlt)),
		plate,
	];
	return <LayerStack variant={variant} tone={tone} items={layers} />;
};
