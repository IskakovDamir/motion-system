import type {PrimitiveSpec} from '../types';
import {linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// A cut between two frames. `before`: frames the outgoing picture is shown before the cut in the
// isolated component (its measured moment); emptyFrames: empty canvas frames before the next layout.
// motionMatch carries the matched moves on both sides of the cut. Pixels of v5 are of a 1622 x 918
// picture. shutter 1.25: v5 rows note the blur without its size (the median of the fourteen
// blur / speed pairs measured in this group's whip rows, WhipCut.spec.ts).
const SHUTTER = 1.25;

export const spec: PrimitiveSpec = {
	name: 'HardCut',
	kind: 'transition',
	description:
		'The picture is replaced between two frames; the next layout is complete in the cut frame or builds from the empty canvas; an overlay can hold across the cut, or a move can continue through it in the same direction.',
	defaultVariant: 'plain',
	variants: {
		plain: {
			// v2.trans-hard-cut, 17 cuts: 12 replace the picture between two frames with the next layout complete
			// in the cut frame (the compared moment: last old picture f957, first new f958); 5 pass through the
			// empty canvas for 6 / 1 / 1 / 3 / 1 frames (f1-f6, f226, f1408, f1689-f1691, f1801), set with the
			// component's emptyFrames prop
			motions: {},
			params: {before: 1, emptyFrames: 0},
			covers: ['v2.trans-hard-cut'],
		},
		motionMatch: {
			// v5 T28 (f4160-f4170): the card is cut mid-exit, still rising 4.9 / 7.0% H per picture over
			// f4160-f4162 / f4162-f4165 (2.45 and 2.33% H per frame: near constant, -11.9% H in 5 f), and the
			// window group enters from 47.8% H below its rest at 8.5% H per frame or more and decelerates
			// (v5.card-rise-drop-in.i5); both blurred along the move; shares the centred layout (x 50%)
			motions: {out: motion(5, linear), in: measured('v5.card-rise-drop-in.i5', 5)},
			params: {before: 5, emptyFrames: 0, outY: -11.9, inY: 47.8, shutter: SHUTTER},
			covers: ['v5.trans-motion-match-cut'],
		},
		overlayHold: {
			// v5 T02 (f268-f272, cut at f270): the footage under the title is cut while the overlay holds: no
			// flash, no jump (template scale 1.015 and centre unchanged on f268-f275)
			motions: {},
			params: {before: 2, emptyFrames: 0},
			covers: ['v5.layout-overlay-holds-across-cut'],
		},
	},
	demoFrames: 40,
	demoTone: 'light',
};
