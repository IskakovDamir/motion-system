import type {PrimitiveSpec} from '../types';
import {measured} from '../../tokens/measured';

export const spec: PrimitiveSpec = {
	name: 'GlobeRise',
	kind: '3d',
	description:
		'The dome of a globe tiled with footage rises from the bottom edge on a strong ease-out, then spins about its vertical axis at a constant rate.',
	defaultVariant: 'riseSpin',
	variants: {
		riseSpin: {
			// v6.3d-globe-rise: the dome rises from the bottom edge, top tile 827 -> 360 px (90.1 -> 39.2 % H, 50.9 % H) in
			// 25 f (the curve); it spins about its vertical axis at a constant 2.9 px per frame at the centre (0.18 % W,
			// measured f376-f433); radius at least 469 px (28.9 % W: half the visible ink width 21.5-79.3 % W, centre
			// 50.4 % W), so 2.9 / 469 rad = 0.354 deg per frame; footage tiles about 3 % W wide on the surface
			motions: {y: measured('v6.3d-globe-rise')},
			params: {rise: 50.9, top: 39.2, radius: 28.9, centerX: 50.4, degPerFrame: 0.354, tile: 3.0},
			reproduces: {y: ['v6.3d-globe-rise']},
		},
	},
	demoFrames: 120,
	demoTone: 'light',
};
