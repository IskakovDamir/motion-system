import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// blur: starting Gaussian deviation in % of frame width; rise: travel into place in % of frame height;
// stagger and spreads in frames; indents in % W per line (a staircase), pitch = baseline pitch in % H.
// v5-v8 pixels are of a 1622 x 918 picture.

export const spec: PrimitiveSpec = {
	name: 'BlurIn',
	kind: 'text',
	description:
		'Units fade in from defocused to sharp in their places, optionally rising a few pixels; staggered by letter, word or line, or rolling so each word peaks in focus and defocuses out as the next one peaks.',
	defaultVariant: 'wordRise',
	variants: {
		wordRise: {
			// v7.text-word-blur-rise: caption words appear in their final places in a pre-centred line (Inter 500,
			// cap 4.8% H): fade + de-blur (main), rise 14 px = 1.53% H (.i2), Gaussian sigma about 3 px = 0.18% W
			// -> 0 (S07 word 3: 3 / 1.5 / 1 / 1 / 0.5 / 0 px at +0 / 3 / 5 / 8 / 10 / 13 f, outStrongOver2 16 f
			// fits, rmse 0.057); the stagger follows the voice, 10-30 f, median 20 f
			motions: {
				opacity: measured('v7.text-word-blur-rise'),
				y: measured('v7.text-word-blur-rise.i2'),
				blur: motion(16, EASE.outStrongOver2),
			},
			params: {unit: 'word', blur: 0.18, rise: 1.53, stagger: 20, type: 'ui', weight: 500, capHeight: 4.8, align: 'center'},
			reproduces: {opacity: ['v7.text-word-blur-rise']},
		},
		overlapWords: {
			// v7.ui-prompt-word-stream: prompt words stream in about 3.5 f apart, each over 10-16 f, so 3-4 fade
			// at once (Inter 400, cap 3.9% H, left in a bar); sigma 5 / 3 / 2 / 1.5 / 1 / 0.5 px (0.31% W ->
			// 0) and y +5 / 4 / 3 / 2 / 1 / 0 px (0.5% H) at +0 / 2 / 6 / 8 / 10 / 17 f and +0 / 2 / 6 / 8 / 10
			// / 15 f (values; outStrongOver2 21 f and inOutGlideOver 15 f fit them, rmse 0.039 / 0.038)
			motions: {
				opacity: measured('v7.ui-prompt-word-stream'),
				blur: motion(21, EASE.outStrongOver2),
				y: motion(15, EASE.inOutGlideOver),
			},
			params: {unit: 'word', blur: 0.31, rise: 0.5, stagger: 3.5, type: 'ui', weight: 400, capHeight: 3.9, align: 'left'},
			reproduces: {opacity: ['v7.ui-prompt-word-stream']},
		},
		inPlace: {
			// v8.text-label-blur-fade-in: a 1-line label fades and de-blurs in place (Inter 400, cap 3.16% H,
			// tight, about -0.04 em), the middle characters resolving first (f2018), the right end at f2022 and
			// the left end at f2024; the blur's size is not measured
			motions: {opacity: measured('v8.text-label-blur-fade-in')},
			params: {unit: 'letter', rise: 0, spreadLeft: 6, spreadRight: 4, type: 'ui', weight: 400, capHeight: 3.16, tracking: -0.04, align: 'left'},
			reproduces: {opacity: ['v8.text-label-blur-fade-in']},
		},
		letterSweep: {
			// v5.text-caption-word-fade: letters sweep in left to right through the whole caption, about 2 f per
			// character (S09: Inter Bold, line 1 cap 5.2% H; staircase, line 2 indented +7.4% W, pitch 6.2% H);
			// each letter goes from blurred and transparent to sharp (the blur's size is not measured)
			motions: {opacity: measured('v5.text-caption-word-fade')},
			params: {unit: 'letter', stagger: 2, rise: 0, indents: '7.4', pitch: 6.2, type: 'ui', weight: 700, capHeight: 5.2, align: 'left'},
			reproduces: {opacity: ['v5.text-caption-word-fade']},
		},
		focusRoll: {
			// v5.text-caption-focus-roll: each word fades in still defocused (main, 23 f), sharpens to a focus
			// peak 30 f after it starts (.i2, sharpness only: the blur's size is not measured) and defocuses and
			// fades out from 5 f after its peak (.i3, 10 f); focus peaks 10 f apart (f3537 / 3547 / 3557);
			// Inter 500, cap 2.6% H, each line indented 2.7% W further right
			motions: {
				opacity: measured('v5.text-caption-focus-roll'),
				out: measured('v5.text-caption-focus-roll.i3', 35),
			},
			params: {unit: 'word', stagger: 10, rise: 0, indents: '2.7', type: 'ui', weight: 500, capHeight: 2.6, align: 'left'},
			reproduces: {opacity: ['v5.text-caption-focus-roll']},
		},
		verticalBlur: {
			// v6.text-rise-in-blur: a 5-word caps caption (Saira Medium, +0.18 em, cap 3.8% H, centred) rises
			// 17 px = 1.85% H while its vertical blur clears: top edge 17 / 5 / 0 px off at +0 / 3 / 8 f, box
			// 41 / 36 / 35 px tall (blur about (41 - 35) / 2 = 3 px = 0.18% W at first); outStrong 9 f fits
			// both, rmse 0.004 (10 f in the row)
			motions: {y: motion(9, EASE.outStrong), blur: motion(9, EASE.outStrong)},
			params: {unit: 'line', blur: 0.18, blurAxis: 'y', rise: 1.85, font: 'square', weight: 500, tracking: 0.18, capHeight: 3.8, case: 'upper', align: 'center'},
			covers: ['v6.text-rise-in-blur'],
		},
	},
	demoFrames: 100,
	demoTone: 'dark',
};
