import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Pixels of v5 are of a 1622x918 picture: % W = px / 16.22, % H = px / 9.18.

export const spec: PrimitiveSpec = {
	name: 'StarFlare',
	kind: 'fx',
	description:
		'A four-point sparkle star and its light streaks: a star drops in growing, a streak led by a sparkle sweeps along a title and parks at its end, a full-width anamorphic streak through a point light that drains, or stars fixed in depth that ride a camera push.',
	defaultVariant: 'streakSweep',
	variants: {
		streakSweep: {
			// v5.shape-flare-streak-sweep S24: the lower streak's sparkle head runs left -> right along
			// y 78.5 % H, 17.9 -> 97.3 % W (overshoots to the frame edge and settles back), 3 f after the
			// mirrored upper streak that runs right -> left along y 20.7 % H, head 99.6 -> 82.3 -> 41.7 ->
			// 6.2 % W at +0 / +3 / +5 / +8 f
			motions: {x: measured('v5.shape-flare-streak-sweep', 3), upper: motion(8, EASE.inOutWhip6)},
			params: {fromX: 17.9, travel: 79.4, y: 78.5, upperFromX: 99.6, upperTravel: -93.4, upperY: 20.7},
			reproduces: {x: ['v5.shape-flare-streak-sweep']},
		},
		drop: {
			// v5.shape-star-drop: x 50 % W, y 18.8 -> 49.5 % H in 12 f, ease-out (progress 0.39 / 0.64 /
			// 0.82 / 0.93 at +2 / +4 / +7 / +9 f); width 4.3 -> 9.5 (+9 f) -> 13.3 % W (+12 f), then
			// 31.1 % W at +14 f; tip to tip 625 px tall at 505 px wide
			motions: {y: motion(12, EASE.outStrongOver2), grow: motion(12, EASE.inGentle), burst: motion(2, linear, 12)},
			params: {x: 50, fromY: 18.8, toY: 49.5, fromWidth: 4.3, midWidth: 13.3, toWidth: 31.1, aspect: 1.24},
			covers: ['v5.shape-star-drop'],
		},
		anamorphic: {
			// v5.fx-anamorphic-flare S24: the full-width streak shows from f3922 and peaks at f3925 (band
			// luma 172 on black), then drains to 2.3 by f3935; the point core peaks at 248 (f3925) and
			// drains 166 / 64 / 23 / 4.7 / 0.5 at +2 / +5 / +7 / +10 / +12 f
			motions: {rise: motion(3, linear), band: motion(10, EASE.outFirm, 3), core: motion(12, EASE.outFirm, 3)},
			params: {bandPeak: 0.67, corePeak: 0.97},
			covers: ['v5.fx-anamorphic-flare'],
		},
		depthField: {
			// v5.particle-sparkle-field: 11 tracked stars at a steady peak luma (median 213), riding a
			// camera push: the field's radius x1.07 per 11 f, the 2 large near sparkles x1.18 per 10 f
			// (x1.17 / x1.19), the near one 55 px = 3.4 % W wide; one star emerges at (918, 46) px over
			// f3985-f3992 (+50 f, 7 f), one fades at (1050, 165) px over f3995-f4000 (+60 f, 5 f)
			motions: {emerge: motion(7, EASE.inGentle, 50), fade: motion(5, EASE.inOutWhip4, 60)},
			params: {
				count: 11,
				near: 2,
				fieldScale: 1.07,
				fieldFrames: 11,
				nearScale: 1.18,
				nearFrames: 10,
				nearWidth: 3.4,
				peakLuma: 0.84,
				emergeX: 56.6,
				emergeY: 5.0,
				fadeX: 64.7,
				fadeY: 18.0,
			},
			covers: ['v5.particle-sparkle-field'],
		},
	},
	demoFrames: 72,
	demoTone: 'dark',
};
