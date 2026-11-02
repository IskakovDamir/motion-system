import {ThreeCanvas} from '@remotion/three';
import type React from 'react';
import {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {maybe, mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FONT, fontSize} from '../../tokens/type';
import type {DemoProps, VariantSpec} from '../types';
import {FootageSlot} from '../footage/FootageSlot';
import {clamp01} from './space';
import {boxOf, diagonalStack, PoseLayer, type Pose, screenStack} from './stacks';
import {spec} from './Camera3D.spec';

export type Camera3DProps = {
	/** the scene: one full-frame plane (swingPush, orbitDrift, shrinkIntoStack's page is the last item), the stack's
	 * layers back first (orbitPush, dollyReframe, dollyParallax, pullWide, pushFlatten), or the floating items (tunnelDolly) */
	items: React.ReactNode[];
	tone?: Tone;
	variant?: string;
	/** tunnelDolly: where each item comes to hover, in % of the frame */
	spots?: {x: number; y: number}[];
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

/** The exploded v6 stack at scale 1, back layer first, and its box. */
const useV6Base = (v: VariantSpec, n: number) => {
	const {w, h} = useFrame();
	const lh = h(num(v, 'layerH'));
	const base = diagonalStack({
		n,
		spread: 1,
		yaw: num(v, 'yaw'),
		frontX: 0,
		frontY: 0,
		dx: w(num(v, 'spreadX')),
		dy: h(num(v, 'spreadY')),
		w: lh * num(v, 'aspect'),
		h: lh,
	});
	return {base, box: boxOf(base)};
};

const V6Camera: React.FC<{name: string; variant?: string; items: React.ReactNode[]}> = ({name, variant, items}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {width, height, w, h} = useFrame();
	const n = items.length;
	const {base, box} = useV6Base(v, n);
	const boxW = box.right - box.left;
	const bcx = (box.left + box.right) / 2;
	const bcy = (box.top + box.bottom) / 2;
	let poses: Pose[] = base;
	if (name === 'orbitPush') {
		const x = p('x');
		const s = w(mix(x, num(v, 'fromWidth'), num(v, 'toWidth'))) / boxW;
		const left = w(mix(x, num(v, 'fromLeft'), num(v, 'toLeft')));
		poses = base.map((b) => ({...b, x: left + s * (b.x - box.left), y: height / 2 + s * (b.y - bcy), s}));
	}
	if (name === 'dollyReframe') {
		const s = w(num(v, 'width')) / boxW;
		poses = base.map((b, i) => {
			// the second layer from the back leads; the front layer runs on after the others stop
			const q = i === 1 ? p('lead') : p('x');
			const left = w(mix(q, num(v, 'fromLeft'), num(v, 'toLeft')));
			const top = h(num(v, 'fromTop') - num(v, 'rise') * q);
			const run = i === n - 1 ? w(num(v, 'settleX')) * p('settle') : 0;
			return {...b, x: left + s * (b.x - box.left) + run, y: top + s * (b.y - box.top), s};
		});
	}
	if (name === 'dollyParallax') {
		const q = p('x');
		const s0 = w(num(v, 'width')) / boxW;
		const left = w(num(v, 'fromLeft'));
		const top = h(num(v, 'fromTop'));
		poses = base.map((b, i) => {
			const [dx, dy, k] =
				i === 0
					? [num(v, 'backDX'), num(v, 'backDY'), num(v, 'backScale')]
					: i === 1
						? [num(v, 'midDX'), num(v, 'midDY'), num(v, 'midScale')]
						: [num(v, 'nearDX'), num(v, 'midDY'), num(v, 'midScale')];
			const sunk = i === 0 ? h(num(v, 'backSunk')) : 0;
			return {...b, x: left + s0 * (b.x - box.left) + w(dx) * q, y: top + s0 * (b.y - box.top) + sunk + h(dy) * q, s: s0 * mix(q, 1, k)};
		});
	}
	if (name === 'pullWide') {
		const q = p('scale');
		const s0 = w(num(v, 'fromWidth')) / boxW;
		const m = mix(q, 1, num(v, 'layerScale'));
		const pw = boxW - (Math.max(...base.map((b) => b.x)) - Math.min(...base.map((b) => b.x)));
		const span = boxW - pw;
		// layers shrink by m; their centres spread by k so the extent follows the measured width
		const k = (w(mix(q, num(v, 'fromWidth'), num(v, 'toWidth'))) / s0 - m * pw) / span;
		const lowest = Math.max(...base.map((b) => k * (b.y - bcy) + (m * b.h) / 2));
		const y0 = h(mix(q, num(v, 'fromBottom'), num(v, 'toBottom'))) - s0 * lowest;
		poses = base.map((b) => ({...b, x: width / 2 + s0 * k * (b.x - bcx), y: y0 + s0 * k * (b.y - bcy), s: s0 * m}));
	}
	return (
		<AbsoluteFill style={{perspective: w(num(v, 'perspective'))}}>
			<Layers poses={poses} items={items} />
		</AbsoluteFill>
	);
};

const PushFlatten: React.FC<{variant?: string; items: React.ReactNode[]}> = ({variant, items}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {w, h} = useFrame();
	const x = p('x');
	const q = p('swing');
	const yaw = mix(x, num(v, 'yaw'), 0);
	const h0 = h(num(v, 'fromHeight'));
	const lh = h(mix(x, num(v, 'fromHeight'), num(v, 'toHeight')));
	const lw = lh * num(v, 'aspect');
	const left = w(mix(x, num(v, 'fromLeft'), num(v, 'toLeft')));
	const cy = h(num(v, 'centerY'));
	// the far end at the start (after its swing), as offsets from the front layer, carried by the push and closing up
	const pw0 = h0 * num(v, 'aspect') * cos(num(v, 'yaw'));
	const reach0 = w(mix(q, num(v, 'farFrom'), num(v, 'farSwing'))) - w(num(v, 'fromLeft')) - pw0;
	const rise0 = cy - (h(mix(q, num(v, 'farTopFrom'), num(v, 'farTopSwing'))) + h0 / 2);
	// the spread keeps its screen size while the front card grows, then closes behind it
	const close = clamp01((num(v, 'aloneAt') - x) / (num(v, 'aloneAt') - num(v, 'spreadHold')));
	const pw = lw * cos(yaw);
	const poses = screenStack({n: items.length, frontLeft: left, farRight: left + pw + reach0 * close, cy, rise: rise0 * close, w: lw, h: lh, yaw});
	return (
		<AbsoluteFill style={{perspective: w(num(v, 'perspective'))}}>
			<Layers poses={poses} items={items} />
		</AbsoluteFill>
	);
};

const ShrinkIntoStack: React.FC<{variant?: string; items: React.ReactNode[]}> = ({variant, items}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {width, height, w, h, px} = useFrame();
	const i = p('inset');
	const s = mix(p('scale'), 1, num(v, 'toScale'));
	const cy = h(num(v, 'centerY'));
	const clip = `inset(${h(num(v, 'insetTop'))}px ${w(num(v, 'inset') * i)}px ${h(num(v, 'insetBottom') * i)}px ${w(num(v, 'inset') * i)}px round ${px(num(v, 'radius'))}px)`;
	return (
		<AbsoluteFill style={{perspective: w(num(v, 'perspective')), perspectiveOrigin: `${width / 2}px ${cy}px`}}>
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: cy - height / 2,
					width,
					height,
					clipPath: clip,
					transformOrigin: '50% 50%',
					transform: `scale3d(${s}, ${s}, ${s}) rotateY(${num(v, 'yaw') * p('yaw')}deg)`,
				}}
			>
				{items[items.length - 1]}
			</div>
		</AbsoluteFill>
	);
};

