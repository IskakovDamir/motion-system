import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Frame 0 is the cut: the new view is shown at its offset (fromX % W, fromY % H), scale (fromScale
// about pivotX / pivotY, % of frame), opacity or blur, already moving, and settles to rest.
// shutter: frames of travel smeared into one picture (box length / px per frame), measured on
// v8.cam-scroll-exit-up (24 px box at 17 px/f on its cut picture f1002); set where the rows note
// blur on arrival (and on v8, whose look ties blur to speed).
const SHUTTER = 1.41;

export const spec: PrimitiveSpec = {
	name: 'CutInSettle',
	kind: 'camera',
	description:
		'After a hard cut the new view arrives offset, zoomed or blurred and still moving, and settles on a strong ease-out.',
	defaultVariant: 'zoomOut',
	variants: {
		zoomOut: {
			// v7.cam-zoom-out-settle-in (S02): x1.59 -> 1.0 while the header centre goes (30.1, 9.3) -> (34.2, 19.7)%,
			// i.e. a pure scale about ((1.59 * 34.2 - 30.1) / 0.59, (1.59 * 19.7 - 9.3) / 0.59) = (41.2, 37.3)%; enters blurred
			motions: {scale: measured('v7.cam-zoom-out-settle-in')},
			params: {fromScale: 1.59, pivotX: 41.2, pivotY: 37.3, shutter: SHUTTER},
			reproduces: {scale: ['v7.cam-zoom-out-settle-in']},
		},
		blurLow: {
			// v8.cam-cut-in-settle: agent icon 61.7 -> 56.4% H (+5.3% H low); scale x0.94 -> 1.00 by f523 (11 f, the
			// row's shape: outStrong2; UNCERTAIN in the row); Gaussian sigma 7.0 px of 1622 over a 1.6 px sharp baseline
			// (sqrt(7.0^2 - 1.6^2) = 6.8 px = 0.42% W) clearing over 15 f: 0 / 0.15 / 0.43 / 0.57 / 0.93 / 1 at
			// +0 / 4 / 8 / 10 / 12 / 15 (inOutGlide fits at rmse 0.055); scale pivot not measured: frame centre
			motions: {y: measured('v8.cam-cut-in-settle'), scale: motion(11, EASE.outStrong2), blur: motion(15, EASE.inOutGlide)},
			params: {fromY: 5.3, fromScale: 0.94, fromBlur: 0.42, pivotX: 50, pivotY: 50},
			reproduces: {y: ['v8.cam-cut-in-settle']},
		},
		throwUp: {
			// v8.cam-whip-in-settle: image bottom edge 76.6 -> 16.5% H (+60.1% H low), heavy vertical blur gone by f1481
			motions: {y: measured('v8.cam-whip-in-settle')},
			params: {fromY: 60.1, shutter: SHUTTER},
			reproduces: {y: ['v8.cam-whip-in-settle']},
		},
		slideLeft: {
			// v8.cam-slide-in-left-settle: band left edge 223.9 -> 176.7 px of 1622 (+2.9% W, still sliding left), no scale
			motions: {x: measured('v8.cam-slide-in-left-settle')},
			params: {fromX: 2.9, shutter: SHUTTER},
			reproduces: {x: ['v8.cam-slide-in-left-settle']},
		},
		zoomDown: {
			// v4.layout-zoom-settle-in: 1.112 -> 1.000 about the hub centre (958, 575 px of 1920 x 1080), opacity
			// 0 -> 1 on its own curve (.i2), settling 18 f before the zoom; no blur noted
			motions: {scale: measured('v4.layout-zoom-settle-in'), opacity: measured('v4.layout-zoom-settle-in.i2')},
			params: {fromScale: 1.112, pivotX: 49.9, pivotY: 53.2},
			reproduces: {scale: ['v4.layout-zoom-settle-in']},
		},
		punchIn: {
			// v8.cam-punch-in-cut-settle (S09): the cut is to a x2.5 closer framing of the same layout (already at its
			// final scale on the first picture); the close-up arrives 314 -> 159 px of 918 (+16.9% H) low and settles;
			// the framed point is the content's choice (focus prop), else the frame centre
			motions: {y: measured('v8.cam-punch-in-cut-settle')},
			params: {fromY: 16.9, punchScale: 2.5, pivotX: 50, pivotY: 50, shutter: SHUTTER},
			reproduces: {y: ['v8.cam-punch-in-cut-settle']},
		},
		ghostCarry: {
			// v8.ui-ghost-card-band: the previous card returns flattened as a band (fill 224 on the 248 page: the
			// surfaceAlt role on bg) at y 0-19.1% H, left edge 176.8 px = 10.9% W, width 1385 px = 85.4% W of 1622,
			// riding the cut-in slide (v8.cam-slide-in-left-settle: +2.9% W), then holding
			motions: {x: measured('v8.cam-slide-in-left-settle')},
			params: {fromX: 2.9, ghostLeft: 10.9, ghostWidth: 85.4, ghostHeight: 19.1, shutter: SHUTTER},
			covers: ['v8.ui-ghost-card-band'],
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
