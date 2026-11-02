import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Scales are about pivotX / pivotY (% of frame; a pivot outside 0-100 lies off the frame, so the zoom
// also slides the layer); space 'log' eases ln(scale), the way those curves were measured. px are of the
// analysed picture (v1-v4 1920 x 1080, v5-v8 1622 x 918). A curve measured on a point the zoom carries
// (scaleBy) drives the zoom with its own progress. Token frame 0 of a curve is its measured active start
// minus the frames the token takes to reach 2%, which is how the other motions of a variant are placed.
// shutter: frames of travel smeared into one picture (box length / px per frame), measured on
// v8.cam-scroll-exit-up (24 px box at 17 px/f on its cut picture f1002), as in camera-move; set where the
// rows note blur or smear on the fast pictures.
const SHUTTER = 1.41;

export const spec: PrimitiveSpec = {
	name: 'PullBack',
	kind: 'camera',
	description:
		'The camera pulls back to reveal more of the layout on an eased slow-fast-slow move (often eased in log scale), with blur on its fastest pictures, about the frame centre or a point near an edge, sometimes with a pan.',
	defaultVariant: 'reveal',
	variants: {
		reveal: {
			// v7.cam-pull-back-reveal S17: the whole window 1.00 -> 0.40 eased in ln(scale) over 54 f, about the zoom
			// origin (43, 561) px = (2.7, 61.1)% of 1622 x 918, so the window also slides down-left; motion blur on
			// the fastest pictures (about -5% scale per frame)
			motions: {scale: measured('v7.cam-pull-back-reveal')},
			params: {toScale: 0.4, space: 'log', pivotX: 2.7, pivotY: 61.1, shutter: SHUTTER},
			reproduces: {scale: ['v7.cam-pull-back-reveal']},
		},
		logEase: {
			// v3.cam-network-pullback S02: the network plane 1.000 -> 0.2907 about (960, 540) px, the ease applied to
			// ln(scale); headline and glow stay locked to the screen. No blur noted
			motions: {scale: measured('v3.cam-network-pullback')},
			params: {toScale: 0.2907, space: 'log', pivotX: 50, pivotY: 50, still: 'headline'},
			reproduces: {scale: ['v3.cam-network-pullback']},
		},
		panLead: {
			// v4.cam-pullback T04: the canvas 1.000 -> 0.5527 about the hub centre (49.9% W, 575 px = 53.2% H) while
			// the hub pans 49.896 -> 25.599% W (.i2, active f964-f1003, one frame before the zoom's f965: token
			// frame 0 at f957 against the zoom's f955, delay 2); v4.trans-pullback-morph is the composite
			// transition it drives (headline swap and content cross-fades belong to their own primitives)
			motions: {scale: measured('v4.cam-pullback'), x: measured('v4.cam-pullback.i2', 2)},
			params: {toScale: 0.5527, pivotX: 49.9, pivotY: 53.2, travelX: -24.297},
			reproduces: {scale: ['v4.cam-pullback']},
			covers: ['v4.trans-pullback-morph'],
		},
		centred: {
			// v4.trans-pullback-reveal T05: the same pull-back with no pan, 1.000 -> 0.5128 about (960, 575) px =
			// (50.0, 53.2)%, on its own measured curve v4.cam-pullback.i3, placed as in the transition: T05 starts at
			// f1114 (the headline fade) and the curve's token frame 0 is f1131, so delay 17
			motions: {scale: measured('v4.cam-pullback.i3', 17)},
			params: {toScale: 0.5128, pivotX: 50, pivotY: 53.2},
			covers: ['v4.trans-pullback-reveal'],
		},
		centreTail: {
			// v7.cam-pull-back-centre S26: 1.0 -> 0.832 about the frame centre (line centre x 810-816 px of 1622),
			// slow-fast-slow, then a decelerating tail: line 807 -> 801 px (x0.9926) from the curve's end f3062
			// (token frame 59) to f3086 (24 f); outFirm starts at 2.1x its average speed, as the tail does
			// (about 1.2 px/f at f3057-f3062 against 0.25 px/f on average)
			motions: {scale: measured('v7.cam-pull-back-centre'), tail: motion(24, EASE.outFirm, 59)},
			params: {toScale: 0.832, tailScale: 0.9926, pivotX: 50, pivotY: 50},
			reproduces: {scale: ['v7.cam-pull-back-centre']},
		},
		closeUpOut: {
			// v6.cam-zoom-out S05: from the close-up x2.53 to the full centred line x1.00 in 21 f about the line centre
			// (810, 461) px = (49.9, 50.2)%, with horizontal blur and a long slow tail; the line's cap height at rest
			// is 10.8% H (99 px of 918)
			motions: {scale: measured('v6.cam-zoom-out')},
			params: {fromScale: 2.53, toScale: 1, pivotX: 49.9, pivotY: 50.2, lineCap: 10.8, shutter: SHUTTER},
			reproduces: {scale: ['v6.cam-zoom-out']},
		},
		twoPulses: {
			// v8.cam-zoom-out-reveal S13: about x 808 px = 49.8% W (y: frame centre). Pulse 1 (the curve, drift
			// removed) 1.0 -> 0.782 from f1694 (token frame 0 = f1686); a linear drift of -0.00151 scale per frame
			// (-0.151%) added to it from f1690 (delay 4) to pulse 2's start f1752 (62 f), so the wall is at
			// 0.782 - 0.094 = 0.69 there, as measured; pulse 2 from there to 0.53 over f1752-f1792, fit
			// bezier(0.573, 0.329, 0.138, 0.898) D=46, closest token outSoft (rmse 0.034), 2% at its frame 5:
			// delay 1752 - 5 - 1686 = 61. New columns enter at the edges with radial blur
			motions: {
				scale: measured('v8.cam-zoom-out-reveal'),
				drift: motion(62, linear, 4),
				second: motion(46, EASE.outSoft, 61),
			},
			params: {toScale: 0.782, driftRate: -0.151, secondScale: 0.53, pivotX: 49.8, pivotY: 50, shutter: SHUTTER},
			reproduces: {scale: ['v8.cam-zoom-out-reveal']},
		},
		whipReveal: {
			// v5.cam-whip-pullback S17: card 3 centre 52.774 -> 76.048% W (the curve) while the scale goes 1.00 ->
			// 0.58 on its own ease, fit bezier(0.812, 0.263, 0.006, 0.998) D=56, closest token inOutWhip (rmse 0.054),
			// settling over f2577-f2627; the zoom is about card 3, which the pan carries; card 3's y is not
			// measured: frame centre. Blur f2600-f2607
			motions: {x: measured('v5.cam-whip-pullback'), scale: motion(56, EASE.inOutWhip)},
			params: {travelX: 23.274, toScale: 0.58, pivotX: 52.774, pivotY: 50, shutter: SHUTTER},
			reproduces: {x: ['v5.cam-whip-pullback']},
		},
		flatten: {
			// v5.cam-pull-back-snap S22: the strip width 1.00 -> 0.6715 in 29 f, motion blur f3360-f3362; the pivot is
			// not measured: frame centre
			motions: {scale: measured('v5.cam-pull-back-snap')},
			params: {toScale: 0.6715, pivotX: 50, pivotY: 50, shutter: SHUTTER},
			reproduces: {scale: ['v5.cam-pull-back-snap']},
		},
		speedRamp: {
			// v6.cam-pull-back-ramp S12: the whole grid 0.97 -> 0.61 of its f1093 size (x0.629 from where it starts),
			// a 10 f burst; grid centre y 531 -> 506 px of 918, a pure zoom about y (506 - 0.629 * 531) / 0.371 =
			// 464 px = 50.5% H; x is not measured: frame centre. No blur noted
			motions: {scale: measured('v6.cam-pull-back-ramp')},
			params: {toScale: 0.629, pivotX: 50, pivotY: 50.5},
			reproduces: {scale: ['v6.cam-pull-back-ramp']},
		},
		recoil: {
			// v7.cam-click-pull-back S30: x1.172 -> x1.004 (x0.857) eased in ln(scale) about (803, 465) px =
			// (49.5, 50.65)% of 1622 x 918, reversing the incoming zoom with no hold; from 1.172 / 1.004 = 1.167 of
			// the rest it returns to. No blur noted
			motions: {scale: measured('v7.cam-click-pull-back')},
			params: {fromScale: 1.167, toScale: 1, space: 'log', pivotX: 49.5, pivotY: 50.65},
			reproduces: {scale: ['v7.cam-click-pull-back']},
		},
		easeBack: {
			// v8.cam-pull-back-settle S08: after the oversized landing the card's right edge eases 1595 -> 1223 px of
			// 1622 (98.3 -> 75.4% W); the scale and its pivot are not measured, so only the travel is built
			motions: {x: measured('v8.cam-pull-back-settle')},
			params: {travelX: -22.9},
			reproduces: {x: ['v8.cam-pull-back-settle']},
		},
		reframe: {
			// v5.cam-reframe-pullback S11: x1.15 -> 1.00 while the chips row goes (37.8, 44.499) -> (26.2, 51.743)%
			// (y is the curve), a pure zoom about ((1.15 * 26.2 - 37.8) / 0.15, (1.15 * 51.743 - 44.499) / 0.15) =
			// (-51.1, 100.0)%; blur on f1502
			motions: {y: measured('v5.cam-reframe-pullback')},
			params: {scaleBy: 'y', fromScale: 1.15, toScale: 1, pivotX: -51.1, pivotY: 100.0, shutter: SHUTTER},
			reproduces: {y: ['v5.cam-reframe-pullback']},
		},
	},
	demoFrames: 130,
	demoTone: 'light',
};
