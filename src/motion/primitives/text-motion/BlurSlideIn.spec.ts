import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// mode: edges (units slide in from frame sides), track (a stretched line tightens into place), glyphs
// (leading and trailing glyphs converge on the text between) or letters (letters fly in from all four
// edges onto a low line that rises). travel: % of frame width from rest on the side the measured curve
// drives (curveSide), travelOther: the other side. sides: L / R per unit, cycling; a trailing * repeats
// the last. exposure: frames of motion blur (measured streak length over measured speed). The overshoots
// are in the measured curves. v5-v7 pixels are of a 1622 x 918 picture.

export const spec: PrimitiveSpec = {
	name: 'BlurSlideIn',
	kind: 'text',
	description:
		'Lines, words, letters or glyphs slide in from the frame edges with directional motion blur and lock into place on a hard ease-out or a stiff spring, sometimes overshooting; pairs come from opposite sides.',
	defaultVariant: 'oppositeEdges',
	variants: {
		oppositeEdges: {
			// v5.text-line-slide-blur (S22): line 1 enters from the left edge as a blur streak (left ink edge
			// 0 -> 40.75% W, main) and line 2 from the right edge (ink centroid 94.9 -> 49.4% W = 45.5% W, .i3),
			// together; the streak is 0-11% W on the first picture while the line covers 8.8% W per frame
			// (11 / 8.8 = 1.25 f); type of the S08 instance: Archivo wdth 125 Black, flat cap 10.9% H, 0.03-0.05 em
			motions: {x: measured('v5.text-line-slide-blur'), xOther: measured('v5.text-line-slide-blur.i3')},
			params: {
				mode: 'edges',
				unit: 'line',
				sides: 'LR',
				curveSide: 'L',
				travel: 40.75,
				travelOther: 45.5,
				stagger: 0,
				exposure: 1.25,
				font: 'wide',
				weight: 900,
				stretch: 125,
				capHeight: 10.9,
				tracking: 0.04,
				case: 'upper',
				align: 'center',
			},
			reproduces: {x: ['v5.text-line-slide-blur']},
		},
		overshoot: {
			// v5.text-line-slide-overshoot: title 1 slides in from the left edge (13.7 -> 48.0% W = 34.3% W, .i2)
			// and title 2 from the right edge 5 f later (113.8 -> 74.6% W = 39.2% W, main), the same curve,
			// overshooting 0.9 / 1.3% W; Unbounded Black, 0.02-0.04 em; cap 9.2% H (title 1, left aligned) and
			// 5.8-6.1% H (title 2, right aligned) while they slide
			motions: {x: measured('v5.text-line-slide-overshoot')},
			params: {
				mode: 'edges',
				unit: 'line',
				sides: 'LR',
				curveSide: 'R',
				travel: 39.2,
				travelOther: 34.3,
				stagger: 5,
				font: 'round',
				weight: 900,
				capHeight: 5.95,
				capHeightOther: 9.2,
				tracking: 0.03,
				case: 'upper',
				align: 'split',
			},
			reproduces: {x: ['v5.text-line-slide-overshoot']},
		},
		converge: {
			// v5.text-converge-slide: words 2-3 fly in from the right (ink centroid 83.53 -> 64.39% W = 19.1% W,
			// 5 f, main) with a ~600 px smear while covering 140 px/f on the first pictures (4.3 f); word 1 from
			// the left (3.3 -> 25.8 -> 35.0 -> 34.4% W at +0 / 2 / 5 / 12 f = 31.1% W, +9 px overshoot; values,
			// outFirmOver 6 f fits, rmse 0.005); Archivo wdth 125 Black, cap 11.4% H (big first word) tapering to
			// 6.1% H (the two smaller words), one baseline
			motions: {x: measured('v5.text-converge-slide'), xOther: motion(6, EASE.outFirmOver)},
			params: {
				mode: 'edges',
				unit: 'word',
				sides: 'LR*',
				curveSide: 'R',
				travel: 19.1,
				travelOther: 31.1,
				stagger: 0,
				exposure: 4.3,
				font: 'wide',
				weight: 900,
				stretch: 125,
				capHeight: 6.1,
				capHeightOther: 11.4,
				case: 'upper',
				align: 'center',
			},
			reproduces: {x: ['v5.text-converge-slide']},
		},
		typeAlong: {
			// v6.text-line-slide-blur: the 2 lines of a sub-caption slide in from the right on one path
			// (997.6 -> 867.0 px = 8.1% W, main = line 2), line 2 about 5 f after line 1, typing on with a
			// per-letter fade at about 1.25 f per letter; Archivo wdth 125 Bold, cap 6.5% H, caps, flush left,
			// line 1 grey and line 2 black (the horizontal blur is not sized in the rows)
			motions: {x: measured('v6.text-line-slide-blur')},
			params: {
				mode: 'edges',
				unit: 'line',
				sides: 'R',
				curveSide: 'R',
				travel: 8.1,
				stagger: 5,
				typeRate: 1.25,
				leadInk: 'muted',
				font: 'wide',
				weight: 700,
				stretch: 125,
				capHeight: 6.5,
				case: 'upper',
				align: 'left',
			},
			reproduces: {x: ['v6.text-line-slide-blur']},
		},
		whipIn: {
			// v6.text-word-whip-in: words whip in from the right in reading order and decelerate (S13 line-2
			// word 952 -> 403 px = 33.8% W, main); in S13 the words come to rest at f1198 / f1206 / f1208 on the
			// same curve, 8 then 2 f apart (mean 5; S10's second word, a different device, follows 15 f later);
			// S10's blurred left edge spreads over 145 px while covering 82 px/f (1.77 f); Saira SemiCondensed,
			// cap 17.3% H, caps, left; line 1 SemiBold grey, line 2 ExtraBold black
			motions: {x: measured('v6.text-word-whip-in')},
			params: {
				mode: 'edges',
				unit: 'word',
				sides: 'R',
				curveSide: 'R',
				travel: 33.8,
				stagger: 5,
				exposure: 1.77,
				leadInk: 'muted',
				leadWeight: 600,
				font: 'square',
				weight: 800,
				stretch: 87.5,
				capHeight: 17.3,
				case: 'upper',
				align: 'left',
			},
			reproduces: {x: ['v6.text-word-whip-in']},
		},
		trackingSettle: {
			// v5.text-tracking-settle: the line lands stretched and tightens leftward into place (main: letter 7
			// +51 px = 3.15% W -> 0); at the start letters 1-7 sit +8 / 17 / 28 / 37 / 44 / 50 / 51 px out
			// (0.49 / 1.05 / 1.73 / 2.28 / 2.71 / 3.08 / 3.14% W); later letters type on 2.4 f apart at letter 7's
			// offset and ride along; Archivo wdth 125 Black, caps, centred, cap 5.9 -> 11.4% H (mean 8.65)
			motions: {x: measured('v5.text-tracking-settle')},
			params: {
				mode: 'track',
				unit: 'letter',
				offsets: '0.49,1.05,1.73,2.28,2.71,3.08,3.14',
				typeFrom: 7,
				typeRate: 2.4,
				font: 'wide',
				weight: 900,
				stretch: 125,
				capHeight: 8.65,
				case: 'upper',
				align: 'center',
			},
			reproduces: {x: ['v5.text-tracking-settle']},
		},
		glyphConverge: {
			// v7.text-glyph-slide-in: the left chevrons slide in from the box's left edge, 24.0 -> 31.3% W
			// (7.3% W) in 9 f, the second chevron 12 f after the first; the word between scales up from a dot
			// f60-f66 (+9 f, 6 f); the right chevrons arrive from the right edge from +15 f, first in place 5 f
			// later, 6 f apart (easing not fitted in the rows: outFirm); Inter 700, cap 6.0% H
			motions: {x: motion(9, EASE.outFirm), xOther: motion(5, EASE.outFirm, 15), scale: motion(6, EASE.outFirm, 9)},
			params: {
				mode: 'glyphs',
				unit: 'glyph',
				travel: 7.3,
				travelOther: 7.3,
				stagger: 12,
				otherStagger: 6,
				type: 'ui',
				weight: 700,
				capHeight: 6.0,
				align: 'center',
			},
			covers: ['v7.text-glyph-slide-in'],
		},
		edgeSpring: {
			// v6.text-bracket-spring-in: light-grey braces slide in from both sides onto a label and settle with
			// a damped overshoot (1.1% W past rest): left brace centroid 112.6 -> 607.3 px (30.5% W), right
			// 1553.2 -> 1011.2 px (33.4% W), together; label JetBrains Mono ExtraBold, cap 13.9% H, caps
			motions: {x: measured('v6.text-bracket-spring-in')},
			params: {
				mode: 'glyphs',
				unit: 'glyph',
				travel: 30.5,
				travelOther: 33.4,
				stagger: 0,
				glyphInk: 'muted',
				font: 'mono',
				weight: 800,
				capHeight: 13.9,
				case: 'upper',
				type: 'code',
				align: 'center',
			},
			reproduces: {x: ['v6.text-bracket-spring-in']},
		},
		allEdges: {
			// v6.text-letter-converge: letters 1-8 fly in from the left, bottom, top, top, bottom, bottom,
			// right and top edges, starting f15 / 18 / 18 / 18 / 21 / 21 / 28 / 28 (fast ease-out with a
			// 6-13 px overshoot, 13-21 f each: outFirmOver2 17 f, overshoot 3%), land on a low line 9.0% H
			// below rest at about x1.15 spacing that converges in about 12 f from f26, and the line rises
			// 450.5 -> 367.5 px (9.0% H, main) from f26; letters start beyond the frame edges (half a frame
			// plus one font size from a slot on the centred line); Archivo wdth 125 Black, cap 14.3% H
			motions: {y: measured('v6.text-letter-converge', 11), fly: motion(17, EASE.outFirmOver2), spread: motion(12, EASE.outFirm, 11)},
			params: {
				mode: 'letters',
				unit: 'letter',
				sides: 'LBTTBBRT',
				delays: '0,3,3,3,6,6,13,13',
				lowLine: 9.0,
				spread: 1.15,
				edgeX: 50,
				edgeY: 50,
				font: 'wide',
				weight: 900,
				stretch: 125,
				capHeight: 14.3,
				case: 'upper',
				align: 'center',
			},
			reproduces: {y: ['v6.text-letter-converge']},
		},
	},
	demoFrames: 90,
	demoTone: 'dark',
};
