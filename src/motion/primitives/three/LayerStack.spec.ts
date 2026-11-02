import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Shared geometry (each variant carries what it uses):
// - the v6 phone stack (v6.3d-layer-explode): front-on a layer is 0.49 as wide as tall (278 / 558 px at f548); exploded
//   (still f600) the layers are 491 px = 53.5 % H tall, turned about 44 deg about the vertical axis (left edge nearer:
//   top-edge width 172 px = 0.49 x 491 x cos 44), the ink extent is 719 px and the stack 759 px tall, so the back layer's
//   centre sits (719 - 172) = 547 px = 33.7 % W left of and (759 - 491) = 268 px = 29.2 % H above the front layer's;
//   at the start the closed phone is 558 px = 60.8 % H tall; the front layer's right edge stays at 1102-1145 px (69.3 % W)
// - the v8 screen stack (v8.3d-stack-fan-out, S17): about 11 layers, front edge at 289-304 px (18.3 % W), silhouette
//   26 % H tall at both ends, far end 58 px (6.3 % H) higher; a layer is the S16 page, 1492 x 840 px (aspect 1.776, T17);
//   centre y 460-502 px = 50-55 % H (T16, as the page becomes the front layer)
// - the v8 card deck (S08): about 22 cards in depth, front card at rest x 22.7-77.1 % W, top 6.6 % H; the far end at
//   the left frame edge is 0.48-0.57 (0.525) x the front card
// - perspective (yaw of a layer): v8.3d-card-turn-recede's pinhole fit, f = 2618 px = 161.4 % W, the only measured
//   focal length; the v8 screen layers' yaw is UNCERTAIN in the rows, so they take that card's 26.5 deg yaw (same video)

export const spec: PrimitiveSpec = {
	name: 'LayerStack',
	kind: '3d',
	description:
		'A stack of parallel layers in 3D: it separates along a diagonal, fans out, collapses back, one layer sinks on its own, the rear cards fold into the front one, or new cards land on its front on a fixed interval.',
	defaultVariant: 'explode',
	variants: {
		explode: {
			// v6.3d-layer-explode: the closed stack turns 0 -> 44 deg in 5 f (left edge 675 -> 701 -> 753 px at 0 / 3 / 5 f:
			// inAccelerate2 fits, rmse 0.011), and from 3 f the layers separate along the diagonal (the curve: ink extent
			// 338 -> 719 px, 20 f, sharp ease-out; its token starts moving at its frame 3, so no delay)
			motions: {turn: motion(5, EASE.inAccelerate2), spread: measured('v6.3d-layer-explode')},
			params: {yaw: 44, spreadX: 33.7, spreadY: 29.2, aspect: 0.49, layerHFrom: 60.8, layerH: 53.5, frontRight: 69.3, perspective: 161.4},
			reproduces: {spread: ['v6.3d-layer-explode']},
		},
		fanOut: {
			// v8.3d-stack-fan-out: the layers slide out behind the front layer toward the upper right, far end
			// 68.9 -> 83.0 % W in 39 f (the curve), the front edge staying; a soft dark halo builds around the stack:
			// near-linear first build in 22 f from f2028 (.i2: 3 f before the curve, whose token starts at once, and its own
			// token starts at frame 3: delay -6), then one-picture steps at f2059 and f2073 (+28 f, +42 f; +25 %, +23 %, partly decaying)
			// to 1.35 x the first level; 20 px (1.23 % W) out the page goes 248 -> 203 -> 190 (darkening 0.23 at the end), and
			// it is back to 244 (1.6 %) at the reach, 203-210 px = 12.7 % W
			motions: {
				x: measured('v8.3d-stack-fan-out'),
				halo: measured('v8.3d-stack-fan-out.i2', -6),
				haloStep1: motion(1, linear, 28),
				haloStep2: motion(1, linear, 42),
			},
			params: {
				farFrom: 68.9,
				farTo: 83.0,
				frontLeft: 18.3,
				centerY: 52.5,
				rise: 6.3,
				layerH: 26.0,
				aspect: 1.776,
				yaw: 26.5,
				perspective: 161.4,
				haloFinal: 1.35,
				haloDark: 0.23,
				haloAt: 1.23,
				haloReach: 12.7,
				haloTail: 0.016,
			},
			reproduces: {x: ['v8.3d-stack-fan-out']},
		},
		collapse: {
			// v6.3d-stack-collapse: the exploded layers slide back into one stack (the curve: ink extent 752 -> 461 px,
			// 46.4 -> 28.4 % W, 12 f ease-in, abrupt end) while the front layer's turn of about 40 deg goes to front-on;
			// 15 f after the start (f816; the curve's token starts moving at its frame 3: delay 18) they fan out again
			// turned the other way (extent 477 -> 630 -> 715 -> 748 px at
			// 0 / 2 / 5 / 7 f: outStrongOver2 fits, rmse 0.031), the front layer's right edge now nearer at about 22-28 deg
			// (25), the others fanned to the right
			motions: {spread: measured('v6.3d-stack-collapse'), refan: motion(7, EASE.outStrongOver2, 18)},
			params: {yaw: 40, refanYaw: -25, spreadX: 33.7, spreadY: 29.2, aspect: 0.49, layerH: 53.5, perspective: 161.4},
			reproduces: {spread: ['v6.3d-stack-collapse']},
		},
		layerSink: {
			// v6.3d-layer-sink: in the exploded stack one layer slides down on its own: the second layer from the back
			// +84.5 px = 9.2 % H in 35 f (the curve), the back layer +20.4 px = 2.2 % H with it; the layers in front hold
			motions: {y: measured('v6.3d-layer-sink')},
			params: {sink: 9.2, sinkBehind: 2.2, yaw: 44, spreadX: 33.7, spreadY: 29.2, aspect: 0.49, layerH: 53.5, frontRight: 69.3, perspective: 161.4},
			reproduces: {y: ['v6.3d-layer-sink']},
		},
		fold: {
			// v8.card-stack-collapse: the cards behind the front card fold into it in 7 f: the deck's left end
			// 0 -> 50 -> 151 -> 325 -> 372 px (the front card's left edge) at 0 / 1 / 3 / 5 / 7 f (inOutGlideOver2 fits, rmse 0.032)
			motions: {fold: motion(7, EASE.inOutGlideOver2)},
			params: {frontLeft: 22.7, frontRight: 77.1, frontTop: 6.6, farScale: 0.525},
			covers: ['v8.card-stack-collapse'],
		},
		slamOn: {
			// v8.card-deck-flip-stack: a new card lands on the front of the deck every 4 f (21 cards in 80 f, constant rate);
			// its first picture is 1.3-11.9 % taller (1.066) and 13-121 px further right (67 px = 4.1 % W), and it settles
			// into the stack on the next picture (one 24 fps picture = 2.5 f)
			motions: {land: motion(1, linear, 1.5)},
			params: {interval: 4, slamScale: 1.066, slamShift: 4.1, frontLeft: 22.7, frontRight: 77.1, frontTop: 6.6, farScale: 0.525},
			covers: ['v8.card-deck-flip-stack'],
		},
	},
	demoFrames: 110,
	demoTone: 'light',
};
