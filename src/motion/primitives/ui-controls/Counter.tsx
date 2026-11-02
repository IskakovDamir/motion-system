import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {progressAt} from '../../engine/progress';
import {maybe, mix, num, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FONT, type FontRole} from '../../tokens/type';
import type {DemoProps, VariantSpec} from '../types';
import {nums, sizeAt, stepAt, Text} from './kit';
import {spec} from './Counter.spec';

export type CounterProps = {
	from: number;
	to: number;
	tone?: Tone;
	variant?: string;
	/** after the digits (a unit word, a sign); gets the shown value */
	suffix?: (value: number) => React.ReactNode;
	prefix?: React.ReactNode;
	/** stepOnArrival: what the label swaps to after the last step */
	done?: React.ReactNode;
	/** fastForward: a timer label counting on the same progress (above the digits) and a unit label (below) */
	timer?: {from: number; to: number; format: (value: number) => string};
	unit?: React.ReactNode;
	/** fastForward: ring diameter, px at 1080 */
	ring?: number;
	/** frames before the first step / tick (the content's own timing) */
	offset?: number;
	/** digit colour role */
	color?: 'ink' | 'inkSoft' | 'muted' | 'onAccent';
};

/** Integer between from and to at progress k, moving toward `to` only when a whole unit is passed. */
const between = (k: number, from: number, to: number) => from + Math.trunc((to - from) * Math.min(1, Math.max(0, k)) + 1e-9);

/** Value shown at `frame` and whether the done state is on. */
const valueAt = (v: VariantSpec, frame: number, from: number, to: number): {value: number; done: boolean} => {
	const m = v.motions;
	const curve = m.value ?? m.rotate;
	if (curve) {
		const c = maybe(v, 'cadence') ?? 1;
		return {value: between(progressAt(Math.floor(frame / c) * c, curve), from, to), done: false};
	}
	const tick = maybe(v, 'tickFrames');
	if (tick !== undefined) {
		const first = num(v, 'firstTick');
		const ticks = frame < first ? 0 : Math.floor((frame - first) / tick) + 1;
		const raw = from + Math.sign(to - from) * ticks * num(v, 'step');
		return {value: to >= from ? Math.min(to, raw) : Math.max(to, raw), done: false};
	}
	if (v.params?.steps !== undefined) {
		const n = nums(v, 'steps').filter((s) => frame >= s).length;
		const value = to >= from ? Math.min(to, from + n) : Math.max(to, from - n);
		return {value, done: frame >= num(v, 'doneAt')};
	}
	const units = stepAt(v, 'table', frame, 0);
	return {value: Math.round(mix(units / num(v, 'units'), from, to)), done: false};
};

