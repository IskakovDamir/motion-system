import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Frame 0 is the first frame of the swap (60 fps). v1-v4 px are of a 1920x1080 picture (px at 1080
// as read). Per item, every motion runs from that item's own start (its wave or order offset).
// Sizes of the measured elements (cellW / cellH, plate, pill) are what the Demo lays out at; the
// component swaps whatever it is given.

export const spec: PrimitiveSpec = {
	name: 'ShapeSwap',
	kind: 'shape',
	description:
		'Each element swaps in place for another: the old one shrinks and fades while the new one grows and fades in, all at once or as a wave across the set.',
	defaultVariant: 'waveSwap',
	variants: {
		waveSwap: {
			// v4.trans-tile-hex-morph: at f1294 every dot and long connector is removed in one frame (the
			// detached layer, gone from frame 1); a radial wave from (960, 575) px = (50.0% W, 53.2% H)
			// reaches each node at 0.0161 f per px (62 px/f); per node the old card fades out (.i2) while it
			// shrinks about the node centre to 0.561 (.i3), and the new hexagon in front fades in (the
			// curve: centre-node luma, icon -> solid hexagon) and grows 0.612 -> 1 (.i4) from its first
			// sizable picture, 2 f after the node starts (held at 0.612 before); the labels fade 1 -> 0
			// all at once, near-linearly (about -0.08 per frame), over 13 f; hexagons 57 x 52 px
			motions: {
				opacity: measured('v4.trans-tile-hex-morph'),
				outOpacity: measured('v4.trans-tile-hex-morph.i2'),
				outScale: measured('v4.trans-tile-hex-morph.i3'),
				inScale: measured('v4.trans-tile-hex-morph.i4', 2),
				labels: motion(13, linear),
			},
			params: {waveX: 50.0, waveY: 53.2, framesPerPx: 0.0161, outTo: 0.561, fromScale: 0.612, cellW: 57, cellH: 52},
			reproduces: {opacity: ['v4.trans-tile-hex-morph']},
		},
		centreOutSwap: {
			// v3.icon-badge-to-hex: badges swap centre-out, alternating left / right, 1.8 f apart; per badge
			// the black hexagon (188 x 170 px) appears at 0.62 about the badge centre and grows to 1.00 on
			// the curve (from f1126 = +1 f, so frame 0 still shows the badges) and turns opaque in 15 f
			// (ring luma 129 / 86 / 55 / 37 / 24 at f1129 / 31 / 33 / 35 / 37: an ease-out, outFirm);
			// the old plate shrinks about
			// its centre 215.6 -> 202 / 188 / 164 / 153 px (1 -> 0.937 / 0.872 / 0.761 / 0.71, f1126-f1129)
			// and dims (ring contrast 0.94 / 0.80 / 0.665 / 0.585 at f1129-f1132), then is covered; the
			// label scales 1 -> 0.62 about a point 123.7 px above its centre (35 px below the plate
			// centre; the label sits 159.5 px below it) (.i2) and fades out (.i3), from f1125
			motions: {
				scale: measured('v3.icon-badge-to-hex', 1),
				opacity: motion(15, EASE.outFirm, 1),
				labelScale: measured('v3.icon-badge-to-hex.i2'),
				labelOpacity: measured('v3.icon-badge-to-hex.i3'),
			},
			params: {
				stagger: 1.8,
				fromScale: 0.62,
				outScale: '0:1 1:0.937 2:0.872 3:0.761 4:0.71',
				outDim: '3:1 4:0.94 5:0.8 6:0.665 7:0.585',
				labelTo: 0.62,
				labelPivot: 123.7,
				labelBelow: 159.5,
				cellW: 188,
				cellH: 170,
				plate: 215.6,
			},
			reproduces: {scale: ['v3.icon-badge-to-hex']},
		},
		crossDissolve: {
			// v4.card-content-crossfade: every card's content cross-dissolves in the same frame, no
			// stagger: the old content fades out (.i2, text band luma 44 -> 17) while the new centred
			// content fades in (the curve, 31 f, 50% after 6 f); the card rectangles keep their size
			motions: {opacity: measured('v4.card-content-crossfade'), outOpacity: measured('v4.card-content-crossfade.i2')},
			params: {},
			reproduces: {opacity: ['v4.card-content-crossfade']},
		},
		shrinkGrow: {
			// v2.ui-badge-swap-pop: the old pill shrinks to 0.90 (88 -> 79 px) and fades out in 3 f (luma
			// +2.6, +10.9, +15.7 per frame: an ease-in) and is gone from the 4th frame; the new pill shows
			// from f994 (+3 f) at 0.80 and grows to 1.00 while it fades in, on the curve (90 -> 112 px, fast
			// start, no overshoot; its first picture already shows it, so the fade runs one frame ahead); swaps run 11.5 f apart (12, 11, 11, 12, 11, 12); pill 112 px wide
			motions: {out: motion(3, EASE.inGentleOver), scale: measured('v2.ui-badge-swap-pop', 3), opacity: measured('v2.ui-badge-swap-pop', 2)},
			params: {outTo: 0.9, fromScale: 0.8, stagger: 11.5, cut: 3, pill: 112},
			reproduces: {scale: ['v2.ui-badge-swap-pop']},
		},
	},
	demoFrames: 100,
	demoTone: 'light',
};
