import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {num, str, variantOf} from '../../engine/anim';
import {progressAt} from '../../engine/progress';
import {scheme, type Tone} from '../../tokens/colors';
import type {Motion} from '../../tokens/easing';
import {fontSize, FONT} from '../../tokens/type';
import {FootageSlot} from '../footage/FootageSlot';
import type {DemoProps, VariantSpec} from '../types';
import {DRAW} from './draw';
import {clamp01, LumaFilter, stepAt, useRefFrame, withAlpha} from './light';
import {spec} from './LumaPulse.spec';

export type LumaPulseProps = {
	children: React.ReactNode;
	tone?: Tone;
	variant?: string;
	/** bloomCover / flicker: the content shown once the light has covered the swap */
	next?: React.ReactNode;
	/** haloPeak: glow reach, px at 1080p (not measured: DRAW default) */
	haloPx?: number;
};

const mot = (v: VariantSpec, prop: string): Motion => {
	const m = v.motions[prop];
	if (!m) throw new Error(`LumaPulse variant has no motion ${prop}`);
	return m;
};

/** What a pulse does to its element at one frame. */
type Pulse = {gain: number; lift: number; halo: number; haloPx: number; opacity: number; swapped: boolean};

const pulseAt = (name: string, v: VariantSpec, f: number, haloPx: number): Pulse => {
	const p = (prop: string) => progressAt(f, mot(v, prop));
	const rest: Pulse = {gain: 1, lift: 0, halo: 0, haloPx, opacity: 1, swapped: false};
	const peakLift = () => num(v, 'peak') / (1 - num(v, 'rest'));
	switch (name) {
		case 'slowBloom':
			return {
				...rest,
				halo: peakLift() * (p('opacity') - p('haloOut')),
				haloPx: num(v, 'haloPx'),
				gain: 1 + (num(v, 'fillPeak') - 1) * p('fill') + (num(v, 'fillRest') - num(v, 'fillPeak')) * p('fillOut'),
			};
		case 'bloomCover':
			return {...rest, lift: peakLift() * (p('opacity') - p('decay')), swapped: f >= mot(v, 'decay').delay};
		case 'haloPeak':
			return {...rest, halo: peakLift() * (p('rise') - p('fall'))};
		case 'layerFlash':
			return {...rest, lift: stepAt(str(v, 'steps'), f, 0)};
		case 'opacityDip':
			return {...rest, opacity: 1 - num(v, 'dipLuma') * (p('dip') - p('back'))};
		case 'flicker':
			return {...rest, lift: stepAt(str(v, 'steps'), f, 0), swapped: f >= num(v, 'swapAt')};
		default:
			return {...rest, lift: peakLift() * (p('rise') - p('fall'))};
	}
};

export const LumaPulse: React.FC<LumaPulseProps> = ({children, tone = 'dark', variant, next, haloPx = DRAW.haloPx}) => {
	const name = variant ?? spec.defaultVariant;
	const f = useRefFrame();
	const {height} = useVideoConfig();
	const s = scheme(tone);
	const u = pulseAt(name, variantOf(spec, variant), f, haloPx);
	// a glow is a blurred copy of the element's shape, half as bright as its colour where it meets the
	// element: the colour is twice the measured lift so the luma right beside the element reaches it
	const halo = clamp01(2 * u.halo);
	return (
		<LumaFilter
			gain={u.gain}
			lift={clamp01(u.lift)}
			extra={halo > 1e-3 ? `drop-shadow(0 0 ${(u.haloPx * height) / 1080}px ${withAlpha(s.flash, halo)})` : undefined}
			style={{opacity: clamp01(u.opacity)}}
		>
			{u.swapped && next !== undefined ? next : children}
		</LumaFilter>
	);
};

// ---- Demo: neutral elements on their own frame ----

const Centre: React.FC<{tone: Tone; children: React.ReactNode}> = ({tone, children}) => (
	<AbsoluteFill style={{backgroundColor: scheme(tone).bg, alignItems: 'center', justifyContent: 'center'}}>{children}</AbsoluteFill>
);

const Label: React.FC<{text: string; color: string; role?: 'label' | 'ui' | 'display'; weight?: number}> = ({text, color, role = 'label', weight = 500}) => {
	const {height} = useVideoConfig();
	return <div style={{fontFamily: FONT.ui, fontSize: fontSize(role, height), fontWeight: weight, color, lineHeight: 1}}>{text}</div>;
};

