import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// The scene leaves on an ease-in and is cut at speed when its motion ends (the measured curve ends on
// the last picture before the cut). Travel is the displacement of the scene in % of frame width (x)
// or height (y); scales are about pivotX / pivotY (% of frame).
// shutter: frames of travel smeared into one picture (box length / px per frame), measured on
// v8.cam-scroll-exit-up (24 px box at 17 px/f on its cut picture f1002); set where the rows note
// growing motion or zoom blur (and on v8, whose look ties blur to speed).
const SHUTTER = 1.41;

export const spec: PrimitiveSpec = {
	name: 'AccelerateExit',
	kind: 'camera',
	description:
		'The whole layout (or one block) accelerates out along one axis or in scale on an ease-in with growing motion blur and is cut at speed, with no settle; optionally after an anticipation dip.',
	defaultVariant: 'up',
	variants: {
		up: {
			// v7.cam-whip-exit-up (S23): folder centre 47.9 -> 36.8% H, growing vertical blur, cut at 1.5% H per frame
			motions: {y: measured('v7.cam-whip-exit-up')},
			params: {axis: 'y', travelY: -11.1, shutter: SHUTTER},
			reproduces: {y: ['v7.cam-whip-exit-up']},
		},
		driftUp: {
			// v8.cam-scroll-exit-up (S07): row 1 centre 222 -> 104 px of 918 (-12.9% H), blur box 2 -> 24 px
			motions: {y: measured('v8.cam-scroll-exit-up')},
			params: {axis: 'y', travelY: -12.9, shutter: SHUTTER},
			reproduces: {y: ['v8.cam-scroll-exit-up']},
		},
		left: {
			// v8.cam-slide-exit-left: caption block 560 -> 409 px of 1622 (-9.3% W), 0.5 -> 22 px/f at the cut; no blur
			// noted, and the cut picture f1324 is barely smeared, so no shutter
			motions: {x: measured('v8.cam-slide-exit-left')},
			params: {axis: 'x', travelX: -9.3},
			reproduces: {x: ['v8.cam-slide-exit-left']},
		},
		drift: {
			// v7.cam-drift-accelerating-exit: transport controls 60.8 -> 56.2% W over 80+ f, no motion blur
			motions: {x: measured('v7.cam-drift-accelerating-exit')},
			params: {axis: 'x', travelX: -4.6},
			reproduces: {x: ['v7.cam-drift-accelerating-exit']},
		},
		blockUp: {
			// v8.text-block-exit-up: block 22.1 -> 4.9% H, growing vertical blur
			motions: {y: measured('v8.text-block-exit-up')},
			params: {axis: 'y', travelY: -17.2, shutter: SHUTTER},
			reproduces: {y: ['v8.text-block-exit-up']},
		},
		anticipateUp: {
			// v6.layout-anticipate-exit-up: pill centre dips 792.9 -> 829.1 px of 918 (+3.9% H) over f113-f123
			// (readings at +0 / +5 / +8 / +10: 0.05 / 0.69 / 0.95 / 1.0, inOutWhip fits at rmse 0.03), then the exit
			// curve 792.9 -> 49.4 px (-81.0% H from rest, token frame 0 = f124) with growing vertical blur
			motions: {dip: motion(10, EASE.inOutWhip), y: measured('v6.layout-anticipate-exit-up', 11)},
			params: {axis: 'y', dipY: 3.9, travelY: -81.0, shutter: SHUTTER},
			reproduces: {y: ['v6.layout-anticipate-exit-up']},
		},
		hoverUp: {
			// v5.3d-card-exit-up: card centre 50.7 -> 17.2% H, cut mid-exit; scale 0.99 -> 0.96 linear over 30 f from
			// f4135 (token frame 21); the rows note no blur, but the cut picture f4165 is smeared vertically; card
			// centre x not measured: pivot x on the frame centre
			motions: {y: measured('v5.3d-card-exit-up'), scale: motion(30, linear, 21)},
			params: {axis: 'y', travelY: -33.5, toScale: 0.97, pivotX: 50, pivotY: 50.7, shutter: SHUTTER},
			reproduces: {y: ['v5.3d-card-exit-up']},
		},
		peekSnap: {
			// v5.text-edge-peek-exit: a line held cut off by the top edge (lowest 4.6-4.9% H of letters 128-131 px
			// = 14.1% H tall in frame) for 23 f, then 2 pictures: -0.6% H at +23 (f3130), -4.1% H smeared at +25
			// (f3132), gone at +28 (f3135); no curve (a 2-picture step)
			motions: {},
			params: {axis: 'y', stepAt: '23, 25', stepY: '-0.6, -4.1', goneAt: 28, peek: 4.7, glyph: 14.1, shutter: SHUTTER},
			covers: ['v5.text-edge-peek-exit'],
		},
		pushIntoCut: {
			// v5.cam-push-in-accelerate (S11): whole UI box ~1.04 -> ~2.7 of rest (x2.6) about the button centre
			// (50.6, 49.0% at f1680), zoom blur into the hard cut
			motions: {scale: measured('v5.cam-push-in-accelerate')},
			params: {axis: 'scale', toScale: 2.6, pivotX: 50.6, pivotY: 49.0, shutter: SHUTTER},
			reproduces: {scale: ['v5.cam-push-in-accelerate']},
		},
		punchBreak: {
			// v7.cam-push-in-accelerating: label width 55.8 -> 61.1% W (x1.095), then a 5 f punch to 75.3% W
			// (x1.232, 2.8% W per frame, blurred) and a near-linear 20 f drift to 86.4% W (x1.147); the label's
			// position is not measured: pivot on the frame centre
			motions: {scale: measured('v7.cam-push-in-accelerating'), punch: motion(5, linear, 56), drift: motion(20, linear, 61)},
			params: {axis: 'scale', toScale: 1.095, punchScale: 1.232, driftScale: 1.147, pivotX: 50, pivotY: 50, shutter: SHUTTER},
			reproduces: {scale: ['v7.cam-push-in-accelerating']},
		},
		oversizeLanding: {
			// v8.cam-push-in-accelerating: front card x1.62 (height 52.8 -> 85.5% H) while its right edge goes
			// 44.8 -> 82.8% W, so the scale is about x = (1.62 * 44.8 - 82.8) / 0.62 = -16.5% W (left of the frame);
			// the pivot y is not measured: frame centre
			motions: {scale: measured('v8.cam-push-in-accelerating')},
			params: {axis: 'scale', toScale: 1.62, pivotX: -16.5, pivotY: 50, shutter: SHUTTER},
			reproduces: {scale: ['v8.cam-push-in-accelerating']},
		},
		pullIntoCut: {
			// v6.cam-pull-back-cut (S11): 1.02 -> 0.40 (x0.39) about the frame centre (811, 462 px of 1622 x 918 in
			// S07), growing zoom blur, cut at its fastest picture
			motions: {scale: measured('v6.cam-pull-back-cut')},
			params: {axis: 'scale', toScale: 0.39, pivotX: 50.0, pivotY: 50.3, shutter: SHUTTER},
			reproduces: {scale: ['v6.cam-pull-back-cut']},
		},
		blurPullExit: {
			// v7.cam-pull-back-blur-exit: 1.0 -> 0.835 about (48.7% W, 50.4% H), growing motion blur, into the hard cut
			motions: {scale: measured('v7.cam-pull-back-blur-exit')},
			params: {axis: 'scale', toScale: 0.835, pivotX: 48.7, pivotY: 50.4, shutter: SHUTTER},
			reproduces: {scale: ['v7.cam-pull-back-blur-exit']},
		},
	},
	demoFrames: 130,
	demoTone: 'light',
};
