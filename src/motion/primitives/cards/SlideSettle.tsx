import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DirectionalBlur} from '../../engine/blur';
import {maybe, mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FootageSlot} from '../footage/FootageSlot';
import type {DemoProps} from '../types';
import {Disc, Lines, Surface, Word, itemDelay, perItem, stepAt} from './kit';
import {spec} from './SlideSettle.spec';

export type SlideSettleProps = {
	items: React.ReactNode[];
	tone?: Tone;
	variant?: string;
	/** how the items sit (layout, not motion) */
	direction?: 'row' | 'column';
	/** space between items, px at 1080 (negative: they overlap); defaults to the variant's measured gap, else 0 */
	gap?: number;
	align?: React.CSSProperties['alignItems'];
	style?: React.CSSProperties;
};

// Each item shifts from its start offset (fromX / fromY) into place on the variant's x / y motion,
// starting at its own delay (stagger or per-item delays). Items after the first use xNext / yNext
// when the variant has them. An item fades on the opacity motion (from item `fadeFrom` on) or, without
// one, is at full value from its start frame. Optional: a blur that clears (blur motion, % W), a
// scale from fromScale (scale motion), later items growing from growFrom (grow motion), or an x
// offset held on pictures (stepsX).
export const SlideSettle: React.FC<SlideSettleProps> = ({items, variant, direction = 'row', gap, align, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, h, px} = useFrame();
	const has = (k: string) => k in v.motions;
	const fadeFrom = maybe(v, 'fadeFrom') ?? 0;
	const stepsX = typeof v.params?.stepsX === 'string' ? v.params.stepsX : undefined;
	const space = px(gap ?? maybe(v, 'gap') ?? 0);
	return (
		<div style={{display: 'flex', flexDirection: direction, alignItems: align, ...style}}>
			{items.map((item, i) => {
				const off = itemDelay(v, i);
				const later = i > 0;
				const xm = later && has('xNext') ? 'xNext' : 'x';
				const ym = later && has('yNext') ? 'yNext' : 'y';
				let dx = w(perItem(v, 'fromX', i) ?? 0) * (1 - p(xm, off));
				const dy = h(perItem(v, 'fromY', i) ?? 0) * (1 - p(ym, off));
				if (stepsX) dx = w(stepAt(stepsX, frame - off, 0));
				const started = frame >= off;
				const opacity = has('opacity') && i >= fadeFrom ? p('opacity', off) : started ? 1 : 0;
				const scale = has('scale') ? mix(p('scale', off), num(v, 'fromScale'), 1) : 1;
				const grow = has('grow') && later ? mix(p('grow', off), num(v, 'growFrom'), 1) : 1;
				const blur = has('blur') ? w(num(v, 'blur')) * (1 - p('blur', off)) : 0;
				return (
					<div
						key={i}
						style={{
							opacity,
							transform: `translate(${dx}px, ${dy}px) scale(${scale * grow})`,
							flexShrink: 0,
							[direction === 'row' ? 'marginLeft' : 'marginTop']: later ? space : 0,
						}}
					>
						<DirectionalBlur x={blur} y={blur}>
							{item}
						</DirectionalBlur>
					</div>
				);
			})}
		</div>
	);
};

// ---- isolated demo ----

const centre: React.CSSProperties = {alignItems: 'center', justifyContent: 'center'};

