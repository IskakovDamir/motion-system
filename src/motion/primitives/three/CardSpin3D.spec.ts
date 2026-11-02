import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// perspective: the one measured focal length of the references, v8.3d-card-turn-recede's pinhole fit,
// f = 2618 px on the 1622 px picture = 161.4 % W (about 34 deg horizontal field of view)

export const spec: PrimitiveSpec = {
	name: 'CardSpin3D',
	kind: '3d',
	description:
		'A card turns in 3D: a half turn about its vertical axis braking to a frontal rest, a yaw then recede, a push back to rest size, or a light-up while a sheen crosses it.',
	defaultVariant: 'halfTurn',
	variants: {
		halfTurn: {
			// v5.3d-card-spin-y: a half turn about the vertical axis, 9.6 -> 180 deg (first face -> second face),
			// entered mid-spin and braking to a frontal rest in 18 f (the curve; peak about 20 deg per frame); the card is
			// 74.1 % W wide when it settles (the edge width v5.3d-card-recede starts from)
			motions: {rotate: measured('v5.3d-card-spin-y')},
			params: {fromAngle: 9.6, toAngle: 180, perspective: 161.4, width: 74.1},
			reproduces: {rotate: ['v5.3d-card-spin-y']},
		},
		yawRecede: {
			// v8.3d-card-turn-recede: yaw 0 -> 26.5 deg with the left edge toward the camera in 53 f (the curve);
			// 42 f after the turn starts (f1066; the turn's token starts moving at its frame 5, so delay 47) the card
			// recedes, depth scale 0.98 -> 0.80 (x0.816), and slides left,
			// centre 45.6 -> 34.7 % W (-10.9), accelerating 3 -> 11 px/f over 26 f (constant acceleration: inGentle2, rmse 0.045);
			// the card at rest spans 366-1250 px (54.5 % W)
			motions: {rotate: measured('v8.3d-card-turn-recede'), recede: motion(26, EASE.inGentle2, 47)},
			params: {angle: 26.5, perspective: 161.4, toScale: 0.816, shiftX: -10.9, width: 54.5, centerX: 45.6},
			reproduces: {rotate: ['v8.3d-card-turn-recede']},
		},
		pushBack: {
			// v5.3d-card-recede: the settled card is pushed back from 1.53 to 1.00 of its rest size, centre fixed,
			// 21 f to the 2 % band: 1.5175 / 1.47 / 1.3625 / 1.16 / 1.0625 / 1.0275 / 1.015 / 1.005 at 2 / 5 / 7 / 10 / 12 / 15 / 17 / 21 f
			// (outSoft over 23 f fits, rmse 0.020); edge width 74.1 -> 48.3 % W
			motions: {scale: motion(23, EASE.outSoft)},
			params: {fromScale: 1.53, width: 48.3},
			covers: ['v5.3d-card-recede'],
		},
		lightUp: {
			// v5.3d-card-light-up: only the card brightens, region luma 55.3 -> 134.8 (x0.41 -> 1), 17 f; the ground stays
			motions: {opacity: measured('v5.3d-card-light-up')},
			params: {fromLevel: 0.41},
			reproduces: {opacity: ['v5.3d-card-light-up']},
		},
	},
	demoFrames: 110,
	demoTone: 'dark',
};
