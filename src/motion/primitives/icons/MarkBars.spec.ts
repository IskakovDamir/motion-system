import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Two plain bars that move as one. barW / barH / gap: bar width, open height and the space between
// the bars, px at 1080 (v1-v4 as read, v8 x 1080/918). x / y travel in px at 1080 from the pair's
// centre; y down.

export const spec: PrimitiveSpec = {
	name: 'MarkBars',
	kind: 'shape',
	description:
		'The two bars inside a mark move as one: they squash shut and reopen, slide together to a new position with a squash mid-move, open from closed dashes after a hold, slide, hold and slide back, or swap glyphs in one frame.',
	defaultVariant: 'slideSquash',
	variants: {
		slideSquash: {
			// v2.logo-eye-glance (S04 big mark): the pair slides (+48, -40) -> (-48, +8) px on an ease-in-out
			// (x is the curve, y moves with it) and squashes mid-move: pair height 120 -> 99 -> 120 px (x0.825),
			// width 106 -> 112 -> 106 px (x1.057). Bars: pair 106 px wide, inner edges 32.6 px apart -> 36.7 px each
			motions: {x: measured('v2.logo-eye-glance'), y: measured('v2.logo-eye-glance')},
			params: {barW: 36.7, barH: 120, gap: 32.6, fromX: 48, toX: -48, fromY: -40, toY: 8, squash: 0.825, stretch: 1.057},
			reproduces: {x: ['v2.logo-eye-glance']},
		},
		squashShut: {
			// v1.logo-blink: the bars (16 x 54 px, 15 px apart) snap shut to 4 px dashes about their own centres
			// in 1 f (scaleY 0.074), hold 7 f (f900-f906), then reopen on the curve from f906 (7 f after the snap)
			motions: {shut: motion(1, linear), scaleY: measured('v1.logo-blink', 7)},
			params: {barW: 16, barH: 54, gap: 15, closedScale: 0.074},
			reproduces: {scaleY: ['v1.logo-blink']},
		},
		squashPair: {
			// v2.logo-eye-blink (S04, same bars as slideSquash): height 120 -> 112, 88, 46, 36 px (4 f closing)
			// -> 80, 108, 120 (3 f opening), position fixed; closed 36 / 120 = 0.30
			motions: {close: motion(4, EASE.inOutGlide), open: motion(3, EASE.outSoft, 4)},
			params: {barW: 36.7, barH: 120, gap: 32.6, closedScale: 0.3},
			covers: ['v2.logo-eye-blink'],
		},
		openFromDash: {
			// v3.logo-eyes-open: the bars appear as closed 16 x 4 px dashes (centres 31.3 px apart), hold 6 f
			// (f1238-f1243), then open about their centres to 54 px on the curve (from f1243, 5 f in)
			motions: {height: measured('v3.logo-eyes-open', 5)},
			params: {barW: 16, barH: 54, gap: 15.3, closedScale: 0.074},
			reproduces: {height: ['v3.logo-eyes-open']},
		},
		openToPills: {
			// v4.logo-eye-open: 10 x 2 px closed bars arrive with the cut, hold 6 f (f1463-f1468), then open about
			// their centre line into 32 px pills on the curve (from f1468, 5 f in); the space between the bars
			// is not measured (the component then uses one bar width)
			motions: {height: measured('v4.logo-eye-open', 5)},
			params: {barW: 10, barH: 32, closedScale: 0.0625, round: true},
			reproduces: {height: ['v4.logo-eye-open']},
		},
		slideHoldReturn: {
			// v8.icon-mascot-eye-glance (S10): the pair glides out 14.9 px left and 4.6 px down (16 f; the
			// outgoing glide is curve .i2), holds 12 f, and glides back to 3.65 px left / 1.1 px down of where
			// it started on the main curve (19 f, from +28 f); at 918, here x 1080/918. Bar size is not
			// measured on this mark (glyph eyes): v1's bars
			motions: {out: measured('v8.icon-mascot-eye-glance.i2'), x: measured('v8.icon-mascot-eye-glance', 28)},
			params: {barW: 16, barH: 54, gap: 15, outX: -17.5, outY: 5.4, backX: -4.3, backY: 1.3},
			reproduces: {x: ['v8.icon-mascot-eye-glance']},
		},
		glyphSwap: {
			// v8.icon-mascot-eye-swap: the glyphs swap in one frame, every 16-20 f (S06) / 20-26 f (S08): 20 f;
			// bars -> dashes -> rings -> dots (the references' asterisks and chevrons left out). Bar size not
			// measured on this mark: v1's bars, dash = v1's closed height
			motions: {},
			params: {barW: 16, barH: 54, gap: 15, every: 20, glyphs: 'bar dash ring dot', closedScale: 0.074},
			covers: ['v8.icon-mascot-eye-swap'],
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
