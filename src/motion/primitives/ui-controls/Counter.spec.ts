import type {PrimitiveSpec} from '../types';
import {measured} from '../../tokens/measured';

// Digits are set in the counter type role at the measured cap height (capHeight, % of frame height),
// in the measured family (font: a FONT key) and weight. cadence: frames between value updates (1 =
// every frame; 2.5 = every picture of 24 fps material on the 60 fps grid). A curve drives the value
// (value / rotate motions); the others step on a clock (tickFrames), on listed events (steps) or by a
// measured step table (table: frame:units counted, units: the table's total).

export const spec: PrimitiveSpec = {
	name: 'Counter',
	kind: 'ui',
	description:
		'A number changes in place: it counts with an accelerating rate, ticks as a real-time timer, steps on events, swaps readings once per picture, or a dial knob fast-forwards around its ring while its digits count.',
	defaultVariant: 'accelerating',
	variants: {
		accelerating: {
			// v1.counter-accelerating-count: 1 -> 100 in 108 f, rate 0.09 -> 1.62 counts per frame, the value
			// replaced every frame; digits + 1 word, centred, re-centring as digits are added; figure height
			// 92 px = 8.5% H, Inter Tight 400, tight
			motions: {value: measured('v1.counter-accelerating-count')},
			params: {cadence: 1, capHeight: 8.5, font: 'display', weight: 400},
			reproduces: {value: ['v1.counter-accelerating-count']},
		},
		realTime: {
			// v3.counter-elapsed-timer: seconds with one decimal, +0.1 every 6 f in real time (S06: first tick
			// f645, 8 f after it appears at f637), frozen on the answer; status-row sans cap 23 px = 2.13% H
			motions: {},
			params: {tickFrames: 6, firstTick: 8, step: 0.1, decimals: 1, capHeight: 2.13, font: 'display', weight: 400},
			covers: ['v3.counter-elapsed-timer'],
		},
		stepOnArrival: {
			// v4.counter-step: +1 at f837 / f854 / f870 / f887 (17, 16, 17 f apart), each in the frame its
			// event lands; the label swaps to its done state 16 f after the last step (f903); 12 px = 1.11% H
			motions: {},
			params: {steps: '0 17 33 50', doneAt: 66, capHeight: 1.11, font: 'display', weight: 400},
			covers: ['v4.counter-step'],
		},
		perPictureSwap: {
			// v7.counter-ui-readout-step S34: counts down 9 units in 5 hard swaps, 0 / 1 / 3 / 5 / 8 / 9 units
			// at +0 / +2 / +4 / +7 / +9 / +12 (f4307-f4319), no roll, slide or fade; right-aligned (the
			// digits' left edge moves when a digit goes, the sign and word stay); digit height 124 px =
			// 13.5% H, Inter 400
			motions: {},
			params: {table: '2:1 4:3 7:5 9:8 12:9', units: 9, capHeight: 13.5, font: 'ui', weight: 400, align: 'right'},
			covers: ['v7.counter-ui-readout-step'],
		},
		fastForward: {
			// v6.counter-dial-fastforward: the knob -1.5 -> -176.0 deg (counter-clockwise from 12 o'clock; angle =
			// the travel) around the ring on one eased move (1-4 -> 26 -> 0.25 deg per frame); the counter's digits count
			// (down) and the timer label (up) on the same progress, one update per picture (24 fps material:
			// 2.5 f); digits 117-119 px = 12.8% H, Inter Tight 800, tight; timer mono 20-21 px = 2.2% H
			motions: {rotate: measured('v6.counter-dial-fastforward')},
			params: {fromAngle: -1.5, angle: -174.5, cadence: 2.5, capHeight: 12.8, font: 'display', weight: 800, timerCap: 2.2},
			reproduces: {rotate: ['v6.counter-dial-fastforward']},
		},
	},
	demoFrames: 140,
	demoTone: 'light',
};
