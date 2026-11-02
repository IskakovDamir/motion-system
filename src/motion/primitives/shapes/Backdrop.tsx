import type React from 'react';
import {Fragment, useId} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {mix, num, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Scheme, type Tone} from '../../tokens/colors';
import {FONT} from '../../tokens/type';
import {FootageSlot} from '../footage/FootageSlot';
import type {DemoProps} from '../types';
import {Blob, DotField, RadialMask} from './field';
import {clamp01, contrastGrey, cyc, greyOf, mod, nums, points, stepAt, withAlpha, type Pt} from './kit';
import {spec} from './Backdrop.spec';

export type Halftone = {
	/** dot pitch in px at 1080 */
	pitch: number;
	/** dot diameter in px at 1080 (ribbonRise measures its own) */
	dot: number;
	/** dot luma 0-1 */
	level: number;
};

export type BackdropProps = {
	/** drawn over the field (and under a knockout zone) */
	children?: React.ReactNode;
	/** drawn on top of everything: the text a knockout zone sits behind */
	over?: React.ReactNode;
	tone?: Tone;
	variant?: string;
	/** breathe, clear, blobFadeIn: blob radius in % of frame width (not measured) */
	blobSize?: number;
	/** breathe, clear, blobFadeIn: the dot grid's dot diameter (px at 1080) and luma levels from the field (not measured); none: no grid */
	dots?: {size: number; contrast: number};
	/** travellingGlow, cornerFadeUp, ribbonRise, beamGrow: the halftone dots (not measured) */
	halftone?: Halftone;
	/** ribbonRise, ribbonDrift: ribbon paths in px of a 1080-high frame */
	ribbons?: string[];
	/** ribbonRise, ribbonDrift: ribbon width in px at 1080 (not measured) */
	ribbonWidth?: number;
	/** diagonalSplit: the split's angle from vertical (deg) and where it crosses mid-height (% W), and the scheme
	 * roles left and right of it (default bgAlt / bg); not measured */
	split?: {angle: number; at: number; roles?: [keyof Scheme, keyof Scheme]};
	/** beamGrow: the beam's far end and the seam its wide end sits on (% of frame) */
	beam?: {from: Pt; to: Pt};
	/** clearZone, glowZone: the zone in % of frame (left, top, width, height) */
	zone?: {x: number; y: number; w: number; h: number};
	/** clearZone, glowZone: feather in px at 1080 (not measured) */
	feather?: number;
};

const need = <T,>(x: T | undefined, what: string): T => {
	if (x === undefined) throw new Error(`Backdrop: this variant needs the ${what} prop (not measured)`);
	return x;
};

const TAU = 2 * Math.PI;

