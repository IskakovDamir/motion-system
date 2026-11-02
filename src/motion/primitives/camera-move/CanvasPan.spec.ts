import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Travel is the displacement of the scene (content), in % of frame width (x) or height (y): a pan
// right moves the content left (negative x). Scales are about pivotX / pivotY (% of frame), the
// tracked point of the reference, so that point travels exactly the measured distance.
// shutter: frames of travel smeared into one picture (box length / px per frame), measured on
// v8.cam-scroll-exit-up (24 px box at 17 px/f on its cut picture f1002); set on the variants whose
// rows note motion blur at peak speed (or v8, whose look ties blur to speed), off where none is noted.
const SHUTTER = 1.41;

export const spec: PrimitiveSpec = {
	name: 'CanvasPan',
	kind: 'camera',
	description:
		'The camera pans or tilts across one canvas on an eased curve with directional blur at peak speed, sometimes with a small zoom; whip-like pans start slowly, burst for a few pictures and settle long.',
	defaultVariant: 'whipX',
	variants: {
		whipX: {
			// v5.cam-whip-pan (S17 whip 2): card 1 label centre 46.9 -> 11.7% W, scale 1.00, blur f2495-2497
			motions: {x: measured('v5.cam-whip-pan')},
			params: {travelX: -35.3, shutter: SHUTTER},
			reproduces: {x: ['v5.cam-whip-pan']},
		},
		whipReframe: {
			// v5.cam-whip-pan-reframe: old framing eases in (chips row 25.9 -> 13.9% W, f1522-f1535) and keeps its
			// speed to the jump; on f1540 (+18) the new framing is x1.25 with the card centre 13.2% H higher
			// (rims centre 50.2 -> 36.9% H); it then settles from +10.7% W (send button 92.8 -> 82.1% W from f1542,
			// +20), progress 0.37 / 0.60 / 0.77 / 0.89 / 0.97 / 1.0 at +4 / +6 / +8 / +10 / +13 / +15 (outFirmOver
			// over 22 f fits it at rmse 0.007). The ease-in has only its end points: inAccelerate. The card is wider
			// than the frame, so the pivot x is not measured: frame centre.
			motions: {x: motion(13, EASE.inAccelerate), settle: motion(22, EASE.outFirmOver, 20)},
			params: {travelIn: -12.0, travelOut: 10.7, reframeAt: 18, toScale: 1.25, reframeY: -13.2, pivotX: 50, pivotY: 50.2, shutter: SHUTTER},
			covers: ['v5.cam-whip-pan-reframe'],
		},
		whipY: {
			// v5.cam-whip-tilt (S08): chip-2 label y 177 -> 472 px of 918 (content down 32.1% H), x and scale unchanged, vertical blur at peak
			motions: {y: measured('v5.cam-whip-tilt')},
			params: {travelY: 32.1, shutter: SHUTTER},
			reproduces: {y: ['v5.cam-whip-tilt']},
		},
		typingPan: {
			// v6.cam-text-pan: word 2's first letter 845 -> 168 px of 1622 (-41.7% W), horizontal blur at peak; the
			// headline is 27.1% H cap height in that close-up (typography row), used by the demo
			motions: {x: measured('v6.cam-text-pan')},
			params: {travelX: -41.7, capHeight: 27.1, shutter: SHUTTER},
			reproduces: {x: ['v6.cam-text-pan']},
		},
		panUpZoom: {
			// v7.cam-pan-up-zoom: header y 19.7 -> 6.0% H, x 34.4 -> 33.2% W, scale 0.99 -> 1.06 on one curve;
			// then a near-linear drift, header y 6.3 -> 5.1% H and scale 1.06 -> 1.09 over 33 f from f236 (token frame 37)
			motions: {
				y: measured('v7.cam-pan-up-zoom'),
				x: measured('v7.cam-pan-up-zoom'),
				scale: measured('v7.cam-pan-up-zoom'),
				drift: motion(33, linear, 37),
			},
			params: {travelY: -13.7, travelX: -1.2, toScale: 1.07, pivotX: 34.4, pivotY: 19.7, driftY: -1.2, driftScale: 1.028},
			reproduces: {y: ['v7.cam-pan-up-zoom']},
		},
		reframeOut: {
			// v7.cam-reframe-pan-out (S11): pointer 840 -> 484 px of 1622 (-21.9% W) and scale 1.00 -> 0.72 on one
			// curve, motion blur at peak; the pointer's y is not measured: pivot y on the frame centre
			motions: {x: measured('v7.cam-reframe-pan-out'), scale: measured('v7.cam-reframe-pan-out')},
			params: {travelX: -21.9, toScale: 0.72, pivotX: 51.8, pivotY: 50, shutter: SHUTTER},
			reproduces: {x: ['v7.cam-reframe-pan-out']},
		},
		reveal: {
			// v8.cam-pan-reveal: bubble text 59.4 -> 74.0% W (+14.5% W), horizontal motion blur f646-f656
			motions: {x: measured('v8.cam-pan-reveal')},
			params: {travelX: 14.5, shutter: SHUTTER},
			reproduces: {x: ['v8.cam-pan-reveal']},
		},
		tiltTwoPhase: {
			// v5.cam-tilt-reveal: card 1 top edge 95.9 -> 20.1% H (content up 75.8% H) in two speed phases; the rows
			// note no blur, but the reference pictures f3089-f3093 are smeared vertically at the fast phase
			motions: {y: measured('v5.cam-tilt-reveal')},
			params: {travelY: -75.8, shutter: SHUTTER},
			reproduces: {y: ['v5.cam-tilt-reveal']},
		},
		scrollUp: {
			// v7.cam-scroll-up: query centre y 50.0 -> 23.5% H, x 26.8 -> 21.7% W, scale 1.0 -> 0.88 on one curve, blur f354-f361
			motions: {y: measured('v7.cam-scroll-up'), x: measured('v7.cam-scroll-up'), scale: measured('v7.cam-scroll-up')},
			params: {travelY: -26.5, travelX: -5.1, toScale: 0.88, pivotX: 26.8, pivotY: 50.0, shutter: SHUTTER},
			reproduces: {y: ['v7.cam-scroll-up']},
		},
		scrollSettle: {
			// v8.cam-scroll-up-settle: page 88.8 -> 19.2% H (-69.6% H), vertical blur f2262-f2280, then drifts up 0.08% H per frame
			motions: {y: measured('v8.cam-scroll-up-settle')},
			params: {travelY: -69.6, driftPerFrame: -0.08, shutter: SHUTTER},
			reproduces: {y: ['v8.cam-scroll-up-settle']},
		},
	},
	demoFrames: 110,
	demoTone: 'light',
};
