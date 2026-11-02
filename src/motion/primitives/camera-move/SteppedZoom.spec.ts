import type {PrimitiveSpec} from '../types';
import {measured} from '../../tokens/measured';

// The measured curve is the envelope of the steps: the component quantises it into the measured
// steps. Frames are counted from the first picture of the move.
// shutter: frames of travel smeared into one picture (box length / px per frame), measured on
// v8.cam-scroll-exit-up (24 px box at 17 px/f on its cut picture f1002).
const SHUTTER = 1.41;

export const spec: PrimitiveSpec = {
	name: 'SteppedZoom',
	kind: 'camera',
	description:
		'A zoom made of quick discrete steps between near-holds, or of stepped, differently centred crops each held to the next picture; the measured curve is the envelope the steps follow.',
	defaultVariant: 'pullBack',
	variants: {
		pullBack: {
			// v1.cam-stepped-zoom-out: 1.00 -> 0.32 about the frame centre in 12 quick 1-5 f steps from f121:
			// f122-126, 134-135, 141-143, 145-146, 150-151, 160-161, 164-166, 172-174, 177-178, 187, 190, 194;
			// each step sweeps the envelope from the previous step's end to its own end, then holds
			motions: {scale: measured('v1.cam-stepped-zoom-out')},
			params: {
				steps: 12,
				toScale: 0.32,
				stepStart: '1, 13, 20, 24, 29, 39, 43, 51, 56, 65, 68, 72',
				stepEnd: '5, 14, 22, 25, 30, 40, 45, 53, 57, 66, 69, 73',
				pivotX: 50,
				pivotY: 50,
			},
			reproduces: {scale: ['v1.cam-stepped-zoom-out']},
		},
		punchStutter: {
			// v6.trans-punch-in-stutter (keyframes in its curve sidecar): 5 pictures, each a differently centred
			// crop held to the next: x1.0 (f303), the envelope at +3 / +8 / +10 (x1.25 / 1.97 / 3.85 measured) about
			// (174, 852) / (1538, 855) / (1539, 859) px of 1622 x 918, then x2.30 about (108, 9) px at +13, off the
			// envelope; empty field from +15 (f318), next scene at +21 (f324). The keyframes note no blur, but the
			// reference crops f306-f313 are smeared: each held crop carries the zoom smear of its own jump
			motions: {scale: measured('v6.trans-punch-in-stutter')},
			params: {
				steps: 5,
				toScale: 3.85,
				stepAt: '3, 8, 10, 13',
				stepFocus: '10.7 92.8, 94.8 93.1, 94.9 93.6, 6.7 1.0',
				lastScale: 2.3,
				emptyAt: 15,
				nextAt: 21,
				shutter: SHUTTER,
			},
			reproduces: {scale: ['v6.trans-punch-in-stutter']},
		},
	},
	demoFrames: 110,
	demoTone: 'light',
};
