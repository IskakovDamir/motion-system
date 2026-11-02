import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Positions and sizes in % of frame width (x) and height (y) (v7 pictures are 1622 x 918; a % is the
// same on any frame). Frames from the variant's frame 0. shutter: frames of travel smeared into one
// picture where the rows note motion blur: v7 "half the travel to the next picture at 24 fps" = 1.25 f
// (as cards/EdgeEnter).

export const spec: PrimitiveSpec = {
	name: 'DragDrop',
	kind: 'ui',
	description:
		'Items are dragged and dropped: a file is carried along a path and shrinks into its target, outline copies travel as one grid, a selected block is dragged out accelerating, a dropped strip docks and splits into clips, or clips butt together and gaps open.',
	defaultVariant: 'carryIn',
	variants: {
		carryIn: {
			// v7.cursor-drag-file-in S23, frame 0 = f2741: the chip and the cursor come in from the bottom edge on a
			// straight diagonal, the name pill's centre (33.42, 93.30)% (542, 856.5 px) -> (54.25, 53.38)% (880, 490
			// px), +20.8% W / -39.9% H (the curve is y, x rides the same progress), ~38 px/f at entry with motion
			// blur to ~f2756. The chip's own centre ends at (50.4, 53.2)% and it shrinks to nothing about it,
			// slow-fast-slow (.i2: 2% start f2771 = frame 30, its token frame 6 -> delay 24); gone from f2794
			// (frame 53). The target folder presses as the chip goes in: width 246 -> 236 -> 198 px over
			// f2780-f2784 (1 -> 0.805 in 4 f from frame 39, fit inGentleOver), 0.862 by f2794 (10 f, linear), and
			// springs back as the chip is gone (0.988 f2796, 1.004 f2799: 5 f from frame 53, fit outStrongOver).
			// The cursor holds the chip by its name pill (the grip the caller gives; not measured)
			motions: {
				y: measured('v7.cursor-drag-file-in'),
				drop: measured('v7.cursor-drag-file-in.i2', 24),
				press: motion(4, EASE.inGentleOver, 39),
				creep: motion(10, linear, 43),
				release: motion(5, EASE.outStrongOver, 53),
			},
			params: {fromX: 33.42, fromY: 93.3, toX: 54.25, toY: 53.38, dropX: 50.4, dropY: 53.2, goneAt: 53, pressTo: 0.805, creepTo: 0.862, shutter: 1.25},
			reproduces: {y: ['v7.cursor-drag-file-in']},
		},
		ghostTrail: {
			// v7.ui-ghost-drag-to-timeline S16-S17, frame 0 = f2060: thin outline copies of the selected items appear
			// around them in one picture (f2061, frame 1) with a slight lift of the whole window, hold 5 f, then
			// travel as one grid, right first and then down: x +15.91% W (the curve, 2% start f2064 = its token
			// frame 4 -> delay 0), y +44.92% H in all (.i2, 2% start f2066 -> delay 6; across the punch-in, its
			// tail in close-up units), and vanish in one picture with the lift (f2116, frame 56). Boxes 12.1% W x
			// 19.6% H (f2076) on the thumbnail pitch 197.5 x 197 px = 12.18% W x 21.46% H; outline +27 luma and
			// fill +8 luma over the 18.7 background = white at 0.116 / 0.035; lift +2.9 luma on the 25.4 timeline
			// = white at 0.0126. The top-right box rests at (975.5, 276.5) px = (60.14, 30.12)%. The outlines are "thin" (width not measured): lineW is a hairline
			motions: {x: measured('v7.ui-ghost-drag-to-timeline'), y: measured('v7.ui-ghost-drag-to-timeline.i2', 6)},
			params: {
				topRightX: 60.14,
				topRightY: 30.12,
				travelX: 15.91,
				travelY: 44.92,
				appearAt: 1,
				goneAt: 56,
				boxW: 12.1,
				boxH: 19.6,
				pitchX: 12.18,
				pitchY: 21.46,
				cols: 3,
				outline: 0.116,
				fill: 0.035,
				lift: 0.0126,
				lineW: 2,
			},
			reproduces: {x: ['v7.ui-ghost-drag-to-timeline']},
		},
		dragOut: {
			// v7.ui-drag-group-out S13, frame 0 = f1598 (the curve's 2% start f1606 is its token frame 8): the
			// selected grid (25 tiles, one block) slides right accelerating, left edge 19.05 -> 53.82% W (the
			// curve, to the last trackable picture f1636), +33 px down while it moves +289 px right (to f1629):
			// 0.2018 % H per % W; pure translation; it keeps its exit speed past the window border (f1641) and
			// leaves; growing horizontal motion blur (3 -> 62 px per frame)
			motions: {x: measured('v7.ui-drag-group-out')},
			params: {fromX: 19.05, toX: 53.82, slopeY: 0.2018, cols: 5, shutter: 1.25},
			reproduces: {x: ['v7.ui-drag-group-out']},
		},
		stripDock: {
			// v7.ui-clip-strip-slide-in S17, frame 0 = f2126: the dropped clips arrive as one continuous strip from
			// beyond the right edge, left end 96.8 -> 27.46% W in close-up window units (the curve, docked f2146);
			// from f2150 (frame 24, 5 f after the dock) every bar's right end retracts at once, opening each gap
			// to 54.6 px of 1622 = 3.37% W in 6 f (44% at f2151, 87% at f2155, 98% at f2156; fit outSoft4, rmse
			// 0.05); the bars' left ends and the clip pitch stay
			motions: {x: measured('v7.ui-clip-strip-slide-in'), split: motion(6, EASE.outSoft4, 24)},
			params: {fromX: 96.8, toX: 27.46, gap: 3.37},
			reproduces: {x: ['v7.ui-clip-strip-slide-in']},
		},
		rippleEdit: {
			// v7.ui-clip-ripple-edit S17, frame 0 = f2181, px of 1622 at the x0.40 framing: the strip starts with the
			// split's gaps (20-23 px: 21 = 1.29% W); the first widens to 87 px (5.36% W) under the cursor in 5 f
			// (values only: linear); the gaps right of it close, the clips butting together, from f2186 (frame 5)
			// in 2-3 pictures (3 f; ease not fitted: outFirm), the last ones by f2199 (stagger (2199 - 2189) / 3 =
			// 3.3 f over 4 gaps; the widened one closes with the last: the strip is whole again by f2202); later
			// two gaps open by the clips right of them sliding right: 0 -> 76 px (4.69% W) from f2221 (frame 40) and 0 -> 102 px (6.29% W) 9 f later (frame 49), each outStrong2 19 f (a
			// shared fit to the 14 readings, rmse 0.043). left: the strip's left end at this framing, 251 px of 1622
			// (v7.ui-clip-strip-slide-in's rest on screen)
			motions: {
				widen: motion(5, linear),
				close: motion(3, EASE.outFirm, 5),
				openA: motion(19, EASE.outStrong2, 40),
				openB: motion(19, EASE.outStrong2, 49),
			},
			params: {left: 15.47, startGap: 1.29, widenTo: 5.36, gaps: 5, closeStagger: 3.3, openTo: '4.69 6.29'},
			covers: ['v7.ui-clip-ripple-edit'],
		},
	},
	demoFrames: 60,
	demoTone: 'dark',
};
