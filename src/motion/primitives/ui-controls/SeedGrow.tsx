import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DirectionalBlur} from '../../engine/blur';
import {flag, maybe, mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FootageSlot} from '../footage/FootageSlot';
import type {DemoProps, VariantSpec} from '../types';
import {Bar, Chevron, Glyph, smear, Text, typedCount, useRate} from './kit';
import {spec} from './SeedGrow.spec';

export type SeedGrowProps = {
	/** what the box holds (centred and clipped), the element that stretches, or the callout's pill */
	children?: React.ReactNode;
	/** a label typed (or un-typed) inside the box at the variant's cadence */
	label?: string;
	/** renders the typed label (default: the plain string) */
	renderLabel?: (shown: string) => React.ReactNode;
	tone?: Tone;
	variant?: string;
	/** placement in % of the frame: the box centre, or its fixed left edge (anchor left / leftShare); the callout's dot */
	x?: number;
	y?: number;
	/** fill, border and radius of the box the component draws (pill: radius follows the height) */
	boxStyle?: React.CSSProperties;
	pill?: boolean;
	/** a node fixed at the box's left end (the icon a pill grows out of) */
	lead?: React.ReactNode;
};

type Geo = {w: number; h: number; left: number; top: number};

/** Box size (% W, % H) at the current frame, from the variant's width / height motions. */
const boxSize = (v: VariantSpec, p: (prop: string, off?: number) => number): {w: number; h: number} => {
	const m = v.motions;
	const restW = num(v, 'restW');
	let w = mix(p('width'), maybe(v, 'fromW') ?? 0, restW);
	if (m.widen) w += p('widen') * (num(v, 'widenW') - restW);
	let h = maybe(v, 'restH') ?? 0;
	if (m.height) h = mix(p('height'), 0, num(v, 'restH'));
	if (m.content && maybe(v, 'midH') !== undefined) {
		// the box height follows the content scale-down, then grows for a second line
		const top = m.height ? h : num(v, 'fromH');
		h = mix(p('content'), top, num(v, 'midH'));
		if (m.grow) h += p('grow') * ((maybe(v, 'growH') ?? num(v, 'restH')) - num(v, 'midH'));
	}
	return {w, h};
};

