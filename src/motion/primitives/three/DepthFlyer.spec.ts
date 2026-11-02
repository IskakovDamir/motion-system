import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

export const spec: PrimitiveSpec = {
	name: 'DepthFlyer',
	kind: '3d',
	description:
		'Small folded 3D shapes fly into depth toward a vanishing point, shrinking and decelerating, each pulling a particle trail; or one dives out through the bottom edge.',
	defaultVariant: 'converge',
	variants: {
		converge: {
			// v5.3d-origami-converge, frame 0 = f3965 (the curve's start): three folded shapes fly into depth toward the
			// frame centre, shrinking and decelerating:
			// right one: 69.8 -> 58.4 % W (the curve, 27 f), 64.9 -> 58.0 % H (57.4-58.6), scale 1.45 -> 0.90;
			// top one, under way since f3960 (-5 f): x 49.5 % W (49-50), 29.7 -> 42.8 % H, scale 1.48 -> 0.72 in 37 f,
			// decelerating (not fitted separately: the right one's outFirm);
			// near one, since f3957 (-8 f): from the upper-left corner to 48.4 % W / 56.1 % H (47.7-49.1, 55.4-56.8) in
			// about 40 f (template lost: ease and scale not measured; it takes the top one's scale, and a fast-start token,
			// outSnap, as the stills show it most of the way in by f3965)
			motions: {x: measured('v5.3d-origami-converge'), top: motion(37, EASE.outFirm, -5), near: motion(40, EASE.outSnap, -8)},
			params: {
				count: 3,
				rightX0: 69.8,
				rightX1: 58.4,
				rightY0: 64.9,
				rightY1: 58.0,
				rightS0: 1.45,
				rightS1: 0.9,
				topX: 49.5,
				topY0: 29.7,
				topY1: 42.8,
				topS0: 1.48,
				topS1: 0.72,
				nearX0: 0,
				nearY0: 0,
				nearX1: 48.4,
				nearY1: 56.1,
			},
			reproduces: {x: ['v5.3d-origami-converge']},
		},
		dive: {
			// v5.3d-origami-dive: a small folded shape just below the centre dives straight out of the bottom edge: its lower
			// extent 75.9 -> 84.4 -> 94.7 % H at 0 / 3 / 6 f, out of the frame by 10 f (constant acceleration through the three
			// samples reaches 111.2 % H at 10 f; linear is the closest token, rmse 0.049); column x 690-830 px (46.9 % W)
			motions: {y: motion(10, linear)},
			params: {x: 46.9, fromY: 75.9, toY: 111.2},
			covers: ['v5.3d-origami-dive'],
		},
	},
	demoFrames: 90,
	demoTone: 'dark',
};
