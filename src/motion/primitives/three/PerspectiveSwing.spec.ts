import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

export const spec: PrimitiveSpec = {
	name: 'PerspectiveSwing',
	kind: '3d',
	description:
		'A flat line or card turns in perspective: it morphs into a keystone taper right after landing, swings flat from a tilt while growing, or a mirrored pair turns its top edges apart and back.',
	defaultVariant: 'taper',
	variants: {
		taper: {
			// v5.3d-perspective-swing, S24 title 2 (the curve: top-edge slope 0 -> 33 px over 540 px = 3.5 deg, 17 f):
			// the line keeps its x extent (711 -> 698 px, x0.982) and its ends go from flat to a keystone,
			// in % of the line height (53-56 px, 54.5): left end top 645 -> 624 px (-38.5), bottom 698 -> 684 (-25.7),
			// right end top 645 -> 657 (+22.0), bottom 701 -> 695 (-11.0): left/right height ratio 0.95 -> 1.58
			motions: {taper: measured('v5.3d-perspective-swing')},
			params: {topLeft: -38.5, bottomLeft: -25.7, topRight: 22.0, bottomRight: -11.0, widthScale: 0.982},
			reproduces: {taper: ['v5.3d-perspective-swing']},
		},
		swingIn: {
			// v5.text-type-swing-in: the line's baseline tilt 8.06 -> 0 deg in 10 f (the curve, right end low at the cut);
			// cap height 41 -> 81 px (x0.506 -> 1) in 12 f, sampled 0 / .60 / .78 / .93 / .98 / 1 at 0 / 2 / 5 / 7 / 10 / 12 f
			// (outStrong3 fits, rmse 0.031); letters type on 4 -> 12 of 12 (from a third) in 10 f, linear (1.25 f per letter);
			// the newest letters sit at luma 213-220 against 249 settled (0.87) for one 24 fps picture (2.5 f)
			motions: {rotate: measured('v5.text-type-swing-in'), scale: motion(12, EASE.outStrong3), type: motion(10, linear)},
			params: {fromAngle: 8.06, fromScale: 0.506, typedFrom: 0.333, freshOpacity: 0.87, freshFrames: 2.5},
			reproduces: {rotate: ['v5.text-type-swing-in']},
		},
		mirrorPair: {
			// v5.card-mirror-tilt: the two outer cards turn as a mirrored pair, top edges 0.2 -> 9.8 deg in 23 f (the curve;
			// first card's right end down, last card's left end down), bottom edges 0.2 -> 7.5 deg, side edges staying upright
			// (a 3D turn, not a flat rotation); middle cards level; they hold, then turn back with the pull-back to 1.3 deg
			// (bottom -1.6) in 25 f (.i2), its row starting 70 f after the turn (f3107 -> f3177); delays align the tokens'
			// active windows (the turn's starts 5 f into its token, the turn-back's 8 f: 5 + 70 - 8 = 67)
			motions: {rotate: measured('v5.card-mirror-tilt'), back: measured('v5.card-mirror-tilt.i2', 67)},
			params: {angle: 9.8, fromAngle: 0.2, bottomAngle: 7.5, backAngle: 1.3, backBottom: -1.6},
			reproduces: {rotate: ['v5.card-mirror-tilt']},
		},
	},
	demoFrames: 150,
	demoTone: 'dark',
};
