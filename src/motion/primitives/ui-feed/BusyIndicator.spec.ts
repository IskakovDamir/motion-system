import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Spinners step on frame clocks (stepFrames, timerFrames, period): no easing between their states.

export const spec: PrimitiveSpec = {
	name: 'BusyIndicator',
	kind: 'ui',
	description:
		'A working indicator loops while something is pending: a glyph or dot spinner steps through its frames, an arc spins at a constant rate, an icon pulses its tone, a placeholder flashes on and off, or a mark makes one full turn and stops.',
	defaultVariant: 'glyphCycle',
	variants: {
		glyphCycle: {
			// v4.ui-spinner-glyph-cycle: star glyph every 6 f: dot, plus, thin star, six-point star, asterisk,
			// heavy asterisk and back (10 steps = 60 f); the first step one interval after it appears; the
			// working line's elapsed-seconds digit steps +1 60 f after the line appears
			motions: {},
			params: {kind: 'stars', glyphs: 'dot plus thinStar sixStar asterisk heavyAsterisk', pingPong: true, stepFrames: 6, timerFrames: 60, timerStep: 1},
			covers: ['v4.ui-spinner-glyph-cycle'],
		},
		dotCycle: {
			// v3.icon-dot-spinner: a dot-cluster spinner steps to a new glyph about every 5 f (f274, f279, f285).
			// Its frames are drawn as the 10-pattern dot turn measured in v4 (3-4 dots of a 2 x 3 cell running
			// round; cells 1-3 left column top to bottom, 4-6 right column): p1 top pair + middle left, p2 top
			// pair + middle right, p3 bottom right added, p4 right column, then on round the cell
			motions: {},
			params: {kind: 'dots', patterns: '124 145 1456 456 3456 356 236 1236 123 1234', stepFrames: 5},
			covers: ['v3.icon-dot-spinner'],
		},
		cycleWithTimer: {
			// v1.ui-status-timer: dot spinner one state every 5 f (10-state cycle) and a timer +0.1 per 6 f,
			// stepping independently
			motions: {},
			params: {kind: 'dots', patterns: '124 145 1456 456 3456 356 236 1236 123 1234', stepFrames: 5, timerFrames: 6, timerStep: 0.1},
			covers: ['v1.ui-status-timer'],
		},
		constantSpin: {
			// v7.ui-spinner-rotate: bright arc on a faint ring, clockwise at a constant 6.8 deg/f; arc centre at
			// 192 deg from 12 o'clock at the first measured frame; arc length 134 deg
			motions: {},
			params: {kind: 'arc', degPerFrame: 6.8, startDeg: 192, arc: 134},
			covers: ['v7.ui-spinner-rotate'],
		},
		turning: {
			// v8.icon-activity-spinner: a small light 8-spoke activity spinner (its rotation rate is not measured)
			motions: {},
			params: {kind: 'spokes', spokes: 8},
			covers: ['v8.icon-activity-spinner'],
		},
		tonePulse: {
			// v2.ui-status-avatar-pulse: luma 22 -> 105 -> 22 over 42 f: up 22, 27, 32, 46, 56, 75, 86, 96, 100,
			// 103, 105 (f681-f702: inOutGlideOver over 19 f from f682, rmse 0.028), down 97, 84, 70, 55, 44, 31,
			// 25, 22 (f707-f724: inOutGlideOver over 20 f from f704, rmse 0.025); 105 - 22 on the 253 page =
			// 0.36 of the way to the background
			motions: {rise: motion(19, EASE.inOutGlideOver), fall: motion(20, EASE.inOutGlideOver, 22)},
			params: {kind: 'pulse', period: 42, fade: 0.36},
			covers: ['v2.ui-status-avatar-pulse'],
		},
		onOff: {
			// v7.ui-gap-placeholder-blink: strictly on / off, 2 pictures on and 2 off = a 10-frame loop
			// (on at f2259 / 2269 / 2279 ...); the second placeholder one picture (2 f) later
			motions: {},
			params: {kind: 'blink', period: 10, onFrames: 5, lag: 2},
			covers: ['v7.ui-gap-placeholder-blink'],
		},
		fullTurn: {
			// v7.logo-spin-while-typing: one clockwise turn, 11 -> 373.5 deg (362.5 deg), then still
			motions: {rotate: measured('v7.logo-spin-while-typing')},
			params: {kind: 'turn', turn: 362.5},
			reproduces: {rotate: ['v7.logo-spin-while-typing']},
		},
	},
	demoFrames: 120,
	demoTone: 'light',
};
