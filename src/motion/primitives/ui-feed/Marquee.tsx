import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {flag, maybe, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FootageSlot} from '../footage/FootageSlot';
import type {DemoProps} from '../types';
import {Word} from './kit';
import {spec} from './Marquee.spec';

export type MarqueeProps = {
	items: React.ReactNode[];
	tone?: Tone;
	variant?: string;
	/** slot pitch, % of frame width (default: the variant's measured pitch, else the items share one frame width) */
	pitch?: number;
	/** centre of the first slot before the row moves, % of frame width (default: the variant's, else half a pitch) */
	firstX?: number;
	style?: React.CSSProperties;
};

// An endless row (or one with a leading end, when it `arrives`): slot k sits at firstX + k * pitch and
// shows items[k mod n]. It moves left by travel x the variant's x motion plus `speed` % W per frame (for
// `cruise` frames, then it stops dead).
export const Marquee: React.FC<MarqueeProps> = ({items, variant, pitch: pitchProp, firstX: firstProp, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w} = useFrame();
	const n = items.length;
	const pitch = pitchProp ?? maybe(v, 'pitch') ?? 100 / Math.max(1, n);
	const firstX = firstProp ?? maybe(v, 'firstX') ?? pitch / 2;
	const cruise = maybe(v, 'cruise');
	const travel = maybe(v, 'travel') ?? 0;
	const speed = maybe(v, 'speed') ?? 0;
	const offset = -(travel * p('x') + speed * Math.max(0, cruise === undefined ? frame : Math.min(frame, cruise)));
	// a row that arrives has a leading end: no slot before the first
	const k0 = Math.max(flag(v, 'arrives') ? 0 : -Infinity, Math.ceil((-pitch - firstX - offset) / pitch));
	const k1 = Math.floor((100 + pitch - firstX - offset) / pitch);
	const slots: number[] = [];
	for (let k = k0; k <= k1; k++) slots.push(k);
	return (
		<div style={{position: 'relative', width: '100%', height: '100%', ...style}}>
			{n === 0
				? null
				: slots.map((k) => (
						<div
							key={k}
							style={{
								position: 'absolute',
								top: 0,
								bottom: 0,
								left: w(firstX + k * pitch + offset - pitch / 2),
								width: w(pitch),
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							{items[((k % n) + n) % n]}
						</div>
					))}
		</div>
	);
};

// ---- isolated demo ----

const H = 1080;

const Card: React.FC<{w: number; h: number; r: number; label: string}> = ({w, h, r, label}) => (
	<div style={{width: w, height: h, borderRadius: r, overflow: 'hidden', position: 'relative'}}>
		<FootageSlot label={label} />
	</div>
);

const Shape: React.FC<{tone: Tone; i: number}> = ({tone, i}) => {
	const s = scheme(tone);
	const k = i % 6;
	return (
		<svg width={90} height={90} viewBox="0 0 90 90">
			{k === 0 ? <circle cx={45} cy={45} r={34} fill={s.ink} /> : null}
			{k === 1 ? <rect x={13} y={13} width={64} height={64} rx={10} fill={s.ink} /> : null}
			{k === 2 ? <polygon points="45,8 84,78 6,78" fill={s.ink} /> : null}
			{k === 3 ? <circle cx={45} cy={45} r={30} fill="none" stroke={s.ink} strokeWidth={12} /> : null}
			{k === 4 ? <polygon points="45,6 84,45 45,84 6,45" fill={s.ink} /> : null}
			{k === 5 ? <path d="M38 8h14v30h30v14H52v30H38V52H8V38h30z" fill={s.ink} /> : null}
		</svg>
	);
};

const NAMES = ['one', 'two', 'three', 'four', 'five', 'six'];

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const v = variantOf(spec, variant);
	const {w} = useFrame();
	if (variant === 'deadStop') {
		const items = NAMES.map((name, i) => (
			<div key={name} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
				<div
					style={{
						width: 200,
						height: 200,
						borderRadius: 40,
						backgroundColor: s.surface,
						border: `1px solid ${s.line}`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Shape tone={tone} i={i} />
				</div>
				<Word tone={tone} height={H} color="muted">
					{name}
				</Word>
			</div>
		));
		return (
			<AbsoluteFill>
				<Marquee variant={variant} items={items} />
			</AbsoluteFill>
		);
	}
	if (variant === 'speedRamp') {
		const r = w(num(v, 'radius'));
		const items = [1, 2, 3, 4, 5].map((i) => <Card key={i} w={480} h={620} r={r} label={`${i}`} />);
		return (
			<AbsoluteFill>
				<AbsoluteFill style={{top: 80}}>
					<Marquee variant={variant} items={items} pitch={28} />
				</AbsoluteFill>
				<AbsoluteFill style={{alignItems: 'center', paddingTop: 60}}>
					<Word tone={tone} height={H} role="headline">
						pick a size
					</Word>
				</AbsoluteFill>
			</AbsoluteFill>
		);
	}
	// constant (default) and brakeIn: a row of portrait footage cards; the arriving row's leading card
	// starts in the right half, its left empty (demo layout: the start position is not measured)
	const items = [1, 2, 3, 4, 5, 6, 7].map((i) => <Card key={i} w={300} h={540} r={22} label={`${i}`} />);
	const pitch = 18;
	return (
		<AbsoluteFill>
			<Marquee variant={variant ?? spec.defaultVariant} items={items} pitch={pitch} firstX={v.params?.arrives === true ? 50 + pitch / 2 : undefined} />
		</AbsoluteFill>
	);
};
