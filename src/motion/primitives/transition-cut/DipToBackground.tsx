import type React from 'react';
import {useVideoConfig} from 'remotion';
import {mix, num, variantOf} from '../../engine/anim';
import type {Tone} from '../../tokens/colors';
import type {DemoProps, VariantSpec} from '../types';
import {between, end, type Layer, makePresentation, mot, type Plan, pct, planTiming, type Rig, type Size, Stage, still, useRefFrame} from './cut';
import {Headline, Panel, Window} from './demo';
import {spec} from './DipToBackground.spec';

/** The layers of a DipToBackground variant: fade out in place, empty background, the next layout. */
export const dipPlan = (v: VariantSpec, size: Size): Plan => {
	const {H} = pct(size);
	const fade = mot(v, 'opacity');
	const scale = v.motions.scale ?? fade;
	const enter = v.motions.enter;
	const title = v.motions.title;
	const pivot = still(num(v, 'pivotX'), num(v, 'pivotY'));
	// the next layout comes in after the held empty frames (or with its own entrance)
	const cut = enter ? enter.delay : end(fade) + num(v, 'emptyFrames');
	const from: Rig = (f, P) => ({...pivot, opacity: 1 - P(fade, f), s: mix(P(scale, f), 1, num(v, 'exitScale'))});
	const to: Rig = (f, P) =>
		enter ? {...pivot, opacity: P(enter, f), s: mix(P(enter, f), num(v, 'enterScale'), 1), y: H(num(v, 'enterY')) * (1 - P(enter, f))} : pivot;
	const layers: Layer[] = [
		{side: 'from', rig: from, on: between(0, cut)},
		{side: 'to', rig: to, on: between(cut)},
	];
	if (title) {
		const rig: Rig = (f, P) => ({...still(), opacity: P(title, f), y: H(num(v, 'titleY')) * (1 - P(title, f))});
		layers.push({side: 'to', part: 'title', rig, on: between(title.delay)});
	}
	return {layers, length: Math.max(cut, ...Object.values(v.motions).map(end))};
};

export type DipToBackgroundProps = {
	from: React.ReactNode;
	to: React.ReactNode;
	tone?: Tone;
	variant?: string;
	/** zoomBuild: the next layout's headline, which drops in last (screen-fixed) */
	title?: React.ReactNode;
};

export const DipToBackground: React.FC<DipToBackgroundProps> = ({from, to, tone = 'light', variant, title}) => {
	const f = useRefFrame();
	const size = useVideoConfig();
	return <Stage plan={dipPlan(variantOf(spec, variant), size)} f={f} nodes={{from, to, title}} tone={tone} />;
};

const planOf = (variant: string, size: Size) => dipPlan(variantOf(spec, variant), size);

/** TransitionSeries presentation (pass the zoomBuild headline as its third argument). */
export const dipToBackgroundPresentation = makePresentation(planOf, spec.defaultVariant);

/** Its timing: a steady clock from the first fading frame until the next layout has settled. */
export const dipToBackgroundTiming = (variant?: string) => planTiming(planOf(variant ?? spec.defaultVariant, {width: 1920, height: 1080}).length);

// ---- Demo ----

const TONE: Tone = spec.demoTone;

/** Isolated demo: a plate-and-word layout dips to the background and a second layout (two windows for zoomBuild) comes in. */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const from = <Panel tone={TONE} word="north" number="24" shape={0} />;
	if (variant === 'zoomBuild') {
		const windows = (
			<>
				<div style={{position: 'absolute', left: '6%', top: '22%', width: '42%', height: '70%'}}>
					<Window tone={TONE} title="chat" inset={0} />
				</div>
				<div style={{position: 'absolute', left: '52%', top: '22%', width: '42%', height: '70%'}}>
					<Window tone={TONE} title="log" inset={0} />
				</div>
			</>
		);
		return <DipToBackground variant={variant} from={from} to={windows} title={<Headline tone={TONE} word="two panels, one view" />} />;
	}
	return <DipToBackground variant={variant} from={from} to={<Panel tone={TONE} word="south" number="108" shape={1} flip />} />;
};
