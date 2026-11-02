import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Whip through a hidden cut. `out` moves the outgoing scene (travel outX % W / outY % H, optional
// zoom outScale about outPivot) into the cut; the incoming scene appears when its motion starts,
// offset by inX / inY (and inScale) and settles to rest. The axis curve is the incoming half unless
// `outCurve` says it is the outgoing one. When no `to` is given, the incoming scene is the outgoing
// layout re-framed: its last camera, then scaleJump about pivotX / pivotY (the closer or wider framing
// of the same canvas the punch variants cut to).
// Pixels of v5-v8 are of a 1622 x 918 picture: % W = px / 16.22, % H = px / 9.18.
//
// shutter: frames of travel smeared into one picture (blur box / px per frame), as camera-move:
// v7 1.22 = median of the ten blur / speed pairs in the v7 whip rows (S10 51 / 52, S14 44 / 33,
// S16 34 / 28.5, S19 5 / 4, 7 / 5, 9 / 9, 17 / 17, S20 7 / 4.5, 15 / 12, 33 / 38 px);
// v8 1.55 = median of the four v8.trans-whip-up pairs (S06 box 10 / 18 / 24 px at 6 / 12.5 / 34 px per
// frame, S07 32 px at 12 px per frame on the arrival);
// v5 and v6 rows note the blur without its size: 1.25, the median of all fourteen pairs.
const SHUTTER_V7 = 1.22;
const SHUTTER_V8 = 1.55;
const SHUTTER = 1.25;

export const spec: PrimitiveSpec = {
	name: 'WhipCut',
	kind: 'transition',
	description:
		'Whip through a hidden cut: the outgoing view eases in along one axis with growing directional blur, the picture is replaced at speed, and the incoming view (the next layout or a closer framing of the same one) arrives still moving and decelerates on a strong ease-out.',
	defaultVariant: 'pushLeft',
	variants: {
		pushLeft: {
			// outgoing: T13 (.i5), the chrome eases in 28.36 -> 21.52% W (-6.84% W, 1.7% W per frame on its
			// last picture) with growing horizontal blur; incoming: the curve, T17 f2342-f2371, the frame
			// arrives 58.66 -> 49.88% W (+8.79% W of rest) at 19.5 px per frame, blurred, and settles
			motions: {out: measured('v7.trans-whip-push-left.i5'), x: measured('v7.trans-whip-push-left', 30)},
			params: {axis: 'x', outX: -6.84, inX: 8.79, scaleJump: 1, shutter: SHUTTER_V7},
			reproduces: {x: ['v7.trans-whip-push-left']},
		},
		pushRight: {
			// incoming half only, after a cut from a static shot (one still picture before it): the window
			// arrives 38.78 -> 51.82% W (-13.04% W of rest) at 28 px per frame with 34 px of blur, 32 f
			motions: {x: measured('v7.trans-whip-push-right', 1)},
			params: {axis: 'x', inX: -13.04, scaleJump: 1, shutter: SHUTTER_V7},
			reproduces: {x: ['v7.trans-whip-push-right']},
		},
		blendLeft: {
			// T12 f1748-f1785: the outgoing shot accelerates left 13 / 30 / 92 / 148 / 141 px per frame over
			// f1748-f1760 (readings 3 f apart: 1041 px = 64.2% W by their trapezoid sum; inGentle2 fits the
			// summed progress 0 / 0.06 / 0.24 / 0.58 / 1 at rmse 0.03 and ends at the measured 141 px per frame),
			// f1760-f1770 blends both shots (10 f), and the curve lands the incoming shot from +35.05% W
			motions: {out: motion(12, EASE.inGentle2), blend: motion(10, linear, 12), x: measured('v5.trans-whip-pan', 22)},
			params: {axis: 'x', outX: -64.2, inX: 35.05, scaleJump: 1, shutter: SHUTTER},
			reproduces: {x: ['v5.trans-whip-pan']},
		},
		streakLeft: {
			// the curve is the outgoing half (T12): the grid pans 560 -> 320 px (-14.8% W) on an ease-in, then
			// smears on at 110 px per frame (right edge 1375 -> 1044 px over f1183-f1186 = 6.8% W per frame)
			// until its last picture f1186 (token frame 33); the swap lands at f1188 (35) on T09's arrival
			// (.i2): the figure comes in from the right 895.5 -> 536 px (+22.16% W of rest), 12 f ease-out
			motions: {x: measured('v6.trans-whip-left'), in: measured('v6.trans-whip-left.i2', 35)},
			params: {axis: 'x', outCurve: true, outX: -14.8, outRun: 6.8, outGone: 34, inX: 22.16, scaleJump: 1, shutter: SHUTTER},
			reproduces: {x: ['v6.trans-whip-left']},
		},
		creepLeft: {
			// T14: the card creeps from rest and accelerates left (.i2, 49.84 -> 39.88% W = -9.95% W, to 18 px
			// per frame, horizontal blur), and the next block arrives sliding left 21.33 -> 15.97% W (+5.36% W)
			motions: {out: measured('v8.trans-whip-left.i2'), x: measured('v8.trans-whip-left', 43)},
			params: {axis: 'x', outX: -9.95, inX: 5.36, scaleJump: 1, shutter: SHUTTER_V8},
			reproduces: {x: ['v8.trans-whip-left']},
		},
		blurReframe: {
			// T04: the camera accelerates across the UI (.i2, icon 14.49 -> 19.67% W = +5.18% W) while it
			// defocuses, cuts to the same UI zoomed out x0.66, which arrives at 14.37% W (-10.17% W of its rest
			// 24.54) and decelerates (the curve) while the blur clears (.i3: edge sigma 0.601 -> 0.096% W sharp
			// baseline, so 0.505% W above it); the re-frame's fixed point x = (24.54 - 0.66 x 19.67) / 0.34 =
			// 34.0% W (y not measured: frame centre)
			motions: {
				out: measured('v8.trans-blur-whip-reframe.i2'),
				x: measured('v8.trans-blur-whip-reframe', 46),
				blur: measured('v8.trans-blur-whip-reframe.i3', 46),
			},
			params: {axis: 'x', outX: 5.18, inX: -10.17, scaleJump: 0.66, pivotX: 34.0, pivotY: 50, blurPeak: 0.505},
			reproduces: {x: ['v8.trans-blur-whip-reframe']},
		},
		layerBlur: {
			// v7.fx-layer-directional-blur, f1487-f1504 (T11 arrival, curve .i4 of the whip): the window arrives
			// 47.9 -> 20.8% W (+27.13% W of rest) at about 88 px per frame; only its content grid is smeared
			// (91 px at the cut, decaying with the speed) while the chrome stays sharp (1 px); one still
			// picture of the outgoing shot before the cut
			motions: {x: measured('v7.trans-whip-push-left.i4', 1)},
			params: {axis: 'x', inX: 27.13, scaleJump: 1, shutter: SHUTTER_V7, layerBlur: true},
			covers: ['v7.fx-layer-directional-blur'],
		},
		canvasDown: {
			// T17 f2622-f2668: one rigid canvas, the camera tilts down 86.82% H (canvas offset 166.78 -> 79.96%
			// H): the old layout leaves through the top while the next one, 86.82% H below it, arrives; heavy
			// vertical blur at the peak (about 131 px per frame)
			motions: {y: measured('v5.trans-whip-tilt')},
			params: {axis: 'y', strip: 86.82, shutter: SHUTTER},
			reproduces: {y: ['v5.trans-whip-tilt']},
		},
		pushUp: {
			// T02: the menu eases in upward (.i2, 58.99 -> 47.06% H = -11.93% H, 2.45% H per frame at the end)
			// with vertical blur; the page arrives 8.61% H below its rest still rising (the curve)
			motions: {out: measured('v7.trans-whip-push-up.i2'), y: measured('v7.trans-whip-push-up', 21)},
			params: {axis: 'y', outY: -11.93, inY: 8.61, scaleJump: 1, shutter: SHUTTER_V7},
			reproduces: {y: ['v7.trans-whip-push-up']},
		},
		riseUp: {
			// T06: the list accelerates up (.i2, 479 -> 337 px = -15.47% H, to 34 px per frame, blur to 24 px);
			// the chat arrives 599 -> 520 px (+8.61% H of rest), blurred 32 px, and settles (the curve)
			motions: {out: measured('v8.trans-whip-up.i2'), y: measured('v8.trans-whip-up', 27)},
			params: {axis: 'y', outY: -15.47, inY: 8.61, scaleJump: 1, shutter: SHUTTER_V8},
			reproduces: {y: ['v8.trans-whip-up']},
		},
		sinkDown: {
			// T13: the wall sinks on a long ease-in (.i2, 0 -> 17.48% H, to 23.7 px per picture, vertical
			// blur); the card reel arrives from above at 231 px per picture: landing card bottom -13.88 ->
			// 89.59% H (-103.46% H of rest), strong ease-out (the curve)
			motions: {out: measured('v8.trans-whip-down.i2'), y: measured('v8.trans-whip-down', 59)},
			params: {axis: 'y', outY: 17.48, inY: -103.46, scaleJump: 1, shutter: SHUTTER_V8},
			reproduces: {y: ['v8.trans-whip-down']},
		},
		punchUp: {
			// T19, stop-hold: the canvas eases up (.i4, 49.47 -> 35.40% H = -14.07% H) into a hard stop, holds
			// 3 crisp pictures (f2471-f2473), then the same canvas x2.2 closer (logo 69 -> 152 px wide) arrives
			// 30.83% H below its rest rising at about 40 px per frame and settles (the curve); the jump's fixed
			// point y = (2.2 x 35.40 - 16.23) / 1.2 = 51.4% H from the logo (x not measured: frame centre)
			motions: {out: measured('v7.trans-punch-in-whip-up.i4'), y: measured('v7.trans-punch-in-whip-up', 36)},
			params: {axis: 'y', outY: -14.07, hold: 3, inY: 30.83, scaleJump: 2.2, pivotX: 50, pivotY: 51.4, shutter: SHUTTER_V7},
			reproduces: {y: ['v7.trans-punch-in-whip-up']},
		},
		punchZoom: {
			// T33: the camera accelerates into a value (.i2: x1.0 -> x1.215 about the value (1395, 542) px =
			// (86.0% W, 59.0% H) while it pans -153 / -23 px = -9.43% W / -2.51% H), cut at speed (x1.125 per
			// picture) to a x1.7 closer framing: the value shows x2.32 on the first new picture at word scale
			// 0.81, grows to 1.00 in 10 f (0.81 / 0.89 / 0.945 / 0.98 / 1.00 at +0 / 2 / 5 / 7 / 10;
			// outStrongOver2 fits at rmse 0.05) about its top edge (rest centre x 1162 px = 71.6% W, top 389 px
			// = 42.4% H) and drifts 2.81% W / 4.79% H into place (the curve: unit word top 433 -> 389 px);
			// re-frame of the same layout x(1.125 x 1.7 / 0.81) = x2.36 about (80.2% W, 61.4% H), the point
			// that takes the value from its last outgoing place (76.6, 56.5) to its incoming rest (71.6, 49.8)
			motions: {
				out: measured('v7.trans-punch-in-whip-zoom.i2'),
				y: measured('v7.trans-punch-in-whip-zoom', 20),
				grow: motion(10, EASE.outStrongOver2, 20),
			},
			params: {
				axis: 'y',
				outScale: 1.215,
				outX: -9.43,
				outY: -2.51,
				outPivotX: 86.0,
				outPivotY: 59.0,
				scaleJump: 1.7,
				punchRate: 1.125,
				inScale: 0.81,
				inX: 2.81,
				inY: 4.79,
				inPivotX: 71.6,
				inPivotY: 42.4,
				pivotX: 80.2,
				pivotY: 61.4,
				shutter: SHUTTER_V7,
			},
			reproduces: {y: ['v7.trans-punch-in-whip-zoom']},
		},
		diagonalZoom: {
			// T29: a full-frame card slides down-left on an ease-in (.i2: top edge 2.76 -> 18.31% H = +15.55% H,
			// right edge 97.2 -> 90.3% W = -6.94% W), growing smear; hard cut to a window that fills the frame
			// and at once zooms in x4.347 (ln scale -1.311 -> 0.159, the curve) about (1799, -113) px = (110.9% W,
			// -12.3% H), so its top-right corner keeps travelling down-left; its text stays sharp (no blur)
			motions: {out: measured('v7.trans-whip-down-left-zoom-in.i2'), scale: measured('v7.trans-whip-down-left-zoom-in', 49)},
			params: {axis: 'scale', outX: -6.94, outY: 15.55, scaleJump: 4.347, pivotX: 110.9, pivotY: -12.3, shutter: SHUTTER_V7, sharpIn: true},
			reproduces: {scale: ['v7.trans-whip-down-left-zoom-in']},
		},
	},
	demoFrames: 100,
	demoTone: 'light',
};
