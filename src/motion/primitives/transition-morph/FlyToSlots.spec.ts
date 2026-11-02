import type {PrimitiveSpec} from '../types';
import {linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Frame 0 is the first frame of the first item's motion token (60 fps). v1-v4 px are of a 1920x1080
// picture (px at 1080 as read); v5-v8 px of 1622x918: % W = px / 16.22, % H = px / 9.18. Paths run
// from each item's start to its slot (both given by the layout); the measured progress, path shape,
// scale and staggers come from here. Positions and sizes after `layout:` are the measured layout the
// Demo uses.

export const spec: PrimitiveSpec = {
	name: 'FlyToSlots',
	kind: 'shape',
	description:
		'A set of elements travels on straight or arced paths into target slots on one shared ease-in-out, optionally scaling to the slot size; staggered starts, so speed scales with distance.',
	defaultVariant: 'gather',
	variants: {
		gather: {
			// v3.trans-hex-gather: each hexagon flies on a straight line into its honeycomb cell on one
			// shared ease-in-out (the curve, progress along the path; D 31-32 for all), starts 2.4 f apart
			// in the swap order, so speed scales with distance; size, orientation and luma constant.
			// layout: cells 188 x 170 px, a 7-cell honeycomb of pitch 204.5 px round (959.5, 379.5) px =
			// (50.0% W, 35.1% H)
			motions: {progress: measured('v3.trans-hex-gather')},
			params: {stagger: 2.4, toScale: 1, cellW: 188, cellH: 170, pitch: 204.5, slotX: 50.0, slotY: 35.1},
			reproduces: {progress: ['v3.trans-hex-gather']},
		},
		converge: {
			// v2.trans-icon-converge-morph: every icon travels on a straight line into a slot of a centred
			// row (y 450 -> 757 px = 41.7% -> 70.1% H) while shrinking 1.00 -> 0.64, all on one
			// ease-in-out (the curve on y; token start f1162), no stagger (9 icons onto 6 slots, so some
			// slots take two); from f1174 (+12 f) the icons crossfade into the slot shapes, done f1184
			// (10 f, not fitted: linear)
			motions: {y: measured('v2.trans-icon-converge-morph'), morph: motion(10, linear, 12)},
			params: {toScale: 0.64, fromY: 41.7, toY: 70.1},
			reproduces: {y: ['v2.trans-icon-converge-morph']},
		},
		riseIntoSlots: {
			// v2.trans-hex-fly-into-ui: the row flies up into the slots of a panel, all on one progress (the
			// lead: y 757 -> 160 px = 70.1% -> 14.8% H, the curve; token start f1215); the lead shrinks
			// to 0.75 of its size, the others to 0.44 (126 -> 94 / 56 px wide); the panel behind fades in
			// from f1219 (+4 f) to f1235 (16 f; toolbar luma 250 -> 239.1, near-linear: linear)
			motions: {y: measured('v2.trans-hex-fly-into-ui'), panel: motion(16, linear, 4)},
			params: {leadScale: 0.75, toScale: 0.44, fromY: 70.1, toY: 14.8, cell: 126},
			reproduces: {y: ['v2.trans-hex-fly-into-ui']},
		},
		swirl: {
			// v4.particle-swarm-converge: each hexagon flies on a near-straight path from its grid place to
			// a slot of a honeycomb disc round (959.5, 574.5) px = (50.0% W, 53.2% H), on the corner
			// hexagon's curve (progress along its path, about 1 px overshoot); launches ripple outward at
			// about 65 px per frame from that centre (f1329 at 71 px, f1343 at 978 px); the slots are turned
			// against the starts (corner hexagons -16 and -31 deg about the centre: mean -23.5), so the
			// cloud reads as a swirl
			motions: {progress: measured('v4.particle-swarm-converge')},
			params: {waveSpeed: 65, centreX: 50.0, centreY: 53.2, turn: -23.5},
			reproduces: {progress: ['v4.particle-swarm-converge']},
		},
		arcToSlot: {
			// v8.trans-mascot-converge-fly: the element flies from (49.69% W, 50.6% H) into its slot
			// (10.25% W, 38.1% H) on the curve (x), along a dipping arc: lowest 56.6% H (6.0% H below the
			// start) at 0.426 of the x travel (x 32.89% W at f2654), level there, then rising into the slot;
			// it grows x2.0 (40 -> 80 px) on the same progress
			motions: {x: measured('v8.trans-mascot-converge-fly')},
			params: {dip: 6.0, dipAt: 0.426, toScale: 2.0, fromX: 49.69, fromY: 50.6, toX: 10.25, toY: 38.1, size: 47.1},
			reproduces: {x: ['v8.trans-mascot-converge-fly']},
		},
		swoopAcross: {
			// v8.trans-avatar-fly-split: the tile swoops from its slot (10.30% W, 35.8% H) down through a dip
			// (55.3% H = 19.5% H below the start, at 0.300 of the x travel, f2500) and across the frame
			// centre to the mirror place (69.13% W, 50.2% H) on the curve (x, token start f2481 = +7 f); it
			// grows with an ease-in x1 -> x4.76 (the cusp, f2507; .i2, token start f2474), then shrinks
			// with an ease-out from full speed x1.50 -> x1.0 of its settled size, 4.76 -> 3.17 of the
			// 81.4 px slot (v8.particle-mascot-split.i2's curve, from f2507 = +33 f)
			motions: {x: measured('v8.trans-avatar-fly-split', 7), grow: measured('v8.trans-avatar-fly-split.i2'), settle: measured('v8.particle-mascot-split.i2', 33)},
			params: {dip: 19.5, dipAt: 0.3, peakScale: 4.76, toScale: 3.17, fromX: 10.3, fromY: 35.8, toX: 69.13, toY: 50.2, size: 95.8},
			reproduces: {x: ['v8.trans-avatar-fly-split']},
		},
	},
	demoFrames: 100,
	demoTone: 'light',
};
