import type {PrimitiveSpec} from '../types';
import {linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Scales are about pivotX / pivotY (% of frame; a pivot outside 0-100 lies off the frame, so the push
// also slides the layer); px are of the analysed picture (v5-v8 1622 x 918). A curve measured on a point
// the zoom carries (scaleBy) drives the zoom with its own progress: the point moves with exactly it.
// shutter: frames of travel smeared into one picture (box length / px per frame), measured on
// v8.cam-scroll-exit-up (24 px box at 17 px/f on its cut picture f1002), as in camera-move; set where the
// rows note blur on the fast pictures.
const SHUTTER = 1.41;

export const spec: PrimitiveSpec = {
	name: 'PushIn',
	kind: 'camera',
	description:
		'The camera pushes in on a region and settles: slow start, a fast blurred middle and an ease-out into a creep, about the frame centre or a point off it; or a scale jump in one picture after an accelerating approach.',
	defaultVariant: 'blurSettle',
	variants: {
		blurSettle: {
			// v7.cam-push-in-blur S03: the whole page x1.0 (f304) -> x1.79 (f331), blurred f309-f319; the page title
			// centre (17.3, 38.8)% -> (26.0, 12.7)%, a pure zoom about ((1.79 * 17.3 - 26.0) / 0.79, (1.79 * 38.8 -
			// 12.7) / 0.79) = (6.3, 71.8)% (the f321 fixed point (103, 662) px = (6.4, 72.1)% agrees). It does not
			// settle: from f331 (token frame 31) the creep v7.cam-slow-push-creep takes over, x1.0115 in 16 f,
			// linear, about the frame centre
			motions: {scale: measured('v7.cam-push-in-blur'), creep: motion(16, linear, 31)},
			params: {toScale: 1.79, pivotX: 6.3, pivotY: 71.8, creepScale: 1.0115, creepX: 50, creepY: 50, shutter: SHUTTER},
			reproduces: {scale: ['v7.cam-push-in-blur']},
		},
		cornerSettle: {
			// v7.cam-push-in-corner-settle S33: entered mid-move at the cut, x1.00 -> x1.64 about (1645, 30) px =
			// (101.4, 3.3)% of 1622 x 918, decelerating to rest in 33 f; the curve is the card top edge
			// (523 -> 836 px), which the zoom carries, so it drives the zoom. No blur noted
			motions: {y: measured('v7.cam-push-in-corner-settle')},
			params: {scaleBy: 'y', toScale: 1.64, pivotX: 101.4, pivotY: 3.3},
			reproduces: {y: ['v7.cam-push-in-corner-settle']},
		},
		pivotBelow: {
			// v8.cam-push-in-pan S22: device card and UI x1.000 -> x1.429 about the fixed point (1507, 1927) px =
			// (92.9, 210)% (card left edge 33.0 -> 7.3% W, top 12.1 -> -72.8% H); creep, sharp middle, 40 f settle
			motions: {scale: measured('v8.cam-push-in-pan')},
			params: {toScale: 1.429, pivotX: 92.9, pivotY: 210},
			reproduces: {scale: ['v8.cam-push-in-pan']},
		},
		snap: {
			// v5.cam-snap-zoom S08: the first word of line 2 goes 58.06 -> 22.71% H (the curve): an accelerating
			// y-only approach to 47.1% H, then scale 1.00 -> 1.60 in one blurred picture while it jumps to 33.0% H,
			// then a decelerating settle. The zoom runs while the word crosses 47.1 -> 33.0% H, about the word; its
			// x is not measured: frame centre
			motions: {y: measured('v5.cam-snap-zoom')},
			params: {fromY: 58.061, travelY: -35.349, jumpFromY: 47.1, jumpToY: 33.0, toScale: 1.6, pivotX: 50, pivotY: 58.061, shutter: SHUTTER},
			reproduces: {y: ['v5.cam-snap-zoom']},
		},
		layerPunch: {
			// v6.ui-mockup-punch-in S11: the device mock-up x1.000 -> x1.221 (outline width 480 -> 586 px) about its
			// upper middle, scale centre x 805-823 / y 242-260 px of 1622 x 918: (805 px, the centre x that holds;
			// 251 px) = (49.6, 27.3)%; 58% of the growth in one blurred picture; the headline keeps its size
			motions: {scale: measured('v6.ui-mockup-punch-in')},
			params: {toScale: 1.221, pivotX: 49.6, pivotY: 27.3, shutter: SHUTTER, still: 'headline'},
			reproduces: {scale: ['v6.ui-mockup-punch-in']},
		},
	},
	demoFrames: 120,
	demoTone: 'light',
};
