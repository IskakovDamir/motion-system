import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// fromScale: scale on the first frame of the scale motion; firstScale: scale held on the pictures before it
// (the motion's delay). originX / originY: the point the element scales about, in % of its own width / height
// (50 50 = its centre; a negative x lies left of the element).

export const spec: PrimitiveSpec = {
	name: 'OversizeSettle',
	kind: 'layout',
	description: 'An element enters oversized (often blurred and cut by the frame edge) and shrinks to rest about its anchor on a fast-start ease-out.',
	defaultVariant: 'settle',
	variants: {
		settle: {
			// v6.text-scale-down-settle S07: first seen f324 at about x1.5, then x1.385 (f326) -> 1.0 on the curve
			// (2 f later), about its baseline centre (770, 500) px = (47.5% W, 54.5% H); its left edge comes in from
			// outside the frame to 168 px (10.4% W); caps, cap height 13.5% H
			motions: {scale: measured('v6.text-scale-down-settle', 2)},
			params: {fromScale: 1.385, firstScale: 1.5, originX: 50, originY: 100, anchorX: 47.5, anchorY: 54.5, restLeft: 10.4, capH: 13.5},
			reproduces: {scale: ['v6.text-scale-down-settle']},
		},
		hugeShrink: {
			// v6.text-word-shrink-in S10: x3.56 -> 1 on the curve, uniform, about a point on the line's centre line left
			// of the word: anchor x 762-765 px, the word's rest left edge 877 px, 415 px wide: -27.3% of its width;
			// rest ink height 193 px of 918 (21.0% H)
			motions: {scale: measured('v6.text-word-shrink-in')},
			params: {fromScale: 3.56, originX: -27.3, originY: 50, inkH: 21.0},
			reproduces: {scale: ['v6.text-word-shrink-in']},
		},
		blurShrink: {
			// v7.icon-tile-scale-down-in S04: the tile appears at a cut x2.20 and shrinks to rest (13.3% W) about its
			// centre on the curve
			motions: {scale: measured('v7.icon-tile-scale-down-in')},
			params: {fromScale: 2.196, originX: 50, originY: 50, tileW: 13.3},
			reproduces: {scale: ['v7.icon-tile-scale-down-in']},
		},
		quickSettle: {
			// v7.ui-button-oversize-settle S03: x1.23 (f376) -> 1.10 (f380) -> 1.02 (f382) -> 1.0 (f384) about its own
			// centre, inOutGlideOver over 8 f (rmse 0.008); before f376 it sits at x1.25-1.30 in its row; rest 230 x 50 px
			// (14.2% W x 5.4% H)
			motions: {scale: motion(8, EASE.inOutGlideOver)},
			params: {fromScale: 1.23, originX: 50, originY: 50, buttonW: 14.2, buttonH: 5.4},
			covers: ['v7.ui-button-oversize-settle'],
		},
		riseSettle: {
			// v5.card-scale-settle S20: card 2 enters huge (x2.26) and shrinks to rest (23.5% W) on the curve
			motions: {scale: measured('v5.card-scale-settle')},
			params: {fromScale: 2.26, originX: 50, originY: 50, cardW: 23.5},
			reproduces: {scale: ['v5.card-scale-settle']},
		},
	},
	demoFrames: 80,
	demoTone: 'light',
};
