import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Pixels: v5-v8 are 1622x918 (% of that picture). Frame 0 of a variant is frame 0 of its curve's motion
// unless a part moves earlier. Item i reads value i of a list param (the last value holds).
// travelX / travelY: travel in % of frame width / height on motion x / y (item i uses x<i+1> when the
// variant has one); delays: start frame per item; fromScale -> toScale on motion scale. An item given
// as an array moves part by part, partDelays apart. goneAfter: an item is gone once its x motion ends
// (it has left the frame). spreadFrom: grid spacing factor at the start (cell positions about the
// grid centre scale by it, item size does not); pitchX: settled column pitch in % W.

export const spec: PrimitiveSpec = {
	name: 'SplitApart',
	kind: 'layout',
	description:
		'Parts of a block move apart: lines slide to opposite sides, a line splits up and down, split lines whip out in their directions, grid spacing opens, settled lines kick apart and lock again, or one element becomes a mirrored pair.',
	defaultVariant: 'splitShift',
	variants: {
		splitShift: {
			// v6.layout-line-split-shift S11, items [line 1, line 2] of a centred block: line 1 slides -182 px (-11.2% W;
			// left edge 14.8% -> 3.6% W): its left edge 240 / 227 / 208 / 98 / 80 / 72 / 67 / 64 / 62 / 60 / 58 px at
			// f976-f1016 fits inOutWhip2 over 27 f from f973 (rmse 0.013); line 2 slides +361 px (+22.3% W; right edge
			// 76.3% -> 98.5% W) on the curve from f980 = frame 7 (half-way about 7 f after line 1)
			motions: {x1: motion(27, EASE.inOutWhip2), x2: measured('v6.layout-line-split-shift', 7)},
			params: {travelX: '-11.2 22.3'},
			reproduces: {x2: ['v6.layout-line-split-shift']},
		},
		splitMorph: {
			// v6.trans-split-morph T05, items [words 1-2, word 3] of one centred line (centres 33.5% and 69.6% W, y 50.1%
			// H): words 1-2 rise 363 px (-39.5% H, to 10.6% H) at the same size, x fixed, on the curve (f206-f218, frame 0
			// = f204); word 3 drops 323.5 px (+35.2% H, to 85.3% H) and grows x1.10 over f208-f221: no curve of its own,
			// it takes the same curve 2 f later (13 f built)
			motions: {y: measured('v6.trans-split-morph'), y2: measured('v6.trans-split-morph', 2), scale2: measured('v6.trans-split-morph', 2)},
			params: {travelY: '-39.5 35.2', toScale: '1 1.10'},
			reproduces: {y: ['v6.trans-split-morph']},
		},
		whipOut: {
			// v6.layout-split-whip-out S11, items [line 1 as its words, arrow, line 2] after the split: line 2 whips out
			// right, left edge 734 -> 1256 px (+522 px = +32.2% W) on the pure ease-in curve (7 f, frame 0 = f1061), out of
			// frame by the next picture; the arrow leaves the same way 5 f later (f1066); line 1 leaves left word by word,
			// words moving from f1061 / f1063 / f1066 (0 / 2 / 5 f), word 1's right edge 564 -> 320 px (-244 px = -15.0%
			// W) in the same 7 f, each word on the same ease-in
			motions: {x: measured('v6.layout-split-whip-out')},
			params: {travelX: '-15.0 32.2 32.2', delays: '0 5 0', partDelays: '0 2 5', goneAfter: true},
			reproduces: {x: ['v6.layout-split-whip-out']},
		},
		gridSpread: {
			// v6.grid-spread-out S12: the grid's spacing factor (column pitch / item scale, 311 -> 415 px) opens 0.7488 ->
			// 1 from the centre on the curve (23 f); positions about the centre item scale by it (rows by the same factor),
			// item size does not; settled column pitch 402.5 px = 24.8% W
			motions: {x: measured('v6.grid-spread-out')},
			params: {spreadFrom: 0.7488, pitchX: 24.8},
			reproduces: {x: ['v6.grid-spread-out']},
		},
		kickApart: {
			// v5.text-line-counter-shift S22, items [line 1, line 2] settled: line 1 kicks -3.3% W (left edge 40.7% ->
			// 37.4% W) and line 2 +4.2% W on the curve (7 f) and they lock there; letter sizes unchanged
			motions: {x: measured('v5.text-line-counter-shift')},
			params: {travelX: '-3.3 4.2'},
			reproduces: {x: ['v5.text-line-counter-shift']},
		},
		mirrorPair: {
			// v8.particle-mascot-split S20, items [front, hidden behind it] on one spot: the hidden one slides out until
			// both sit mirror-symmetric about the centre, separation 0 -> 623 px (38.4% W: 19.2% W each way, the front one
			// right, the other left) on the curve (17 f, frame 0 = f2505); both come out x1.50 and shrink to x1.0 on .i2
			// from f2507 = frame 2
			motions: {x: measured('v8.particle-mascot-split'), scale: measured('v8.particle-mascot-split.i2', 2)},
			params: {travelX: '19.2 -19.2', fromScale: 1.5, toScale: 1},
			reproduces: {x: ['v8.particle-mascot-split']},
		},
	},
	demoFrames: 70,
	demoTone: 'light',
};