export const Backdrop: React.FC<BackdropProps> = (props) => {
	const {children, over, tone = 'light', variant} = props;
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const t = useCurrentFrame();
	const {width, height, w, h, px} = useFrame();
	const uid = `bd${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	const s = scheme(tone);

	let field: React.ReactNode = null;
	let zone: React.ReactNode = null;

	const blobs = (opacityOf: (i: number) => number, depthOf: (i: number) => number, shift: (i: number) => Pt = () => [0, 0]) => {
		const r = w(need(props.blobSize, 'blobSize'));
		return points(v, 'blobs').map((b, i) => {
			const [dx, dy] = shift(i);
			return <Blob key={i} x={w(b[0] + dx)} y={h(b[1] + dy)} r={r} color={contrastGrey(s, depthOf(i))} opacity={opacityOf(i)} />;
		});
	};
	const grid = (opacity: number) =>
		props.dots ? <DotField pitch={w(num(v, 'pitch'))} dot={px(props.dots.size)} color={contrastGrey(s, props.dots.contrast)} opacity={opacity} /> : null;

	if (name === 'breathe') {
		const period = num(v, 'period');
		const depth = nums(v, 'depth');
		const darkest = nums(v, 'darkest');
		field = (
			<>
				{blobs(
					() => 1,
					(i) => cyc(depth, i) + num(v, 'swing') * Math.cos((TAU * (t - cyc(darkest, i))) / period),
					// only the top-left blob's wander was measured; its phase was not
					(i) => (i === 0 ? [num(v, 'wanderX') * Math.sin((TAU * t) / period), num(v, 'wanderY') * Math.cos((TAU * t) / period)] : [0, 0]),
				)}
				{grid(1)}
			</>
		);
	}

	if (name === 'clear') {
		const k = 1 - clamp01(p('fade'));
		const depth = nums(v, 'depth');
		field = (
			<>
				{blobs(() => k, (i) => cyc(depth, i))}
				{grid(k)}
			</>
		);
	}

	if (name === 'blobFadeIn') {
		const depth = nums(v, 'depth');
		field = (
			<>
				{blobs((i) => clamp01(p(i === 0 ? 'fade' : 'fade2')), (i) => cyc(depth, i))}
				{grid(1)}
			</>
		);
	}

	if (name === 'dotGridDrift' && t < num(v, 'off')) {
		const pitch = w(num(v, 'pitch'));
		const dx = -w(num(v, 'speed')) * Math.max(0, t);
		const color = contrastGrey(s, num(v, 'contrast'));
		const third = <rect x={0} y={0} width={width / 3} height={height} fill="white" />;
		const rest = <rect x={width / 3} y={0} width={width} height={height} fill="white" />;
		field = (
			<>
				<DotField pitch={pitch} dot={px(num(v, 'dot'))} color={color} dx={dx} opacity={stepAt(str(v, 'steps'), t - num(v, 'lag'), 0)} mask={third} />
				<DotField pitch={pitch} dot={px(num(v, 'dot'))} color={color} dx={dx} opacity={stepAt(str(v, 'steps'), t, 0)} mask={rest} />
			</>
		);
	}

	if (name === 'diagonalSplit') {
		const {angle, at, roles = ['bgAlt', 'bg']} = need(props.split, 'split');
		const k = Math.tan((angle * Math.PI) / 180);
		const xAt = (y: number) => w(at) + k * (y - height / 2);
		field = (
			<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
				<rect x={0} y={0} width={width} height={height} fill={s[roles[1]]} />
				<polygon points={`0,0 ${xAt(0)},0 ${xAt(height)},${height} 0,${height}`} fill={s[roles[0]]} />
			</svg>
		);
	}

	if (name === 'travellingGlow' || name === 'cornerFadeUp') {
		const ht = need(props.halftone, 'halftone');
		const reach = w(num(v, 'reach'));
		const corners = points(v, 'corners');
		const fade = name === 'cornerFadeUp' ? mix(clamp01(p('fade')), num(v, 'from'), 1) : 1;
		field = corners.map((c, i) => {
			const cx = w(c[0]);
			const cy = h(c[1]);
			const base = (
				<DotField
					key={`b${i}`}
					pitch={px(ht.pitch)}
					dot={px(ht.dot)}
					color={greyOf(s, ht.level)}
					opacity={fade}
					maskDefs={<RadialMask id={`${uid}r${i}`} x={cx} y={cy} r={reach} />}
					mask={<rect x={0} y={0} width={width} height={height} fill={`url(#${uid}r${i})`} />}
				/>
			);
			if (name === 'cornerFadeUp') return base;
			// one pulse per period around the patch's peak: it swells, travels inward, fades
			const period = num(v, 'period');
			const u = mod(t - cyc(nums(v, 'peaks'), i) + period / 2, period) - period / 2;
			const k = 0.5 + 0.5 * Math.cos((TAU * u) / period);
			const half = num(v, 'travel') / 2;
			const off = Math.max(-half, Math.min(half, u * num(v, 'speed')));
			const dir = c[0] < 50 ? 1 : -1;
			const gx = w(c[0] + dir * (half + off));
			return (
				<Fragment key={i}>
					{base}
					<DotField
						pitch={px(ht.pitch)}
						dot={px(ht.dot)}
						color={greyOf(s, Math.min(1, ht.level * cyc(nums(v, 'gains'), i)))}
						maskDefs={<RadialMask id={`${uid}g${i}`} x={gx} y={cy} r={reach} strength={k} />}
						mask={<rect x={0} y={0} width={width} height={height} fill={`url(#${uid}g${i})`} />}
					/>
				</Fragment>
			);
		});
	}

	if (name === 'ribbonRise') {
		const ht = need(props.halftone, 'halftone');
		const rw = need(props.ribbonWidth, 'ribbonWidth');
		const lift = h(num(v, 'rise')) * (1 - p('rise'));
		const grow = clamp01(p('grow'));
		const len = mix(grow, num(v, 'fromLength'), 1);
		field =
			t >= 0 ? (
				<DotField
					pitch={px(ht.pitch)}
					dot={px(num(v, 'dot'))}
					dy={lift}
					color={greyOf(s, ht.level * mix(grow, num(v, 'fromLevel'), 1))}
					mask={
						<g transform={`translate(0 ${lift}) scale(${height / 1080})`}>
							{need(props.ribbons, 'ribbons').map((d, i) => (
								<path key={i} d={d} pathLength={1} fill="none" stroke="white" strokeWidth={rw} strokeDasharray={len >= 1 ? undefined : `${len} 2`} />
							))}
						</g>
					}
				/>
			) : null;
	}

	if (name === 'ribbonDrift') {
		const rw = need(props.ribbonWidth, 'ribbonWidth');
		const speeds = nums(v, 'speeds');
		const color = greyOf(s, num(v, 'level'));
		field = (
			<svg viewBox={`0 0 ${(width * 1080) / height} 1080`} width={width} height={height} style={{position: 'absolute', inset: 0}}>
				<defs>
					<filter id={`${uid}soft`} x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur stdDeviation={rw / 2} />
					</filter>
				</defs>
				{need(props.ribbons, 'ribbons').map((d, i) => {
					// sweeping down through the frame and round again
					const y = mod(cyc(speeds, i) * t, 1080);
					return (
						<g key={i} filter={`url(#${uid}soft)`}>
							<path d={d} transform={`translate(0 ${y})`} fill="none" stroke={color} strokeWidth={rw} />
							<path d={d} transform={`translate(0 ${y - 1080})`} fill="none" stroke={color} strokeWidth={rw} />
						</g>
					);
				})}
			</svg>
		);
	}

	if (name === 'beamGrow') {
		const ht = need(props.halftone, 'halftone');
		const {from, to} = need(props.beam, 'beam');
		const lead = num(v, 'lead');
		const k = clamp01(p('grow'));
		const glintH = num(v, 'glintH');
		const hornH = num(v, 'hornH');
		const right = to[0];
		const left = mix(k, to[0] - num(v, 'glintW'), from[0]);
		const lh = mix(k, glintH, hornH) / 2;
		const rh = (t >= lead ? hornH : glintH) / 2;
		const mid = (left + right) / 2;
		const y = mix(0.5, from[1], to[1]);
		const shape = `${w(left)},${h(y - lh)} ${w(mid)},${h(y - glintH / 2)} ${w(right)},${h(y - rh)} ${w(right)},${h(y + rh)} ${w(mid)},${h(y + glintH / 2)} ${w(left)},${h(y + lh)}`;
		const grown = v.motions.grow?.duration ?? 0;
		// the beam's body shows the glint's level; its brightest dots (the horn's max) sit at the seam while it
		// grows, then swing along it as a cluster; the cluster's size (the waist) is an assumption
		const swingX = t < grown ? right : mid + (num(v, 'swing') / 2) * Math.sin((TAU * (t - grown)) / num(v, 'swingPeriod'));
		field =
			t >= 0 ? (
				<>
					<DotField
						pitch={px(ht.pitch)}
						dot={px(ht.dot)}
						color={greyOf(s, num(v, 'fromLevel'))}
						maskDefs={
							<filter id={`${uid}f`}>
								<feGaussianBlur stdDeviation={px(ht.pitch) / 2} />
							</filter>
						}
						mask={<polygon points={shape} fill="white" filter={`url(#${uid}f)`} />}
					/>
					<DotField
						pitch={px(ht.pitch)}
						dot={px(ht.dot)}
						color={greyOf(s, num(v, 'toLevel'))}
						maskDefs={
							<>
								<RadialMask id={`${uid}c`} x={w(swingX)} y={h(y)} r={h(glintH)} strength={k} />
								<clipPath id={`${uid}k`}>
									<polygon points={shape} />
								</clipPath>
							</>
						}
						mask={<rect x={0} y={0} width={width} height={height} fill={`url(#${uid}c)`} clipPath={`url(#${uid}k)`} />}
					/>
				</>
			) : null;
	}

	if (name === 'clearZone' || name === 'glowZone') {
		const z = need(props.zone, 'zone');
		const f = px(need(props.feather, 'feather'));
		const box: React.CSSProperties = {position: 'absolute', left: w(z.x), top: h(z.y), width: w(z.w), height: h(z.h)};
		if (name === 'clearZone') {
			zone = <div style={{...box, backgroundColor: s.bg, filter: `blur(${f}px)`}} />;
		} else {
			const edge = withAlpha(s.bg, num(v, 'edge'));
			const feather = `linear-gradient(to bottom, transparent, black ${f}px, black calc(100% - ${f}px), transparent)`;
			zone = (
				<div
					style={{
						...box,
						background: `linear-gradient(to right, ${edge}, ${s.bg} 50%, ${edge})`,
						maskImage: feather,
						WebkitMaskImage: feather,
					}}
				/>
			);
		}
	}

	return (
		<AbsoluteFill style={{backgroundColor: s.bg, overflow: 'hidden'}}>
			<AbsoluteFill>{field}</AbsoluteFill>
			{children ? <AbsoluteFill>{children}</AbsoluteFill> : null}
			{zone}
			{over ? <AbsoluteFill>{over}</AbsoluteFill> : null}
		</AbsoluteFill>
	);
};