// One component, three ways of growing, chosen by the variant: a box it draws itself (width and
// height eased separately, content centred and clipped, a typed label, corner handles), an element
// stretched in x at its rest size (stretch), or a callout chain (dot, leader line, pill).
export const SeedGrow: React.FC<SeedGrowProps> = ({children, label, renderLabel, tone = 'light', variant, x, y, boxStyle, pill, lead}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const rate = useRate(spec, variant);
	const frame = useCurrentFrame();
	const {w: pw, h: ph, width, height} = useFrame();
	const s = scheme(tone);
	const m = v.motions;
	const shutter = maybe(v, 'shutter');
	const at = {x: x ?? maybe(v, 'x') ?? 50, y: y ?? maybe(v, 'y') ?? 50};

	if (maybe(v, 'dot') !== undefined) {
		// callout chain: dot at (x, y), leader line down from it, pill hung by its top centre at the line end
		const dot = ph(num(v, 'dot'));
		const full = ph(num(v, 'line'));
		const outro = m.swell !== undefined;
		const dotS = outro ? 1 - p('dot') : p('dot');
		const len = full * (outro ? 1 - p('line') : p('line'));
		const pillW = pw(num(v, 'pillW'));
		let sx: number;
		let sy: number;
		let dy = 0;
		let blur = 0;
		if (outro) {
			const base = mix(p('swell'), 1, num(v, 'swell'));
			sx = base * (1 - p('scale'));
			sy = Math.min(sx, base * (1 - p('squash')));
			blur = smear(shutter ?? 0, rate('scale') * base * pillW * 0.5);
		} else {
			sx = p('scale');
			sy = sx;
			dy = ph(num(v, 'rise')) * (1 - p('scale'));
			blur = smear(shutter ?? 0, rate('scale') * pillW * 0.25);
		}
		const dotX = pw(at.x);
		const dotY = ph(at.y);
		return (
			<AbsoluteFill>
				<div
					style={{
						position: 'absolute',
						left: dotX - 1.5,
						top: dotY,
						width: 3,
						height: Math.max(0, len),
						backgroundColor: s.muted,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						left: dotX - dot / 2,
						top: dotY - dot / 2,
						width: dot,
						height: dot,
						borderRadius: dot / 2,
						backgroundColor: s.surface,
						border: `2px solid ${s.muted}`,
						boxSizing: 'border-box',
						transform: `scale(${Math.max(0, dotS)})`,
						opacity: outro ? Math.max(0, dotS) : 1,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						left: dotX,
						top: dotY + full + dy,
						transform: `translateX(-50%) scale(${Math.max(0, sx)}, ${Math.max(0, sy)})`,
						transformOrigin: outro ? '50% 0%' : '50% 50%',
						opacity: sx > 0.002 ? 1 : 0,
					}}
				>
					<DirectionalBlur x={blur} y={blur * (ph(num(v, 'pillH')) / pillW)}>
						{children}
					</DirectionalBlur>
				</div>
			</AbsoluteFill>
		);
	}

	const {w, h} = boxSize(v, p);
	const left = v.params?.anchor === 'left';
	const share = maybe(v, 'leftShare');
	const restW = num(v, 'restW');
	const fullW = Math.max(maybe(v, 'fromW') ?? 0, restW);
	// width change per frame (px) -> mean speed of the box's points along x
	let dw = rate('width') * pw(restW - (maybe(v, 'fromW') ?? 0));
	if (m.widen) dw += rate('widen') * pw(num(v, 'widenW') - restW);
	const blur = shutter === undefined ? 0 : smear(shutter, dw * (left ? 0.5 : 0.25));
	const opacity = m.opacity ? mix(p('opacity'), maybe(v, 'fromOpacity') ?? 0, 1) : m.fade ? 1 - p('fade') : 1;

	if (flag(v, 'stretch')) {
		// the element keeps its rest layout and is stretched in x about its centre or its left edge
		const sx = w / restW;
		return (
			<div
				style={{
					position: 'absolute',
					left: left ? pw(at.x) : pw(at.x - restW / 2),
					top: ph(at.y),
					width: pw(restW),
					transform: `translateY(-50%) scaleX(${Math.max(0, sx)})`,
					transformOrigin: left ? '0% 50%' : '50% 50%',
					opacity,
				}}
			>
				<DirectionalBlur x={blur}>{children}</DirectionalBlur>
			</div>
		);
	}

	// the box the component draws: px size, placement by anchor
	let wpx = pw(w);
	let hpx = ph(h);
	// dot -> circle about its own centre (the height motion), then the capsule stretches from that circle
	const born = m.height !== undefined && maybe(v, 'typeAt') !== undefined;
	if (born) {
		const d = hpx;
		wpx = mix(p('width'), d, pw(restW));
		if (frame < (m.width?.delay ?? 0)) wpx = d;
	} else if (flag(v, 'seedRound')) {
		hpx = Math.min(hpx, wpx);
	}
	const g: Geo = {
		w: wpx,
		h: hpx,
		left: left ? pw(at.x) + (born ? Math.max(0, (ph(num(v, 'restH')) - hpx) / 2) : 0) : share !== undefined ? pw(at.x + share * (fullW - w)) : pw(at.x) - wpx / 2,
		top: ph(at.y) - hpx / 2,
	};
	const contentScale = m.content ? mix(p('content'), 1, num(v, 'contentScale')) : 1;
	let shown: string | undefined;
	if (label !== undefined) {
		const fpc = num(v, 'framesPerChar');
		const untype = maybe(v, 'untypeAt');
		const n = Array.from(label).length;
		const count = untype !== undefined ? n - typedCount(frame - untype, fpc, n) : typedCount(frame - (maybe(v, 'typeAt') ?? 0), fpc, n);
		shown = Array.from(label).slice(0, count).join('');
	}
	// the fill smears by the speed of its moving edges (v7 / v8 shutter); the content stays sharp on top
	const edge = shutter === undefined ? 0 : smear(shutter, dw * (left ? 1 : 0.5));
	const dh = m.height ? rate('height') * ph(maybe(v, 'restH') ?? 0) : 0;
	const edgeY = shutter === undefined ? 0 : smear(shutter, dh * 0.5);
	const frameStyle: React.CSSProperties = {
		position: 'absolute',
		left: g.left,
		top: g.top,
		width: Math.max(0, g.w),
		height: Math.max(0, g.h),
		borderRadius: pill ? g.h / 2 : undefined,
		boxSizing: 'border-box',
	};
	return (
		<AbsoluteFill style={{opacity}}>
			<DirectionalBlur x={edge} y={edgeY} style={{position: 'absolute', inset: 0}}>
				<div style={{...frameStyle, ...boxStyle}} />
			</DirectionalBlur>
			<div
				style={{
					...frameStyle,
					overflow: 'hidden',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					...boxStyle,
					backgroundColor: 'transparent',
					border: 'none',
				}}
			>
				<div style={{transform: `scale(${contentScale})`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
					{shown !== undefined ? (renderLabel ? renderLabel(shown) : shown) : children}
				</div>
			</div>
			{lead ? <div style={{position: 'absolute', left: g.left, top: g.top + g.h / 2, transform: 'translate(-50%, -50%)'}}>{lead}</div> : null}
			{m.handlesIn ? <Handles v={v} p={p} g={g} tone={tone} frame={frame} width={width} height={height} follow={edge} /> : null}
		</AbsoluteFill>
	);
};

/** Selection handles: squares just outside the top-left and bottom-right corners, flying out, following, shrinking out. */
const Handles: React.FC<{v: VariantSpec; p: (prop: string) => number; g: Geo; tone: Tone; frame: number; width: number; height: number; follow: number}> = ({
	v,
	p,
	g,
	tone,
	frame,
	width,
	height,
	follow,
}) => {
	const s = scheme(tone);
	const start = v.motions.handlesIn?.delay ?? 0;
	if (frame < start) return null;
	const size = (mix(p('content'), num(v, 'handle'), num(v, 'handleRest')) / 100) * width;
	const fly = p('handlesIn');
	const off = (size / 2) * fly;
	// the measured diagonal streak (px at 1080), shortening as the squares land; while they follow the
	// widen they smear like the box edge they sit on (follow)
	const streak = ((num(v, 'handleSmear') * height) / 1080) * (1 - fly);
	const blur = streak / Math.SQRT2 / Math.sqrt(12);
	const square = (cx: number, cy: number, k: number, key: string) => (
		<div
			key={key}
			style={{
				position: 'absolute',
				left: cx - size / 2,
				top: cy - size / 2,
				width: size,
				height: size,
				transform: `scale(${Math.max(0, k)})`,
			}}
		>
			<DirectionalBlur x={Math.hypot(blur, follow)} y={blur}>
				<div style={{width: size, height: size, backgroundColor: s.surfaceAlt}} />
			</DirectionalBlur>
		</div>
	);
	return (
		<>
			{square(g.left - off, g.top - off, 1 - p('outA'), 'tl')}
			{square(g.left + g.w + off, g.top + g.h + off, 1 - p('outB'), 'br')}
		</>
	);
};

// ---- isolated demo ----

const H = 1080;

const LabelLines: React.FC<{tone: Tone; grow?: number}> = ({tone, grow}) => {
	const s = scheme(tone);
	return (
		<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
			<Text role="display" height={H} cap={8.3} weight={700} color={s.onAccent}>
				Notes today
			</Text>
			{grow !== undefined ? (
				<div style={{height: 0.13 * H * grow, opacity: grow, overflow: 'hidden'}}>
					<Text role="display" height={H} cap={6.0 / 0.723} weight={700} color={s.onAccent}>
						and more
					</Text>
				</div>
			) : null}
		</div>
	);
};

const ResultRow: React.FC<{tone: Tone}> = ({tone}) => {
	const s = scheme(tone);
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 40, width: '100%', boxSizing: 'border-box'}}>
			<Glyph size={150} tile={s.surfaceAlt} mark={s.inkSoft} kind="square" />
			<div style={{display: 'flex', flexDirection: 'column', gap: 10, flex: 1}}>
				<Text role="headline" height={H} cap={3.8} weight={500} color={s.ink}>
					Shapes
				</Text>
				<Text role="headline" height={H} cap={3.0} color={s.muted}>
					Draw a few simple forms in one go
				</Text>
			</div>
			<div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '28px 44px', borderRadius: 60, backgroundColor: s.accent}}>
				<Text role="ui" height={H} cap={3.2} weight={500} color={s.onAccent}>
					Open it
				</Text>
				<Chevron size={44} color={s.onAccent} dir="right" />
			</div>
		</div>
	);
};

