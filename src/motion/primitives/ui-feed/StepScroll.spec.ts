import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// The list moves up `step` (% H, the item pitch) once per new item, `stepEvery` frames apart; between
// steps it drifts up `baseDrift` % H per frame. A single-frame step is a 1-frame motion: progress 0 in
// the frame before, 1 in the frame after. v3-v4: 1920x1080; v8: 1622x918.

export const spec: PrimitiveSpec = {
	name: 'StepScroll',
	kind: 'ui',
	description: "A list moves up by one item's height as a new item arrives: in a single frame, or as an eased step over a slow base drift.",
	defaultVariant: 'eased',
	variants: {
		eased: {
			// v8.ui-list-step-scroll S07: row 1 centre 481 -> 225 px of 918 (52.4% -> 24.5% H, one row =
			// 256 px = 27.9% H) in 21 f; base drift 520 -> 495 px in f937-f948 (25 px / 11 f = 0.25% H per
			// frame); S06 steps 30 f apart
			motions: {y: measured('v8.ui-list-step-scroll')},
			params: {step: 27.9, startY: 52.4, stepEvery: 30, baseDrift: 0.25, anchor: 'top'},
			reproduces: {y: ['v8.ui-list-step-scroll']},
		},
		thread: {
			// v8.ui-thread-step-scroll S12 step 2: content -916 -> -1411 px (494 px = 53.9% H, one reply block);
			// 34 f after step 1; linear base drift 3 px/f after it (f1574-f1585) = 0.33% H per frame
			motions: {y: measured('v8.ui-thread-step-scroll')},
			params: {step: 53.9, stepEvery: 34, baseDrift: 0.33, anchor: 'top'},
			reproduces: {y: ['v8.ui-thread-step-scroll']},
		},
		jump: {
			// v3.ui-chat-step-scroll S03: the list jumps -170 px (15.7% H at 1080) in a single frame
			// (f248 -> f249), the next -170 px 86 f later (f335); no drift
			motions: {y: motion(1, EASE.inOutWhip5)},
			params: {step: 15.7, stepEvery: 86, anchor: 'top'},
			covers: ['v3.ui-chat-step-scroll'],
		},
		jumpBottom: {
			// v4.ui-chat-list-step-scroll: the bottom-anchored list moves up by the inserted item's height plus
			// gap in a single frame (-122, -84, -50, -84 px: the step is the layout of the new item); the status
			// line goes in 12 f after the bubble (S03 f561 -> f573)
			motions: {y: motion(1, EASE.inOutWhip5)},
			params: {stepEvery: 12, anchor: 'bottom'},
			covers: ['v4.ui-chat-list-step-scroll'],
		},
	},
	demoFrames: 190,
	demoTone: 'light',
};
