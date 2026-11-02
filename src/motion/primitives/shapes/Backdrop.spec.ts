import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';

// Background behaviour. Positions in % of frame width / height; luma as levels (0-255) away from the
// field (`depth`, `contrast`) or as a 0-1 luma (`level`); drift speeds in % W per frame or px at 1080
// per frame; periods, staggers and steps in frames. v5-v8 pictures are 1622 x 918: px x 1080/918 at 1080.

const V6_BLOBS = '19.1,9.5 87.5,83.3';

export const spec: PrimitiveSpec = {
	name: 'Backdrop',
	kind: 'fx',
	description:
		'The background field and its ambient changes: soft blobs breathe, fade in or clear, a dot grid drifts, halftone glows swell and travel, ribbons rise or drift, a diagonal split rides the camera, a dotted beam bridges two elements, or a feathered zone clears the field behind text.',
	defaultVariant: 'breathe',
	variants: {
		breathe: {
			// v6.bg-soft-field S04: near-white field with soft grey blobs at the top left (darkness-weighted
			// centroid about (310, 87) px: 19.1% W, 9.5% H) and bottom right (its text-free box (1300, 700,
			// 240, 130): centre 87.5% W, 83.3% H); box means 207.7-225.6 and 214.1-226.9 luma on the 248 field:
			// mean depth 30.7 and 27.4 levels, swinging +-6.5 (12-14 peak to peak) in opposite phase every
			// 70 f (top left darkest at f48 / f118, bottom right at f16 / f86: 35 and 3 f after the start
			// f13); the top-left centroid wanders about 20 px (x 301.6-319.1: +-0.54% W, y 81.1-94.5:
			// +-0.73% H). A faint screen-locked dot grid with rows 34-35 px apart (2.13% W).
			motions: {},
			params: {period: 70, blobs: V6_BLOBS, depth: '30.7 27.4', swing: 6.5, darkest: '35 3', wanderX: 0.54, wanderY: 0.73, pitch: 2.13},
			covers: ['v6.bg-soft-field'],
		},
		clear: {
			// v6.bg-clear-fade S04: the blobs (top left 211.2, bottom right 226.9 luma: depth 36.8 and 21.1)
			// and the dense dot grid fade out together in place in 13 f, leaving the plain field (top left
			// 211.2 / 217.9 / 229.7 / 238.5 / 247.8 at +0 / +3 / +5 / +8 / +13 f: inOutGlideOver rmse 0.043).
			motions: {fade: motion(13, EASE.inOutGlideOver)},
			params: {blobs: V6_BLOBS, depth: '36.8 21.1', pitch: 2.13},
			covers: ['v6.bg-clear-fade'],
		},
		blobFadeIn: {
			// v6.bg-blob-fade-in: on the plain field with the sparse dot grid (68.5 px: 4.2% W) the blobs fade
			// in place, top left 248.2 -> 217.6 (depth 30.6) in 23 f (S05, values linear rmse 0.047),
			// bottom right to 227.8 (20.2); the corners are staggered, the bottom right about 13-15 f after
			// the top left (S13; 14 used). Top-left centroid x 306-312, y 80-85 px (19.0% W, 9.0% H);
			// bottom-right box x 1450-1540, y 760-830 (centre 92.2% W, 86.4% H).
			motions: {fade: motion(23, linear), fade2: motion(23, linear, 14)},
			params: {blobs: '19.0,9.0 92.2,86.4', depth: '30.6 20.2', pitch: 4.2},
			covers: ['v6.bg-blob-fade-in'],
		},
		dotGridDrift: {
			// v8.bg-dot-grid-drift: a faint dot grid fades in over 20 f in steps (16% at +3, 54% +6, 61% +12,
			// 80% +18, 98% of its hold at +20), the left third about 6 f later; it drifts left at one constant
			// rate, 0.17% W/f at the centre = 0.063-0.066 of the local spacing per frame (spacing 2.7 / 0.0645
			// = 41.9 px: 2.58% W); dot cores 237-238 on the 248 page (10.5 levels); 741-902 dot px for 34-38
			// dots (about 23 px each at 918: 6.5 px across at 1080); switched off in one picture 128 f after
			// the fade starts (f1074 -> f1202).
			motions: {},
			params: {pitch: 2.58, speed: 0.17, dot: 6.5, contrast: 10.5, steps: '3:0.16 6:0.54 12:0.61 18:0.8 20:1', lag: 6, off: 128},
			covers: ['v8.bg-dot-grid-drift'],
		},
		diagonalSplit: {
			// v7.bg-diagonal-split: a flat background of two greys split by a steep diagonal that moves with
			// the camera. No movement rows: the angle, the position and the greys are props.
			motions: {},
			covers: ['v7.bg-diagonal-split'],
		},
		travellingGlow: {
			// v5.bg-halftone-ribbon-glow S29: on the black field, halftone patches in the corners (measured
			// over x 0-224 px and 1400-1622 px: 13.8% W) whose lit dots swell, fade and travel: a patch peaks
			// every 60-65 f (62.5 used), each at its own time (upper left f4202, lower right f4207, lower left
			// f4257: 32, 37, 87 f after f4170), with peak energy 3.9 / 2.1 / 2.5 x its trough; a pulse's lit
			// cluster moves 48-62 px (3.4% W) at 2.7-4.6 px/f (0.225% W/f) toward the middle.
			motions: {},
			params: {period: 62.5, corners: '0,0 100,100 0,100', peaks: '32 37 87', gains: '3.9 2.1 2.5', reach: 13.8, travel: 3.4, speed: 0.225},
			covers: ['v5.bg-halftone-ribbon-glow'],
		},
		cornerFadeUp: {
			// v5.bg-halftone-glow S20: the halftone patches in the corners of the dark field fade up just after
			// the cut (measured on the top-right one: patch luma 4.9 -> 9.8 in 13 f, from half its level; ease
			// not measured: linear); the bottom-left patch rises with it; reach as travellingGlow's patches.
			motions: {fade: motion(13, linear)},
			params: {corners: '100,0 0,100', from: 0.5, reach: 13.8},
			covers: ['v5.bg-halftone-glow'],
		},
		ribbonRise: {
			// v5.bg-ribbon-rise-in: curved halftone ribbons appear (faint dots, f2645), rise with the canvas at
			// 0.8x its travel: 141 px of 918 (15.4% H) over 21 f from f2647, 61.5 px in the first 3 f
			// (outStrongOver2), and brighten (max luma 17-23 -> 27-31: from 0.69) and lengthen (81 -> 1002 and
			// 232 -> 647 dots: from 0.22 of their length) until the arrival settles 23 f after they appear
			// (counts rise in steps: linear). Dots 4 x 4 px (4.7 px at 1080).
			motions: {rise: motion(21, EASE.outStrongOver2, 2), grow: motion(23, linear)},
			params: {rise: 15.4, fromLevel: 0.69, fromLength: 0.22, dot: 4.7},
			covers: ['v5.bg-ribbon-rise-in'],
		},
		ribbonDrift: {
			// v5.bg-ribbon-drift: faint curved light ribbons (luma 5-30 on a 0-15 ground: peak 0.118) sweep
			// down through fixed columns, continuously, 4.3, 7 and 2.6 px/f (5.1, 8.2, 3.1 px/f at 1080).
			motions: {},
			params: {speeds: '5.1 8.2 3.1', level: 0.118},
			covers: ['v5.bg-ribbon-drift'],
		},
		beamGrow: {
			// v5.shape-halftone-beam: a dotted glint (0.9% W x 6.0% H, x 68.1-69.0% W, y 49.0-55.0% H, max
			// luma 92) shows 3 f before the next card's seam opens, then a horn whose wide end sits on the seam
			// (y 42.7-62.4%: 19.7% H, max 109), a bow-tie cone between the cards about 15 f after the glint
			// (not tracked: linear); a bright dot cluster swings along it, 4.1% W over about 27 f (x 35.8 ->
			// 31.6 -> 34.5% W).
			motions: {grow: motion(15, linear)},
			params: {lead: 3, glintW: 0.9, glintH: 6.0, hornH: 19.7, swing: 4.1, swingPeriod: 27, fromLevel: 0.36, toLevel: 0.43},
			covers: ['v5.shape-halftone-beam'],
		},
		clearZone: {
			// v1.layout-text-knockout: text on the network sits in a cleared, feather-edged zone that hides the
			// cells and packets under it and stays with the text. No movement rows: zone and feather are props.
			motions: {},
			covers: ['v1.layout-text-knockout'],
		},
		glowZone: {
			// v3.bg-headline-knockout: a soft background-coloured glow behind the headline dims or hides what
			// passes under it, feathered top and bottom, screen-locked; 52% of the connector contrast is left
			// inside the band at its outer ends (cover 0.48 there). Band and feather sizes are props.
			motions: {},
			params: {edge: 0.48},
			covers: ['v3.bg-headline-knockout'],
		},
	},
	demoFrames: 180,
	demoTone: 'light',
};
