import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {MEASURED, measured} from '../../tokens/measured';

// Pixels of v5-v8 are of a 1622x918 picture: % W = px / 16.22, % H = px / 9.18.

export const spec: PrimitiveSpec = {
	name: 'LightFlash',
	kind: 'transition',
	description:
		'Light covers the frame and the picture is replaced under it: a white disc grows from a point, a white bloom peaks on the cut and the next shot comes down from it, a flare band peaks on the cut, two stars split apart over the next shot, or a ring inverts what it passes and a second ring brings the next shot.',
	defaultVariant: 'iris',
	variants: {
		iris: {
			// v7.trans-iris-white: white disc radius 13 px -> 932 px (= the frame corners) with an
			// exponential ease-in, then the frame holds white 7 f and the next layout arrives on it
			motions: {progress: measured('v7.trans-iris-white')},
			params: {fromRadius: 0.8, toRadius: 57.5, holdWhite: 7},
			reproduces: {progress: ['v7.trans-iris-white']},
		},
		ringBloom: {
			// v5.trans-flash-white: frame luma rises into full white at the cut (f4015)
			// v5.fx-exposure-recover: the next shot starts at luma 185 over its rest 26.6
			// ((185.2 - 26.6) / (255 - 26.6) = 0.69 white) and comes down in 10 f, ease-out
			// (progress 0.44 / 0.72 / 0.91 / 1.00 at +2 / +5 / +7 / +10 f)
			motions: {
				opacity: measured('v5.trans-flash-white'),
				recover: motion(10, EASE.outStrongOver2, MEASURED['v5.trans-flash-white'].duration),
			},
			params: {recoverFrom: 0.69},
			reproduces: {opacity: ['v5.trans-flash-white']},
			covers: ['v5.fx-exposure-recover'],
		},
		flareCut: {
			// v5.fx-flare-bloom-out: frame luma 32 -> 35.7 -> 64.6 -> 97.1 -> 128.8 over 10 f, cut on the
			// brightest picture: a white wash of (128.8 - 32) / (255 - 32) = 0.43; the band y 380-540 px
			// (centre 50.1 % H, 17.4 % H tall) rises 88 -> 186 luma in 5 f: (186 - 88) / (255 - 88) = 0.59
			motions: {wash: motion(10, EASE.inGentle2), band: motion(5, EASE.inGentle2)},
			params: {washPeak: 0.43, bandPeak: 0.59, bandY: 50.1, bandHeight: 17.4},
			covers: ['v5.fx-flare-bloom-out'],
		},
		starSplit: {
			// v5.trans-star-flash: the dropped star (31.1 % W wide, 625 / 505 px tall/wide at f182) doubles
			// at f185 into two mirror stars sliding apart, accelerating: centre spacing 2.7 / 8.7 / 24.0 % W
			// at +0 / +2 / +5 f; from f190 (+5 f) the gap between them, where the next shot shows, opens
			// 0 -> 100 % W (the curve), and the spacing follows the gap to 2 x 50 + 31.1 = 131.1 % W, both
			// stars out of the frame (54.4 % W at +7 f, >= 90 at +10 f); frame luma 43 -> 138 (+7 f) -> 42
			// (+15 f) while they cover it: (138 - 43) / (255 - 43) = 0.45 white
			motions: {
				progress: measured('v5.trans-star-flash', 5),
				split: motion(5, EASE.inGentle),
				wash: motion(7, EASE.inOutGlide),
				washOut: motion(8, EASE.inOutGlide, 7),
			},
			params: {starWidth: 31.1, starAspect: 1.24, splitEarly: 24.0, splitTo: 131.1, washPeak: 0.45},
			reproduces: {progress: ['v5.trans-star-flash']},
		},
		invertRipple: {
			// v7.fx-ripple-invert: ring 1 inverts what it passes, radius 0 -> 932 px (the frame corners);
			// ring 2 follows 10 f later and restores the polarity
			motions: {progress: measured('v7.fx-ripple-invert'), restore: measured('v7.fx-ripple-invert', 10)},
			params: {toRadius: 57.5},
			reproduces: {progress: ['v7.fx-ripple-invert']},
		},
	},
	demoFrames: 72,
	demoTone: 'light',
};