const Strip: React.FC = () => {
	const s = scheme('dark');
	return (
		<div style={{display: 'flex', gap: 14, padding: 24, backgroundColor: s.bgAlt, borderRadius: 12}}>
			{[240, 140, 330, 190, 270, 130].map((wd, i) => (
				<div key={i} style={{width: wd, height: 96, borderRadius: 10, backgroundColor: s.muted}} />
			))}
		</div>
	);
};

const Panel: React.FC<{children: React.ReactNode}> = ({children}) => (
	<div style={{width: 960, height: 620, padding: 40, borderRadius: 24, backgroundColor: scheme('dark').surface, display: 'flex', flexWrap: 'wrap', gap: 28, alignContent: 'flex-start'}}>
		{children}
	</div>
);

const Plates: React.FC = () => (
	<Panel>
		{Array.from({length: 6}, (_, i) => (
			<div key={i} style={{width: 272, height: 250, borderRadius: 14, overflow: 'hidden', position: 'relative'}}>
				<FootageSlot tone="dark" />
			</div>
		))}
	</Panel>
);

const Folders: React.FC = () => {
	const s = scheme('dark');
	return (
		<Panel>
			{['one', 'two', 'three'].map((t) => (
				<div key={t} style={{width: 272, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
					<svg width="160" height="120" viewBox="0 0 160 120">
						<path d="M8 20 h52 l14 14 h78 v78 h-144 z" fill={s.surfaceAlt} stroke={s.muted} strokeWidth="3" />
					</svg>
					<Label text={t} color={s.inkSoft} role="ui" />
				</div>
			))}
		</Panel>
	);
};

const Stack: React.FC<{variant: string}> = ({variant}) => {
	const s = scheme('dark');
	const plate = (i: number) => (
		<div
			style={{
				width: 620,
				height: 360,
				borderRadius: 18,
				backgroundColor: s.surface,
				border: `3px solid ${s.line}`,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 36,
			}}
		>
			<svg width="120" height="120" viewBox="0 0 120 120">
				<circle cx="60" cy="60" r="44" fill="none" stroke={s.muted} strokeWidth="10" />
			</svg>
			<Label text={['one', 'two', 'three'][i] ?? ''} color={s.inkSoft} />
		</div>
	);
	return (
		<Centre tone="dark">
			<div style={{position: 'relative', width: 1460, height: 820}}>
				{[0, 1, 2].map((i) => (
					<div key={i} style={{position: 'absolute', left: 40 + i * 400, top: 30 + i * 200}}>
						{i === 1 ? <LumaPulse variant={variant}>{plate(i)}</LumaPulse> : plate(i)}
					</div>
				))}
			</div>
		</Centre>
	);
};

const Screen: React.FC<{tone: Tone; text: string}> = ({tone, text}) => {
	const s = scheme(tone);
	return (
		<div style={{width: 420, height: 760, borderRadius: 56, backgroundColor: tone === 'light' ? s.surface : s.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			<Label text={text} color={s.ink} role="display" weight={700} />
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const d = scheme('dark');
	const l = scheme('light');
	switch (variant) {
		case 'slowBloom':
			return (
				<Centre tone="dark">
					<LumaPulse variant={variant}>
						<Strip />
					</LumaPulse>
				</Centre>
			);
		case 'bloomCover':
			return (
				<Centre tone="dark">
					<LumaPulse variant={variant} next={<Folders />}>
						<Plates />
					</LumaPulse>
				</Centre>
			);
		case 'haloPeak':
			return (
				<Centre tone="dark">
					<LumaPulse variant={variant}>
						<div style={{width: 520, height: 300, borderRadius: 28, backgroundColor: l.surface, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<Label text="note" color={l.ink} role="display" weight={600} />
						</div>
					</LumaPulse>
				</Centre>
			);
		case 'layerFlash':
			return <Stack variant={variant} />;
		case 'opacityDip':
			return (
				<Centre tone="light">
					<LumaPulse variant={variant} tone="light">
						<div style={{fontFamily: FONT.display, fontWeight: 800, fontSize: 190, color: l.ink, letterSpacing: '-0.02em'}}>SEVEN DAYS</div>
					</LumaPulse>
				</Centre>
			);
		case 'flicker':
			return (
				<Centre tone="light">
					<LumaPulse variant={variant} tone="light" next={<Screen tone="dark" text="42" />}>
						<Screen tone="light" text="ready" />
					</LumaPulse>
				</Centre>
			);
		default:
			return (
				<Centre tone="dark">
					<LumaPulse variant={variant}>
						<div style={{padding: '34px 84px', borderRadius: 999, backgroundColor: d.surface, border: `2px solid ${d.line}`}}>
							<Label text="Send" color={d.ink} role="display" weight={600} />
						</div>
					</LumaPulse>
				</Centre>
			);
	}
};
