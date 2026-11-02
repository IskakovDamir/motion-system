import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Pixels: v1-v4 are 1920x1080; v5-v8 are 1622x918 (% of that picture, px x 1080/918 for px at 1080).
// fromX / fromY: offset at the start in % of frame width / height (+ = right / below); a list gives one
// value per item. stagger: frames between items; delays: one start frame per item (instead of stagger).
// Items without an opacity motion are at full value from their start frame (they pop in, no fade).

export const spec: PrimitiveSpec = {
	name: 'SlideSettle',
	kind: 'layout',
	description: 'An element shifts a short distance into place while it fades in or sharpens, on a long ease-out; more follow on a stagger.',
	defaultVariant: 'fadeSlide',
	variants: {
		fadeSlide: {
			// v1.card-slide-fade-in S03/S04: cards first visible at +165 px (+8.6% W), sliding left on the measured
			// curve from f338; opacity 0 -> 1 from f337 (1 f ahead), 14 f, luma 246 / 214 / 165 / 129 / 100 / 79 ... 17
			// (outFirm over 14 f fits the lumas, rmse 0.017); card 2 identical per frame, +3 f
			motions: {x: measured('v1.card-slide-fade-in', 1), opacity: motion(14, EASE.outFirm)},
			params: {fromX: 8.6, stagger: 3},
			reproduces: {x: ['v1.card-slide-fade-in']},
		},
		longThrow: {
			// v8.layout-header-slide-left S15: pill + header row slide left 38.5 -> 10.3% W (28.2% W) on the curve; the
			// pill is there on its first picture, the header row fades in on the way (first ink f1932, full f1934)
			motions: {x: measured('v8.layout-header-slide-left'), opacity: motion(3, linear, 1)},
			params: {fromX: 28.2, fadeFrom: 1},
			reproduces: {x: ['v8.layout-header-slide-left']},
		},
		onePicture: {
			// v5.ui-chip-slide-in S08: the chip parks within one picture: +114 px (7.03% W) on its first picture (f862),
			// +13 px (0.80% W) at f865, -3 px (-0.18% W) at f867, at noise level from f870; no scale, no fade; it enters
			// from the right frame edge (left end 1520 px = 93.7% W at f862) and parks 31 px (36.5 px at 1080) after the
			// previous chip, its left end at 1340 - 13 = 1327 px (81.8% W)
			motions: {},
			params: {stepsX: '0:7.03 3:0.80 5:-0.18 8:0', gap: 36.5, restLeft: 81.8},
			covers: ['v5.ui-chip-slide-in'],
		},
		deblurRise: {
			// v8.ui-card-rise-deblur-in S08: top 145 -> 79.7 px (7.1% H) on the curve; Gaussian blur sigma 6.5 px =
			// 0.40% W (f1004) -> 5.5 (f1007) -> 4.5 (f1008) -> 1.0 (f1010) -> 0.5 px (f1012): inOutWhip4 over 10 f
			// (rmse 0.033); width 852 px at f1008 -> 884 px by f1028 (x0.964 -> 1, the strong ease-out of the rise)
			motions: {y: measured('v8.ui-card-rise-deblur-in'), blur: motion(10, EASE.inOutWhip4), scale: motion(20, EASE.outStrong2, 4)},
			params: {fromY: 7.1, blur: 0.4, fromScale: 0.964},
			reproduces: {y: ['v8.ui-card-rise-deblur-in']},
		},
		fadeRise: {
			// v8.card-rise-fade-in S21: the card fades in on the near-linear curve (20 f) while rising 43 px = 4.7% H
			// relative to the text; the rise has no curve of its own and shares the fade's window
			motions: {opacity: measured('v8.card-rise-fade-in'), y: measured('v8.card-rise-fade-in')},
			params: {fromY: 4.7},
			reproduces: {opacity: ['v8.card-rise-fade-in']},
		},
		fanOut: {
			// v8.card-column-fan-out S13: each column's upper card slides up out from behind the first card, separation
			// 36.06 -> 47.82% H (11.76% H) on the curve; first visible centre f1678, right f1680, left f1683
			motions: {y: measured('v8.card-column-fan-out')},
			params: {fromY: 11.76, delays: '5 0 2'},
			reproduces: {y: ['v8.card-column-fan-out']},
		},
		dropSettle: {
			// v8.ui-sidebar-drop-in S05: the header pops in at full ink 4.68% H above rest (-3.42 -> +1.25% H relative to
			// the panel) and drops on the curve; the list card pops in 3 f later, 41 px = 4.47% H above (25.5 -> 66.5 px),
			// and drops the same way: 25.5 / 47.0 / 57.1 / 64.0 / 66.5 px at +0 / 4 / 8 / 14 / 20 f, outStrong over 20 f
			// (rmse 0.008)
			motions: {y: measured('v8.ui-sidebar-drop-in'), yNext: motion(20, EASE.outStrong)},
			params: {fromY: '-4.68 -4.47', stagger: 3},
			reproduces: {y: ['v8.ui-sidebar-drop-in']},
		},
		riseBuild: {
			// v8.ui-composer-build S05: the outline appears at f612 at full width (no fade) 31 px = 3.4% H below rest and
			// rises on the curve, carrying the later parts; the send button grows 12 -> 41 px (x0.293 -> 1) from f625
			// (+13 f) in 17 f: 12 / 29 / 38 / 41 px at +0 / 5 / 11 / 17 f, outStrongOver2 over 17 f (rmse 0.013)
			motions: {y: measured('v8.ui-composer-build'), grow: motion(17, EASE.outStrongOver2, 13)},
			params: {fromY: 3.4, growFrom: 0.293},
			reproduces: {y: ['v8.ui-composer-build']},
		},
	},
	demoFrames: 100,
	demoTone: 'light',
};
