import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Cadence: framesPerChar (uniform, spaces count as characters), a jittered mean, a step list, or a curve
// `progress` (share of the characters shown). Pixel values of v5-v8 are of a 1622 x 918 picture.

export const spec: PrimitiveSpec = {
	name: 'Typewriter',
	kind: 'text',
	description:
		'Characters appear one at a time in their final places, left to right, in hard steps; optionally a solid caret, the newest letters drawn lighter and darkening behind, or each new letter flashing before it settles.',
	defaultVariant: 'fastSteps',
	variants: {
		steadyCaret: {
			// v1.text-typewriter-char S01: 35 characters f12-f72, linear 1.76 f/char in steps of 1-2 f, no pause
			// at spaces; solid caret (no blink) removed 9 f after the last character; the placeholder is swapped
			// for the first character. Inter Tight 400, cap 4.7 % H, left aligned
			motions: {},
			params: {font: 'display', weight: 400, capHeight: 4.7, framesPerChar: 1.76, caret: true, caretHold: 9, tone: 'light'},
			covers: ['v1.text-typewriter-char'],
		},
		jittered: {
			// v2.text-typewriter-char S08: 39 characters f575-f671 = 2.5 f/char on average; gaps 2-5 f with one
			// 8 f pause (f596-f604, 21 f in); the other 38 gaps average (96 - 8) / 38 = 2.32 f; no caret.
			// Inter 400, cap 2.4 % H, line width matches Inter at +0.049 em
			motions: {},
			params: {
				font: 'ui',
				weight: 400,
				capHeight: 2.4,
				tracking: 0.049,
				framesPerChar: 2.5,
				gapMean: 2.32,
				gapMin: 2,
				gapMax: 5,
				pause: 8,
				pauseAt: 21,
				caret: false,
				tone: 'light',
			},
			covers: ['v2.text-typewriter-char'],
		},
		linearRate: {
			// v4.text-typewriter-input S02: about 62 characters in 51 f (0.85 f/char), linear envelope, a 1-frame
			// stall every 3-5 frames (every 4th frame holds); no caret; the field clips the line at its right edge,
			// x 171 -> 849 px of 1920 (35.3 % W). Inter Tight 400, cap 1.6 % H
			motions: {progress: measured('v4.text-typewriter-input')},
			params: {font: 'display', weight: 400, capHeight: 1.6, framesPerChar: 0.85, holdEvery: 4, fieldWidth: 35.3, caret: false, tone: 'light'},
			reproduces: {progress: ['v4.text-typewriter-input']},
		},
		fastSteps: {
			// v5.text-typewriter S08: 48 characters in 22 f (2.2 per frame), linear envelope, no cursor glyph, hard
			// steps on the capture's pictures (2.5 f apart: v5.text-type-on, letters on f1902/1905/1907/1910/1912).
			// Inter 400, cap 5.45 % H (zoomed framing f812)
			motions: {progress: measured('v5.text-typewriter')},
			params: {font: 'ui', weight: 400, capHeight: 5.45, pictureFrames: 2.5, caret: false, color: 'inkSoft', tone: 'dark'},
			reproduces: {progress: ['v5.text-typewriter']},
		},
		letterFade: {
			// v7.text-type-letter-fade S18/S25: each letter fades in place (no blur, no move) to light grey and on to
			// full (the measured first-letter curve, applied to every letter from its onset); the first gaps +4.5,
			// +3.2, +3.8, +3.0, +4.5, +5.0, +2.5 f (S18 onsets), then one character per 2.96 f (S25: 23 intervals
			// f2946-f3014). Inter 400, cap 11.7 % H at the close framing, tracking 0 em
			motions: {opacity: measured('v7.text-type-letter-fade')},
			params: {font: 'ui', weight: 400, capHeight: 11.7, tracking: 0, framesPerChar: 2.96, leadGaps: '4.5,3.2,3.8,3.0,4.5,5.0,2.5', look: 'fade', tone: 'dark'},
			reproduces: {opacity: ['v7.text-type-letter-fade']},
		},
		fadeTrail: {
			// v8.text-type-on-fade-trail S03: 0.85 f per character, 2 characters per captured picture; the newest
			// 2-3 characters light grey for 2-4 f (3 f), then dark: darkest pixel 142 against 33 on the 248 page =
			// 0.49 of the ink; v6.text-type-on: the same lighter-trail typing at 0.59-1.6 f per letter.
			// Inter 400, cap 3.2 % H, dark grey on white
			motions: {},
			params: {
				font: 'ui',
				weight: 400,
				capHeight: 3.2,
				framesPerChar: 0.85,
				charsPerPicture: 2,
				look: 'trail',
				trailFrames: 3,
				trailInk: 0.49,
				color: 'inkSoft',
				tone: 'light',
			},
			covers: ['v8.text-type-on-fade-trail', 'v6.text-type-on'],
		},
		stretchFade: {
			// v7.text-type-on S01: title word 2 types left to right at 4.6 f per letter, each new letter faint on its
			// first picture (8 luma over the 207 box fill against about 250 when set = 0.19; pictures 2.5 f apart:
			// S03 letters on f324 / 326 / 329 / 331 / 334); title line 2, 48 f later (f49), stretches each letter in
			// from 0.49 width with a 20 px gap (0.36 cap) closing to 4 px (0.07 cap), 14 f per letter, letters 2.5 f
			// apart, overlapping (the 14 f shape is not fitted: outFirm, the text family's most common measured
			// shape). Inter 700, cap 6.0 % H, title case, centred, light on a darker box
			motions: {stretch: motion(14, EASE.outFirm)},
			params: {
				font: 'ui',
				weight: 700,
				capHeight: 6.0,
				framesPerChar: 4.6,
				look: 'trail',
				trailFrames: 2.5,
				trailInk: 0.19,
				stretchFramesPerChar: 2.5,
				stretchDelay: 48,
				fromScaleX: 0.49,
				fromGap: 0.36,
				restGap: 0.07,
				align: 'center',
				color: 'onAccent',
				tone: 'light',
			},
			covers: ['v7.text-type-on'],
		},
		acceleratingDots: {
			// v7.text-typewriter-capsule S11: 16 characters as 1 / 3 / 4 / 6 / 8 / 10 / 13 / 16 at f1391 / 1399 / 1404 /
			// 1406 / 1409 / 1411 / 1414 / 1416 (1.6 f/char on average, speeding up), centred in a capsule that widens
			// with them; then a 3-dot ellipsis dot by dot at +3 / +5 / +9 f. Inter 400, cap 4.2 % H
			motions: {},
			params: {
				font: 'ui',
				weight: 400,
				capHeight: 4.2,
				framesPerChar: 1.6,
				stepFrames: '0,8,13,15,18,20,23,25',
				stepCounts: '1,3,4,6,8,10,13,16',
				dotFrames: '3,5,9',
				flow: true,
				align: 'center',
				tone: 'dark',
			},
			covers: ['v7.text-typewriter-capsule'],
		},
		leadingEdge: {
			// v6.text-type-on-pan S05: the next word of a huge panning line types on just inside the leading (right)
			// frame edge, each letter cut on at full tone, one every 5 f, then rides the pan. Letter 1 at x 1259 px
			// (77.6 % W) when it appears; its left edge then rides the pan 1259 / 1144 / 1070 / 1022 / 990 / 969 /
			// 956 px over f161-f176 (18.7 % W in 15 f; outStrongOver2 fits, rmse 0.034). Archivo wdth 125 Black,
			// caps, cap 27.1 % H (close-up)
			motions: {pan: motion(15, EASE.outStrongOver2)},
			params: {font: 'wide', weight: 900, stretch: 125, capHeight: 27.1, case: 'upper', framesPerChar: 5, panTravel: 18.7, edgeX: 77.6, tone: 'light'},
			covers: ['v6.text-type-on-pan'],
		},
		flashLetter: {
			// v5.text-type-on S15: letters 7-11 of 11 type on one per picture (f1902, 1905, 1907, 1910, 1912 =
			// 2.4 f/letter); the first 6 (0.545 of the line) are already in (they arrive by a blurred slide); the
			// newest letter flashes white for its picture, then settles to the metallic grey. Archivo wdth 125
			// Black, caps, reverse cap taper 5.9 % H (first letter) -> 11.4 % H (last) on a common baseline, centred
			motions: {progress: measured('v5.text-type-on')},
			params: {
				font: 'wide',
				weight: 900,
				stretch: 125,
				capHeight: 11.4,
				case: 'upper',
				framesPerChar: 2.4,
				fromShare: 0.545,
				pictureFrames: 2.5,
				look: 'flash',
				taperFrom: 5.9,
				taperTo: 11.4,
				color: 'inkSoft',
				align: 'center',
				tone: 'dark',
			},
			reproduces: {progress: ['v5.text-type-on']},
		},
	},
	demoFrames: 120,
	demoTone: 'light',
};
