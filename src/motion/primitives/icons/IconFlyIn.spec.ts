import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Paths are offsets from the element's rest position in % W (x) and % H (y); toX / toY is the
// measured rest, used when the caller gives no target.

export const spec: PrimitiveSpec = {
	name: 'IconFlyIn',
	kind: 'shape',
	description:
		'An icon enters along a path and lands: it darts in from beyond an edge, drops into a card with a damped bounce, decelerates along an arc, or a chain follows its leader along an arc and dives into the target.',
	defaultVariant: 'arcIn',
	variants: {
		arcIn: {
			// v8.icon-mascot-fly-in-arc: enters through the bottom edge at x 81.5% W and decelerates along an
			// up-left arc through (74.8, 95.9) f2946, (63.3, 84.5) f2950, (52.9, 74.2) f2956, (41.0, 69.5) f2968
			// to rest (36.2, 61.5) % (f3004), 832 px of path; the curve runs from 111.6 px along it (f2946,
			// the first unclipped picture) to the end. Constant size
			motions: {progress: measured('v8.icon-mascot-fly-in-arc')},
			params: {path: '45.3,38.5 38.6,34.4 27.1,23.0 16.7,12.7 4.8,8.0 0,0', fromAlong: 0.134, toX: 36.2, toY: 61.5},
			reproduces: {progress: ['v8.icon-mascot-fly-in-arc']},
		},
		dart: {
			// v8.icon-mascot-dart-in: from beyond the lower-left edge (nothing at f772) to its place in 2
			// pictures: (13.2, 66.0) f774 -> (18.1, 61.2) f776 -> (24.1, 59.1) % f778, no fade; later rows
			// arrive at f774, f802, f834, f850, f858 (gaps 28, 32, 16, 8 f)
			motions: {progress: motion(4, linear)},
			params: {path: '-10.9,6.9 -6.0,2.1 0,0', arrivals: '0 28 60 76 84', toX: 24.1, toY: 59.1},
			covers: ['v8.icon-mascot-dart-in'],
		},
		dropBounce: {
			// v8.icon-mascot-drop-into-card: drops into a card from above, clipped by its top edge, and settles
			// with a damped bounce and a sideways swing. Card-centred close-up px at 918 (rest y +5.5, x 385):
			// y -99 (f702) -> -13 (f708) -> +21 (f718-f722) -> +5.5 (f732): -11.38% H at the start, the curve's
			// 0.82 at +6 f and +1.69% H overshoot at +16-20 f fit outSnapOver2 over 30 f; x 461 -> 348 (f720)
			// -> 385 (f732): +4.69% W, a swing to -2.28% W at +18 f, back at +30 f (ease not fitted: inOutGlide)
			motions: {y: motion(30, EASE.outSnapOver2), swing: motion(18, EASE.inOutGlide), back: motion(12, EASE.inOutGlide, 18)},
			params: {fromY: -11.38, fromX: 4.69, swingX: -2.28},
			covers: ['v8.icon-mascot-drop-into-card'],
		},
		curvedStagger: {
			// v5.logo-sphere-fly-in: three elements fly in and settle in a row at y 60.1% H. The middle one
			// drops from the top edge (y 0 -> 60.1% H: the curve); the left one comes down from the top-left
			// with it and drifts right 406 -> 487 px of 1622 (25.0% -> 30.0% W) over f1400-f1420 (ease not
			// fitted: outStrong); the right one enters first from the right edge, 5 f before the others, to
			// 1131 px (69.7% W): 1171 px at f1400 and 1131 at f1415 match the curve's progress, so its x
			// uses it. The middle's x (between the two) is not measured
			motions: {y: measured('v5.logo-sphere-fly-in'), x: measured('v5.logo-sphere-fly-in'), drift: motion(20, EASE.outStrong, 13)},
			params: {stagger: 5, fromY: 0, rowY: 60.1, leftFromX: 25.0, leftToX: 30.0, rightFromX: 100, rightToX: 69.7},
			reproduces: {y: ['v5.logo-sphere-fly-in']},
		},
		chainArc: {
			// v7.particle-mascot-chain-arc: a lead and its followers (160 px = 9.9% W apart along the same path)
			// arc from the left edge (0.7, 64.8) over a peak (33.9, 18.5) into the target centre (49.8, 49.4) %
			// (curve: path length; the path is level at the peak, a parabola each side); the followers wait above the centre and sink in one after another from
			// +52 f (f136), about 5 f apart, all in by f154 (18 f: 3 f each; ease not fitted: outStrong)
			motions: {progress: measured('v7.particle-mascot-chain-arc'), sink: motion(3, EASE.outStrong, 52)},
			params: {path: '-49.1,15.4 -15.9,-30.9 0,0', spacing: 9.9, sinkStagger: 5, toX: 49.8, toY: 49.4, ball: 5.4},
			reproduces: {progress: ['v7.particle-mascot-chain-arc']},
		},
	},
	demoFrames: 120,
	demoTone: 'light',
};