const TunnelWalls: React.FC<{offset: number; spacing: number; tone: Tone}> = ({offset, spacing, tone}) => {
	const {width, height} = useFrame();
	const s = scheme(tone);
	// a corridor whose cross-section fills the frame at depth 1: the picture is the same for any field of view
	const fov = 90;
	const b = Math.tan(((fov / 2) * Math.PI) / 180);
	const a = (b * width) / height;
	const shades = [s.surface, s.bgAlt, s.surfaceAlt, s.surface, s.line, s.bgAlt];
	// draw distance: panels beyond depth 40 are under 2.5 % of the frame, a point at the vanishing point
	const count = Math.ceil(40 / spacing);
	const shift = offset % spacing;
	const turns = Math.floor(offset / spacing);
	const corners = useMemo(() => {
		const g = new THREE.BufferGeometry();
		const far = 1 + count * spacing;
		const pts = [-1, 1].flatMap((sx) => [-1, 1].flatMap((sy) => [sx * a, sy * b, -0.5, sx * a, sy * b, -far]));
		g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
		return g;
	}, [a, b, count, spacing]);
	const walls: React.ReactNode[] = [];
	for (let k = 0; k < count; k++) {
		const z0 = 1 - spacing + k * spacing - shift;
		const z1 = z0 + spacing;
		if (z1 <= 0) continue;
		const zc = -(Math.max(z0, 0.01) + z1) / 2;
		const len = z1 - Math.max(z0, 0.01);
		const id = k + turns;
		const shade = (side: number) => shades[(id * 7 + side * 3) % shades.length] ?? s.surface;
		walls.push(
			<mesh key={`l${k}`} position={[-a, 0, zc]} rotation={[0, Math.PI / 2, 0]}>
				<planeGeometry args={[len, 2 * b]} />
				<meshBasicMaterial color={shade(0)} side={THREE.DoubleSide} />
			</mesh>,
			<mesh key={`r${k}`} position={[a, 0, zc]} rotation={[0, -Math.PI / 2, 0]}>
				<planeGeometry args={[len, 2 * b]} />
				<meshBasicMaterial color={shade(1)} side={THREE.DoubleSide} />
			</mesh>,
			<mesh key={`t${k}`} position={[0, b, zc]} rotation={[Math.PI / 2, 0, 0]}>
				<planeGeometry args={[2 * a, len]} />
				<meshBasicMaterial color={shade(2)} side={THREE.DoubleSide} />
			</mesh>,
			<mesh key={`b${k}`} position={[0, -b, zc]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[2 * a, len]} />
				<meshBasicMaterial color={shade(3)} side={THREE.DoubleSide} />
			</mesh>,
		);
	}
	return (
		<ThreeCanvas width={width} height={height} dpr={1} camera={{fov, near: 0.01, far: 1000, position: [0, 0, 0]}} gl={{antialias: true}}>
			<color attach="background" args={[s.bg]} />
			{walls}
			<lineSegments geometry={corners}>
				<lineBasicMaterial color={s.ink} />
			</lineSegments>
		</ThreeCanvas>
	);
};

