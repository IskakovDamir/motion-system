import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Tones are luma 0-1 (measured 0-255 / 255) of the element's ink or fill; the component sets them as
// the element's `color` (a grey between the scheme's darkest role and its flash role).

export const spec: PrimitiveSpec = {
	name: 'ToneShift',
	kind: 'fx',
	description:
		'An element\'s ink or fill changes tone in place: a fill darkens in two stages, a fill darkens to its rest tone, text lightens, a word dims and returns, older lines fall back while a new one darkens, or a tone sweep runs across a line.',
	defaultVariant: 'twoStage',
	variants: {
		twoStage: {
			// v7.ui-label-fill-darken: fill 207 (f1) -> 147 (f11) -> 90 (f21), steady; hold to f29; then
			// 90 -> 0.5 in 15 f (from +28 f)
			motions: {stage1: motion(20, linear), opacity: measured('v7.ui-label-fill-darken', 28)},
			params: {fromTone: 0.81, midTone: 0.353, toTone: 0.002},
			reproduces: {opacity: ['v7.ui-label-fill-darken']},
		},
		darkenIn: {
			// v7.ui-dropdown-fill-darken: fill 96 -> 39 in 15 f, speeding up into the rest tone
			motions: {opacity: measured('v7.ui-dropdown-fill-darken')},
			params: {fromTone: 0.376, toTone: 0.153},
			reproduces: {opacity: ['v7.ui-dropdown-fill-darken']},
		},
		lighten: {
			// v6.text-dim-out: ink 95 -> 111 / 141.5 / 170 -> 175 at +3 / +8 / +13 / +18 f, abrupt stop
			motions: {tone: motion(18, EASE.inOutGlideOver)},
			params: {fromTone: 0.373, toTone: 0.686},
			covers: ['v6.text-dim-out'],
		},
		dimToggle: {
			// v8.text-word-dim-toggle S01: ink 0 -> 151 in 8 f, holds 6 f, back to 0 in 8 f, linear-looking
			motions: {dim: motion(8, linear), back: motion(8, linear, 14)},
			params: {fromTone: 0, toTone: 0.592},
			covers: ['v8.text-word-dim-toggle'],
		},
		focusShift: {
			// v8.text-focus-dim: over 45 f the line two rows up 165 -> 214 (+14 f) -> 235, the line above
			// 106 -> 118 (+28 f) -> 136, while the new line darkens 168 -> 15
			motions: {far: motion(45, EASE.outFirm2), near: motion(45, EASE.inGentleOver), fresh: motion(45, linear)},
			params: {farFrom: 0.647, farTo: 0.922, nearFrom: 0.416, nearTo: 0.533, freshFrom: 0.659, toTone: 0.059},
			covers: ['v8.text-focus-dim'],
		},
		sweep: {
			// v6.text-tone-sweep: ink 26 -> 90 through a left-to-right sweep in 16 f with a soft front about
			// 180 px wide (x 680-860 of a 918-high picture = 212 px at 1080); the front is past the line's
			// middle 2 f in, the first word is done at +11 f, the second at +16 f
			motions: {front: motion(16, EASE.outSnap)},
			params: {fromTone: 0.102, toTone: 0.353, frontPx: 212},
			covers: ['v6.text-tone-sweep'],
		},
	},
	demoFrames: 72,
	demoTone: 'light',
};
