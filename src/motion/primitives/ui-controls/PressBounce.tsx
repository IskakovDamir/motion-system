import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {maybe, mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {Bar, Check, Chevron, Glyph, Lift, liftOf, Text} from './kit';
import {spec} from './PressBounce.spec';

export type PressBounceProps = {
	children: React.ReactNode;
	/** the pressed / selected state, shown over children from the variant's swap (fade or hard swap) */
	swapped?: React.ReactNode;
	tone?: Tone;
	variant?: string;
	style?: React.CSSProperties;
};

/** Scale of the pressed element at the current frame: rest 1 -> pressScale, then the release. */
const usePressScale = (variant?: string): number => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const pressed = mix(p('scale'), 1, num(v, 'pressScale'));
	return v.motions.release ? mix(p('release'), pressed, maybe(v, 'releaseScale') ?? 1) : pressed;
};

// The element (children) scales about its centre; the swapped state fades in over it (or swaps in
// one picture at swapAt and back at unswapAt); a measured fill lift (glowRelease) brightens what it
// paints: one step at the bottom of the press, then a linear rise.
export const PressBounce: React.FC<PressBounceProps> = ({children, swapped, variant, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const scale = usePressScale(variant);
	let on = 0;
	if (swapped) {
		if (v.motions.swap) on = p('swap');
		else {
			const at = maybe(v, 'swapAt');
			const until = maybe(v, 'unswapAt');
			on = at !== undefined && frame >= at && (until === undefined || frame < until) ? 1 : 0;
		}
	}
	const fill = maybe(v, 'fillLuma');
	const glow = v.motions.glow;
	let lift = 0;
	if (fill !== undefined && glow) {
		const rest = fill / 255;
		const luma = frame < glow.delay ? rest : mix(p('glow'), num(v, 'stepLuma'), num(v, 'glowLuma')) / 255;
		lift = liftOf(rest, luma);
	}
	return (
		<div style={{position: 'relative', display: 'inline-block', transform: `scale(${scale})`, transformOrigin: '50% 50%', ...style}}>
			<Lift lift={lift}>
				{children}
				{swapped ? <div style={{position: 'absolute', inset: 0, opacity: on}}>{swapped}</div> : null}
			</Lift>
		</div>
	);
};

// ---- isolated demo ----

const H = 1080;

const SendDisc: React.FC<{tone: Tone; d: number; dark?: boolean}> = ({tone, d, dark = true}) => {
	const s = scheme(tone);
	return (
		<div style={{width: d, height: d, borderRadius: d / 2, backgroundColor: dark ? s.accent : s.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
			<Chevron size={d * 0.62} color={dark ? s.onAccent : s.ink} />
		</div>
	);
};

const InputBar: React.FC<{tone: Tone; w: number; h: number; children: React.ReactNode}> = ({tone, w, h, children}) => {
	const s = scheme(tone);
	return (
		<div
			style={{
				width: w,
				height: h,
				borderRadius: h / 2,
				backgroundColor: s.surface,
				border: `2px solid ${s.line}`,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: `0 ${h * 0.14}px 0 ${h * 0.4}px`,
				boxSizing: 'border-box',
			}}
		>
			{children}
		</div>
	);
};

const Chip: React.FC<{tone: Tone; word: string; on?: boolean}> = ({tone, word, on}) => {
	const s = scheme(tone);
	return (
		<div
			style={{
				height: 132,
				padding: '0 54px',
				borderRadius: 66,
				backgroundColor: s.surfaceAlt,
				boxShadow: on ? `inset 0 0 0 5px ${s.ink}` : undefined,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				boxSizing: 'border-box',
			}}
		>
			<Text role="headline" height={H} color={on ? s.ink : s.muted}>
				{word}
			</Text>
		</div>
	);
};

const MenuRow: React.FC<{tone: Tone; word: string; kind: 'circle' | 'square' | 'triangle'; w: number; lit?: boolean; check?: number}> = ({
	tone,
	word,
	kind,
	w,
	lit,
	check = 0,
}) => {
	const s = scheme(tone);
	return (
		<div
			style={{
				width: w,
				height: 118,
				borderRadius: 26,
				backgroundColor: lit ? s.surfaceAlt : 'transparent',
				display: 'flex',
				alignItems: 'center',
				gap: 30,
				padding: '0 30px',
				boxSizing: 'border-box',
			}}
		>
			<Glyph size={72} tile={s.bgAlt} mark={s.inkSoft} kind={kind} />
			<Text role="ui" height={H} cap={3.4} color={lit ? s.ink : s.inkSoft}>
				{word}
			</Text>
			<div style={{flex: 1}} />
			<div style={{opacity: check}}>
				<Check size={56} color={s.ink} />
			</div>
		</div>
	);
};

const Folder: React.FC<{tone: Tone; w: number; light?: boolean}> = ({tone, w, light}) => {
	const s = scheme(tone);
	const fill = light ? s.surface : s.muted;
	return (
		<svg width={w} height={w * 0.78} viewBox="0 0 100 78">
			<path d="M4 14 Q4 8 10 8 L36 8 Q40 8 42 12 L45 17 L90 17 Q96 17 96 23 L96 70 Q96 76 90 76 L10 76 Q4 76 4 70 Z" fill={fill} />
		</svg>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {px} = useFrame();
	const size = px(maybe(v, 'restSize') ?? 120);
	const centre: React.CSSProperties = {alignItems: 'center', justifyContent: 'center', backgroundColor: s.bg};

	if (variant === 'deep' || variant === 'quick' || variant === undefined) {
		const tall = Math.max(size * 1.3, 96);
		return (
			<AbsoluteFill style={centre}>
				<InputBar tone={tone} w={variant === 'deep' ? 820 : 1180} h={tall}>
					<Bar tone={tone} w={variant === 'deep' ? 360 : 520} h={tall * 0.2} />
					<PressBounce variant={variant}>
						<SendDisc tone={tone} d={size} />
					</PressBounce>
				</InputBar>
			</AbsoluteFill>
		);
	}
	if (variant === 'held') {
		return (
			<AbsoluteFill style={centre}>
				<PressBounce variant={variant}>
					<div style={{padding: '90px 260px', borderRadius: 60, backgroundColor: s.accent, borderBottom: `20px solid ${s.inkSoft}`}}>
						<Text role="display" height={H} cap={7} weight={700} color={s.onAccent}>
							start
						</Text>
					</div>
				</PressBounce>
			</AbsoluteFill>
		);
	}
	if (variant === 'springBack') {
		return (
			<AbsoluteFill style={centre}>
				<div style={{display: 'flex', gap: 40, alignItems: 'center'}}>
					<Chip tone={tone} word="small" />
					<PressBounce variant={variant} swapped={<Chip tone={tone} word="wide" on />}>
						<Chip tone={tone} word="wide" />
					</PressBounce>
					<Chip tone={tone} word="auto" />
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'pressSwap') {
		const w = size * 1.25;
		const old = 1 - p('oldOut');
		const oldLit = frame < num(v, 'oldGoneAt');
		return (
			<AbsoluteFill style={centre}>
				<div style={{padding: 22, borderRadius: 40, backgroundColor: s.surface, border: `2px solid ${s.line}`, display: 'flex', flexDirection: 'column', gap: 10}}>
					<MenuRow tone={tone} word="first" kind="circle" w={w} lit={oldLit} check={old} />
					<PressBounce variant={variant} swapped={<MenuRow tone={tone} word="second" kind="square" w={w} lit check={1} />}>
						<MenuRow tone={tone} word="second" kind="square" w={w} />
					</PressBounce>
					<MenuRow tone={tone} word="third" kind="triangle" w={w} />
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'glowRelease') {
		return (
			<AbsoluteFill style={centre}>
				<PressBounce variant={variant}>
					<div style={{width: size, height: size, borderRadius: size / 2, backgroundColor: s.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<Chevron size={size * 0.5} color={s.onAccent} />
					</div>
				</PressBounce>
			</AbsoluteFill>
		);
	}
	if (variant === 'longHold') {
		return (
			<AbsoluteFill style={centre}>
				<InputBar tone={tone} w={1100} h={size * 1.5}>
					<Bar tone={tone} w={560} h={size * 0.26} />
					<PressBounce variant={variant}>
						<div style={{width: size, height: size, borderRadius: size / 2, backgroundColor: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<div style={{width: size * 0.18, height: size * 0.42, borderRadius: size * 0.09, backgroundColor: s.onAccent}} />
						</div>
					</PressBounce>
				</InputBar>
			</AbsoluteFill>
		);
	}
	// dropPress: a folder takes a dropped chip, which shrinks away on its front
	const chip = 1 - p('chipOut');
	return (
		<AbsoluteFill style={centre}>
			<div style={{position: 'absolute', left: '26%', right: '26%', top: '22%', bottom: '22%', borderRadius: 48, backgroundColor: s.accent}} />
			<div style={{position: 'relative'}}>
				<PressBounce variant={variant} swapped={<Folder tone={tone} w={size} light />}>
					<Folder tone={tone} w={size} />
				</PressBounce>
				<div
					style={{
						position: 'absolute',
						left: '50%',
						top: '58%',
						transform: `translate(-50%, -50%) scale(${chip})`,
						opacity: chip > 0.001 ? 1 : 0,
						padding: '16px 30px',
						borderRadius: 18,
						backgroundColor: s.inkSoft,
						whiteSpace: 'nowrap',
					}}
				>
					<Text role="ui" height={H} color={s.onAccent}>
						notes
					</Text>
				</div>
			</div>
		</AbsoluteFill>
	);
};
