import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Travel in % of frame height (positive = rises from below, negative = drops from above), staggers in
// frames, type overrides from each technique's typography rows (cap height % H, weight, tracking em).
// v5-v8 pixels are of a 1622 x 918 picture, v1-v4 of 1920 x 1080.

export const spec: PrimitiveSpec = {
	name: 'RiseFade',
	kind: 'text',
	description:
		'Units (letters, words, lines or a block) fade in while rising or dropping a few pixels into place on one ease-out, on a fixed stagger; with no travel it is a plain fade in place.',
	defaultVariant: 'wordRise',
	variants: {
		wordRise: {
			// v4.text-word-rise-fade: 10 words of a left-aligned 2-line headline (Inter Tight 400, cap 5.0% H);
			// each rises 18 px = 1.67% H on the same progress as its fade (offset = 18 px x (1 - p)), in
			// whole-pixel steps, 4.2 f apart straight across the line break
			motions: {opacity: measured('v4.text-word-rise-fade'), y: measured('v4.text-word-rise-fade')},
			params: {unit: 'word', rise: 1.67, stagger: 4.2, snap: true, type: 'headline', weight: 400, capHeight: 5.0, align: 'left'},
			reproduces: {opacity: ['v4.text-word-rise-fade']},
		},
		letterRise: {
			// v4.text-letter-rise-fade: 6 letters of a word (Inter Tight 400, cap 7.4% H) left to right 2.1 f
			// apart; fade 19 f (main) and a 17 px = 1.58% H rise in whole-pixel steps (.i2), no x move, no blur
			motions: {opacity: measured('v4.text-letter-rise-fade'), y: measured('v4.text-letter-rise-fade.i2')},
			params: {unit: 'letter', rise: 1.58, stagger: 2.1, snap: true, type: 'headline', weight: 400, capHeight: 7.4, align: 'center'},
			reproduces: {opacity: ['v4.text-letter-rise-fade']},
		},
		softBlockRise: {
			// v4.text-tagline-rise-in: a small mid-grey tagline (Inter Tight 400, cap 2.6% H, centred) fades in as
			// one block (main, 20 f) while rising 13 px = 1.2% H in whole-pixel steps (.i2, 17 f)
			motions: {opacity: measured('v4.text-tagline-rise-in'), y: measured('v4.text-tagline-rise-in.i2')},
			params: {unit: 'block', rise: 1.2, snap: true, type: 'headline', weight: 400, capHeight: 2.6, ink: 'muted', align: 'center'},
			reproduces: {opacity: ['v4.text-tagline-rise-in']},
		},
		dropIn: {
			// v4.text-headline-drop-in: a centred 1-line headline (Inter Tight 400, cap 3.8% H) fades in (main)
			// while dropping 10 px = 0.93% H into place in whole-pixel steps (.i2, 11 f)
			motions: {opacity: measured('v4.text-headline-drop-in'), y: measured('v4.text-headline-drop-in.i2')},
			params: {unit: 'line', rise: -0.93, snap: true, type: 'headline', weight: 400, capHeight: 3.8, align: 'center'},
			reproduces: {opacity: ['v4.text-headline-drop-in']},
		},
		steepStagger: {
			// v6.text-word-rise-stagger: the words of a 1-line caps headline (Saira SemiCondensed ExtraBold,
			// cap 14.7% H) each rise one line, 171 px = 18.6% H of 918, on a steep in-out, half-way points
			// 5-6 f apart (f954 / f959 / f965); no fade
			motions: {y: measured('v6.text-word-rise-stagger')},
			params: {unit: 'word', rise: 18.6, stagger: 5.5, font: 'square', weight: 800, stretch: 87.5, capHeight: 14.7, case: 'upper', align: 'center'},
			reproduces: {y: ['v6.text-word-rise-stagger']},
		},
		blockRise: {
			// v8.text-block-rise-in: a 2-line reply (Inter 400, cap 2.5% H, left) rises 3.3% H into place (main);
			// it fades in as one block, ink 7 / 31 / 47 / 67 / 83 / 92 / 97 / 100% at +0 / 2 / 4 / 8 / 12 / 15 /
			// 20 / 39 f (not fitted in the row; outStrong 27 f fits those values, rmse 0.011)
			motions: {y: measured('v8.text-block-rise-in'), opacity: motion(27, EASE.outStrong)},
			params: {unit: 'block', rise: 3.3, type: 'ui', weight: 400, capHeight: 2.5, align: 'left'},
			reproduces: {y: ['v8.text-block-rise-in']},
		},
		cascade: {
			// v8.text-list-cascade-fade: a sub-line then list items fade in one after another, items starting
			// f1932 / f1942 / f1950 (10 then 8 f apart); the last item stays dim, about half the darkness of the
			// one before (Inter 400, cap 2.6% H, grey, left)
			motions: {opacity: measured('v8.text-list-cascade-fade')},
			params: {unit: 'line', stagger: 9, lastOpacity: 0.5, type: 'ui', weight: 400, capHeight: 2.6, ink: 'inkSoft', align: 'left'},
			reproduces: {opacity: ['v8.text-list-cascade-fade']},
		},
		fadeInPlace: {
			// v2.text-label-fade-in: a 1-line lowercase label fades in place, no slide or scale (Inter 400,
			// ascender 4.7% H, no capitals: Inter's ascender is about 1.04 x its cap height, so cap 4.5% H);
			// v7.icon-mark-fade-in: a small mark above a label fades in the same way (9 f, not fitted)
			motions: {opacity: measured('v2.text-label-fade-in')},
			params: {unit: 'block', rise: 0, type: 'ui', weight: 400, capHeight: 4.5, case: 'lower', align: 'center'},
			reproduces: {opacity: ['v2.text-label-fade-in']},
			covers: ['v7.icon-mark-fade-in'],
		},
		quickFade: {
			// v8.shape-separator-fade-in: a thin separator fades in in 2-6 f: luma 248 -> 211 -> 147 on two
			// pictures 2 f apart (S26), an even ramp; not fitted
			motions: {opacity: motion(4, linear)},
			params: {unit: 'block', rise: 0, type: 'label', align: 'center'},
			covers: ['v8.shape-separator-fade-in'],
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