const Attachment: React.FC<{tone: Tone}> = ({tone}) => {
	const s = scheme(tone);
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 44, padding: 30, width: '100%', boxSizing: 'border-box', borderRadius: 36, backgroundColor: s.surface, border: `2px solid ${s.line}`}}>
			<div style={{width: 230, height: 160, borderRadius: 20, overflow: 'hidden', position: 'relative', flexShrink: 0}}>
				<FootageSlot tone={tone} />
			</div>
			<div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
				<Text role="headline" height={H} cap={2.72} weight={500} color={s.ink}>
					Plan for spring
				</Text>
				<Text role="headline" height={H} cap={2.0} color={s.muted}>
					sheet
				</Text>
			</div>
		</div>
	);
};

const Callout: React.FC<{tone: Tone; v: VariantSpec; word: string}> = ({tone, v, word}) => {
	const s = scheme(tone);
	const {w, h} = useFrame();
	const ph = h(num(v, 'pillH'));
	return (
		<div
			style={{
				width: w(num(v, 'pillW')),
				height: ph,
				borderRadius: ph / 2,
				backgroundColor: s.surface,
				border: `2px solid ${s.line}`,
				display: 'flex',
				alignItems: 'center',
				gap: ph * 0.25,
				padding: `0 ${ph * 0.3}px`,
				boxSizing: 'border-box',
			}}
		>
			<div style={{width: ph * 0.6, height: ph * 0.6, borderRadius: ph * 0.3, backgroundColor: s.inkSoft, flexShrink: 0}} />
			<Text role="ui" height={H} cap={1.96} weight={500} color={s.inkSoft}>
				{word}
			</Text>
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, name);
	const p = useProgress(spec, name);
	const bg: React.CSSProperties = {backgroundColor: s.bg};
	const dark: React.CSSProperties = {backgroundColor: s.accent};

	if (name === 'seedPop') {
		return (
			<AbsoluteFill style={bg}>
				<SeedGrow variant={name} boxStyle={dark}>
					<Text role="display" height={H} cap={8.3} weight={700} color={s.onAccent}>
						Notes
					</Text>
				</SeedGrow>
			</AbsoluteFill>
		);
	}
	if (name === 'widenOvershoot' || name === 'cornerFollow') {
		return (
			<AbsoluteFill style={bg}>
				<SeedGrow variant={name} boxStyle={dark}>
					<LabelLines tone={tone} grow={p('grow')} />
				</SeedGrow>
			</AbsoluteFill>
		);
	}
	if (name === 'speckStretch') {
		return (
			<AbsoluteFill style={bg}>
				<div style={{position: 'absolute', left: '14.9%', top: '18%'}}>
					<Text role="headline" height={H} cap={4.8} color={s.ink}>
						Tools
					</Text>
				</div>
				<div style={{position: 'absolute', left: '14.9%', top: '30%', width: '80.6%', height: 110, borderRadius: 55, backgroundColor: s.surfaceAlt}} />
				<SeedGrow variant={name}>
					<ResultRow tone={tone} />
				</SeedGrow>
			</AbsoluteFill>
		);
	}
	if (name === 'edgeStretch') {
		return (
			<AbsoluteFill style={bg}>
				<div style={{position: 'absolute', left: '15.7%', top: '20%', display: 'flex', flexDirection: 'column', gap: 26}}>
					<Text role="headline" height={H} cap={4.36} weight={600} color={s.ink}>
						Here is the file you asked for
					</Text>
					<Bar tone={tone} w={900} h={26} />
				</div>
				<SeedGrow variant={name}>
					<Attachment tone={tone} />
				</SeedGrow>
			</AbsoluteFill>
		);
	}
	if (name === 'dotToPill') {
		return (
			<AbsoluteFill style={bg}>
				<SeedGrow
					variant={name}
					x={27}
					y={50}
					boxStyle={dark}
					pill
					label="Sorting files..."
					renderLabel={(t) => (
						<Text role="headline" height={H} cap={5.8} color={s.onAccent}>
							{t}
						</Text>
					)}
				/>
			</AbsoluteFill>
		);
	}
	if (name === 'lineToPill' || name === 'pillToLine') {
		return (
			<AbsoluteFill style={bg}>
				<SeedGrow
					variant={name}
					x={39}
					y={50}
					boxStyle={dark}
					pill
					label="Done."
					renderLabel={(t) => (
						<Text role="headline" height={H} cap={5.1} weight={650} color={s.onAccent}>
							{t}
						</Text>
					)}
				/>
			</AbsoluteFill>
		);
	}
	if (name === 'growType') {
		const icon = (
			<div style={{width: 170, height: 170, borderRadius: 85, backgroundColor: s.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<div style={{width: 60, height: 60, borderRadius: 12, backgroundColor: s.surface}} />
			</div>
		);
		return (
			<AbsoluteFill style={bg}>
				<SeedGrow
					variant={name}
					x={22}
					y={50}
					boxStyle={{backgroundColor: s.surface, border: `2px solid ${s.line}`, justifyContent: 'flex-start', paddingLeft: 120, boxSizing: 'border-box'}}
					pill
					lead={icon}
					label="checking the list of open tasks"
					renderLabel={(t) => (
						<Text role="headline" height={H} cap={3.2} color={s.ink}>
							{t}
						</Text>
					)}
				/>
			</AbsoluteFill>
		);
	}
	// chainIn / chainOut: one callout over a plain panel
	return (
		<AbsoluteFill style={bg}>
			<div style={{position: 'absolute', left: '30%', top: '18%', width: '40%', height: '30%', borderRadius: 32, backgroundColor: s.bgAlt}} />
			<SeedGrow variant={name} x={50} y={36}>
				<Callout tone={tone} v={v} word="two new files" />
			</SeedGrow>
		</AbsoluteFill>
	);
};
