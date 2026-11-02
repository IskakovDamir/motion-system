import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Sizes: v1-v4 px are of a 1920x1080 picture (px at 1080 as read), v5-v8 px of 1622x918 are given
// here x 1080/918. restSize / restW / restH are the measured element's rest size, which the Demo
// lays its content out at; the component itself scales whatever it is given.

export const spec: PrimitiveSpec = {
	name: 'ScalePop',
	kind: 'ui',
	description:
		'An element scales up from small about its own centre while it fades in, on a strong ease-out or on a spring that overshoots and settles; a tilt or spin can straighten with it.',
	defaultVariant: 'strongOut',
	variants: {
		strongOut: {
			// v2.logo-mark-pop-in: scale 0.316 (first visible) -> 1 about the centre on the measured ease-out;
			// opacity 0.185 -> 1 in 20 f with it (0.339, 0.468, 0.567 ... the same normalised pace as the scale)
			motions: {scale: measured('v2.logo-mark-pop-in'), opacity: motion(20, EASE.outStrong)},
			params: {fromScale: 0.316, fromOpacity: 0.185, restSize: 376},
			reproduces: {scale: ['v2.logo-mark-pop-in']},
		},
		fadeGrow: {
			// v1.logo-mark-pop-in: opacity 0 -> 1 in 9 f (curve); scale 0.765 -> 1 in 6 f from the next frame
			// (0.765, 0.905, 0.95, 0.96, 0.98, 0.99, 1.00: half way in under 1 f -> outStrong2)
			motions: {opacity: measured('v1.logo-mark-pop-in'), scale: motion(6, EASE.outStrong2, 1)},
			params: {fromScale: 0.765},
			reproduces: {opacity: ['v1.logo-mark-pop-in']},
		},
		spinTilt: {
			// v2.logo-spin-scale-in: scale 0.658 -> 1, a 17.1 deg counter-clockwise tilt -> 0 and opacity
			// 0.13 -> 1, all on the same normalised progress (within 0.02)
			motions: {
				scale: measured('v2.logo-spin-scale-in'),
				rotate: measured('v2.logo-spin-scale-in'),
				opacity: measured('v2.logo-spin-scale-in'),
			},
			params: {fromScale: 0.658, fromAngle: -17.1, fromOpacity: 0.13, restSize: 167.5},
			reproduces: {scale: ['v2.logo-spin-scale-in']},
		},
		longTail: {
			// v7.icon-voice-badge-pop: absent -> 0.49 in its first picture -> 1 on a long tail (37-45 f to 2%);
			// badge disc 65.8 px across at 918
			motions: {scale: measured('v7.icon-voice-badge-pop')},
			params: {fromScale: 0, restSize: 77.4},
			reproduces: {scale: ['v7.icon-voice-badge-pop']},
		},
		sliverGrow: {
			// v7.icon-tile-pop-in: from nothing to the 157 px tile (9.7% W) about its centre, fast ease-out, no overshoot
			motions: {scale: measured('v7.icon-tile-pop-in')},
			params: {fromScale: 0, restSize: 184.7},
			reproduces: {scale: ['v7.icon-tile-pop-in']},
		},
		rideIn: {
			// v8.icon-mascot-pop-slide: grows from a dot about a point fixed in its layout, no overshoot;
			// it fades in over its first frames (S05: about 0.5 at +2 f, 0.8 at +4, 0.9 at +6-8, 1 by +12)
			motions: {scale: measured('v8.icon-mascot-pop-slide'), opacity: motion(12, EASE.outStrong)},
			params: {fromScale: 0, restSize: 98.8},
			reproduces: {scale: ['v8.icon-mascot-pop-slide']},
		},
		discGrow: {
			// v8.icon-avatar-grow-in: a round avatar grows about its centre (main curve) while its thread
			// connector draws down from under it (.i2: 0 -> 24.9% H); the connector's top stays 75.5 px below
			// the centre of the 117 px avatar (0.645 of its width) and it is drawn on, not scaled with the disc
			motions: {scale: measured('v8.icon-avatar-grow-in'), connector: measured('v8.icon-avatar-grow-in.i2')},
			params: {fromScale: 0, connectorLength: 24.946, connectorTop: 0.645, restSize: 128.2},
			reproduces: {scale: ['v8.icon-avatar-grow-in']},
		},
		glowGrow: {
			// v7.icon-glow-in: from a dot about 1% W across into the sharp icon in 15 f (ease not fitted:
			// outFirm, the icon family's usual ease-out)
			motions: {scale: motion(15, EASE.outFirm)},
			params: {fromWidth: 1},
			covers: ['v7.icon-glow-in'],
		},
		cellByCell: {
			// v8.icon-grid-cell-pop: a 2 x 2 grid builds cell by cell, anticlockwise from the bottom-left:
			// starts f883 (BL), f884 (BR), f891 (TR), f894 (TL); each cell 3-5 f from a 3-15 px dot to 27 px
			// (1.7% W). cellOffsets are in reading order of the cells (TL, TR, BL, BR); 4 f = middle of 3-5;
			// fromScale = the 3 px dot / 27 px
			motions: {cell: motion(4, EASE.outStrong)},
			params: {fromScale: 0.11, cellOffsets: '11 8 0 1', cellSize: 31.8},
			covers: ['v8.icon-grid-cell-pop'],
		},
		threeStep: {
			// v5.ui-chip-pop: shown on three pictures only (f832 / f835 / f837 after the last empty one, f830):
			// 0.48 / 0.92 / 1.00 of its size, fill at full luma from the first; the measured curve is the
			// envelope the steps sample. Chip 361 x 81 px at 918
			motions: {scale: measured('v5.ui-chip-pop')},
			params: {fromScale: 0, steps: '2 5 7', restW: 424.7, restH: 95.3},
			reproduces: {scale: ['v5.ui-chip-pop']},
		},
		glowSettle: {
			// v7.ui-folder-pop-in: absent -> 0.62 in its first picture -> 1.0 (247 px = 15.2% W) about its centre
			motions: {scale: measured('v7.ui-folder-pop-in')},
			params: {fromScale: 0, restSize: 290.6},
			reproduces: {scale: ['v7.ui-folder-pop-in']},
		},
		twoPicture: {
			// v5.ui-button-pop: a speck at its centre (about 23 px of 117.5, max luma 14) for 2 f, then 0.69 of
			// its size and dim (median luma 160) at +2 f, then 0.99 and bright (204, 207 at rest) at +5 f;
			// opacity = luma / 207. It keeps a 7 deg tilt as its rest pose (top edge 6.7-7.8 deg)
			motions: {steps: motion(5, linear)},
			params: {stepFrames: '0 2 5', scaleSteps: '0.196 0.69 0.99', opacitySteps: '0.068 0.773 0.986', restAngle: 7, restSize: 138.2},
			covers: ['v5.ui-button-pop'],
		},
		overshootPeak: {
			// v3.icon-node-pop-in: scale 0.868 -> 1.026 (sharp peak) -> 1.000 in 11 f (main curve, the peak
			// comes from its overshoot) while the opacity rises 0 -> 1 in 5 f (curve .i2); badge 137.8 px
			motions: {scale: measured('v3.icon-node-pop-in'), opacity: measured('v3.icon-node-pop-in.i2')},
			params: {fromScale: 0.868, restSize: 137.8},
			reproduces: {scale: ['v3.icon-node-pop-in']},
		},
		springDip: {
			// v8.icon-mascot-pop-in: from nothing to x1.17-1.22, a dip to x0.96-0.98, rest (curve: bbox width,
			// rest 7.58% W)
			motions: {scale: measured('v8.icon-mascot-pop-in')},
			params: {fromScale: 0, restSize: 144.7},
			reproduces: {scale: ['v8.icon-mascot-pop-in']},
		},
		blurOvershoot: {
			// v6.ui-node-pop-in: the icon grows from 0 (fitted from scale 0, first picture x0.45) to x1.05 and
			// back to 1 in 25 f; icon 193 x 174 px at 918
			motions: {scale: measured('v6.ui-node-pop-in')},
			params: {fromScale: 0, restW: 227.1, restH: 204.7},
			reproduces: {scale: ['v6.ui-node-pop-in']},
		},
		spinSpring: {
			// v7.icon-glyph-spin-pop: the glyph spins from +80 deg (clockwise, image y down) into place on a
			// damped spring (curve: -18.5 deg overshoot, +1 deg, 0); its size 0.47 -> 1.40 (f434, +15 f) ->
			// 0.98 (f467) -> 1.0 (f472, +53 f). Scale shape not fitted: up on outFirm, the settle on
			// inOutGlideOver2 (its overshoot is the dip below 1)
			motions: {
				rotate: measured('v7.icon-glyph-spin-pop'),
				scaleUp: motion(15, EASE.outFirm),
				scaleSettle: motion(38, EASE.inOutGlideOver2, 15),
			},
			params: {fromAngle: 80, fromScale: 0.47, peakScale: 1.4},
			reproduces: {rotate: ['v7.icon-glyph-spin-pop']},
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
