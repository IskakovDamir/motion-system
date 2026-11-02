import type {PrimitiveSpec} from '../types';
import {linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// A band crosses the wrapped content left to right. mode brighten: the content inside the band is drawn
// again through a brightness filter (`amount`, a luma ratio), so a light fill lifts while dark glyphs stay
// dark; dim: the content's ink falls to `amount` inside the band; reveal: the content shows only inside the
// band. Band sizes in % W; pixels of v7 / v8 are of a 1622 x 918 picture, v2 of 1920 x 1080.

export const spec: PrimitiveSpec = {
	name: 'ShimmerSweep',
	kind: 'fx',
	description:
		'A soft band of lighter or darker tone crosses text, a pill, a card or grid lines from left to right and leaves; once, on each rest, or on a loop.',
	defaultVariant: 'slantedBand',
	variants: {
		slantedBand: {
			// v8.fx-shimmer-sweep S08 re-entry: the band centre runs from half a band left of the pill's left end to
			// half a band right of its right end in 16 f (main curve); plateau at page white 248 over the 231 fill
			// (x1.074), about 300 px with 50-80 px soft edges (FWHM 365 px = 22.5 % W, edges 65 px = 4.0 % W),
			// slanted 28 deg from vertical with the lower end leading; the band is 2.5 x the pill height wide; the
			// label glyphs stay dark. Pill ends 407 + 182 -> 1615 - 182 px = 844 px = 52 % W. Label cap 3.7 % H
			motions: {x: measured('v8.fx-shimmer-sweep')},
			params: {mode: 'brighten', amount: 1.074, profile: 'plateau', path: 'across', bandWidth: 22.5, edge: 4.0, slant: 28, pillRatio: 2.5, pillWidth: 52, capHeight: 3.7, tone: 'light'},
			reproduces: {x: ['v8.fx-shimmer-sweep']},
		},
		darkBand: {
			// v2.ui-status-text-shimmer S09: a darker band (label luma 205 -> 170, x0.83) sweeps the status label
			// and its search icon left to right in 12 f at about 9 px/f, stepped every 2-3 f (2.5), a sweep about
			// every 36 f. The band's width is not measured: the looping status shimmer's FWHM (5.2 % W) is used.
			// Status label cap 1.3 % H (S09 UI text)
			motions: {x: motion(12, linear)},
			params: {mode: 'brighten', amount: 0.83, profile: 'gauss', path: 'span', bandWidth: 5.2, period: 36, pictureFrames: 2.5, capHeight: 1.3, tone: 'light'},
			covers: ['v2.ui-status-text-shimmer'],
		},
		looping: {
			// v8.text-status-fade-sweep S05: a lighter band crosses the light-grey status word at a constant 3.54 px/f
			// (0.218 % W per frame) and loops every 62.7 f; Gaussian dip, depth 0.725 (ink falls to 0.275), FWHM
			// 84 px = 5.2 % W; the centre crosses the 96 px word in 27 f, so each pass starts (222 - 96) / 2 = 63 px
			// = 3.9 % W before the word. Status word Inter 400, cap 1.3 % H (11 letters)
			motions: {},
			params: {mode: 'dim', amount: 0.275, profile: 'gauss', bandWidth: 5.2, speed: 0.218, lead: 3.9, period: 62.7, capHeight: 1.3, tone: 'light'},
			covers: ['v8.text-status-fade-sweep'],
		},
		once: {
			// v8.text-shimmer-sweep S21: after the lines have streamed, one lighter band (ink 0.48-0.58 of final:
			// 0.53) runs left to right across all lines at a constant 18-23 px/f (20.5 = 1.26 % W per frame) for
			// 31 f and vanishes. Its width is not measured: the looping band's FWHM (5.2 % W) is used
			motions: {x: motion(31, linear)},
			params: {mode: 'dim', amount: 0.53, profile: 'gauss', bandWidth: 5.2, speed: 1.26, capHeight: 4.47, tone: 'light'},
			covers: ['v8.text-shimmer-sweep'],
		},
		lineLight: {
			// v7.grid-light-sweep S22: the card's thin grid lines light up (+10..+17 luma over the fill) in 6-8 f (7)
			// and fade in 8-10 f (9) as a sweep crosses left to right at about 110 px/f = 6.8 % W per frame
			motions: {},
			params: {mode: 'reveal', profile: 'ramp', speed: 6.8, rise: 7, fade: 9, tone: 'dark'},
			covers: ['v7.grid-light-sweep'],
		},
	},
	demoFrames: 130,
	demoTone: 'light',
};
