import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

export const spec: PrimitiveSpec = {
	name: 'AmbientLoop',
	kind: 'shape',
	description:
		'Continuous cyclic motion on held elements: a sine float with its own phase per element, a scale pulse that takes turns, a squash pulse, level bars following the audio, or elements riding an ellipse at a constant angular speed.',
	defaultVariant: 'sineFloat',
	variants: {
		sineFloat: {
			// v1.icon-idle-float: y bobs 10.0 px (0.93% H) either side of rest, period 156.9 f, x fixed; the
			// curve is one half-swing (lowest to highest), played forward then mirrored. phases: frame of each
			// element's lowest point (f39, f154, f111, f69 upper four, f26, f141, f99, f56 lower four, less f26)
			motions: {y: measured('v1.icon-idle-float')},
			params: {amplitude: 0.93, period: 156.9, phases: '13 128 85 43 0 115 73 30'},
			reproduces: {y: ['v1.icon-idle-float']},
		},
		pulseTurns: {
			// v4.icon-pulse: one element at a time scales to 1.057 about its centre (rise: the curve), holds
			// near the top, and returns on a steep ease-in (.i2, from 10 f after the rise starts: 16-17 f in
			// all); the elements take turns every 25.2 f
			motions: {scale: measured('v4.icon-pulse'), down: measured('v4.icon-pulse.i2', 10)},
			params: {peakScale: 1.0573, period: 25.2},
			reproduces: {scale: ['v4.icon-pulse']},
		},
		squashPulse: {
			// v8.icon-mascot-idle-bounce: the width pulses +15-30% and back: 114 -> 150 px over 16 f, back in
			// 8 f (S01, peaks f4 and f28: 24 f apart), 120 -> 150 -> 120 px (S26, back in 8 f): x1.25 used;
			// staggered between elements, not on the beat (ease not fitted: inOutGlide)
			motions: {rise: motion(16, EASE.inOutGlide), fall: motion(8, EASE.inOutGlide, 16)},
			params: {peakScaleX: 1.25, period: 24},
			covers: ['v8.icon-mascot-idle-bounce'],
		},
		audioLevel: {
			// v7.icon-voice-meter: 4 level bars inside the badge follow the audio, a new value every picture,
			// from 4-5 px round dots in silence to 35 px bars (at 918: dot 5.3 px, bar 41.2 px at 1080); badge:
			// the 65.8 px disc they sit in (v7.icon-voice-badge-pop, same shot), which the Demo draws
			motions: {},
			params: {bars: 4, dot: 5.3, maxHeight: 41.2, badge: 77.4},
			covers: ['v7.icon-voice-meter'],
		},
		ellipseOrbit: {
			// v2.icon-ring-orbit: the icons ride a 2:1 ellipse (semi-axes 37.9% W x 33.7% H) clockwise at a
			// constant 0.3565 deg/f (1010 f per turn), upright and flat
			motions: {},
			params: {degPerFrame: 0.3565, rx: 37.9, ry: 33.7},
			covers: ['v2.icon-ring-orbit'],
		},
	},
	demoFrames: 180,
	demoTone: 'light',
};
