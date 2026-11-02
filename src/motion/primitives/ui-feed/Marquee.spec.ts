import type {PrimitiveSpec} from '../types';
import {measured} from '../../tokens/measured';

// The row's offset (% W, leftward) is `travel` x the x motion plus a constant cruise of `speed` % W per
// frame (for `cruise` frames when it stops dead, else for ever). v3: 1920x1080; v6, v8: 1622x918.

export const spec: PrimitiveSpec = {
	name: 'Marquee',
	kind: 'ui',
	description:
		'A row scrolls sideways at a constant speed: it arrives fast and brakes into its cruise, ramps its speed between holds, or stops dead after a number of slots.',
	defaultVariant: 'constant',
	variants: {
		constant: {
			// v8.layout-marquee-scroll: constant leftward 7.37 px/f = 0.455% W per frame over f3306-f3374,
			// then it stops without easing (68 f of cruise)
			motions: {},
			params: {speed: 0.455, cruise: 68},
			covers: ['v8.layout-marquee-scroll'],
		},
		brakeIn: {
			// v8.layout-marquee-whip-in: after the cut the row arrives at 291 px/f and brakes; the curve is the
			// row position minus the steady 7.37 px/f drift: 0 -> -1630.5 px = 100.5% W; then the 0.455% W/f cruise.
			// The row has a leading end: it enters from the right edge (the left of the first picture is empty)
			motions: {x: measured('v8.layout-marquee-whip-in')},
			params: {travel: 100.5, speed: 0.455, arrives: true},
			reproduces: {x: ['v8.layout-marquee-whip-in']},
		},
		deadStop: {
			// v3.ui-logo-marquee: 300 px pitch (15.625% W), 0 -> -2100 px = 7 slots = 109.375% W, then a dead
			// stop; badge centres on x 209.5 + 300k (10.9% W) in the first and the last picture
			motions: {x: measured('v3.ui-logo-marquee')},
			params: {travel: 109.375, pitch: 15.625, firstX: 10.9},
			reproduces: {x: ['v3.ui-logo-marquee']},
		},
		speedRamp: {
			// v6.card-carousel-speed-ramp: the card row scrolls left 756.5 px = 46.6% W with a speed ramp
			// (0.4 -> 4.2 -> 0.4% W per picture); cards have a 2.0% W corner radius
			motions: {x: measured('v6.card-carousel-speed-ramp')},
			params: {travel: 46.6, radius: 2.0},
			reproduces: {x: ['v6.card-carousel-speed-ramp']},
		},
	},
	demoFrames: 120,
	demoTone: 'light',
};
