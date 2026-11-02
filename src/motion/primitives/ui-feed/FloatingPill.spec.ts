import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Offsets are from the pill's rest centre (restX % W, restY % H), positive = right / down. All
// references here are 1622x918 (v6, v8): px / 9.18 = % H, px / 16.22 = % W. `layer*` params and
// motions belong to the layer the pill rides (the demo moves it), so the pill's move reads against it.

export const spec: PrimitiveSpec = {
	name: 'FloatingPill',
	kind: 'ui',
	description:
		'A floating status pill or toast with its icon: it enters (drops along a curve, rises through the bottom edge with an overshoot, whips up), drifts against the layer under it, and leaves (smears out, fades and slides, lifts and drops away).',
	defaultVariant: 'dropIn',
	variants: {
		dropIn: {
			// v8.ui-status-pill-drop-in S08: from x 77.4% / y 19.8% to rest x 66.2% / y 51.8% along a curved path
			// (y drops first, x slides on); a quadratic path with its control at 0.23 of the x travel and the
			// full y travel passes the f1008 / f1010 / f1012 samples within 5.5 px; then a slow drift down
			// about 0.5 px/f (0.054% H per frame)
			motions: {progress: measured('v8.ui-status-pill-drop-in')},
			params: {restX: 66.2, restY: 51.8, fromX: 11.2, fromY: -32.0, bendX: 0.23, bendY: 1.0, settleDriftY: 0.054},
			reproduces: {progress: ['v8.ui-status-pill-drop-in']},
		},
		riseLevel: {
			// v8.ui-status-pill-rise-level: centre 838 px (f1192) -> 779 (f1220) -> 788 px (f1230): 91.3% ->
			// rest 85.8% H through 1.0% H past rest (inOutWhipOver3 over 38 f, rmse 0.011); tilt -5.2 deg (right
			// end up, f1192) -> -3.4 (f1216) -> -1.2 (f1230) -> -0.15 (f1240) (inGentle2 over 44 f, rmse 0.017)
			motions: {y: motion(38, EASE.inOutWhipOver3), tilt: motion(44, EASE.inGentle2)},
			params: {restY: 85.8, fromY: 5.45, tiltFrom: -5.2},
			covers: ['v8.ui-status-pill-rise-level'],
		},
		whipUp: {
			// v8.ui-status-pill-whip-in-up: from below the bottom edge, centre 783 -> 639 px (85.3% -> 69.6% H), x fixed
			motions: {y: measured('v8.ui-status-pill-whip-in-up')},
			params: {restY: 69.6, fromY: 15.7},
			reproduces: {y: ['v8.ui-status-pill-whip-in-up']},
		},
		counterDrift: {
			// v8.ui-status-pill-drift S08: centre 788 -> 830 px (85.8% -> 90.4% H, 42 px = 4.58% H down) in 28 f,
			// linear-ish, while the card under it rises 9 px (top 55 -> 46 px = 0.98% H)
			motions: {y: motion(28, linear), layer: motion(28, linear)},
			params: {restY: 85.8, toY: 4.58, layerY: -0.98},
			covers: ['v8.ui-status-pill-drift'],
		},
		trackFootage: {
			// v8.ui-overlay-follow-footage: after landing (69.6% H, the whip-in rest) the pill drifts y +74 px
			// (8.06% H) in 42 f, then -25 px (2.72% H) to f3241 (23 f), x +13 px (0.80% W) over the 65 f,
			// linear-ish; the footage's foreground moves +66 px (7.19% H) then -16 px (1.74% H) in y meanwhile
			motions: {
				y: motion(42, linear),
				back: motion(23, linear, 42),
				x: motion(65, linear),
				layer: motion(42, linear),
				layerBack: motion(23, linear, 42),
			},
			params: {restY: 69.6, toY: 8.06, backY: -2.72, toX: 0.8, layerY: 7.19, layerBackY: -1.74},
			covers: ['v8.ui-overlay-follow-footage'],
		},
		smearOut: {
			// v8.fx-overlay-vertical-smear-out: 17 f exit (f3029-f3046): pill fill coverage 0.82 -> 0.65 (f3042)
			// -> 0.44 (f3044) -> gone (inLaunch2 over 17 f); the mascot grows from 130 px tall to a 240 px
			// streak by f3044 (x1.85; label gradient 10.5 -> 4.3 -> 1.6 -> 0.9: inLaunch2 over 14 f, rmse 0.010)
			motions: {opacity: motion(17, EASE.inLaunch2), stretch: motion(14, EASE.inLaunch2)},
			params: {fadeOut: true, stretchY: 1.85},
			covers: ['v8.fx-overlay-vertical-smear-out'],
		},
		edgeRise: {
			// v6.ui-pill-rise: from below the bottom edge, centre 883 -> 803.5 px (96.2% -> 87.5% H)
			motions: {y: measured('v6.ui-pill-rise')},
			params: {restY: 87.5, fromY: 8.7},
			reproduces: {y: ['v6.ui-pill-rise']},
		},
		overshootRise: {
			// v8.ui-prompt-pill-rise-in: centre 89.9% -> 70.4% H (19.5% H) from below the frame, past rest and back
			motions: {y: measured('v8.ui-prompt-pill-rise-in')},
			params: {restY: 70.4, fromY: 19.5},
			reproduces: {y: ['v8.ui-prompt-pill-rise-in']},
		},
		liftDrop: {
			// v8.ui-pill-anticipate-drop-out: lift 70.48% -> 64.92% H (-5.56% H) in 9 f, no hold, then the drop
			// (.i2: 64.92% -> 86.71% H = 21.79% H by f446, ease-in, inAccelerate over 8 f) starting 11 f after the
			// lift (f429 -> f440; 12 f between the two tokens' starts, as each eases in from rest); it falls on
			// through the bottom edge at its exit speed (gone at f452)
			motions: {y: measured('v8.ui-pill-anticipate-drop-out'), drop: motion(8, EASE.inAccelerate, 12)},
			params: {restY: 70.48, toY: -5.56, dropY: 21.79},
			reproduces: {y: ['v8.ui-pill-anticipate-drop-out']},
		},
		toastIn: {
			// v8.ui-toast-fade-in: opacity 0 -> 1 on a linear ramp, about 0.085 per frame, 12 f; no slide or scale
			motions: {opacity: motion(12, linear)},
			params: {},
			covers: ['v8.ui-toast-fade-in'],
		},
		toastOut: {
			// v8.ui-toast-fade-slide-out: fades out in 16 f while sliding 10.3 px (1.12% H) down against the page
			// by f2370 (12 f; the slide takes the fade's shape), as the page drifts up 9 px (0.98% H)
			motions: {opacity: measured('v8.ui-toast-fade-slide-out'), y: motion(12, EASE.inOutGlideOver), layer: motion(12, EASE.inOutGlideOver)},
			params: {fadeOut: true, toY: 1.12, layerY: -0.98},
			reproduces: {opacity: ['v8.ui-toast-fade-slide-out']},
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
