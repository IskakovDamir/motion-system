import type {PrimitiveSpec} from '../types';
import {measured} from '../../tokens/measured';

// mixedPops: the per-letter moves were measured as values with no curve fit, so they are value tracks
// ('value@frame', frames from the letter's own onset, linear between the measured pictures). Amounts are
// in cap heights of the row (cap 45 px in v6, 1622 x 918). Letters of a row longer or shorter than the
// measured 10 take the slot at the same relative position.

export const spec: PrimitiveSpec = {
	name: 'LetterPopBuild',
	kind: 'text',
	description:
		'A short row builds out of order: each letter enters by its own small move (grows from a speck, spins in, splits from a twin, drops and bounces, slides out from behind a neighbour) while the row tightens or re-centres.',
	defaultVariant: 'mixedPops',
	variants: {
		mixedPops: {
			// v6.text-type-recenter S04: an icon alone in the centre (f26) slides left 8.8 % W while the row types on
			// out of order, about 3.0 f per letter (10 letters f33-f63): icon left edge 776 / 769 / 761 / 664 / 647 /
			// 635 / 633 px at f26 / 28 / 31 / 36 / 38 / 42 / 43; icon 59 px wide (1.31 cap), 21 px (0.47 cap) to the
			// first letter. v6.text-letter-pop-mix S04 (frame 0 here = f26), per letter slot:
			//  1 slides in leftward with the re-centring: 20 / 8 / 0 px right of rest at f36 / 38 / 42
			//  2, 7 a stem grows up from the baseline (4.4 / 22.2 / 41.2 / 46.2 px against 30.9 at f42 / 43 / 46 / 48),
			//    then its dot hangs x1.4 above the row (top 77.6-78.7 px over the baseline), falls (71.7 / 61.4 /
			//    45.3), lands in the stem 17 % past rest (38.2 px), rebounds 11 % above (47.0) and rests at 44.1 px
			//    while the stem shrinks 38.0 / 31.5 / 29.2 px; slot 2 runs the same moves 8 f earlier
			//  3-4 one glyph x0.87 between the two places (f33), full size (f36), splits: each copy moves 17 px
			//    from the common centre, ink width 34 / 40 / 60 / 68 px at f42 / 43 / 46 / 48
			//  5 a speck x0.1 grows x0.44 / 0.96 / 1.24 / 1.16 / 1.02 / 1.00 (f36-f48) while it spins -182 -> +27 ->
			//    -16 -> 0 deg (f36-f63)
			//  8 a speck on its baseline x0.21 / 0.61 / 0.81 / 1.02 / 1.15 / 1.10 / 1.03 / 0.97 / 0.97 / 1.00 (f53-f78)
			//  6, 9 slide out from behind slot 7's stem: 9 about 46 px right (f53-f58, 8 / 2 / -1 px short at f56 /
			//    58 / 63), 6 about 26 px left; 10 slides 12 px right out from behind 9 (f61-f63)
			// Inter 600, cap 4.9 % H, mixed case
			motions: {},
			params: {
				font: 'ui',
				weight: 600,
				capHeight: 4.9,
				case: 'mixed',
				framesPerLetter: 3.0,
				kinds: 'slideIn,stem,split,split,speckSpin,slideOut,stem,speckBase,slideOut,slideOutShort',
				onsets: '10,8,7,7,7,27,16,27,27,35',
				amounts: '0.44,0,0.38,-0.38,0,0.58,0,0,-1.02,-0.27',
				slideIn: '1@0,0.4@2,0@6',
				splitScale: '0.87@0,1@3',
				split: '1@0,1@5,0.94@9,0.78@10,0.22@13,0@15',
				speckScale: '0.1@0,0.44@3,0.96@5,1.24@9,1.16@10,1.02@13,1@15',
				spin: '-182@0,-183@5,-96@9,-50@10,-4@13,27@15,18@18,0@20,-16@23,-13@25,-6@28,0@30',
				stem: '0.14@0,0.72@1,1.33@4,1.5@6,1.48@11,1.23@14,1.02@16,0.94@19,1@21',
				dotY: '1.72@6,1.75@9,1.74@11,1.59@14,1.36@16,1.01@19,0.85@21,0.9@24,0.98@26,1.04@29,1.04@31,1@36,0.98@37',
				dotScale: '1.4@6,1.4@11,1@19',
				dotSize: 0.2,
				speckBase: '0.21@0,0.61@3,0.81@5,1.02@8,1.15@10,1.1@13,1.03@15,0.97@18,0.97@20,1@25',
				slideOut: '1@0,0.17@3,0.04@5,-0.02@10,0@14',
				slideOutShort: '1@0,0@2',
				recentre: '0@0,0.05@2,0.1@5,0.78@10,0.9@12,0.99@16,1@17',
				iconSize: 1.31,
				iconGap: 0.47,
				tone: 'light',
			},
			covers: ['v6.text-letter-pop-mix', 'v6.text-type-recenter'],
		},
		tighten: {
			// v8.text-letter-pop-tighten S26 (frame 0 = f3397): the app glyph appears at the right as a 9 px dot and
			// grows to 81 px (x1.04 peak; .i2 width curve) with its right edge held, then slides 121.6 px = 7.5 % W
			// left into its slot from f3401 with a 9 px overshoot (main curve, x); its light tile (111.5 px, 12.1 %
			// H) scales in place from f3402: 14 / 57 / 103 / 124 / 122 / 115 / 111.5 px at +0 / 2 / 5 / 7 / 8 / 10 /
			// 12 f; glyph 81 px = 8.8 % H. The wordmark's letters pop in out of order from f3401, 3.7 f per letter,
			// in their final places; only letter 1 rides the glyph, 44-52 px (5.2 % H) right of it.
			// Inter 700, cap 6.5 % H, title case
			motions: {x: measured('v8.text-letter-pop-tighten', 4), scale: measured('v8.text-letter-pop-tighten.i2')},
			params: {
				font: 'ui',
				weight: 700,
				capHeight: 6.5,
				case: 'title',
				framesPerLetter: 3.7,
				lettersFrom: 4,
				travel: 7.5,
				fromScale: 0.11,
				glyphSize: 8.8,
				tileSize: 12.1,
				tileFrom: 5,
				tile: '0.126@0,0.51@2,0.92@5,1.11@7,1.09@8,1.03@10,1@12',
				letterGap: 5.2,
				tone: 'light',
			},
			reproduces: {x: ['v8.text-letter-pop-tighten']},
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
