import type React from 'react';
import {useVideoConfig} from 'remotion';
import {maybe, num, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps, VariantSpec} from '../types';
import {between, end, makePresentation, type Plan, pct, planTiming, type Rig, type Size, Stage, still, useRefFrame} from './cut';
import {Canvas, Headline, Overlay, Panel, Plate, Window} from './demo';
import {spec} from './HardCut.spec';

/**
 * The layers of a HardCut variant. In the component the outgoing picture shows for `before` frames
 * (or until its matched move ends); in a TransitionSeries the cut opens the overlap, so a plain cut
 * with no empty frames has no overlap at all.
 */
export const hardCutPlan = (v: VariantSpec, size: Size, mode: 'component' | 'series', emptyFrames?: number): Plan => {
	const {H} = pct(size);
	const out = v.motions.out;
	const into = v.motions.in;
	const empty = emptyFrames ?? num(v, 'emptyFrames');
	const cut = into ? into.delay : mode === 'component' ? num(v, 'before') : 0;
	const shutter = maybe(v, 'shutter');
	const from: Rig = (f, P) => ({...still(), y: out ? H(num(v, 'outY')) * P(out, f) : 0});
	const to: Rig = (f, P) => ({...still(), y: into ? H(num(v, 'inY')) * (1 - P(into, f)) : 0});
	return {
		layers: [
			{side: 'from', rig: from, on: between(0, cut), shutter},
			{side: 'to', rig: to, on: between(cut + empty), shutter},
			// an overlay above both scenes, unchanged by the cut (the component only: in a series it sits above the series)
			{side: 'to', part: 'overlay', rig: () => still(), on: between(0)},
		],
		length: Math.max(cut + empty, into ? end(into) : 0),
	};
};

export type HardCutProps = {
	from: React.ReactNode;
	to: React.ReactNode;
	tone?: Tone;
	variant?: string;
	/** empty canvas frames before the next layout (the measured cuts hold 0, or 1-6) */
	emptyFrames?: number;
	/** overlayHold: a layer that holds across the cut */
	overlay?: React.ReactNode;
};

export const HardCut: React.FC<HardCutProps> = ({from, to, tone = 'light', variant, emptyFrames, overlay}) => {
	const f = useRefFrame();
	const size = useVideoConfig();
	return <Stage plan={hardCutPlan(variantOf(spec, variant), size, 'component', emptyFrames)} f={f} nodes={{from, to, overlay}} tone={tone} />;
};

const planOf = (variant: string, size: Size) => hardCutPlan(variantOf(spec, variant), size, 'series');

/** TransitionSeries presentation: the matched moves of motionMatch, or the empty frames of a cut; length 0 is a plain cut. */
export const hardCutPresentation = makePresentation(planOf, spec.defaultVariant);

/** Its timing (0 frames for a plain cut). */
export const hardCutTiming = (variant?: string) => planTiming(planOf(variant ?? spec.defaultVariant, {width: 1920, height: 1080}).length);

// ---- Demo ----

const TONE: Tone = spec.demoTone;

/** Isolated demo: canvas "one" cut to canvas "two"; overlayHold cuts two gray plates under a word that stays. */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	if (variant === 'overlayHold') {
		return (
			<HardCut
				variant={variant}
				from={<Plate tone="light" label="shot a" />}
				to={<Plate tone="dark" label="shot b" />}
				overlay={<Overlay tone={TONE} word="level" />}
			/>
		);
	}
	if (variant === 'motionMatch') {
		// a card cut mid-exit (already high, as the measured card at the moment's start) to a window with a
		// caption rising in, on one shared field
		const card = (
			<div style={{position: 'absolute', left: '26%', top: '1%', width: '48%', height: '57%', borderRadius: 28, overflow: 'hidden', border: `3px solid ${scheme(TONE).ink}`}}>
				<Panel tone={TONE} word="north" number="24" shape={0} />
			</div>
		);
		const group = (
			<>
				<div style={{position: 'absolute', left: '16%', top: '7%', width: '68%', height: '73%'}}>
					<Window tone={TONE} title="field" inset={0} />
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: '74%', height: '26%'}}>
					<Headline tone={TONE} word="three plain words" />
				</div>
			</>
		);
		return <HardCut variant={variant} from={card} to={group} />;
	}
	return <HardCut variant={variant} from={<Canvas tone={TONE} seed="one" word="one" />} to={<Canvas tone={TONE} seed="two" word="two" alt />} />;
};
