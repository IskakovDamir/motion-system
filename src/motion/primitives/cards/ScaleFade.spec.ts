import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Scales are factors about each item's own centre (origin 'own') or the frame centre (origin 'frame': each
// item is a full-frame layer). rise: vertical travel in % of frame height (an entrance rises into place, an
// exit rises away); a list gives one value per item. exit: opacity 1 -> 0 and scale 1 -> toScale.

export const spec: PrimitiveSpec = {
	name: 'ScaleFade',
	kind: 'layout',
	description:
		'A group fades in while growing slightly about its centre (and rising) on an ease-out, or fades out while shrinking or zooming slightly on an ease-in.',
	defaultVariant: 'growIn',
	variants: {
		growIn: {
			// v3.ui-panel-grow-fade-in S03: each panel fades in on the curve while growing 0.9726 -> 1 about its own
			// centre on the .i2 curve, which starts 1 f after the fade (f227 vs f226); panels 2 f apart (f225 / 227 / 229)
			motions: {opacity: measured('v3.ui-panel-grow-fade-in'), scale: measured('v3.ui-panel-grow-fade-in.i2', 1)},
			params: {fromScale: 0.973, stagger: 2, origin: 'own'},
			reproduces: {opacity: ['v3.ui-panel-grow-fade-in']},
		},
		centreGrowIn: {
			// v1.ui-prompt-pop-in S01: the box fades in on the curve; it scales 0.977 -> 1 about the frame centre from f1:
			// 0.977 / 0.982 / 0.986 / 0.990 / 0.993 / 0.995 / 0.997 / 0.998 / 1.000 (f1-f9), outFirm over 11 f (rmse 0.022)
			motions: {opacity: measured('v1.ui-prompt-pop-in'), scale: motion(11, EASE.outFirm, 1)},
			params: {fromScale: 0.977, origin: 'frame'},
			reproduces: {opacity: ['v1.ui-prompt-pop-in']},
		},
		riseGrowIn: {
			// v4.card-rise-scale-fade-in S02: each window fades in, scales 0.970 -> 1 about its centre and rises 30 px
			// (2.8% H), scale and y on the opacity progress (one curve); the second window +3 f
			motions: {
				opacity: measured('v4.card-rise-scale-fade-in'),
				scale: measured('v4.card-rise-scale-fade-in'),
				y: measured('v4.card-rise-scale-fade-in'),
			},
			params: {fromScale: 0.97, rise: 2.8, stagger: 3, origin: 'own'},
			reproduces: {opacity: ['v4.card-rise-scale-fade-in']},
		},
		staggerIn: {
			// v4.layout-team-stagger-fade T05: each team (a hub, its tiles and connectors) fades in as one unit on the
			// curve, no move or scale; one every 3 f (ten teams f1129-f1156)
			motions: {opacity: measured('v4.layout-team-stagger-fade')},
			params: {stagger: 3, origin: 'own'},
			reproduces: {opacity: ['v4.layout-team-stagger-fade']},
		},
		shrinkOut: {
			// v3.ui-panel-shrink-fade-out S03: all panels fade out together on the curve (ease-in) while shrinking
			// 1 -> 0.9693 about their own centres on the .i2 curve (its visible part)
			motions: {opacity: measured('v3.ui-panel-shrink-fade-out'), scale: measured('v3.ui-panel-shrink-fade-out.i2')},
			params: {toScale: 0.969, exit: true, origin: 'own'},
			reproduces: {opacity: ['v3.ui-panel-shrink-fade-out']},
		},
		shrinkCut: {
			// v1.card-shrink-fade-out S03 / S04: both cards scale to 0.966 about their centres and fade on one ease-in
			// curve, cut at 87% of it (last visible luma 217 on 17 -> 246)
			motions: {opacity: measured('v1.card-shrink-fade-out'), scale: measured('v1.card-shrink-fade-out')},
			params: {toScale: 0.966, cutAt: 0.87, exit: true, origin: 'own'},
			reproduces: {opacity: ['v1.card-shrink-fade-out']},
		},
		riseZoomOut: {
			// v1.layout-send-off-exit S01: the box (item 1) rises 37 px (3.4% H) on the curve, ease-in; the icon layer
			// (item 2) scales x1.075 about the frame centre on the same timing; all layers fade 1 -> 0 ease-in over the
			// same 10 f (f101, empty at f112), so the fade takes the rise's curve too
			motions: {
				y: measured('v1.layout-send-off-exit'),
				scale: measured('v1.layout-send-off-exit'),
				opacity: measured('v1.layout-send-off-exit'),
			},
			params: {rise: '3.4 0', toScale: '1 1.075', exit: true, origin: 'frame'},
			reproduces: {y: ['v1.layout-send-off-exit']},
		},
		zoomOut: {
			// v4.layout-zoom-fade-out S01: the whole layer fades out on the curve while scaling 1 -> 1.0315 about the
			// frame centre on the .i2 curve, both from f215
			motions: {opacity: measured('v4.layout-zoom-fade-out'), scale: measured('v4.layout-zoom-fade-out.i2')},
			params: {toScale: 1.032, exit: true, origin: 'frame'},
			reproduces: {opacity: ['v4.layout-zoom-fade-out']},
		},
		shrinkEach: {
			// v4.layout-shrink-fade-out T03: each window fades out on the curve while shrinking to 0.944 about its own
			// centre on the .i2 curve (both active from f720)
			motions: {opacity: measured('v4.layout-shrink-fade-out'), scale: measured('v4.layout-shrink-fade-out.i2')},
			params: {toScale: 0.944, exit: true, origin: 'own'},
			reproduces: {opacity: ['v4.layout-shrink-fade-out']},
		},
	},
	demoFrames: 80,
	demoTone: 'light',
};
