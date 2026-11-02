import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Frame 0 of every variant is the first frame of its first motion token (60 fps). Pixels of v5-v8
// are of a 1622x918 picture: % W = px / 16.22, % H = px / 9.18. Scales written as factors; a curve
// measured on ln or log2 scale is played on that scale. `cut` is the frame of the first incoming
// picture; until then the outgoing side holds its last picture, as the references do.

export const spec: PrimitiveSpec = {
	name: 'ZoomThrough',
	kind: 'transition',
	description:
		'A zoom on one point accelerates toward the camera and carries through into the next scene, which continues the motion and settles; with radial streaks, a dissolve, a spin, or one dark vignetted picture.',
	defaultVariant: 'cutContinue',
	variants: {
		cutContinue: {
			// v7.trans-zoom-through-cut: the outgoing view pushes in about (811, 461) px = (50.0% W, 50.2% H),
			// ln scale 0 -> ln 1.691 accelerating to about 5% per frame (.i2, ends on the last old picture
			// f3686, repeated f3687-f3689); hard cut f3690 = +4 f; the incoming view keeps zooming in about
			// (810, 459) px = (49.9, 50.0) by x1.432 on ln scale (the curve), so it starts at 1 / 1.432 of
			// its rest size and settles at it
			motions: {out: measured('v7.trans-zoom-through-cut.i2'), scale: measured('v7.trans-zoom-through-cut', 43)},
			params: {outScale: 1.691, outX: 50.0, outY: 50.2, inScale: 1.432, inX: 49.9, inY: 50.0, cut: 43},
			reproduces: {scale: ['v7.trans-zoom-through-cut']},
		},
		risingZoom: {
			// v1.trans-zoom-through-mark: the layer scales 1.0 -> 1.40 about the mark (curve) while the mark
			// rises 540 -> 379.5 px = 50.0% -> 35.1% H (-14.9% H, .i2); every cell but the mark fades out
			// f880-f888 (8 f, +13 f after the token start f867; not fitted: linear); the mark is the
			// incoming scene's mark, so the incoming layer rides the same zoom and lands at rest
			motions: {scale: measured('v1.trans-zoom-through-mark'), rise: measured('v1.trans-zoom-through-mark.i2'), fade: motion(8, linear, 13)},
			params: {toScale: 1.4, rise: 14.9, markX: 50.0, markY: 50.0},
			reproduces: {scale: ['v1.trans-zoom-through-mark']},
		},
		radialStreaks: {
			// v5.trans-zoom-through-radial: the title accelerates toward the camera about (801, 455) px =
			// (49.4% W, 49.6% H), 1.035 -> 1.521 (x1.470, .i2, token start f297); its last picture f312
			// is held to f315; cut f316 = +19 f; radial streaks (length / outer radius) 0 at f307 (no blur),
			// 0.20 f310, 0.23 f312, 0.47 on the first new picture f316, back to none at f318; the new shot
			// starts dimmed (f316: centre 57.5 / 106.5, edge 43.8 / 77.2 of rest -> 0.46 / 0.43 dark), is
			// darkest at f318 (+21 f: centre 49.6 / 106.5, edge 17.2 / 77.2 -> 0.53 / 0.78 dark, a sharp
			// centre window 37% W x 41% H) and recovers on the curve (frame luma 20.8 -> 80.45)
			motions: {zoom: measured('v5.trans-zoom-through-radial.i2'), opacity: measured('v5.trans-zoom-through-radial', 21)},
			params: {
				zoomTo: 1.47,
				originX: 49.4,
				originY: 49.6,
				cut: 19,
				streaks: '10:0 13:0.2 15:0.23 19:0.47 21:0',
				firstCentre: 0.46,
				firstEdge: 0.43,
				darkCentre: 0.53,
				darkEdge: 0.78,
				windowW: 37,
				windowH: 41,
			},
			reproduces: {opacity: ['v5.trans-zoom-through-radial']},
		},
		oversizeLanding: {
			// v6.trans-zoom-through: the outgoing view pulls back x1.0 -> x0.40 about (811, 462) px =
			// (50.0% W, 50.3% H) with an accelerating ease-in (v6.cam-pull-back-cut's curve, last picture
			// f1078 = its end, swap 1078|1081); the incoming view lands oversized x1.14 at f1081 (+28 f)
			// and shrinks to x1.0 in 10 f (the curve; item scale, here the whole incoming layer about the
			// frame centre)
			motions: {out: measured('v6.cam-pull-back-cut'), scale: measured('v6.trans-zoom-through', 28)},
			params: {outScale: 0.4, outX: 50.0, outY: 50.3, inScale: 1.14, cut: 28},
			reproduces: {scale: ['v6.trans-zoom-through']},
		},
		dissolve: {
			// v8.trans-zoom-through-dissolve: the lockup zooms about (50.5% W, 50.0% H), log2 scale 0 -> 1.65
			// stops (x3.14) on the curve, still growing after it (last measured interval 1.15 -> 1.65 stops
			// in 2 f = 0.25 stops per frame); the next scene cross-dissolves in under it over 7 f (darkest
			// pixel luma 180 / 112 / 43 / 0 at f136 / 138 / 140 / 143 = a linear fade f134-f141, +19 f)
			motions: {scale: measured('v8.trans-zoom-through-dissolve'), dissolve: motion(7, linear, 19)},
			params: {stops: 1.65, exitRate: 0.25, originX: 50.5, originY: 50.0},
			reproduces: {scale: ['v8.trans-zoom-through-dissolve']},
		},
		tunnelExit: {
			// v8.trans-tunnel-exit-zoom-through (curve v8.footage-card-zoom-to-full): the outgoing content flies
			// past the camera (x1.10 / 1.50 / 1.60 / 1.9 at f164 / 168 / 172 / 174 = 1 / 1.364 / 1.455 / 1.727
			// of its first picture, accelerating) while the field pales to white from f166 (+2 f): mostly by
			// f172, faint bars to f177, pure white from f179 (13 f; not fitted: an early ease-out, outStrong); at f174 (+10 f) the incoming card appears at the vanishing point
			// (49.9% W, 50.2% H) at 0.0506 of the frame and zooms to full frame (the curve)
			motions: {scale: measured('v8.footage-card-zoom-to-full', 10), wash: motion(13, EASE.outStrong, 2)},
			params: {fly: '0:1 4:1.364 8:1.455 10:1.727', cardFrom: 0.0506, cardX: 49.9, cardY: 50.2},
			reproduces: {scale: ['v8.trans-tunnel-exit-zoom-through']},
		},
		spin: {
			// v7.trans-spin-zoom-whip: the outgoing view turns counter-clockwise 0 -> -9.54 deg and pushes in
			// x1.512 (ln scale) about (50.4% W, 49.9% H) on one ease-in (.i2, last picture f1256 = its end,
			// token start f1233); hard cut f1259 (+26 f); the incoming view starts 9.749 deg clockwise and
			// turns level (the curve, from f1260 = +27 f) while it pushes in x2.58 about (50.2% W, 50.4% H)
			// (.i3, background scale), so it starts at 1 / 2.58 of its rest size
			motions: {
				out: measured('v7.trans-spin-zoom-whip.i2'),
				rotate: measured('v7.trans-spin-zoom-whip', 27),
				scale: measured('v7.trans-spin-zoom-whip.i3', 27),
			},
			params: {outAngle: -9.54, outScale: 1.512, outX: 50.4, outY: 49.9, inAngle: 9.749, inScale: 2.58, inX: 50.2, inY: 50.4, cut: 26},
			reproduces: {rotate: ['v7.trans-spin-zoom-whip']},
		},
	},
	demoFrames: 110,
	demoTone: 'light',
};
