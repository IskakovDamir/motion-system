import type {PrimitiveSpec} from '../types';
import {measured} from '../../tokens/measured';

// Opacity goes 1 -> 0 on the measured progress (or 1 -> removeAt, then the text is gone); stagger in
// frames between lines; indents in % W per line (a staircase), pitch = baseline pitch in % H.

export const spec: PrimitiveSpec = {
	name: 'TextFadeOut',
	kind: 'text',
	description:
		'Text fades out in place on an ease-in, all together or line by line in reading order, optionally defocusing as it goes; no move or scale.',
	defaultVariant: 'easeIn',
	variants: {
		easeIn: {
			// v3.text-fade-out: a 7-word headline fades out in place, all words together, ease-in, 9 f
			// (Inter Tight 400, cap 7.9% H, centred)
			motions: {opacity: measured('v3.text-fade-out')},
			params: {unit: 'block', type: 'display', weight: 400, capHeight: 7.9, align: 'center'},
			reproduces: {opacity: ['v3.text-fade-out']},
		},
		accelerating: {
			// v4.text-headline-fade-out: a 1-line headline leaves in place on an ease-in still steep at its end,
			// 11-12 f, no move, no blur (Inter Tight 400, cap 3.8% H, centred)
			motions: {opacity: measured('v4.text-headline-fade-out')},
			params: {unit: 'block', type: 'headline', weight: 400, capHeight: 3.8, align: 'center'},
			reproduces: {opacity: ['v4.text-headline-fade-out']},
		},
		linear: {
			// v7.text-caption-fade-out: a 1-word caption fades out in place, near-linear 5.3% per frame, removed
			// at about 10% (19 f; Inter 500, cap 4.8% H, caps, centred)
			motions: {opacity: measured('v7.text-caption-fade-out')},
			params: {unit: 'block', type: 'ui', weight: 500, capHeight: 4.8, case: 'upper', align: 'center'},
			reproduces: {opacity: ['v7.text-caption-fade-out']},
		},
		slowFade: {
			// v8.text-fade-out: a 1-line title fades evenly, ease-in, 1.0 -> 0.268 in 25 f, where the next page
			// covers it (Inter Tight 400, cap 3.16% H, about -0.04 em, left)
			motions: {opacity: measured('v8.text-fade-out')},
			params: {unit: 'block', removeAt: 0.268, type: 'headline', weight: 400, capHeight: 3.16, tracking: -0.04, align: 'left'},
			reproduces: {opacity: ['v8.text-fade-out']},
		},
		defocusLines: {
			// v5.text-caption-line-fade-out: caption lines leave one at a time in reading order, each fading as
			// one unit (main: caption E line 2, 12 f); caption E's lines leave f2334 / 2344 / 2352 (10 then 8 f
			// apart); Inter SemiBold, cap 4.4% H, staircase +66 / +97 px = 4.07 / 5.98% W, baselines 23.1 /
			// 28.1 / 34.3% H (pitch 5.6% H); the defocus is not sized in the rows
			motions: {opacity: measured('v5.text-caption-line-fade-out')},
			params: {unit: 'line', stagger: 9, indents: '4.07,5.98', pitch: 5.6, type: 'ui', weight: 600, capHeight: 4.4, align: 'left'},
			reproduces: {opacity: ['v5.text-caption-line-fade-out']},
		},
	},
	demoFrames: 60,
	demoTone: 'light',
};