// The value comes from the variant: a measured curve sampled at its update cadence, a real-time clock,
// listed events or a measured step table; digits are set in the measured family, weight and cap height
// with tabular figures, so a changing digit never moves the others. With a rotate motion the counter
// sits in a dial whose knob runs round the ring on exactly that progress.
export const Counter: React.FC<CounterProps> = ({from, to, tone = 'light', variant, suffix, prefix, done, timer, unit, ring = 420, offset = 0, color = 'ink'}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {height, px} = useFrame();
	const s = scheme(tone);
	const t = frame - offset;
	const {value, done: isDone} = valueAt(v, t, from, to);
	const font = str(v, 'font') as FontRole;
	const decimals = maybe(v, 'decimals') ?? 0;
	const size = sizeAt('counter', height, num(v, 'capHeight'), font);
	const digits = (
		<span
			style={{
				fontFamily: FONT[font],
				fontWeight: num(v, 'weight'),
				fontSize: size,
				fontVariantNumeric: 'tabular-nums',
				lineHeight: 1.1,
				color: s[color],
				whiteSpace: 'pre',
			}}
		>
			{value.toFixed(decimals)}
		</span>
	);
	const line =
		isDone && done ? (
			done
		) : (
			<div style={{display: 'inline-flex', alignItems: 'baseline', gap: size * 0.22, justifyContent: v.params?.align === 'right' ? 'flex-end' : 'center'}}>
				{prefix}
				{digits}
				{suffix ? suffix(value) : null}
			</div>
		);
	if (!v.motions.rotate) return line;
	// dial: ring, knob at the measured angle (0 = 12 o'clock, negative = counter-clockwise), digits centred
	const d = px(ring);
	const angle = num(v, 'fromAngle') + num(v, 'angle') * p('rotate');
	const rad = (angle * Math.PI) / 180;
	const knob = d * 0.075;
	const kx = d / 2 + (d / 2) * Math.sin(rad);
	const ky = d / 2 - (d / 2) * Math.cos(rad);
	const c = maybe(v, 'cadence') ?? 1;
	const k = progressAt(Math.floor(t / c) * c, v.motions.rotate);
	return (
		<div style={{position: 'relative', width: d, height: d}}>
			<svg width={d} height={d} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<circle cx={d / 2} cy={d / 2} r={d / 2} fill="none" stroke={s.line} strokeWidth={d * 0.02} />
				{/* the ring still to run: from the knob on round (counter-clockwise) to 12 o'clock */}
				<path
					d={`M ${kx} ${ky} A ${d / 2} ${d / 2} 0 ${360 + angle > 180 ? 1 : 0} 0 ${d / 2} 0`}
					fill="none"
					stroke={s.muted}
					strokeWidth={d * 0.02}
				/>
			</svg>
			<div
				style={{
					position: 'absolute',
					left: kx - knob / 2,
					top: ky - knob / 2,
					width: knob,
					height: knob,
					borderRadius: knob / 2,
					backgroundColor: s.surface,
					border: `${Math.max(2, knob * 0.12)}px solid ${s.ink}`,
					boxSizing: 'border-box',
				}}
			/>
			<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: px(6)}}>
				{timer ? (
					<span style={{fontFamily: FONT.mono, fontSize: sizeAt('code', height, num(v, 'timerCap')), color: s.muted, fontVariantNumeric: 'tabular-nums'}}>
						{timer.format(between(k, timer.from, timer.to))}
					</span>
				) : null}
				{line}
				{unit}
			</div>
		</div>
	);
};

// ---- isolated demo ----

const H = 1080;

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const centre: React.CSSProperties = {alignItems: 'center', justifyContent: 'center', backgroundColor: s.bg};
	if (variant === 'realTime') {
		return (
			<AbsoluteFill style={centre}>
				<div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '20px 34px', borderRadius: 20, backgroundColor: s.surface, border: `2px solid ${s.line}`}}>
					<div style={{width: 18, height: 18, borderRadius: 9, backgroundColor: s.muted}} />
					<Text role="ui" height={H} cap={2.13} color={s.inkSoft}>
						Waiting for reply
					</Text>
					<Counter variant="realTime" from={0} to={1.9} color="muted" suffix={() => <Text role="ui" height={H} cap={2.13} color={s.muted}>s</Text>} />
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'stepOnArrival') {
		return (
			<AbsoluteFill style={centre}>
				<div style={{padding: '10px 18px', borderRadius: 14, backgroundColor: s.surfaceAlt}}>
					<Counter
						variant="stepOnArrival"
						from={0}
						to={4}
						offset={17}
						color="inkSoft"
						prefix={<Text role="ui" height={H} cap={1.11} color={s.inkSoft}>Replies</Text>}
						done={<Text role="ui" height={H} cap={1.11} color={s.inkSoft}>All replies in</Text>}
					/>
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'perPictureSwap') {
		return (
			<AbsoluteFill style={centre}>
				<div style={{width: 1100, display: 'flex', justifyContent: 'flex-end', padding: '30px 70px', borderRadius: 120, backgroundColor: s.surface, border: `2px solid ${s.line}`, boxSizing: 'border-box'}}>
					<Counter
						variant="perPictureSwap"
						from={104}
						to={95}
						suffix={() => (
							<Text role="ui" height={H} cap={13.5} color={s.muted}>
								% size
							</Text>
						)}
					/>
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'fastForward') {
		return (
			<AbsoluteFill style={centre}>
				<Counter
					variant="fastForward"
					from={240}
					to={60}
					ring={820}
					timer={{from: 0, to: 180, format: (x) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`}}
					unit={
						<Text role="ui" height={H} cap={2.8} weight={500} color={s.muted}>
							steps / min
						</Text>
					}
				/>
			</AbsoluteFill>
		);
	}
	return (
		<AbsoluteFill style={centre}>
			<Counter
				variant={variant ?? 'accelerating'}
				from={1}
				to={100}
				suffix={(n) => (
					<Text role="display" height={H} cap={8.5} color={s.ink}>
						{n === 1 ? 'item' : 'items'}
					</Text>
				)}
			/>
		</AbsoluteFill>
	);
};
