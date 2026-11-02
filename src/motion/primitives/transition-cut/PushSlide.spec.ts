import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Vertical push. The outgoing scene moves outY % H on `out` (continuing along its end speed: these
// exits never settle), the incoming one rises from inY % H below its rest on `y`. A strip variant
// moves both scenes on one strip `travel` % H apart. Pixels of v5-v8 are of a 1622 x 918 picture.
// shutter as in WhipCut.spec.ts: v8 1.55 (the four v8.trans-whip-up blur / speed pairs); v6 rows note
// the blur without its size: 1.25, the median of the group's fourteen measured pairs.
const SHUTTER_V8 = 1.55;
const SHUTTER = 1.25;

export const spec: PrimitiveSpec = {
	name: 'PushSlide',
	kind: 'transition',
	description:
		'Vertical push: the outgoing layout accelerates up out of the top edge and the next one rises in from below the frame and brakes to rest; the two may sit on one strip, overlap, or swap at a hidden cut.',
	defaultVariant: 'stacked',
	variants: {
		stacked: {
			// T15: the block accelerates up (.i2: 31.92 -> 7.41% H = -24.51% H, to 27 px per frame, growing
			// vertical blur) and keeps rising as a fading ghost (ink 23 -> 104 -> 217 on the page 248, f1978-
			// f1987: progress 0.36 / 0.86 at +5 / +8, inGentle2 fits at rmse 0.02); the page rises in over it
			// from f1985 (token frame 30): top edge 96.92 -> 1.57% H (+95.35% H), strong ease-out (the curve)
			motions: {out: measured('v8.trans-push-up.i2'), fade: motion(9, EASE.inGentle2, 23), y: measured('v8.trans-push-up', 30)},
			params: {outY: -24.51, inY: 95.35, shutter: SHUTTER_V8},
			reproduces: {y: ['v8.trans-push-up']},
		},
		dipRise: {
			// T10: one virtual push of 100% H (the curve: scroll 0 -> 100); the title leaves up and is swapped
			// at f916 (token frame 12) for the phone, which rises into place and blinks: darkest luma 122 / 197
			// / 172 / 90 / 19 / 1 at f916 / 918 / 921 / 923 / 927 / 929 on the field 246 = opacity 0.50, 0.20,
			// then back to 1 in 11 f (progress 0.13 / 0.54 / 0.90 / 1.0 at +3 / +5 / +9 / +11, inOutWhip4 fits
			// at rmse 0.03)
			motions: {y: measured('v6.trans-push-up'), dim: motion(2, linear, 12), blink: motion(11, EASE.inOutWhip4, 14)},
			params: {travel: 100, swapAt: 12, blinkFrom: 0.5, blinkFloor: 0.2, shutter: SHUTTER},
			reproduces: {y: ['v6.trans-push-up']},
		},
		easeInDrift: {
			// T08: the layout drifts up on a long ease-in (the curve: 285 -> 188 px = -10.57% H), keeps going at
			// its end speed (118 px at f541, -23 px per frame) and is gone at f543 (token frame 30); the phone
			// rises from below from f538 (25): top 891 / 365 / 225 / 189 px at +0 / +3 / +5 / +8 to its rest
			// 190 px (+76.36% H; outStrong fits at rmse 0.01), landing at x1.17 (box 20.0 -> 17.1% W wide at
			// f546 -> f548) about its top edge (box top 20.6 -> 20.7% H, centre x 50.2 -> 50.35% W)
			motions: {y: measured('v6.trans-push-up-ease-in'), rise: motion(8, EASE.outStrong, 25), land: motion(2, linear, 33)},
			params: {outY: -10.57, outGone: 30, inY: 76.36, inScale: 1.17, inPivotX: 50.3, inPivotY: 20.7, shutter: SHUTTER},
			reproduces: {y: ['v6.trans-push-up-ease-in']},
		},
		rippleRise: {
			// T12: the thread scrolls up without a break (.i2: content -154.40 -> -404.89% H = -250.49% H, to 184 px
			// per picture, heavy vertical blur) and keeps going; three card columns (x 55-538, 568-1052,
			// 1084-1567 px: bands split at the gutters 34.1 / 65.8% W) rise in one picture (2 f) apart, centre,
			// right, left: top edge 97.47 -> 24.14% H (+73.33% H), half the frame in the first interval (the curve).
			// For the demo layout: the card columns 3.4-33.2 / 35.0-64.9 / 66.8-96.6% W with their first card's top
			// at 24.14% H at rest; the thread panel's bottom edge passes 63.7% H at the cut (f1670)
			motions: {out: measured('v8.trans-push-up-columns.i2'), y: measured('v8.trans-push-up-columns', 104)},
			params: {
				outY: -250.49,
				inY: 73.33,
				stagger: 2,
				columns: '34.1, 65.8',
				order: '1, 2, 0',
				shutter: SHUTTER_V8,
				cards: '3.4 33.2, 35.0 64.9, 66.8 96.6',
				cardTop: 24.14,
				panelEdge: 63.7,
			},
			reproduces: {y: ['v8.trans-push-up-columns']},
		},
		sharedStrip: {
			// T19: the page and the next layout sit on one strip that scrolls 1200 px = 111.1% H on an ease-in-
			// out (the curve), so the page leaves accelerating, an empty gap passes at the peak (152 px per
			// frame) and the next layout arrives decelerating; no blur noted
			motions: {y: measured('v2.trans-scroll-push')},
			params: {travel: 111.1},
			reproduces: {y: ['v2.trans-scroll-push']},
		},
	},
	demoFrames: 100,
	demoTone: 'light',
};
