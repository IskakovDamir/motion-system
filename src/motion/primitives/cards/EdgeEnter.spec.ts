import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Pixels: v5-v8 are 1622x918 (% of that picture; px x 1080/918 for px at 1080).
// fromX / fromY: where the element starts, in % of frame width / height from its rest (+ = right / below).
// shutter: frames of travel smeared into one picture (a measured box length / px per frame); the blur
// is that box along the travel, as a Gaussian of equal variance. rest* / card* / length / shaft: the
// measured rest geometry the isolated demo places its element at (so it starts beyond the frame edge).
// v7: half the travel to the next picture at 24 fps (v7.ui-window-drop-in) = 0.5 x 60 / 24 = 1.25 f.
const V7_SHUTTER = 1.25;

export const spec: PrimitiveSpec = {
	name: 'EdgeEnter',
	kind: 'layout',
	description: 'An element enters from beyond a frame edge with directional motion blur and lands on a hard ease-out, sometimes with a small overshoot.',
	defaultVariant: 'hardLand',
	variants: {
		hardLand: {
			// v5.card-rise-drop-in S15 (middle card): top rim 99.4% H (f1885) -> 97.2 (f1887) -> 87.4 (f1890) on held
			// pictures, then the snap + settle curve 87.44 -> 29.37% H (58.07% H) from f1890: drift 11.96 / 9.76% H beyond
			// the curve's start at +0 / +2 f, curve from +5 f; no scale (264 px = 16.2% W wide, 355 px = 38.7% H tall);
			// vertical motion blur: the left card is 419 px tall vs 370 at rest on f1890 (49 px box) while it moves 74 px
			// to the next picture 2 f later (37 px/f): shutter 1.32 f
			motions: {y: measured('v5.card-rise-drop-in', 5)},
			params: {fromY: 58.07, drift: '0:11.96 2:9.76 5:0', shutter: 1.32, restTop: 29.37, cardW: 16.2, cardH: 38.7},
			reproduces: {y: ['v5.card-rise-drop-in']},
		},
		smearRise: {
			// v7.card-rise-in S22: the card (chip label centre) rises 82.0 -> 49.4% H (32.57% H) on the curve, x fixed,
			// no fade, no scale; its vertical smear is not measured: the shutter measured in the same video
			motions: {y: measured('v7.card-rise-in')},
			params: {fromY: 32.57, shutter: V7_SHUTTER, restY: 49.4},
			reproduces: {y: ['v7.card-rise-in']},
		},
		dropDecelerate: {
			// v7.ui-window-drop-in S05: the window's bottom edge 82.6 -> 95.7% H (13.09% H down) on the curve, already
			// moving at the cut (2.3% H per frame); only the sidebar, a small label and the input bar smear (20-25 px at
			// f484, forward: from the window's position down, half the travel to the next picture), headline and window
			// edges stay sharp
			motions: {y: measured('v7.ui-window-drop-in')},
			params: {fromY: -13.09, shutter: V7_SHUTTER, smearParts: true, forward: true, restBottom: 95.73},
			reproduces: {y: ['v7.ui-window-drop-in']},
		},
		blurSlide: {
			// v6.ui-dial-slide-in S13: the dial's left edge 1500 -> 778 px (92.5% -> 48.0% W, 44.5% W from the right) on
			// the curve, scale 0.99-1.02 (none); its motion blur is noted but not measured: the v7 shutter
			motions: {x: measured('v6.ui-dial-slide-in')},
			params: {fromX: 44.5, shutter: V7_SHUTTER, restLeft: 48.0},
			reproduces: {x: ['v6.ui-dial-slide-in']},
		},
		trailSlide: {
			// v6.shape-arrow-slide-in S11: an arrow 594 px (36.6% W) long, shaft about 14 px (16.5 px at 1080), slides in
			// from the left edge, its tip from x 0 to 659 px (40.6% W) in 17 f: -34 / -17 / -7 / -2 / 0 px from rest at
			// +7 / 10 / 12 / 15 / 17 f fit outSnap2 over 17 f (rmse 0.015); chevron ghost trails smeared from x 0 on its
			// first pictures (f991-f996: +0 to +5 f); rest centre y 790 px (86.1% H)
			motions: {x: motion(17, EASE.outSnap2)},
			params: {fromX: -40.6, trailFrames: 5, restTip: 40.6, length: 36.6, shaft: 16.5, restY: 86.1},
			covers: ['v6.shape-arrow-slide-in'],
		},
		streakDrop: {
			// v7.shape-arrow-drop-in S01: a thin down-arrow 32.4% H long drops in from the top, its tip 55.7 -> 67.3% H
			// (11.66% H) on the curve while x 89.4 -> 86.2% W (3.2% W left); a motion-blur streak on its first pictures
			motions: {y: measured('v7.shape-arrow-drop-in')},
			params: {fromY: -11.66, fromX: 3.2, shutter: V7_SHUTTER, length: 32.4, restTipY: 67.32, restX: 86.2},
			reproduces: {y: ['v7.shape-arrow-drop-in']},
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
