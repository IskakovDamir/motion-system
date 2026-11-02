import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Pixels: v5-v8 are 1622 x 918 (% of that picture). Positions are card centres (cx, cy, fromX/toX,
// fromY/toY) or edges (fromTop/toTop) in % of frame width / height; cardW / fromW / toW in % of frame
// width, cardH in % of frame height; scales are factors about the card's centre (zoomToCentre: about
// its top centre). radius: corner radius in % of the card's own width (scale-free).
// edgeBlur: a zooming edge's 10-90% softness over the px it moves per frame (rendered as a Gaussian).
// shutter: frames of travel smeared into one picture (a measured box length / the built speed at that
// picture), rendered as a Gaussian of equal variance.

export const spec: PrimitiveSpec = {
	name: 'FootageCard',
	kind: 'footage',
	description:
		'A card carrying footage moves as one unit: it zooms from a small card to fill the frame, flies in on a diagonal and snaps into place, shrinks to become a node, grows from a speck in depth, or zooms in from specks into a row.',
	defaultVariant: 'zoomToFull',
	variants: {
		zoomToFull: {
			// v8.footage-card-zoom-to-full S02-S03: a frame-aspect card centred on the frame grows 5.1% W (x0.0506) -> full
			// frame on the curve (99.1% W at its 2% point f200, full frame f206); its edges soften with speed: 10-90% width
			// 22 px (f180) -> 15 -> 10 -> 5 -> 3 px (f200), 0.6-0.9 x the per-frame edge travel: 0.75
			motions: {scale: measured('v8.footage-card-zoom-to-full')},
			params: {fromScale: 0.0506, toScale: 1, cx: 50, cy: 50, edgeBlur: 0.75},
			reproduces: {scale: ['v8.footage-card-zoom-to-full']},
		},
		zoomFill: {
			// v8.trans-card-zoom-fill T23: a frame-aspect card 1151 x 652 px (71.0% W x 71.0% H) centred at (49.9, 50.2)%,
			// corner radius about 30 px (2.6% of its width), zooms x1.409 to the full frame on the curve; edge softness
			// 7-15 px (f3072-f3080) while each edge travels 22-10 px/f (width 1224 / 1354 / 1492 / 1571 px at f3071 / 3074
			// / 3078 / 3082), 2-4 px at about 5 px/f (f3086): 0.7
			motions: {scale: measured('v8.trans-card-zoom-fill')},
			params: {fromW: 71.0, toScale: 1.409, cx: 49.9, cy: 50.2, radius: 2.6, edgeBlur: 0.7},
			reproduces: {scale: ['v8.trans-card-zoom-fill']},
		},
		zoomToCentre: {
			// v8.trans-card-zoom-to-center T21: a portrait card 275 px (16.95% W) wide, its bottom below the frame, leaves its
			// slot and zooms x2.0 to 551 px (33.97% W) while travelling to the frame centre: centre x 24.26 -> 49.97% W, top
			// 509 -> 111 px (55.4 -> 12.1% H), all on the curve; corner radius about 18 px at 551 px (3.3% of its width)
			motions: {scale: measured('v8.trans-card-zoom-to-center')},
			params: {fromW: 16.95, toScale: 2.0, fromX: 24.26, toX: 49.97, fromTop: 55.4, toTop: 12.1, radius: 3.3},
			reproduces: {scale: ['v8.trans-card-zoom-to-center']},
		},
		diagonalSnap: {
			// v5.footage-card-fly-in S14: a 710 x 361 px card (43.77% W x 39.32% H) on a straight diagonal (30.5 deg) from
			// beyond the bottom-right corner: centre (90.44, 100.6)% -> rest (49.88, 59.4)% on the curve from f1830 (+5 f);
			// before it two held drift pictures 0.345 / 0.18 of the travel beyond the start (centre y 114.8 / 108.0% H at
			// f1825 / f1827); motion blur f1830-f1837: a 120 px box at f1832, where the built card moves 120 px/f: shutter 1.0
			motions: {x: measured('v5.footage-card-fly-in', 5)},
			params: {fromX: 90.44, toX: 49.88, fromY: 100.6, toY: 59.4, drift: '0:0.345 2:0.18', cardW: 43.77, cardH: 39.32, shutter: 1.0},
			reproduces: {x: ['v5.footage-card-fly-in']},
		},
		shrinkToNode: {
			// v5.trans-morph-tree T14: the same 710 x 361 px card shrinks 1.0 -> 0.34 on the curve (undershoot 0.31 at f1885)
			// and rises from 59.3 to 20.1% H at x 49.9% W to become the parent node
			motions: {scale: measured('v5.trans-morph-tree')},
			params: {toScale: 0.34, cx: 49.9, fromY: 59.3, toY: 20.1, cardW: 43.77, cardH: 39.32},
			reproduces: {scale: ['v5.trans-morph-tree']},
		},
		depthGrow: {
			// v5.card-depth-flyin S22: each thumbnail grows from a speck to 25.52% W visible width on the curve, about its own
			// centre; the next one 5 f later (thumbnail 3 at f3345)
			motions: {scale: measured('v5.card-depth-flyin')},
			params: {toW: 25.52, stagger: 5},
			reproduces: {scale: ['v5.card-depth-flyin']},
		},
		scatterZoom: {
			// v6.card-scatter-zoom-in S06 / S17: the cards' coverage of their band (luma 248 -> 61) reaches 0.01 / 0.13 / 0.48 /
			// 0.91 / 0.99 at f213 / 216 / 218 / 221 / 223: inOutWhip5 over 10 f (rmse 0.048); coverage is area, so each
			// card's scale is its square root (area: true)
			motions: {scale: motion(10, EASE.inOutWhip5)},
			params: {area: true},
			covers: ['v6.card-scatter-zoom-in'],
		},
	},
	demoFrames: 110,
	demoTone: 'light',
};
