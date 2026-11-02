import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Sizes in % of frame width (w) / height (h); x / y place the box (its centre, or its fixed edge when
// anchor is left), in % of the frame. v7 and v8 pictures are 1622x918: px / 16.22 = % W, px / 9.18 = % H.
// The box grows from `fromW` (default 0) to restW with the width motion; height (when it has a motion)
// from 0 to restH, else it is restH throughout. leftShare: the part of a width change taken by the
// left edge (0 = the left edge stays put). shutter: frames of travel smeared into one picture, the
// video's measured look: v7 "about half the travel to the next picture (180 deg shutter at 24 fps)"
// (2.5 f pictures -> 1.25), v8 1.41 (24 px box at 17 px/f, v8.cam-scroll-exit-up, as in camera-move).
// framesPerChar / typeAt: a label typed (or un-typed) inside the box, clipped by it.

export const spec: PrimitiveSpec = {
	name: 'SeedGrow',
	kind: 'ui',
	description:
		'A box or pill is born as a seed (a dot, a dash, a thin line or a blurred speck) and grows to its size along one axis and then the other, on an explosive ease-out or with an overshoot; it can stretch with a typed label and collapse back to a line.',
	defaultVariant: 'seedPop',
	variants: {
		seedPop: {
			// v7.ui-label-pop-in S36: a 13 x 7 px dash at the centre (49.9% W, 50.2% H) -> 56 x 27 -> 325 x 160
			// -> 463 x 220 -> 527 x 229 px = 32.5% W x 25.0% H, poses 5 f apart from the curve's +10; the
			// height runs a little ahead: 0.118 / 0.699 / 0.961 / 1 at +15 / +20 / +25 / +30 (inOutWhip3 over
			// 28 f from +4, rmse 0.007)
			motions: {width: measured('v7.ui-label-pop-in'), height: motion(28, EASE.inOutWhip3, 4)},
			params: {restW: 32.5, restH: 25.0, x: 49.9, y: 50.2, shutter: 1.25},
			reproduces: {width: ['v7.ui-label-pop-in']},
		},
		widenOvershoot: {
			// v7.ui-label-widen-overshoot S01: width 32.6 -> 58.0 (f21) -> 55.8% W, symmetric, from f11; the
			// content shrinks cap 8.3% (f14) -> 6.2 (f24) -> 6.0% H (f34) = x0.723 (outSoft over 16 f from
			// +3) and the box height with it, 24.9% (f11) -> 18.5% H (f36); then the height grows 18.5 ->
			// 21.8 / 23.6 / 24.1 / 24.2% H at f41 / f46 / f51 / f56 for a second line (outFirm2 over 20 f
			// from +25, rmse 0.007); the box edges smear while they run (v7 shutter)
			motions: {width: measured('v7.ui-label-widen-overshoot'), content: motion(16, EASE.outSoft, 3), grow: motion(20, EASE.outFirm2, 25)},
			params: {fromW: 32.6, restW: 55.8, fromH: 24.9, midH: 18.5, restH: 24.2, contentScale: 0.723, x: 49.9, y: 50.2, shutter: 1.25},
			reproduces: {width: ['v7.ui-label-widen-overshoot']},
		},
		cornerFollow: {
			// v7.ui-corner-handles, on the label box of seedPop + widenOvershoot (S36 clock: the widen starts
			// 30 f after the pop token, S01 f0 = +19): two squares fly out diagonally from the top-left and
			// bottom-right corners (S01 f1-f6 = +20..+25, smears about 45 px = 52.9 px at 1080), sit outside
			// the corners touching them, 37 px = 2.28% W; they follow the widen and shrink with the content
			// x0.74 to 27.5 px = 1.70% W (S01 f11-f31); exit 26 -> 11 px -> 0 from S01 f56 (+75): top-left
			// gone f61, bottom-right f66. Fly-out and exit not fitted (2 poses each): linear.
			motions: {
				width: measured('v7.ui-label-pop-in'),
				height: motion(28, EASE.inOutWhip3, 4),
				widen: measured('v7.ui-label-widen-overshoot', 30),
				content: motion(16, EASE.outSoft, 33),
				grow: motion(20, EASE.outFirm2, 55),
				handlesIn: motion(5, linear, 20),
				outA: motion(5, linear, 75),
				outB: motion(10, linear, 75),
			},
			params: {
				restW: 32.5,
				restH: 25.0,
				widenW: 55.8,
				midH: 18.5,
				growH: 24.2,
				contentScale: 0.723,
				handle: 2.28,
				handleRest: 1.7,
				handleSmear: 52.9,
				x: 49.9,
				y: 50.2,
				shutter: 1.25,
			},
			covers: ['v7.ui-corner-handles'],
		},
		speckStretch: {
			// v7.ui-row-stretch-in: a blurred speck at 55.2% W / 76.5% H stretches about its centre to the
			// row's 80.62% W (2.5-3% overshoot of the tile and text, 5% with the button); the row keeps its
			// height, the content stretches with it; horizontal blur to f366 (+15)
			motions: {width: measured('v7.ui-row-stretch-in')},
			params: {stretch: true, restW: 80.62, x: 55.2, y: 76.5, shutter: 1.25},
			reproduces: {width: ['v7.ui-row-stretch-in']},
		},
		edgeStretch: {
			// v8.ui-card-stretch-in-blur: left edge fixed at 15.7% W, visible width 25.9 -> 77.25% W, the
			// content stretched with the card; faint (about half opacity) at the first picture; label luma
			// 239 -> 88 -> 19 -> 7 -> 1 at +0 / +10 / +20 / +26 / +34 (outFirm2 over 34 f from +1, rmse 0.003)
			motions: {width: measured('v8.ui-card-stretch-in-blur'), opacity: motion(34, EASE.outFirm2, 1)},
			params: {stretch: true, anchor: 'left', x: 15.7, fromW: 25.9, restW: 77.25, fromOpacity: 0.5, shutter: 1.41},
			reproduces: {width: ['v8.ui-card-stretch-in-blur']},
		},
		dotToPill: {
			// v7.shape-dot-to-pill: a dot grows into a circle 121.5 px = 13.2% H (the curve, f1364-f1386),
			// then the capsule stretches to the right, left end anchored, 220 -> 742 px = 45.75% W while its
			// label types at 1.6 f per character: 236 / 260 / 289 / 315 / 362 / 409 / 461 / 531 / 603 / 671 /
			// 706 / 742 px at +3 ... +30 (inGentle over 27 f from f1386 = +22, rmse 0.027)
			motions: {height: measured('v7.shape-dot-to-pill'), width: motion(27, EASE.inGentle, 22)},
			params: {anchor: 'left', restH: 13.2, restW: 45.75, typeAt: 22, framesPerChar: 1.6},
			reproduces: {height: ['v7.shape-dot-to-pill']},
		},
		lineToPill: {
			// v7.shape-line-to-pill: a 12 px line (0.74% W) the full 179.5 px height (19.55% H) widens to
			// 369.5 px = 22.78% W; the left edge drifts 29 px left while the right runs out 269 px (left
			// share 0.081); its word types inside at 3 f per character, clipped by the pill
			motions: {width: measured('v7.shape-line-to-pill')},
			params: {fromW: 0.74, restW: 22.78, restH: 19.55, leftShare: 0.081, typeAt: 0, framesPerChar: 3},
			reproduces: {width: ['v7.shape-line-to-pill']},
		},
		pillToLine: {
			// v7.shape-pill-to-line-out: 369.2 px (22.76% W) -> 0, the right edge running in 292 px while the
			// left follows 72 px (left share 0.198); the word un-types from the end at 2.4 f per character
			// from +2; the last thin line fades out over 5 f after f3816 (+24)
			motions: {width: measured('v7.shape-pill-to-line-out'), fade: motion(5, linear, 24)},
			params: {fromW: 22.76, restW: 0, restH: 19.55, leftShare: 0.198, untypeAt: 2, framesPerChar: 2.4},
			reproduces: {width: ['v7.shape-pill-to-line-out']},
		},
		growType: {
			// v8.ui-status-pill-grow-type: grows right out of its icon from a round seed to 806 px = 49.7% W,
			// height 130 px = 14.16% H, growing end motion-blurred; its label types behind the growing end at
			// 1.6 characters per frame (0.625 f per character) from f2965 (+3)
			motions: {width: measured('v8.ui-status-pill-grow-type')},
			params: {anchor: 'left', seedRound: true, restW: 49.7, restH: 14.16, typeAt: 3, framesPerChar: 0.625, shutter: 1.41},
			reproduces: {width: ['v8.ui-status-pill-grow-type']},
		},
		chainIn: {
			// v8.ui-callout-pop-in, callout 6: anchor dot pops f2082-f2094 (.i2, settled 12.2 px = 1.33% H),
			// its leader line draws out from f2090 (.i3, to 82 px beyond the dot = 8.82% H), the pill grows
			// from a blurred speck from f2094 (main curve, ink width / settled 248 x 47 px = 15.29% W x 5.12% H)
			// while its centre rises 861 -> 813 px (48 px = 5.23% H) to the line's end
			motions: {
				scale: measured('v8.ui-callout-pop-in', 12),
				dot: measured('v8.ui-callout-pop-in.i2'),
				line: measured('v8.ui-callout-pop-in.i3', 8),
			},
			params: {dot: 1.33, line: 8.82, rise: 5.23, pillW: 15.29, pillH: 5.12, shutter: 1.41},
			reproduces: {scale: ['v8.ui-callout-pop-in']},
		},
		chainOut: {
			// v8.ui-callout-collapse-out: the pill swells x1.071 (callout C 0.959 -> 1.032 / 1.0271 at the
			// curve's start, f2186-f2194; ease not fitted: outFirm), holds 7 f, then shrinks toward its leader
			// anchor from 1.071 to 0 (main curve from +15); its height squashes faster late: bottom-centre
			// callout 43 -> 29 / 6 / 1 px at +11 / +14 / +16 of its 20 f (inOutWhip6 over 17 f from +3 of the
			// curve, rmse 0.011; that pill 284 x 43 px = 17.51% W x 4.68% H); the leader line retracts into the dot from 12.64% H (.i2, 4 f after the pill
			// starts), the dot shrinks and fades over the last 8 f (f2172-f2180, not fitted: linear)
			motions: {
				swell: motion(8, EASE.outFirm),
				scale: measured('v8.ui-callout-collapse-out', 15),
				squash: motion(17, EASE.inOutWhip6, 18),
				line: measured('v8.ui-callout-collapse-out.i2', 18),
				dot: motion(8, linear, 28),
			},
			params: {swell: 1.071, dot: 1.33, line: 12.64, pillW: 17.51, pillH: 4.68, shutter: 1.41},
			reproduces: {scale: ['v8.ui-callout-collapse-out']},
		},
	},
	demoFrames: 100,
	demoTone: 'light',
};
