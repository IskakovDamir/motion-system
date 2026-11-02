import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// rise: travel into place in % of frame height (positive = from below, negative = from above); the
// overshoots are in the measured curves. exposure: frames of motion blur (measured streak length over
// measured speed). typeRate: frames per character of a type-on. v8 / v6 pixels are of a 918 px high picture.

export const spec: PrimitiveSpec = {
	name: 'EdgeRise',
	kind: 'text',
	description:
		'Text springs in vertically from beyond the frame edge or from far below its slot, overshoots and settles like a damped spring; elements follow on a stagger.',
	defaultVariant: 'springUp',
	variants: {
		springUp: {
			// v8.text-spring-rise: a mark flies up from below the bottom edge (.i2: 929.5 -> 459.5 px = 51.2% H),
			// the 2-word label 8 f later (main: 869 -> 460.5 px = 44.5% H), each overshooting about 4.3-4.6% H
			// above rest and settling; vertical motion blur: the mark is 145 px tall on its first full picture
			// against 113 px at rest while entering at 216 px/f (32 px streak = 0.15 f); Inter 600-700, cap 6.5% H
			motions: {y: measured('v8.text-spring-rise', 8), leadY: measured('v8.text-spring-rise.i2')},
			params: {unit: 'block', rise: 44.5, leadRise: 51.2, exposure: 0.15, type: 'ui', weight: 650, capHeight: 6.5, align: 'center'},
			reproduces: {y: ['v8.text-spring-rise']},
		},
		dropBounce: {
			// v8.text-word-drop-bounce: words drop from above the frame 2 f apart (179.9 -> 411 px = 25.2% H),
			// overshoot 5.2% H below rest and spring back (Inter 600-700, cap 6.4-6.5% H)
			motions: {y: measured('v8.text-word-drop-bounce')},
			params: {unit: 'word', rise: -25.2, stagger: 2, type: 'ui', weight: 650, capHeight: 6.45, align: 'center'},
			reproduces: {y: ['v8.text-word-drop-bounce']},
		},
		typeRise: {
			// v8.text-tag-type-rise: a tag types on while it rises 74.2 -> 59.8% H (14.4% H) with a 4 px
			// overshoot; 16 characters in about 10 f (0.6-0.7 f each), at their final places
			// (Inter 500-600, cap 3.6% H)
			motions: {y: measured('v8.text-tag-type-rise')},
			params: {unit: 'letter', rise: 14.4, typeRate: 0.65, type: 'ui', weight: 550, capHeight: 3.6, align: 'center'},
			reproduces: {y: ['v8.text-tag-type-rise']},
		},
		popDrop: {
			// v6.text-label-drop: a monospace label pops in at full opacity in one picture and drops 106 px =
			// 11.5% H into its slot: bottom edge 511 / 535 / 581 / 606 / 616 / 617 px at +0 / 3 / 5 / 8 / 10 /
			// 14 f (values; outSoft 12 f fits, rmse 0.027), no overshoot (JetBrains Mono ExtraBold, cap 13.9% H)
			motions: {y: motion(12, EASE.outSoft)},
			params: {unit: 'block', rise: -11.5, font: 'mono', weight: 800, capHeight: 13.9, case: 'upper', type: 'code', align: 'center'},
			covers: ['v6.text-label-drop'],
		},
	},
	demoFrames: 70,
	demoTone: 'light',
};
