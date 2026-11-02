import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {maybe, mix, num, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FootageSlot} from '../footage/FootageSlot';
import type {DemoProps} from '../types';
import {CAP_RATIO, FONT} from '../../tokens/type';
import {Lines, Surface, Word} from './kit';
import {spec} from './OversizeSettle.spec';

export type OversizeSettleProps = {children: React.ReactNode; tone?: Tone; variant?: string; style?: React.CSSProperties};

// The element starts at fromScale and shrinks to 1 on the scale motion about its anchor (originX /
// originY, % of its own box). Before the motion starts it holds firstScale (the measured first pictures).
export const OversizeSettle: React.FC<OversizeSettleProps> = ({children, variant, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const m = v.motions.scale;
	const first = maybe(v, 'firstScale');
	const scale = first !== undefined && m && frame < m.delay ? first : mix(p('scale'), num(v, 'fromScale'), 1);
	return (
		<div style={{transform: `scale(${scale})`, transformOrigin: `${num(v, 'originX')}% ${num(v, 'originY')}%`, ...style}}>
			{children}
		</div>
	);
};

// ---- isolated demo ----

const W = 1920;

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const v = variantOf(spec, variant);
	if (variant === 'hugeShrink') {
		// the second word shrinks in about a point on the line's centre line left of it, so it also travels in;
		// the word's ascender height (about its cap height) is the measured rest ink height
		const size = ((num(v, 'inkH') / 100) * 1080) / CAP_RATIO.display;
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 80}}>
					<Word tone={tone} role="display" color="muted" style={{fontSize: size}}>
						go
					</Word>
					<OversizeSettle variant={variant}>
						<Word tone={tone} role="display" style={{fontSize: size, display: 'block'}}>
							small
						</Word>
					</OversizeSettle>
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'blurShrink') {
		const t = (num(v, 'tileW') / 100) * W;
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<OversizeSettle variant={variant}>
					<Surface tone={tone} w={t} h={t} fill="ink" line={false} radius={t * 0.24} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<svg width={t * 0.5} height={t * 0.5} viewBox="0 0 100 100">
							<circle cx="38" cy="38" r="24" fill={s.onAccent} />
							<rect x="48" y="48" width="40" height="40" rx="8" fill={s.muted} />
						</svg>
					</Surface>
				</OversizeSettle>
			</AbsoluteFill>
		);
	}
	if (variant === 'quickSettle') {
		const bw = (num(v, 'buttonW') / 100) * W;
		const bh = (num(v, 'buttonH') / 100) * 1080;
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<Surface tone={tone} w={1100} h={200} radius={36} style={{display: 'flex', alignItems: 'center', gap: 40, padding: '0 48px'}}>
					<Surface tone={tone} w={110} h={110} fill="surfaceAlt" line={false} radius={26} />
					<div style={{display: 'flex', flexDirection: 'column', gap: 14, flex: 1}}>
						<Word tone={tone} weight={600}>
							Daily list
						</Word>
						<Lines tone={tone} widths={[360]} h={14} />
					</div>
					<OversizeSettle variant={variant}>
						<div style={{width: bw, height: bh, borderRadius: bh / 2, backgroundColor: s.ink, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<Word tone={tone} color="onAccent" weight={600}>
								Start
							</Word>
						</div>
					</OversizeSettle>
				</Surface>
			</AbsoluteFill>
		);
	}
	if (variant === 'riseSettle') {
		const cw = (num(v, 'cardW') / 100) * W;
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<OversizeSettle variant={variant}>
					<Surface tone={tone} w={cw} h={cw * 1.3} radius={30}>
						<div style={{position: 'absolute', inset: 0}}>
							<FootageSlot label="picture" />
						</div>
					</Surface>
				</OversizeSettle>
			</AbsoluteFill>
		);
	}
	// settle (default): a caps line laid between the measured left edge and its mirror about the baseline centre,
	// so at its oversized start it is cut by the left frame edge
	const left = num(v, 'restLeft');
	const span = 2 * (num(v, 'anchorX') - left);
	const cap = (num(v, 'capH') / 100) * 1080;
	const size = cap / CAP_RATIO.square;
	return (
		<AbsoluteFill>
			<OversizeSettle
				variant={variant ?? spec.defaultVariant}
				style={{position: 'absolute', left: `${left}%`, width: `${span}%`, top: (num(v, 'anchorY') / 100) * 1080 - cap, height: cap}}
			>
				<svg width="100%" height={cap} style={{overflow: 'visible', display: 'block'}}>
					<text x={0} y={cap} textLength={(span / 100) * W} lengthAdjust="spacingAndGlyphs" fontFamily={FONT.square} fontWeight={700} fontSize={size} fill={s.ink}>
						<tspan fill={s.muted}>12 </tspan>NEW ROWS
					</text>
				</svg>
			</OversizeSettle>
		</AbsoluteFill>
	);
};
