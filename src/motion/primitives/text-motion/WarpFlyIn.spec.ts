import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// mode: lines (lines fly in from opposite sides and rise), block (one block flies in on a diagonal,
// stretched), blob (a lens-shaped blob where a label starts, then the label types on) or smear (two
// lines enter as horizontal smears from opposite edges, then the lockup scales to rest). Travel in % of
// frame width / height; v5 / v6 pixels are of a 1622 x 918 picture. The liquid warp's amplitude is not
// measured (only that it resolves by the landing), so the warp itself is not drawn.

export const spec: PrimitiveSpec = {
	name: 'WarpFlyIn',
	kind: 'text',
	description:
		'Text flies in as a liquid, rubbery or chrome-like warped smear and resolves into its letterforms as it lands; a liquid blob can morph into the first letters.',
	defaultVariant: 'liquid',
	variants: {
		liquid: {
			// v5.text-liquid-flyin: line 1 (2 words) flies in from the right (left ink edge 79.0 -> 24.8% W =
			// 54.2% W, .i2) and line 2 (1 word) from the lower left (ink centroid 9.1 -> 49.2% W = 40.1% W,
			// main), together, while both rise 90.0 -> 59.4% H (30.6% H, .i3); Unbounded / Archivo wdth 125
			// ExtraBold, caps, 0.03-0.07 em, centred; cap 12.3 -> 16.3% H (line 1, mean 14.3), 14.3 -> 11.2 (line 2)
			motions: {
				x: measured('v5.text-liquid-flyin'),
				xOther: measured('v5.text-liquid-flyin.i2'),
				y: measured('v5.text-liquid-flyin.i3'),
			},
			params: {mode: 'lines', sides: 'RL', curveSide: 'L', travel: 40.1, travelOther: 54.2, rise: 30.6, font: 'round', weight: 800, capHeight: 14.3, tracking: 0.05, case: 'upper', align: 'center'},
			reproduces: {x: ['v5.text-liquid-flyin']},
		},
		rubbery: {
			// v6.text-warp-fly-in: a 3-word caps line flies in from the top-left corner and settles centred: ink
			// box centre y 113.5 -> 385 px (29.6% H, main), x 394 / 628.5 / 696 / 801.5 / 800 / 801.5 px at
			// +0 / 2 / 5 / 7 / 12 / 20 f (25.1% W; outStrongOver2 9 f fits, rmse 0.044); stretched to a 161 px
			// box at +2 f against 79 px at rest (x2.04), 77-84 px from +5 f; Archivo Narrow Bold, cap 8.6% H
			motions: {y: measured('v6.text-warp-fly-in'), x: motion(9, EASE.outStrongOver2), stretch: motion(3, EASE.outFirm, 2)},
			params: {mode: 'block', travel: 25.1, rise: -29.6, stretchY: 2.04, font: 'wide', weight: 800, stretch: 75, capHeight: 8.6, case: 'upper', align: 'center'},
			reproduces: {y: ['v6.text-warp-fly-in']},
		},
		blobMorph: {
			// v5.text-liquid-blob-morph: a lens-shaped blob 9.0% W wide appears where a label starts and turns into
			// its first letters (9.0 -> 19.1 -> 21.5% W at +0 / 5 / 10 f: outFirm 10 f), then the label types on
			// at 2-2.5 f per letter; the lower label leads the upper one by 5 f; Unbounded 700-800, cap 3.3% H,
			// caps, 0.02-0.05 em, right aligned
			motions: {blob: motion(10, EASE.outFirm)},
			params: {mode: 'blob', unit: 'line', blob: 9.0, stagger: 5, bottomFirst: true, typeRate: 2.25, font: 'round', weight: 800, capHeight: 3.3, tracking: 0.035, case: 'upper', align: 'right'},
			covers: ['v5.text-liquid-blob-morph'],
		},
		chromeSmear: {
			// v5.logo-chrome-smear-in: the lower line enters from the left: its right end flies in from the left
			// edge (tip 140 / 1167 / 1242 / 1262 / 1280 / 1285 px at +0 / 8 / 10 / 13 / 15 / 18 f, 8.6 -> 78.8%
			// W = 70.2% W; outStrong 14 f fits, rmse 0.006) and from +10 f its leading capital slides 8.0 ->
			// 39.7% W (.i2) as the line un-stretches (its span 1112 px against 662 px flat = x1.68); the upper
			// line enters from the right from +15 f, left end 88.5 -> 20.3% W (68.2% W, .i3); the lockup then
			// scales 0.86 -> 1.0 (main, from +23 f). Upper line Inter Tight ExtraBold cap 14.4% H, lower line a
			// serif at cap 13.1% H (no serif face in FONT: display 400), baseline pitch 17.2% H
			motions: {
				scale: measured('v5.logo-chrome-smear-in', 23),
				head: motion(14, EASE.outStrong),
				capital: measured('v5.logo-chrome-smear-in.i2', 10),
				bold: measured('v5.logo-chrome-smear-in.i3', 15),
			},
			params: {
				mode: 'smear',
				headTravel: 70.2,
				smear: 1.68,
				boldTravel: 68.2,
				scaleFrom: 0.86,
				type: 'display',
				weight: 800,
				capHeight: 14.4,
				otherWeight: 400,
				capHeightOther: 13.1,
				pitch: 17.2,
				align: 'center',
			},
			reproduces: {scale: ['v5.logo-chrome-smear-in']},
		},
	},
	demoFrames: 80,
	demoTone: 'dark',
};
