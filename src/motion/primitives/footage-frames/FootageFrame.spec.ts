import type {PrimitiveSpec} from '../types';
import {measured} from '../../tokens/measured';

// Pixels: v5-v8 are 1622 x 918 (% of that picture; px x 1080/918 for px at 1080). The window holds
// still; what changes is the footage inside it (cuts, a fade from the card fill, a luma dim) or, for the
// curved panel, its outline.
// cuts: frames (60 fps) at which the footage inside the window cuts to the next shot; stagger: the
// same cuts start this many frames later in each following window of a row (index prop).
// Curved panel: cx / cy / cardW / cardH its box at the corners (% of frame), bow: top and bottom edges
// bowed toward the centre (% H, a parabola), radius: corner radius in % of the panel's width.
// dimTo: footage luma under the dim, as a factor of its own.

/** v5.footage-curved-panel S21: x 15.8-84.0% W, top 13.7% H at the corners -> 16.3% H at the centre, bottom 86.6 -> 84.0% H, corner radius about 35 px (2.2% W) on a 1106 px panel. */
const CURVED = {cx: 49.9, cy: 50.15, cardW: 68.2, cardH: 72.9, bow: 2.6, radius: 3.2};

export const spec: PrimitiveSpec = {
	name: 'FootageFrame',
	kind: 'footage',
	description:
		'Footage carried by a fixed window or mask: the footage cuts inside it while the layout holds (single cuts or a quick burst), a curved-screen mask whose edges can wobble as it whips out, footage fading in from the card fill, or a scrim that dims the footage under text.',
	defaultVariant: 'innerCuts',
	variants: {
		innerCuts: {
			// v7.footage-viewer-playback S17: a square-cornered window plays footage with hard cuts inside it, counted from
			// its first visible picture f2129: a burst at f2134 (likely) / 2139 / 2141 / 2146 / 2149, then f2196, f2204,
			// f2209 (shots of 5 / 2 / 5 / 3, then 47, 8, 5 and 133 f to the cut f2341); the layout holds
			motions: {},
			params: {cuts: '5 10 12 17 20 67 75 80', radius: 0},
			covers: ['v7.footage-viewer-playback'],
		},
		cutBurst: {
			// v7.footage-viewer-cut-burst S17: 5 new shots in 15 f (f2134 likely, 2139, 2141, 2146, 2149: shots of 5 / 2 /
			// 5 / 3 f, uneven), then a 47 f hold on one shot
			motions: {},
			params: {cuts: '0 5 7 12 15'},
			covers: ['v7.footage-viewer-cut-burst'],
		},
		singleCut: {
			// v5.footage-window-swap S15: a plain cut (0 f) inside one card window, the layout keeps moving; the next window
			// cuts 33 f later (left card f1987, middle card f2020)
			motions: {},
			params: {cuts: '0', stagger: 33},
			covers: ['v5.footage-window-swap'],
		},
		curvedHold: {
			// v5.footage-curved-panel S21 (S18 the same shape on a 57.8% W card): footage in a curved-screen mask, straight
			// vertical sides, top and bottom bowed toward the centre; static
			motions: {},
			params: {...CURVED},
			covers: ['v5.footage-curved-panel'],
		},
		wobbleExit: {
			// v5.fx-liquid-edge-wobble T21: the curved panel whips out of the top on the exit curve v5.trans-whip-tilt.i5
			// (token frame = f - 3286), its bottom edge 83.9 -> 0% H where the bow is highest; the corners hang 2.6% H lower
			// (86.6% H), so the panel rises 86.6% H to be gone (the camera lands on an empty canvas). From f3297 the outline stops being rigid: it bulges out
			// where the footage is bright (offset against footage level r = +0.77..+0.96), max outward offset 4.9 (f3297) /
			// 14.5 (f3300) / 7 (f3302) / 2.5 px (f3305-3307) -> px at 1080 at token frames 11 / 14 / 16 / 19; edge ramps
			// (10-90%) 1.5-2.4 (rest) / 4.0-4.4 / 6.3-7.0 px -> 2.4 / 4.9 / 7.8 px at 1080. Vertical motion blur is noted
			// (f3297-3302) but not measured: the v5 shutter of v5.footage-card-fly-in
			motions: {y: measured('v5.trans-whip-tilt.i5')},
			params: {...CURVED, rise: 86.6, wobble: '11:5.8 14:17.1 16:8.2 19:2.9', ramp: '0:2.4 11:4.9 14:7.8', shutter: 1.0},
			covers: ['v5.fx-liquid-edge-wobble'],
		},
		contentFade: {
			// v8.footage-card-content-fade-in S21-S22: the card's footage fades in from its black fill on the curve (99th
			// percentile luma 37 -> 244, near-linear)
			motions: {opacity: measured('v8.footage-card-content-fade-in')},
			params: {fill: 'dark'},
			reproduces: {opacity: ['v8.footage-card-content-fade-in']},
		},
		dimIn: {
			// v5.fx-footage-dim S01: the footage darkens under incoming text on the curve, ROI luma 112.2 -> 45.4 (x0.405 at
			// the curve's end; the token's overshoot passes x0.39, the measured 44.0)
			motions: {opacity: measured('v5.fx-footage-dim')},
			params: {dimTo: 0.405},
			reproduces: {opacity: ['v5.fx-footage-dim']},
		},
		heldDim: {
			// v7.text-static-headline-dim-footage S35: full-frame footage held at about half luminance under a static
			// headline (luma ceiling 123-129 against 244-253 undimmed), no fade: it cuts in and out with the shot
			motions: {},
			params: {dimTo: 0.5},
			covers: ['v7.text-static-headline-dim-footage'],
		},
	},
	demoFrames: 230,
	demoTone: 'dark',
};
