import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Pixels: v1-v4 are 1920x1080; v5-v8 are 1622x918 (% of that picture). Frame 0 of a variant is frame 0
// of its measured curve's motion (the token's active window lines up with the measured one).
// The block is MakeRoom's children: one block, or its parts as an array (part i reads value i of a list).
// travelX / travelY: travel in % of frame width / height on motion x / y (part i uses x<i+1> when the
// variant has one); fromX / fromY: offset at frame 0 for parts laid out in their final places;
// fromScale -> toScale on motion scale; creepX / creepY on motion creep (a move before the main one).
// incoming: what arrives in the room, revealed from arriveAt, one unit every arriveRate frames, in the
// slot below or right of the block (moving with it) or between parts 0 and 1 (arriveReverse: last unit
// first). blurExposure: frames of travel smeared into one picture (horizontal motion blur from speed),
// the streak at most blurMax % W.

export const spec: PrimitiveSpec = {
	name: 'MakeRoom',
	kind: 'layout',
	description:
		'A settled block moves, shrinks or re-centres to make room for what arrives next: it rises to the top band, slides and shrinks aside, re-centres as content is inserted, or opens a gap inside a line.',
	defaultVariant: 'riseTop',
	variants: {
		riseTop: {
			// v6.layout-rise-make-room S07: the finished text block rises, line-1 centre 436.5 -> 133.5 px (47.5% ->
			// 14.5% H, -33.0% H) on the curve, 17 f, starting as its last line completes
			motions: {y: measured('v6.layout-rise-make-room')},
			params: {travelY: -33.0},
			reproduces: {y: ['v6.layout-rise-make-room']},
		},
		riseShort: {
			// v7.layout-rise-make-room S01: the line (icon + 2 words) rises 48.7% -> 44.8% H (-3.9% H) on the curve
			// (frame 0 = f31); line 2 appears below it from f49 = frame 18, its letters 2.5 f apart (S01 title line 2)
			motions: {y: measured('v7.layout-rise-make-room')},
			params: {travelY: -3.9, arriveAt: 18, arriveRate: 2.5, slot: 'below'},
			reproduces: {y: ['v7.layout-rise-make-room']},
		},
		shrinkAside: {
			// v6.layout-slide-make-room S13: the headline's centre 800 -> 372 px (49.3% -> 22.9% W, -26.4% W) while it
			// scales 1.00 -> 0.64 in step (cap 159 -> 101 px), on the curve (25 f)
			motions: {x: measured('v6.layout-slide-make-room'), scale: measured('v6.layout-slide-make-room')},
			params: {travelX: -26.4, toScale: 0.64},
			reproduces: {x: ['v6.layout-slide-make-room']},
		},
		openGap: {
			// v7.layout-slide-make-room S01, parts [before the gap, after the gap] in their final places: the icon
			// before the gap 42.7% -> 27.7% W (15.0% W left), word 2 after it 51.0% -> 54.4% W (3.3% W right) on the
			// curve (frame 0 = f13), the content x1.14 -> 1.0 in the same 10 f; the inserted word's first glyph shows at
			// f19 = frame 6 where the icon sat (the word's end nearest the icon's start, so its letters show last to
			// first), letters 2.7 f apart (word 1 decode); icon blur 44 px (f19) and 28 px (f21) over the built speeds
			// there (24.6 / 24.9 px per frame at 15.0% W of 1622 px): about 1.45 f of travel, at most the 44 px
			// (2.7% W) measured
			motions: {x: measured('v7.layout-slide-make-room'), scale: measured('v7.layout-slide-make-room')},
			params: {
				fromX: '15.0 -3.3',
				travelX: '-15.0 3.3',
				fromScale: 1.14,
				toScale: 1,
				arriveAt: 6,
				arriveRate: 2.7,
				arriveReverse: true,
				slot: 'between',
				blurExposure: 1.45,
				blurMax: 2.7,
			},
			reproduces: {x: ['v7.layout-slide-make-room']},
		},
		reflow: {
			// v6.layout-reflow-slide S06, parts [top words, lower word] where they stand before: the top words' centre
			// 543.5 -> 258 px (33.5% -> 15.9% W, -17.6% W) and x1 -> 0.637 (1.57 -> 1 relative to the end) on the curve
			// (frame 0 = f224), y fixed; the lower word's centre 1129.5 -> 427.5 px (69.6% -> 26.4% W, -43.3% W) and
			// x0.80 -> 1 (x1.25) from f228: its values 1128 / 1093 / 985.5 / 650 / 501.5 / 438.5 / 427.5 px at
			// f228-f243 fit inOutWhipOver over 20 f from f226 (rmse 0.012), 2 f after the top words
			motions: {
				x: measured('v6.layout-reflow-slide'),
				scale: measured('v6.layout-reflow-slide'),
				x2: motion(20, EASE.inOutWhipOver, 2),
				scale2: motion(20, EASE.inOutWhipOver, 2),
			},
			params: {travelX: '-17.6 -43.3', toScale: '0.637 1.25'},
			reproduces: {x: ['v6.layout-reflow-slide']},
		},
		liftShrink: {
			// v5.text-lift-to-header S17: the headline's ink width 71.7% -> 49.0% W (x1 -> 0.683, i.e. 1.465 -> 1) and its
			// centre 48.4% -> 23.4% H (-25.0% H) on the same curve, 17 f, starting the picture its last letter lands
			motions: {scale: measured('v5.text-lift-to-header'), y: measured('v5.text-lift-to-header')},
			params: {toScale: 0.683, travelY: -25.0},
			reproduces: {scale: ['v5.text-lift-to-header']},
		},
		recenter: {
			// v8.layout-lockup-recenter S01: label 1 (icon + 2 words) slides 30.9% -> 16.0% W (-14.9% W) on the curve
			// (frame 0 = f2) while label 2 builds at its right: its glyph from f2, its letters 3.6 f apart; the whole
			// lockup then rises 50.3% -> 44.8% H (-5.6% H) on .i2 from f40 = frame 38
			motions: {x: measured('v8.layout-lockup-recenter'), y: measured('v8.layout-lockup-recenter.i2', 38)},
			params: {travelX: -14.9, travelY: -5.6, arriveAt: 0, arriveRate: 3.6, slot: 'right'},
			reproduces: {x: ['v8.layout-lockup-recenter']},
		},
		centreSlide: {
			// v5.ui-box-slide S11: the prompt box slides left over the still background until its send button sits at
			// the frame centre: button centre 75.7% -> 50.0% W (-25.7% W), y 50.1% H fixed, on the curve (25 f)
			motions: {x: measured('v5.ui-box-slide')},
			params: {travelX: -25.7},
			reproduces: {x: ['v5.ui-box-slide']},
		},
		groupSnap: {
			// v5.ui-group-reframe S11: the group creeps linearly for 18 f, button centre (89.0, 29.5) -> (85.0, 35.3) %
			// (-4.0% W, +5.8% H) while it scales 1.02 -> 0.93; then it snaps (85.0, 35.3) -> (75.7, 50.1) % (-9.3% W,
			// +14.8% H) on the curve from f1615 = frame 18 (x has no curve of its own and shares it)
			motions: {creep: motion(18, linear), scale: motion(18, linear), y: measured('v5.ui-group-reframe', 18), x: measured('v5.ui-group-reframe', 18)},
			params: {creepX: -4.0, creepY: 5.8, fromScale: 1.02, toScale: 0.93, travelX: -9.3, travelY: 14.8},
			reproduces: {y: ['v5.ui-group-reframe']},
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
