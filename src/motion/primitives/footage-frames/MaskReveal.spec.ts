import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Pixels: v5-v8 are 1622 x 918 (% of that picture; px x 1080/918 for px at 1080). Cards: cx / cy centre
// and cardW / cardH size in % of frame width / height, radius in % of the card's own width. Edges and
// widths of a mask (right, left, toW, fromW, toR, bandWidth) are % of frame width.

export const spec: PrimitiveSpec = {
	name: 'MaskReveal',
	kind: 'footage',
	description:
		'Footage (or an edited version of it) is revealed inside a card by a moving mask: a glowing dot-matrix ring expands from a point, a light scan band sweeps across, a seam sweeps open with the content riding its edge, or a strip opens from a thin line.',
	defaultVariant: 'dotRing',
	variants: {
		dotRing: {
			// v7.mask-dot-ring-reveal S22 (token frame = f - 2653): a 1354 x 761 px card (83.5% W x 82.9% H, corner radius
			// 40 px = 3.0% of its width) centred at (49.57, 49.73)%; the footage is clear inside a ring whose inner
			// half-level radius grows 0 -> 39.15% W from the card centre on the curve. The ring is a band of glowing dots on a
			// 12 px pitch (14.1 px at 1080); its peak runs ahead of the inner edge: 85 / 65 px (f2656) and 645 / 475 px
			// (f2679) = 1.31 / 1.36 x the inner radius -> peak 1.33; the band is taken symmetric about its peak (outer
			// 1.66 x; the outer edge itself is cut by the card corners). A chip at the centre fades in place as the ring
			// passes (label luma 220 / 189 / 156 / 142 at f2661 / 2664 / 2666 / 2669: inOutGlideOver over 8 f, rmse 0.032,
			// from token frame 8); the dots left at the card's edges fade from f2690 for about 14 f (easing UNCERTAIN:
			// linear)
			motions: {progress: measured('v7.mask-dot-ring-reveal'), chip: motion(8, EASE.inOutGlideOver, 8), dots: motion(14, linear, 37)},
			params: {toR: 39.15, peak: 1.33, outer: 1.66, pitch: 14.1, cx: 49.57, cy: 49.73, cardW: 83.5, cardH: 82.9, radius: 3.0},
			reproduces: {progress: ['v7.mask-dot-ring-reveal']},
		},
		scanBand: {
			// v7.mask-scan-band-reveal S29: a light vertical band sweeps left to right across a 1530 x 862 px card (x 2.9-97.2%
			// W, y 2.7-96.6% H, corner radius 47 px = 3.1% of its width); its trailing edge is the reveal front (the curve)
			// and an edited version shows behind it; three sweeps at f3371 / 3426 / 3484 (+0 / 55 / 113 f), each revealing
			// the next version. The band is 130-201 px (8-12% W) wide mid-card, the widest at the sweep's peak speed -> 12;
			// luma +35-48 over the picture there (+35 at 201 px, +48 at 130 px), +75-91 squeezed against a card edge, +127 as a
			// 41 px line: lift x width about constant -> glow 35 at 12% W, capped at 127
			motions: {progress: measured('v7.mask-scan-band-reveal')},
			params: {sweeps: '0 55 113', bandWidth: 12, glow: 35, glowMax: 127, cx: 50.05, cy: 49.65, cardW: 94.3, cardH: 93.9, radius: 3.1},
			reproduces: {progress: ['v7.mask-scan-band-reveal']},
		},
		seamOpen: {
			// v5.card-seam-reveal S17: a card emerges from a vertical seam: its right edge stays (65.4 -> 64.5% W), its left
			// edge sweeps open to 27.8% W wide on the curve, the content keeping its size and riding the left edge (a mask
			// reveal, not a squash); card 452 x 543 px at rest (59.2% H tall), corner radius 7-7.5% of its width, on the mask (the
			// opening sliver is a rounded pill)
			motions: {width: measured('v5.card-seam-reveal')},
			params: {toW: 27.8, right: 65.4, rightTo: 64.5, cardH: 59.2, radius: 7.25},
			reproduces: {width: ['v5.card-seam-reveal']},
		},
		stripOpen: {
			// v5.footage-strip-open S22: a footage strip opens to the right from a 4 px line (0.25% W) at x 50.8% W, its left
			// edge fixed: 4 / 25 / 56 / 107 / 194 / 374 px at +0 / 3 / 6 / 9 / 11 / 13 f, past the right frame edge (49.2% W
			// wide) at +15: inLaunch over 15 f (rmse 0.018), no settle in frame; strip height 150 px (16.3% H) after a pull-back
			// that scales it x0.70 -> 23.3% H while it opens
			motions: {width: motion(15, EASE.inLaunch)},
			params: {left: 50.8, fromW: 0.25, toW: 49.2, cardH: 23.3},
			covers: ['v5.footage-strip-open'],
		},
	},
	demoFrames: 160,
	demoTone: 'dark',
};
