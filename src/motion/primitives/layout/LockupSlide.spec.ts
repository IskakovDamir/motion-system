import type {PrimitiveSpec} from '../types';
import {measured} from '../../tokens/measured';

// Pixels: v1-v4 are 1920x1080. Frame 0 of a variant is frame 0 of its curve's motion.
// The mark's box (markW % W x markH % H at its start size) starts centred at markX % W, markY % H, and slides
// travelX (% W) on motion x, scaling to toScale on motion scale. The wordmark's left edge sits gap (% W)
// right of the mark's final right edge, its caps centred on the mark's centre line (cap height capHeight
// % H, weight, font role font, tracking em when measured). It appears whole at wordAt, word by word wordStep apart,
// or letter by letter letterStep apart, each letter fading in on letterFade while it rises riseY % H on
// letterRise (it sits behind the mark).

export const spec: PrimitiveSpec = {
	name: 'LockupSlide',
	kind: 'layout',
	description:
		'A mark slides aside on a symmetric ease-in-out (optionally shrinking) to make room for the wordmark, which appears in its place as the slide ends.',
	defaultVariant: 'medium',
	variants: {
		medium: {
			// v1.logo-lockup-slide S06: the mark (167.5 x 152.3 px = 8.7% W x 14.1% H, centre 35.1% H) slides 959.5 ->
			// 700.5 px (-13.5% W) on the curve (frame 0 = f918); the wordmark pops whole at its final place at f942 =
			// frame 24, x 849 px: 64.7 px (3.4% W) right of the mark's right edge; Inter Tight 400, cap 9.9% H
			motions: {x: measured('v1.logo-lockup-slide')},
			params: {markX: 50.0, travelX: -13.5, markW: 8.7, markH: 14.1, markY: 35.1, gap: 3.4, capHeight: 9.9, weight: 400, font: 'display', wordAt: 24},
			reproduces: {x: ['v1.logo-lockup-slide']},
		},
		shrinkWide: {
			// v2.logo-lockup-slide S04: the mark (376 x 340 px = 19.6% W x 31.5% H at the frame centre, y 539.5 px = 50.0%
			// H) slides 959.5 -> 319.5 px (-33.3% W) and shrinks 1 -> 0.404 on the curve (scale progress = x progress
			// within 0.01; frame 0 = f312); the word pops whole at f322 = frame 10, 77 px (4.0% W) right of the mark (mark
			// x 244-395, word x 472); Inter 400, cap 9.0% H, tracking -0.015 em
			motions: {x: measured('v2.logo-lockup-slide'), scale: measured('v2.logo-lockup-slide')},
			params: {markX: 50.0, travelX: -33.3, toScale: 0.404, markW: 19.6, markH: 31.5, markY: 50.0, gap: 4.0, capHeight: 9.0, weight: 400, font: 'ui', tracking: -0.015, wordAt: 10},
			reproduces: {x: ['v2.logo-lockup-slide']},
		},
		wide: {
			// v3.logo-lockup-slide S09: the mark (169 x 152 px = 8.8% W x 14.1% H, centre y 380 px = 35.2% H) slides 960 ->
			// 412 px (-28.5% W) on the curve (frame 0 = f1255); the wordmark's words pop at their final places at f1290 and
			// f1298 = frames 35 and 43 (8 f per word), 68 px (3.5% W) right of the mark, caps centred on the mark's centre
			// line; Inter Tight 400, cap 9.8% H
			motions: {x: measured('v3.logo-lockup-slide')},
			params: {markX: 50.0, travelX: -28.5, markW: 8.8, markH: 14.1, markY: 35.2, gap: 3.5, capHeight: 9.8, weight: 400, font: 'display', wordAt: 35, wordStep: 8},
			reproduces: {x: ['v3.logo-lockup-slide']},
		},
		short: {
			// v4.logo-lockup-slide S08: the mark (104 x 94 px = 5.4% W x 8.7% H, centre y 500 px = 46.3% H) slides 960 ->
			// 766 px (-10.1% W) on the curve (frame 0 = f1485); the wordmark's letters appear behind it 41 px (2.1% W) right
			// of its final right edge, left to right 2.1 f apart: each fades in on v4.text-letter-rise-fade (letter 3 from
			// f1505, so letter 1 from frame 15.8) while rising 17 px (1.6% H) on its .i2 (1 f later); Inter Tight 400, cap
			// 7.4% H
			motions: {
				x: measured('v4.logo-lockup-slide'),
				letterFade: measured('v4.text-letter-rise-fade', 15.8),
				letterRise: measured('v4.text-letter-rise-fade.i2', 16.8),
			},
			params: {markX: 50.0, travelX: -10.1, markW: 5.4, markH: 8.7, markY: 46.3, gap: 2.1, capHeight: 7.4, weight: 400, font: 'display', letterStep: 2.1, riseY: 1.6},
			reproduces: {x: ['v4.logo-lockup-slide']},
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
