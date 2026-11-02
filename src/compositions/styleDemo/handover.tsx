import {type TransitionPresentation, TransitionSeries, type TransitionTiming} from '@remotion/transitions';
import type React from 'react';
import {num, variantOf} from '../../motion/engine/anim';
import {accelerateExitPresentation, accelerateExitTiming} from '../../motion/primitives/camera-move/AccelerateExit';
import {steppedZoomPresentation, steppedZoomTiming} from '../../motion/primitives/camera-move/SteppedZoom';
import {lightFlashPresentation, lightFlashTiming} from '../../motion/primitives/light-fx/LightFlash';
import {spec as lightFlashSpec} from '../../motion/primitives/light-fx/LightFlash.spec';
import {contentSwapPresentation, contentSwapTiming} from '../../motion/primitives/transition-morph/ContentSwap';
import {spec as contentSwapSpec} from '../../motion/primitives/transition-morph/ContentSwap.spec';
import type {CutPresentationProps, Plan} from '../../motion/primitives/transition-cut/cut';
import {dipPlan, dipToBackgroundPresentation, dipToBackgroundTiming} from '../../motion/primitives/transition-cut/DipToBackground';
import {spec as dipSpec} from '../../motion/primitives/transition-cut/DipToBackground.spec';
import {whipCutPresentation, whipCutTiming, whipPlan} from '../../motion/primitives/transition-cut/WhipCut';
import {spec as whipSpec} from '../../motion/primitives/transition-cut/WhipCut.spec';
import {zoomThroughPresentation, zoomThroughTiming} from '../../motion/primitives/transition-morph/ZoomThrough';
import {spec as zoomThroughSpec} from '../../motion/primitives/transition-morph/ZoomThrough.spec';
import type {Tone} from '../../motion/tokens/colors';
import {REF_FPS} from '../../motion/tokens/timing';
import {STYLE_DEMO_FPS, type Into} from '../styleDemoShots';

// Each boundary of the edit as the group primitives build it: the TransitionSeries transition (none for
// a hard cut), how many frames the two shots overlap under it, the frame of the overlap where the viewer
// sees the next shot replace the last one (the cut), and the camera the next shot arrives with when the
// boundary is an exit into a cut. Every number comes from the primitive's spec or its timing.

export type Handover = {
	/** frames the two sequences overlap (the transition's duration) */
	overlap: number;
	/** frame of the overlap at which the incoming shot is first seen */
	cut: number;
	/** CutInSettle variant the incoming shot arrives with */
	arrive?: string;
	/** the TransitionSeries.Transition, tone = the incoming shot's tone */
	element?: (tone: Tone, key: string) => React.ReactNode;
};

const fps = STYLE_DEMO_FPS;
const frames = (t: TransitionTiming) => t.getDurationInFrames({fps});
/** A reference-frame instant of a spec (60 fps) on the composition clock. */
const atFps = (refFrames: number) => Math.ceil((refFrames * fps) / REF_FPS);

/** An exit into a cut: the outgoing shot runs the whole move, the incoming one appears when it ends. */
const exit = (timing: TransitionTiming, element: Handover['element'], arrive?: string): Handover => ({
	overlap: frames(timing),
	cut: frames(timing),
	arrive,
	element,
});

/** The first picture of a transition-cut plan in which the incoming scene is on screen. */
const planCut = (plan: Plan): number => {
	const shows = (f: number) => plan.layers.some((l) => l.side === 'to' && (l.part ?? 'scene') === 'scene' && l.on(f));
	let f = 0;
	while (f < plan.length && !shows(f)) f++;
	return atFps(f);
};
const SIZE = {width: 1920, height: 1080};

/** A WhipCut or DipToBackground boundary: the plan's own cut, over a ground of the shots' shared tone. */
const cutPlan = (
	plan: Plan,
	timing: TransitionTiming,
	presentation: (tone: Tone) => TransitionPresentation<CutPresentationProps>,
): Handover => ({
	overlap: frames(timing),
	cut: planCut(plan),
	element: (tone, key) => <TransitionSeries.Transition key={key} presentation={presentation(tone)} timing={timing} />,
});

const flashTiming = lightFlashTiming('ringBloom');
const zoomTiming = zoomThroughTiming('cutContinue');
const dropTiming = contentSwapTiming('dropThrough');

export const HANDOVER: Record<Into, Handover> = {
	cut: {overlap: 0, cut: 0},
	flash: {
		overlap: frames(flashTiming),
		// the bloom peaks on the cut; the next shot comes down from white from there
		cut: atFps(variantOf(lightFlashSpec, 'ringBloom').motions.recover?.delay ?? 0),
		element: (tone, key) => <TransitionSeries.Transition key={key} presentation={lightFlashPresentation('ringBloom', tone)} timing={flashTiming} />,
	},
	zoom: {
		overlap: frames(zoomTiming),
		cut: atFps(num(variantOf(zoomThroughSpec, 'cutContinue'), 'cut')),
		element: (tone, key) => <TransitionSeries.Transition key={key} presentation={zoomThroughPresentation('cutContinue', tone)} timing={zoomTiming} />,
	},
	slideExit: exit(
		accelerateExitTiming('left'),
		(_tone, key) => <TransitionSeries.Transition key={key} presentation={accelerateExitPresentation('left')} timing={accelerateExitTiming('left')} />,
		'slideLeft',
	),
	push: exit(
		accelerateExitTiming('anticipateUp'),
		(_tone, key) => (
			<TransitionSeries.Transition key={key} presentation={accelerateExitPresentation('anticipateUp')} timing={accelerateExitTiming('anticipateUp')} />
		),
		'throwUp',
	),
	liftExit: exit(
		accelerateExitTiming('up'),
		(_tone, key) => <TransitionSeries.Transition key={key} presentation={accelerateExitPresentation('up')} timing={accelerateExitTiming('up')} />,
		'blurLow',
	),
	drop: {
		overlap: frames(dropTiming),
		cut: atFps(num(variantOf(contentSwapSpec, 'dropThrough'), 'cut')),
		element: (_tone, key) => <TransitionSeries.Transition key={key} presentation={contentSwapPresentation('dropThrough')} timing={dropTiming} />,
	},
	steps: exit(steppedZoomTiming('pullBack'), (_tone, key) => (
		<TransitionSeries.Transition key={key} presentation={steppedZoomPresentation('pullBack')} timing={steppedZoomTiming('pullBack')} />
	)),
	whip: cutPlan(whipPlan(variantOf(whipSpec, 'pushLeft'), SIZE), whipCutTiming('pushLeft'), (tone) => whipCutPresentation('pushLeft', tone)),
	whipUp: cutPlan(whipPlan(variantOf(whipSpec, 'riseUp'), SIZE), whipCutTiming('riseUp'), (tone) => whipCutPresentation('riseUp', tone)),
	dip: cutPlan(dipPlan(variantOf(dipSpec, 'groupFade'), SIZE), dipToBackgroundTiming('groupFade'), (tone) => dipToBackgroundPresentation('groupFade', tone)),
};