const Tunnel: React.FC<{variant?: string; items: React.ReactNode[]; tone: Tone; spots?: {x: number; y: number}[]}> = ({variant, items, tone, spots}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, h} = useFrame();
	// flow at the frame edge (depth 1) is 50 % W x speed: speed in depth units per frame; a panel every panelEvery frames
	const speed = num(v, 'edgeFlow') / 50;
	const k = mix(p('scale'), num(v, 'fromScale'), num(v, 'toScale'));
	const rel = k / num(v, 'toScale');
	const vp = {x: num(v, 'vpX'), y: num(v, 'vpY')};
	return (
		<AbsoluteFill>
			<TunnelWalls offset={speed * frame} spacing={speed * num(v, 'panelEvery')} tone={tone} />
			{items.map((item, i) => {
				const spot = spots?.[i] ?? {x: vp.x, y: vp.y};
				const size = w(num(v, 'itemSize'));
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: w(vp.x + (spot.x - vp.x) * rel) - size / 2,
							top: h(vp.y + (spot.y - vp.y) * rel) - size / 2,
							width: size,
							height: size,
							transform: `scale(${k})`,
						}}
					>
						{item}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

export const Camera3D: React.FC<Camera3DProps> = ({items, tone = 'light', variant, spots}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {w, h} = useFrame();
	if (name === 'orbitPush' || name === 'dollyReframe' || name === 'dollyParallax' || name === 'pullWide') {
		return <V6Camera name={name} variant={variant} items={items} />;
	}
	if (name === 'pushFlatten') return <PushFlatten variant={variant} items={items} />;
	if (name === 'shrinkIntoStack') return <ShrinkIntoStack variant={variant} items={items} />;
	if (name === 'tunnelDolly') return <Tunnel variant={variant} items={items} tone={tone} spots={spots} />;
	if (name === 'orbitDrift') {
		const q = p('drift');
		return (
			<AbsoluteFill
				style={{transform: `translate(${w(num(v, 'driftX') * q)}px, ${h(num(v, 'driftY') * q)}px) rotate(${mix(q, num(v, 'fromTilt'), num(v, 'toTilt'))}deg)`}}
			>
				{items[0]}
			</AbsoluteFill>
		);
	}
	// swingPush: the focus point keeps its place on the plane while the camera scales about it and carries it across
	const fx = w(num(v, 'fromX'));
	const fy = h(num(v, 'fromY'));
	const s = mix(p('scale'), 1, num(v, 'toScale'));
	const tx = w(mix(p('settle'), mix(p('swing'), num(v, 'fromX'), num(v, 'swingX')), num(v, 'toX'))) - fx;
	const ty = h(mix(p('settle'), mix(p('swing'), num(v, 'fromY'), num(v, 'swingY')), num(v, 'toY'))) - fy;
	return (
		<AbsoluteFill style={{transformOrigin: `${fx}px ${fy}px`, transform: `translate(${tx}px, ${ty}px) scale(${s})`}}>{items[0]}</AbsoluteFill>
	);
};

/** Isolated demo: plain panels, a gray plate, short words and simple shapes as the scene. */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone = spec.demoTone;
	const s = scheme(tone);
	const {height, w, h} = useFrame();
	const v = variantOf(spec, variant);
	const ui = fontSize('ui', height);
	const bar = (pct: number, color: string, key?: number) => <div key={key} style={{width: `${pct}%`, height: '3.2%', borderRadius: 99, backgroundColor: color}} />;
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
	const plate = (
		<div style={{width: '100%', height: '100%', borderRadius: h(1.6), overflow: 'hidden', position: 'relative'}}>
			<FootageSlot tone={tone} />
		</div>
	);
	const ring = (
		<svg viewBox="0 0 100 100" style={{width: '55%', alignSelf: 'center'}}>
			<circle cx="50" cy="50" r="38" fill="none" stroke={s.inkSoft} strokeWidth="9" />
			<path d="M50 12 A38 38 0 1 1 14 62" fill="none" stroke={s.bg} strokeWidth="9" />
		</svg>
	);
	const v6Layers = [
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
	if (variant === 'orbitPush' || variant === 'dollyReframe' || variant === 'dollyParallax' || variant === 'pullWide') {
		return <Camera3D variant={variant} tone={tone} items={v6Layers} />;
	}
	if (variant === 'pushFlatten' || variant === 'shrinkIntoStack') {
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
		return <Camera3D variant={variant} tone={tone} items={screens} />;
	}
	if (variant === 'tunnelDolly') {
		const shapes = [
			<circle key="c" cx="50" cy="50" r="42" fill={s.inkSoft} />,
			<rect key="r" x="10" y="10" width="80" height="80" rx="18" fill={s.surfaceAlt} stroke={s.line} strokeWidth="3" />,
			<path key="t" d="M50 8 L94 86 L6 86 Z" fill={s.ink} strokeLinejoin="round" />,
			<path key="p" d="M50 6 L61 39 L95 39 L67 59 L78 92 L50 72 L22 92 L33 59 L5 39 L39 39 Z" fill={s.muted} />,
			<rect key="d" x="18" y="18" width="64" height="64" rx="8" transform="rotate(45 50 50)" fill={s.accent} />,
			<circle key="o" cx="50" cy="50" r="38" fill="none" stroke={s.ink} strokeWidth="14" />,
		];
		const items = shapes.map((shape, i) => (
			<svg key={i} viewBox="0 0 100 100" width="100%" height="100%">
				{shape}
			</svg>
		));
		// the measured item ends at (78.0, 44.1) %; the others hover on a ring around the frame centre
		const spots = [
			{x: 78.0, y: 44.1},
			{x: 66, y: 74},
			{x: 34, y: 72},
			{x: 22, y: 42},
			{x: 38, y: 20},
			{x: 62, y: 18},
		];
		return <Camera3D variant={variant} tone={tone} items={items} spots={spots} />;
	}
	if (variant === 'orbitDrift') {
		// a close-up of a light slab: a ring mark and one word, larger than the frame
		const slab = (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div
					style={{
						width: w(120),
						height: h(150),
						borderRadius: h(6),
						backgroundColor: s.surfaceAlt,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: h(6),
					}}
				>
					<svg width={h(30)} height={h(30)} viewBox="0 0 100 100">
						<circle cx="50" cy="50" r="38" fill="none" stroke={s.ink} strokeWidth="14" />
					</svg>
					<div style={{fontFamily: FONT.wide, fontWeight: 800, fontStretch: '125%', fontSize: fontSize('headline', height) * 1.4, letterSpacing: '0.3em', color: s.ink}}>
						LEVEL
					</div>
				</div>
			</AbsoluteFill>
		);
		return <Camera3D variant={variant} tone={tone} items={[slab]} />;
	}
	// one full-frame plane: a card with a title, chips and a button-like bar
	const plane = (
		<AbsoluteFill style={{backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center'}}>
			<div style={{position: 'absolute', left: w(22), top: h(18), width: w(56), display: 'flex', flexDirection: 'column', gap: h(4), alignItems: 'center'}}>
				<div style={{fontFamily: FONT.wide, fontWeight: 900, fontStretch: '125%', fontSize: fontSize('display', height) * 0.7, color: s.ink, textTransform: 'uppercase'}}>
					start here
				</div>
				<div style={{width: '100%', height: h(7), borderRadius: h(3.5), backgroundColor: s.surface, border: `1px solid ${s.line}`}} />
				<div style={{display: 'flex', gap: w(1.2)}}>
					{['16:9', '720p', '15 s', '1x'].map((t) => (
						<div key={t} style={{fontFamily: FONT.ui, fontSize: ui * 0.8, color: s.inkSoft, padding: `${h(0.8)}px ${w(1.2)}px`, borderRadius: 99, backgroundColor: s.surfaceAlt}}>
							{t}
						</div>
					))}
				</div>
			</div>
			{/* the focus: sits where the measured focus starts */}
			<div
				style={{
					position: 'absolute',
					left: w(maybe(v, 'fromX') ?? 50) - w(10),
					top: h(maybe(v, 'fromY') ?? 50) - h(3),
					width: w(20),
					height: h(6),
					borderRadius: h(1.4),
					backgroundColor: s.surface,
					border: `${h(0.3)}px solid ${s.line}`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: FONT.wide,
					fontWeight: 800,
					fontStretch: '125%',
					fontSize: ui * 1.2,
					color: s.ink,
				}}
			>
				GO
			</div>
		</AbsoluteFill>
	);
	return <Camera3D variant={variant} tone={tone} items={[plane]} />;
};