const DemoCard: React.FC<{tone: Tone; label: string; n: string; dark?: boolean}> = ({tone, label, n, dark}) => (
	<Surface tone={tone} w={820} h={540} fill={dark ? 'accent' : 'surface'} line={!dark} style={{padding: 48, display: 'flex', flexDirection: 'column', gap: 34}}>
		<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
			<Word tone={tone} role="label" color={dark ? 'onAccent' : 'ink'}>
				{label}
			</Word>
			<Word tone={tone} role="code" mono color={dark ? 'onAccent' : 'muted'}>
				{n}
			</Word>
		</div>
		<Lines tone={tone} widths={[560, 640, 420, 520]} fill={dark ? 'onAccent' : 'line'} />
	</Surface>
);

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const v = variantOf(spec, variant);
	if (variant === 'longThrow') {
		const pill = (
			<div key="pill" style={{display: 'flex', alignItems: 'center', gap: 18, padding: '16px 30px 16px 18px', borderRadius: 50, backgroundColor: s.surfaceAlt}}>
				<Disc tone={tone} d={52} fill="ink" />
				<Word tone={tone}>ready</Word>
			</div>
		);
		const row = (
			<div key="row" style={{display: 'flex', alignItems: 'center', gap: 16}}>
				<Word tone={tone} weight={600}>
					Plan
				</Word>
				<svg width="30" height="30" viewBox="0 0 30 30">
					<path d="M6 15 L13 22 L25 8" fill="none" stroke={s.ink} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
				<Word tone={tone} color="muted">
					step two
				</Word>
			</div>
		);
		return (
			<AbsoluteFill style={{justifyContent: 'center', paddingLeft: '10.3%'}}>
				<SlideSettle variant={variant} items={[pill, row]} gap={34} align="center" />
			</AbsoluteFill>
		);
	}
	if (variant === 'onePicture') {
		// the new chip parks with its left end at the measured 81.8% W, so it comes in through the right frame edge
		const chip = (label: string, value: string) => (
			<div style={{display: 'flex', alignItems: 'center', gap: 18, height: 130, padding: '0 46px', borderRadius: 65, backgroundColor: s.surface, border: `3px solid ${s.line}`}}>
				<Word tone={tone} role="caption" color="muted">
					{label}
				</Word>
				<Word tone={tone} role="caption">
					{value}
				</Word>
			</div>
		);
		const gap = num(v, 'gap');
		return (
			<AbsoluteFill>
				<div style={{position: 'absolute', right: `${100 - num(v, 'restLeft')}%`, top: 475, marginRight: gap}}>{chip('size', '16')}</div>
				<div style={{position: 'absolute', left: `${num(v, 'restLeft')}%`, top: 475}}>
					<SlideSettle variant={variant} items={[chip('speed', '2x')]} />
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'deblurRise') {
		// the card's measured rest: top 8.7% H, 54.5% W wide, bottom 91.6% H
		return (
			<AbsoluteFill style={{alignItems: 'center', paddingTop: '8.7%'}}>
				<SlideSettle
					variant={variant}
					items={[
						<Surface key="c" tone={tone} w={1046} h={895} style={{padding: 44, display: 'flex', flexDirection: 'column', gap: 30}}>
							<div style={{display: 'flex', alignItems: 'center', gap: 20}}>
								<Disc tone={tone} d={64} fill="muted" />
								<Word tone={tone} weight={600}>
									north field
								</Word>
								<Word tone={tone} color="muted">
									3 h
								</Word>
							</div>
							<Lines tone={tone} widths={[900, 760]} />
							<div style={{flex: 1, position: 'relative', borderRadius: 20, overflow: 'hidden'}}>
								<FootageSlot label="plate" />
							</div>
						</Surface>,
					]}
				/>
			</AbsoluteFill>
		);
	}
	if (variant === 'fadeRise') {
		return (
			<AbsoluteFill style={{...centre, flexDirection: 'row', gap: 120}}>
				<div style={{display: 'flex', flexDirection: 'column', gap: 26, width: 620}}>
					<Word tone={tone} role="headline">
						Two screens
					</Word>
					<Lines tone={tone} widths={[560, 480, 520]} />
				</div>
				<SlideSettle
					variant={variant}
					items={[
						<Surface key="p" tone={tone} w={380} h={720} fill="ink" line={false} radius={56} style={{padding: 26}}>
							<div style={{position: 'absolute', inset: 26, borderRadius: 34, overflow: 'hidden'}}>
								<FootageSlot tone="dark" label="plate" />
							</div>
						</Surface>,
					]}
				/>
			</AbsoluteFill>
		);
	}
	if (variant === 'fanOut') {
		// upper cards slide up out from behind the first card of each column (first cards drawn on top)
		const colW = 440;
		const gap = 60;
		const cardH = 475;
		const upper = ['a', 'b', 'c'].map((k, i) => (
			<Surface key={k} tone={tone} w={colW} h={cardH} fill="surfaceAlt" style={{padding: 36, display: 'flex', flexDirection: 'column', gap: 22}}>
				<Word tone={tone} role="label">{`${(i + 1) * 12}`}</Word>
				<Lines tone={tone} widths={[300, 340, 220]} />
			</Surface>
		));
		// rest separation of the two card centres: the curve's end value, 47.82% H
		const firstTop = 0.52 * 1080;
		const restSeparation = 0.4782 * 1080;
		return (
			<AbsoluteFill>
				<div style={{position: 'absolute', left: 0, right: 0, top: firstTop - restSeparation, display: 'flex', justifyContent: 'center'}}>
					<SlideSettle variant={variant} items={upper} gap={gap} />
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: firstTop, display: 'flex', justifyContent: 'center', gap}}>
					{[0, 1, 2].map((i) => (
						<Surface key={i} tone={tone} w={colW} h={cardH} style={{padding: 36}}>
							<div style={{position: 'absolute', inset: 0}}>
								<FootageSlot label={`${i + 1}`} />
							</div>
						</Surface>
					))}
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'dropSettle') {
		const header = (
			<div key="h" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 420, height: 70}}>
				<Word tone={tone} weight={600}>
					all notes
				</Word>
				<svg width="40" height="40" viewBox="0 0 40 40">
					<circle cx="17" cy="17" r="11" fill="none" stroke={s.ink} strokeWidth="4" />
					<path d="M25 25 L35 35" stroke={s.ink} strokeWidth="4" strokeLinecap="round" />
				</svg>
			</div>
		);
		const list = <Surface key="l" tone={tone} w={420} h={560} fill="bgAlt" line={false} radius={24} />;
		return (
			<AbsoluteFill style={{...centre, flexDirection: 'row', gap: 60}}>
				<div style={{height: 760, paddingTop: 40}}>
					<SlideSettle variant={variant} items={[header, list]} direction="column" gap={28} />
				</div>
				<Surface tone={tone} w={900} h={760} style={{padding: 48, display: 'flex', flexDirection: 'column', gap: 30}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 18}}>
						<Disc tone={tone} d={56} fill="muted" />
						<Word tone={tone}>today</Word>
					</div>
					<Lines tone={tone} widths={[700, 620, 760, 480]} />
				</Surface>
			</AbsoluteFill>
		);
	}
	if (variant === 'riseBuild') {
		// the composer bar rises with its parts; the send button (second item) grows over the bar's right end
		const bar = (
			<div key="bar" style={{width: 1100, height: 120, borderRadius: 60, border: `3px solid ${s.line}`, backgroundColor: s.surface, display: 'flex', alignItems: 'center', gap: 24, padding: '0 34px', boxSizing: 'border-box'}}>
				<Disc tone={tone} d={60} fill="bgAlt" />
				<Word tone={tone} color="muted">
					type here
				</Word>
			</div>
		);
		const send = (
			<div key="send" style={{width: 84, height: 84, borderRadius: 42, backgroundColor: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<svg width="40" height="40" viewBox="0 0 40 40">
					<path d="M20 31 L20 10 M11 18 L20 9 L29 18" fill="none" stroke={s.onAccent} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</div>
		);
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '6.5%'}}>
				<SlideSettle variant={variant} items={[bar, send]} align="center" gap={-120} />
			</AbsoluteFill>
		);
	}
	// fadeSlide (default)
	return (
		<AbsoluteFill style={centre}>
			<SlideSettle
				variant={variant ?? spec.defaultVariant}
				items={[<DemoCard key="a" tone={tone} label="Left desk" n="~/one" dark />, <DemoCard key="b" tone={tone} label="Right desk" n="~/two" dark />]}
				gap={60}
			/>
		</AbsoluteFill>
	);
};
