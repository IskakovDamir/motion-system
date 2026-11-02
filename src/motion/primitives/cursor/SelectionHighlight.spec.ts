import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Sizes and positions in % of frame width (x) and height (y) (v5-v8 pictures are 1622 x 918, v7 S02 /
// S03 too); frames from the variant's frame 0; lists are space separated. lineW: outline widths the
// rows call thin without measuring them (a hairline, px at 1080).

export const spec: PrimitiveSpec = {
	name: 'SelectionHighlight',
	kind: 'ui',
	description:
		'A selection or hover state moves onto an element: a highlight pill fades in and widens, a card lifts with an outline and shadow, tiles light row by row, a slot holds while rows pass through it, the selection jumps to a new chip, or a selector frame hops between items.',
	defaultVariant: 'fadeWiden',
	variants: {
		fadeWiden: {
			// v7.ui-hover-highlight S02, frame 0 = f236: a light grey pill fades in behind a menu row, luma 248 ->
			// 242 (f239) -> 228 (f241) -> 225 (f244) -> 220 (f251): 0 / 0.21 / 0.71 / 0.82 / 1 (3 pictures and a
			// tail; fit outSoft 12 f, rmse 0.056), and widens 53.3% W x 12.7% H (f241) -> 59.2% W x 14.1% H (f256)
			// from f244 (frame 8) over 12 f (ease not fitted: outFirm; about its centre, the anchor is not measured)
			motions: {opacity: motion(12, EASE.outSoft), widen: motion(12, EASE.outFirm, 8)},
			params: {fromW: 53.3, fromH: 12.7, toW: 59.2, toH: 14.1},
			covers: ['v7.ui-hover-highlight'],
		},
		lift: {
			// v7.ui-hover-lift S03, frame 0 = f385 (the curve's 2% start f386 is its token frame 1): the button grows
			// x1.0 -> x1.293 about its own centre (the curve), and the card's rounded outline (with a soft shadow,
			// luma under the card 248 -> 239) fades in from f396 (frame 11) over 10 f (ease not fitted: outFirm)
			motions: {scale: measured('v7.ui-hover-lift'), outline: motion(10, EASE.outFirm, 11)},
			params: {liftScale: 1.293, lineW: 2},
			reproduces: {scale: ['v7.ui-hover-lift']},
		},
		rowSweep: {
			// v7.ui-tile-select-sweep S13, frame 0 = f1553 (the pointer at tile 1): 25 tiles light up instantly,
			// row by row in reading order (r1c1 f1556; r1c2-4 f1559; r1c5, r2c1-2 f1561; r2c3-5 and r3c5 f1564; r3c1-3 f1566; r3c4, r4c1-3 f1570;
			// r4c4-5, r5c1 f1572; r5c2-5 f1575): litAt per tile; then the whole selection dims in one step at f1586
			// (frame 33): interior 67 -> 53 (x0.79), border 86 -> 75 (x0.87). The pointer sweeps with it: at tile 1
			// (f1553), across the grid diagonally (row 2 at f1563, row 4 at f1566: tiles r2c2 and r4c4), to the
			// lower right (92.5, 87.8)% (f1577-f1591), back to (66.9, 68.5)% (f1601), read off overview sheets:
			// straight between the readings
			motions: {},
			params: {
				litAt: '3 6 6 6 8 8 8 11 11 11 13 13 13 17 11 17 17 17 19 19 19 22 22 22 22',
				dimAt: 33,
				dimFill: 0.79,
				dimBorder: 0.87,
				pointer: '0:@0 10:@6 13:@18 24:92.5,87.8 38:92.5,87.8 48:66.9,68.5',
				lineW: 2,
			},
			covers: ['v7.ui-tile-select-sweep'],
		},
		holdSlot: {
			// v8.ui-sticky-highlight-slot S06, frame 0 = f734: the highlight slot holds its top at 330 px of 918
			// (36.0% H) while the list scrolls through it, dipping +13.6 / +24.2 / +2.9 / +39.2 px (1.48 / 2.64 /
			// 0.32 / 4.27% H) during steps 1-4 and drifting back up about 0.8-1 px/f (0.9: 0.098% H per frame)
			// between them. The list's steps (v8.ui-list-step-scroll S06 rows): f762 / f796 / f824 (frames 28 / 62
			// / 90), 232 px (25.3% H) each in 20 f (that technique's token), and a double-row flick at f858 (frame
			// 124) of 595 px (64.8% H) in 26 f (not fitted: the same token shape stretched to a 26 f 2% window,
			// 39 f), over a base drift of 1.5-4 px/f (0.16-0.44% H per frame, 0.3 the middle)
			motions: {step: measured('v8.ui-list-step-scroll'), flick: motion(39, EASE.outStrong2, 124)},
			params: {slotTop: 36.0, steps: '28 62 90', stepH: 25.3, flickH: 64.8, dips: '1.48 2.64 0.32 4.27', back: 0.098, drift: 0.3},
			covers: ['v8.ui-sticky-highlight-slot'],
		},
		jump: {
			// v8.ui-chip-select-swap S22, frame 0 = f2922 (the tap dot, v8.cursor-tap-ripple, is 5 f earlier, f2917:
			// tapAt): the selection jumps from chip 1 to the tapped chip 3 in one picture at f2924 (frame 2, 7 f after
			// the dot): chip 1 fill luma 80 -> 32, chip 3 38 -> 87.5 on the dark card (the selected fill is ink at (87.5 - 35) / (245 - 35) = 0.25 over the
			// unselected one); the result grid empties and the count label swaps in the same picture
			motions: {},
			params: {at: 2, tapAt: -5, selAlpha: 0.25},
			covers: ['v8.ui-chip-select-swap'],
		},
		hop: {
			// v5.ui-selector-frame-hop S22 (the frame's size at the hops is not measured: 400 px wide is its
			// drop-in): the selector frame hops from the middle
			// thumbnail to the right one, 61.0 -> 77.05% W in 14 f from f3383, blurred f3385-f3390 (the hop-2 shape,
			// inOutWhip5, at 22 f has a 14 f 2% window starting at its frame 4), and 27 f later two thumbnails left,
			// 77.05 -> 40.51% W (the curve, 2% start f3410 = frame 31, its token frame 8 -> delay 23), blurred
			// f3417-f3425 (v5 shutter 0.58 f, as CursorPath)
			motions: {hop1: motion(22, EASE.inOutWhip5), x: measured('v5.ui-selector-frame-hop', 23)},
			params: {x0: 61.0, x1: 77.05, x2: 40.51, shutter: 0.58},
			reproduces: {x: ['v5.ui-selector-frame-hop']},
		},
	},
	demoFrames: 80,
	demoTone: 'light',
};
