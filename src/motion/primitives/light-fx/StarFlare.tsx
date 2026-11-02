import type React from 'react';
import {AbsoluteFill, random, useVideoConfig} from 'remotion';
import {num, variantOf} from '../../engine/anim';
import {mix, progressAt} from '../../engine/progress';
import {scheme, type Tone} from '../../tokens/colors';
import type {Motion} from '../../tokens/easing';
import {fontSize, FONT, TYPE} from '../../tokens/type';
import type {DemoProps, VariantSpec} from '../types';
import {DRAW} from './draw';
import {CENTRE, clamp01, type Origin, Sparkle, useRefFrame, withAlpha} from './light';
import {spec} from './StarFlare.spec';

export type StarFlareProps = {
	tone?: Tone;
	variant?: string;
	/** anamorphic: where the point light sits, % of the frame */
	origin?: Origin;
	/** sparkle at a streak's head, % of frame width (not measured: DRAW default) */
	sparkleWidth?: number;
	/** streak thickness, px at 1080p (not measured: DRAW default) */
	streakPx?: number;
	/** anamorphic streak thickness and core radius, px at 1080p (not measured: DRAW defaults) */
	bandPx?: number;
	corePx?: number;
};

const mot = (v: VariantSpec, prop: string): Motion => {
	const m = v.motions[prop];
	if (!m) throw new Error(`StarFlare variant has no motion ${prop}`);
	return m;
};

/** A thin horizontal light streak between two x (px), brightest at the head. */
const Streak: React.FC<{tail: number; head: number; y: number; thick: number; color: string}> = ({tail, head, y, thick, color}) => {
	const left = Math.min(tail, head);
	const width = Math.abs(head - tail);
	const toward = head >= tail ? '90deg' : '270deg';
	return (
		<div
			style={{
				position: 'absolute',
				left,
				top: y - thick / 2,
				width,
				height: thick,
				borderRadius: thick,
				background: `linear-gradient(${toward}, transparent, ${color})`,
			}}
		/>
	);
};

export const StarFlare: React.FC<StarFlareProps> = ({
	tone = 'dark',
	variant,
	origin = CENTRE,
	sparkleWidth = DRAW.sparkleWidth,
	streakPx = DRAW.streakPx,
	bandPx = DRAW.flareBandPx,
	corePx = DRAW.flareCorePx,
}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const f = useRefFrame();
	const {width, height} = useVideoConfig();
	const s = scheme(tone);
	const w = (pct: number) => (pct / 100) * width;
	const h = (pct: number) => (pct / 100) * height;
	const px = (at1080: number) => (at1080 * height) / 1080;
	const p = (prop: string, at = f) => progressAt(at, mot(v, prop));

	if (name === 'streakSweep') {
		const lane = (prop: string, from: number, travel: number, y: number) => {
			if (f < mot(v, prop).delay) return null;
			const head = w(from + travel * p(prop));
			const tail = w(from + travel * p(prop, f - DRAW.trailFrames));
			const sw = w(sparkleWidth);
			return (
				<>
					<Streak tail={tail} head={head} y={h(y)} thick={px(streakPx)} color={s.flash} />
					<Sparkle x={head} y={h(y)} w={sw} h={sw} color={s.flash} />
				</>
			);
		};
		return (
			<AbsoluteFill>
				{lane('upper', num(v, 'upperFromX'), num(v, 'upperTravel'), num(v, 'upperY'))}
				{lane('x', num(v, 'fromX'), num(v, 'travel'), num(v, 'y'))}
			</AbsoluteFill>
		);
	}

	if (name === 'drop') {
		const sw = w(num(v, 'fromWidth') + (num(v, 'midWidth') - num(v, 'fromWidth')) * p('grow') + (num(v, 'toWidth') - num(v, 'midWidth')) * p('burst'));
		return (
			<AbsoluteFill>
				<Sparkle x={w(num(v, 'x'))} y={h(mix(p('y'), num(v, 'fromY'), num(v, 'toY')))} w={sw} h={sw * num(v, 'aspect')} color={s.flash} />
			</AbsoluteFill>
		);
	}

	if (name === 'anamorphic') {
		const band = num(v, 'bandPeak') * p('rise') * (1 - p('band'));
		const core = num(v, 'corePeak') * p('rise') * (1 - p('core'));
		const ox = w(origin.x);
		const oy = h(origin.y);
		const thick = px(bandPx);
		return (
			<AbsoluteFill>
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: oy - thick / 2,
						width,
						height: thick,
						background: `linear-gradient(180deg, transparent, ${withAlpha(s.flash, band)}, transparent)`,
					}}
				/>
				<AbsoluteFill style={{background: `radial-gradient(circle ${px(corePx)}px at ${ox}px ${oy}px, ${withAlpha(s.flash, core)}, transparent)`}} />
			</AbsoluteFill>
		);
	}

	// depthField: stars fixed in depth while the camera pushes in; positions and sizes scale from the
	// frame centre at the measured rates, the near ones faster (equal real size: smaller far ones)
	const nearRate = Math.log(num(v, 'nearScale')) / num(v, 'nearFrames');
	const farRate = Math.log(num(v, 'fieldScale')) / num(v, 'fieldFrames');
	const nearW = num(v, 'nearWidth');
	const luma = num(v, 'peakLuma');
	// a near star starts close enough to the axis to stay in frame until the field's last change
	const last = mot(v, 'fade').delay + mot(v, 'fade').duration;
	const stars = Array.from({length: num(v, 'count')}, (_, i) => {
		const near = i < num(v, 'near');
		const k = Math.exp((near ? nearRate : farRate) * f);
		const reach = near ? Math.exp(-nearRate * last) : 1;
		const x = 50 + (random(`sparkle-x-${i}`) * 100 - 50) * reach * k;
		const y = 50 + (random(`sparkle-y-${i}`) * 100 - 50) * reach * k;
		const sw = w((near ? nearW : (nearW * farRate) / nearRate) * k);
		return <Sparkle key={i} x={w(x)} y={h(y)} w={sw} h={sw} color={s.flash} opacity={luma} />;
	});
	const farW = w((nearW * farRate) / nearRate);
	return (
		<AbsoluteFill>
			{stars}
			<Sparkle x={w(num(v, 'emergeX'))} y={h(num(v, 'emergeY'))} w={farW} h={farW} color={s.flash} opacity={luma * clamp01(p('emerge'))} />
			<Sparkle x={w(num(v, 'fadeX'))} y={h(num(v, 'fadeY'))} w={farW} h={farW} color={s.flash} opacity={luma * (1 - clamp01(p('fade')))} />
		</AbsoluteFill>
	);
};

// ---- Demo: plain words on a dark frame for the streaks to run along ----

const Word: React.FC<{text: string; style: React.CSSProperties}> = ({text, style}) => {
	const {height} = useVideoConfig();
	const s = scheme('dark');
	return (
		<div
			style={{
				position: 'absolute',
				fontFamily: FONT.wide,
				fontWeight: 800,
				fontStretch: '125%',
				fontSize: fontSize('headline', height),
				letterSpacing: `${TYPE.headline.tracking}em`,
				color: s.inkSoft,
				lineHeight: 1,
				transform: 'translateY(-50%)',
				...style,
			}}
		>
			{text}
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const s = scheme('dark');
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			{variant === 'streakSweep' ? (
				<>
					<Word text="FIRST LIGHT" style={{left: '7.5%', top: '27%'}} />
					<Word text="SECOND LINE" style={{right: '4.5%', top: '71%'}} />
				</>
			) : null}
			<StarFlare variant={variant} tone="dark" />
		</AbsoluteFill>
	);
};
