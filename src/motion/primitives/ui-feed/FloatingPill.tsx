import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {flag, maybe, mix, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FootageSlot} from '../footage/FootageSlot';
import type {DemoProps} from '../types';
import {bentPathAt, Disc, exitRate, motionEnd, Word} from './kit';
import {spec} from './FloatingPill.spec';

export type FloatingPillProps = {
	children: React.ReactNode;
	tone?: Tone;
	variant?: string;
	/** rest centre, % of frame width / height (default: the variant's measured rest, else the centre) */
	x?: number;
	y?: number;
	style?: React.CSSProperties;
};

// The pill (children) sits centred on its rest point and moves by offsets from it: along a bent path
// (progress), or by from -> to offsets in x / y, a second leg (back), a drop that leaves at its exit
// speed, a tilt that levels out, a vertical stretch and a fade, as the variant has them.
export const FloatingPill: React.FC<FloatingPillProps> = ({children, variant, x, y, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, h} = useFrame();
	const m = v.motions;
	let dx = 0;
	let dy = 0;
	const path = m.progress;
	if (path) {
		const [ox, oy] = bentPathAt(p('progress'), [w(maybe(v, 'fromX') ?? 0), h(maybe(v, 'fromY') ?? 0)], [maybe(v, 'bendX') ?? 0, maybe(v, 'bendY') ?? 0]);
		dx += ox;
		dy += oy + h(maybe(v, 'settleDriftY') ?? 0) * Math.max(0, frame - motionEnd(path));
	} else {
		dx += w(mix(p('x'), maybe(v, 'fromX') ?? 0, maybe(v, 'toX') ?? 0));
		dy += h(mix(p('y'), maybe(v, 'fromY') ?? 0, maybe(v, 'toY') ?? 0));
	}
	if (m.back) dy += h(maybe(v, 'backY') ?? 0) * p('back');
	const drop = m.drop;
	if (drop) {
		const travel = h(maybe(v, 'dropY') ?? 0);
		dy += travel * (p('drop') + exitRate(drop) * Math.max(0, frame - motionEnd(drop)));
	}
	const tiltFrom = maybe(v, 'tiltFrom');
	const rotate = tiltFrom === undefined ? 0 : mix(p('tilt'), tiltFrom, 0);
	const stretch = maybe(v, 'stretchY');
	const scaleY = stretch === undefined ? 1 : mix(p('stretch'), 1, stretch);
	const opacity = m.opacity ? (flag(v, 'fadeOut') ? 1 - p('opacity') : p('opacity')) : 1;
	const restX = x ?? maybe(v, 'restX');
	const restY = y ?? maybe(v, 'restY');
	return (
		<div
			style={{
				position: 'absolute',
				left: restX === undefined ? '50%' : w(restX),
				top: restY === undefined ? '50%' : h(restY),
				transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${rotate}deg) scaleY(${scaleY})`,
				opacity,
				...style,
			}}
		>
			{children}
		</div>
	);
};

// ---- isolated demo ----

const H = 1080;

const Hex: React.FC<{tone: Tone; d: number}> = ({tone, d}) => {
	const s = scheme(tone);
	return (
		<svg width={d} height={d} viewBox="0 0 100 100">
			<polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill={s.ink} />
			<polygon points="50,30 68,40 68,60 50,70 32,60 32,40" fill={s.surface} />
		</svg>
	);
};

/** status pill with a mark hanging to its left (the pill is the box the motion centres on) */
const StatusPill: React.FC<{tone: Tone; word: string; w: number; h: number; mark?: boolean; dark?: boolean}> = ({tone, word, w, h, mark = true, dark}) => {
	const s = scheme(tone);
	return (
		<div
			style={{
				position: 'relative',
				width: w,
				height: h,
				borderRadius: h / 2,
				backgroundColor: dark ? s.accent : s.surface,
				border: dark ? undefined : `2px solid ${s.line}`,
				display: 'flex',
				alignItems: 'center',
				gap: h * 0.2,
				padding: `0 ${h * 0.4}px`,
				boxSizing: 'border-box',
			}}
		>
			<Disc tone={tone} d={h * 0.36} fill={dark ? 'surface' : 'muted'} />
			<Word tone={tone} height={H} role="headline" color={dark ? 'onAccent' : 'ink'}>
				{word}
			</Word>
			{mark ? (
				<div style={{position: 'absolute', right: '100%', marginRight: 70, top: '50%', transform: 'translateY(-50%)'}}>
					<Hex tone={tone} d={h * 1.05} />
				</div>
			) : null}
		</div>
	);
};

const PromptPill: React.FC<{tone: Tone}> = ({tone}) => {
	const s = scheme(tone);
	return (
		<div
			style={{
				width: 1100,
				height: 188,
				borderRadius: 94,
				backgroundColor: s.surface,
				border: `2px solid ${s.line}`,
				display: 'flex',
				alignItems: 'center',
				padding: '0 34px 0 64px',
				boxSizing: 'border-box',
			}}
		>
			<Word tone={tone} height={H} role="headline" color="muted">
				ask anything
			</Word>
			<div style={{flex: 1}} />
			<Disc tone={tone} d={124} fill="ink" />
		</div>
	);
};

const Toast: React.FC<{tone: Tone}> = ({tone}) => {
	const s = scheme(tone);
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '24px 40px 24px 26px', borderRadius: 26, backgroundColor: s.accent}}>
			<div style={{width: 58, height: 58, borderRadius: 29, backgroundColor: s.surface, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<svg width={34} height={34} viewBox="0 0 34 34">
					<path d="M7 18l7 7 13-15" fill="none" stroke={s.accent} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</div>
			<Word tone={tone} height={H} color="onAccent">
				saved to list
			</Word>
		</div>
	);
};

const PageBits: React.FC<{tone: Tone; top?: number}> = ({tone, top = 260}) => {
	const s = scheme(tone);
	return (
		<div style={{position: 'absolute', left: 300, right: 300, top, display: 'flex', flexDirection: 'column', gap: 34}}>
			{[0, 1, 2, 3, 4, 5, 6].map((r) => (
				<div key={r} style={{height: 26, width: `${90 - ((r * 13) % 40)}%`, borderRadius: 13, backgroundColor: s.line}} />
			))}
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {h} = useFrame();
	const layerY = h((maybe(v, 'layerY') ?? 0) * p('layer') + (maybe(v, 'layerBackY') ?? 0) * p('layerBack'));
	const pill = <StatusPill tone={tone} word="writing the summary" w={940} h={166} />;
	if (variant === 'counterDrift') {
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<div style={{position: 'absolute', left: 360, right: 360, top: 70, height: 700, borderRadius: 40, overflow: 'hidden', transform: `translateY(${layerY}px)`}}>
					<FootageSlot label="card" />
				</div>
				<FloatingPill variant={variant}>{pill}</FloatingPill>
			</AbsoluteFill>
		);
	}
	if (variant === 'trackFootage') {
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<div style={{position: 'absolute', left: 0, right: 0, top: -120, height: 1320, transform: `translateY(${layerY}px)`}}>
					<FootageSlot label="footage" />
				</div>
				<FloatingPill variant={variant}>{pill}</FloatingPill>
			</AbsoluteFill>
		);
	}
	if (variant === 'toastIn' || variant === 'toastOut') {
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<AbsoluteFill style={{transform: `translateY(${layerY}px)`}}>
					<PageBits tone={tone} />
					<FloatingPill variant={variant} x={50} y={variant === 'toastOut' ? 9 : 14}>
						<Toast tone={tone} />
					</FloatingPill>
				</AbsoluteFill>
			</AbsoluteFill>
		);
	}
	if (variant === 'overshootRise' || variant === 'liftDrop') {
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<FloatingPill variant={variant}>
					<PromptPill tone={tone} />
				</FloatingPill>
			</AbsoluteFill>
		);
	}
	if (variant === 'edgeRise') {
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<FloatingPill variant={variant}>
					<StatusPill tone={tone} word="new" w={300} h={110} mark={false} dark />
				</FloatingPill>
			</AbsoluteFill>
		);
	}
	if (variant === 'smearOut') {
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<PageBits tone={tone} top={120} />
				<FloatingPill variant={variant} x={62} y={58}>
					{pill}
				</FloatingPill>
			</AbsoluteFill>
		);
	}
	// dropIn (default), riseLevel, whipUp
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<FloatingPill variant={variant ?? spec.defaultVariant} x={variant === 'riseLevel' || variant === 'whipUp' ? 60 : undefined}>
				{pill}
			</FloatingPill>
		</AbsoluteFill>
	);
};