// ---- Demo ----

const Word: React.FC<{text: string; size: number; color: string; x?: number; y?: number; weight?: number}> = ({text, size, color, x = 50, y = 50, weight = 600}) => (
	<div
		style={{
			position: 'absolute',
			left: `${x}%`,
			top: `${y}%`,
			transform: 'translate(-50%, -50%)',
			fontFamily: FONT.display,
			fontWeight: weight,
			fontSize: size,
			color,
			whiteSpace: 'nowrap',
		}}
	>
		{text}
	</div>
);

const Plate: React.FC<{x: number; y: number; wPct: number; hPct: number; tone: Tone}> = ({x, y, wPct, hPct, tone}) => {
	const {w, h, px} = useFrame();
	return (
		<div style={{position: 'absolute', left: w(x - wPct / 2), top: h(y - hPct / 2), width: w(wPct), height: h(hPct), borderRadius: px(26), overflow: 'hidden'}}>
			<FootageSlot tone={tone} />
		</div>
	);
};

/** A plain lattice of small marks and hairlines: the "network" a knockout zone sits on. */
const Lattice: React.FC<{tone: Tone}> = ({tone}) => {
	const {width, height, w, h, px} = useFrame();
	const s = scheme(tone);
	const marks: Pt[] = [];
	for (let r = 0; r < 7; r++) for (let c = 0; c < 13; c++) marks.push([4 + c * 7.6 + (r % 2) * 3.8, 8 + r * 14]);
	return (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
			{marks.map((m, i) => (
				<g key={i}>
					<line x1={w(m[0])} y1={h(m[1])} x2={w(m[0] + 7.6)} y2={h(m[1])} stroke={s.line} strokeWidth={px(2)} />
					<rect x={w(m[0]) - px(26)} y={h(m[1]) - px(26)} width={px(52)} height={px(52)} rx={px(12)} fill={i % 3 === 0 ? s.ink : s.inkSoft} />
				</g>
			))}
		</svg>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const {px} = useFrame();
	const light = scheme('light');
	const dark = scheme('dark');
	const ht: Halftone = {pitch: 13, dot: 5.5, level: 0.45};
	switch (variant) {
		case 'dotGridDrift':
			return (
				<Backdrop variant={variant}>
					<Plate x={50} y={50} wPct={34} hPct={50} tone="dark" />
				</Backdrop>
			);
		case 'diagonalSplit':
			return (
				<Backdrop
					variant={variant}
					split={{angle: -39, at: 22, roles: ['muted', 'line']}}
					over={<Word text="Two tones" size={px(120)} color={light.ink} x={64} />}
				/>
			);
		case 'travellingGlow':
		case 'cornerFadeUp':
			return (
				<Backdrop variant={variant} tone="dark" halftone={ht}>
					<Plate x={50} y={48} wPct={40} hPct={52} tone="dark" />
					<Word text="ninety" size={px(64)} color={dark.inkSoft} y={84} weight={800} />
				</Backdrop>
			);
		case 'ribbonRise':
		case 'ribbonDrift':
			return (
				<Backdrop
					variant={variant}
					tone="dark"
					halftone={ht}
					ribbonWidth={variant === 'ribbonRise' ? 70 : 40}
					ribbons={['M -60 1000 C 120 760 160 420 60 120', 'M 1980 1040 C 1780 800 1760 460 1880 160', 'M 300 1080 C 700 860 1200 860 1640 1080']}
				>
					<Plate x={50} y={46} wPct={44} hPct={50} tone="dark" />
				</Backdrop>
			);
		case 'beamGrow':
			return (
				<Backdrop variant={variant} tone="dark" halftone={ht} beam={{from: [42, 52], to: [58, 52]}}>
					<Plate x={28} y={52} wPct={28} hPct={56} tone="dark" />
					<Plate x={72} y={52} wPct={28} hPct={56} tone="dark" />
				</Backdrop>
			);
		case 'clearZone':
			return (
				<Backdrop variant={variant} zone={{x: 22, y: 38, w: 56, h: 24}} feather={40} over={<Word text="Quiet room" size={px(120)} color={light.ink} weight={500} />}>
					<Lattice tone="light" />
				</Backdrop>
			);
		case 'glowZone':
			return (
				<Backdrop variant={variant} zone={{x: 0, y: 40, w: 100, h: 20}} feather={60} over={<Word text="Over the lines" size={px(110)} color={light.ink} weight={500} />}>
					<Lattice tone="light" />
				</Backdrop>
			);
		default:
			// breathe, clear, blobFadeIn
			return (
				<Backdrop variant={variant} blobSize={24} dots={{size: 4, contrast: 24}} over={<Word text="Soft field" size={px(130)} color={light.ink} weight={800} />} />
			);
	}
};
