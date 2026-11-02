import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Frame 0 is the first frame of the swap's first motion token (60 fps). v1-v4 px are of a 1920x1080
// picture (px at 1080 as read); v5-v8 px of 1622x918: % H = px / 9.18. Shifts in px at 1080, travel
// in % of frame height. The swapped part is clipped by its slot (the panel edge).

export const spec: PrimitiveSpec = {
	name: 'ContentSwap',
	kind: 'transition',
	description:
		'Part of a held layout is replaced while the rest stays: a title fades and the next pops into its slot, a panel slides through, a grid drops out and the next drops in, a screen crossfades while its content slides up, or a label or glyph swaps in one frame.',
	defaultVariant: 'titleFade',
	variants: {
		titleFade: {
			// v3.trans-morph-title-swap (curve v3.text-fade-out): the old headline fades in place in 9 f
			// (token start f99); 5 f with no headline (f110-f115); the new headline's first word pops at
			// f116 (+17 f) in the same slot, the next words one-frame pops 8-9 f apart (S02 headline: pop,
			// 8-9 f per word)
			motions: {opacity: measured('v3.text-fade-out')},
			params: {popAt: 17, wordGap: 8.5},
			reproduces: {opacity: ['v3.trans-morph-title-swap']},
		},
		slideThrough: {
			// v4.card-slide-swap: the old window slides right 0 -> +21.4 px and fades 1 -> 0.109 on one
			// ease-in (.i2; x and opacity share the progress; token start f496) and is removed at f508
			// (+12 f); in that frame the new one shows at -20.9 px and 0.12 opacity (the curve's second
			// frame, so the token starts f507 = +11 f) and slides right into place while it fades in (the
			// curve); v4.trans-panel-swap: the rest of the layout holds, frame for frame
			motions: {out: measured('v4.card-slide-swap.i2'), opacity: measured('v4.card-slide-swap', 11)},
			params: {outShift: 21.4, outTo: 0.109, inShift: -20.9, cut: 12},
			reproduces: {opacity: ['v4.card-slide-swap']},
			covers: ['v4.trans-panel-swap'],
		},
		dropThrough: {
			// v7.ui-grid-drop-out: the old content slides down out of its panel, accelerating: +0 / +46 /
			// +287 px (of 918) = 0 / 5.0 / 31.3% H at f1729 / f1731 / f1734 (2 moving pictures, no curve:
			// the closest ease-in through them, inAccelerate2 over 5 f), then on at its last speed (+80 px
			// = 8.7% H per frame) until the panel edge hides it, gone by f1736; v7.ui-folder-drop-in: from
			// f1736 (+7 f) the new content drops in from 15.2% H above (23.8% -> 39.0% H) on the curve
			motions: {out: motion(5, EASE.inAccelerate2), y: measured('v7.ui-folder-drop-in', 7)},
			params: {outDrop: 31.3, outSpeed: 8.7, cut: 7, travel: 15.2},
			reproduces: {y: ['v7.ui-folder-drop-in']},
			covers: ['v7.ui-grid-drop-out'],
		},
		crossfadeSlide: {
			// v8.ui-screen-crossfade-slide: the old page's alpha 1 / 0.54 / 0.08 / 0 at f2972 / 2974 / 2976 /
			// 2978 (3 pictures, not fitted: these values); the new page takes the rest of the mix and slides
			// up 99 screen px = 10.8% H into place on the curve (token start f2973 = +1 f)
			motions: {y: measured('v8.ui-screen-crossfade-slide', 1)},
			params: {outAlpha: '0:1 2:0.54 4:0.08 6:0', travel: 10.8},
			reproduces: {y: ['v8.ui-screen-crossfade-slide']},
		},
		oneFrame: {
			// v4.ui-label-swap: text replaced in one frame, one frame shows both (step); v8.ui-icon-state-swap:
			// a glyph swaps in one picture; v2.ui-send-button-swap: the new glyph brightens over 2 f (max
			// luma 235, 233, 255 = 0.92 -> 1) from the swap frame
			motions: {swap: motion(2, linear), brighten: motion(2, linear, 1)},
			params: {fromBright: 0.92},
			covers: ['v4.ui-label-swap', 'v2.ui-send-button-swap', 'v8.ui-icon-state-swap'],
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
