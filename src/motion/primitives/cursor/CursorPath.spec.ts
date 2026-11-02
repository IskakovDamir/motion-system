import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Positions in % of frame width (x) and height (y); v5-v8 pictures are 1622 x 918, so a % is the
// same on any frame. path: measured points as offsets from the rest point (to*) or, for an exit, from
// the start point (from*). anchor: the pointer point the rows tracked (template / ink centre, or tip).
// look: the pointer the rows describe (2D arrow: flat; 3D pointer or beveled arrow: solid3d).
// shutter: frames of travel smeared into one picture (motion blur), only where the rows note blur:
// v7 "half the travel to the next picture at 24 fps" = 1.25 f (as cards/EdgeEnter); v5 from
// v5.cursor-fly-in's first picture: a 152 px wide streak at luma > 40 against the ~97 px (6% W) arrow
// at 95 px/f in x (f1835 -> f1837) = 55 / 95 = 0.58 f.
// cursorH / cursorW: the pointer size where a row measures it (% H tall / the 3D arrow's size, ~% W).
// look solid3d draws the 3D pointer as the references do: a notched arrowhead, extruded.
// tilt: CSS degrees (negative = counter-clockwise).

export const spec: PrimitiveSpec = {
	name: 'CursorPath',
	kind: 'ui',
	description:
		'A pointer travels on its own: it flies in from beyond an edge and decelerates onto a target, glides between targets (thrown fast and eased out, or in-out), winds up and swoops, or accelerates off the frame.',
	defaultVariant: 'flyUp',
	variants: {
		flyUp: {
			// v7.cursor-fly-in S12: the small 3D pointer flies up 329 px (35.8% H) and left 87 px (5.4% W) onto
			// its target, decelerating (72 / 81 / 54 / 34 / 30 / 24 / 16 / 11 / 6 / 1 px per picture); the curve is y,
			// x rides the same progress (only the two ends are measured: a straight line); blurred on its
			// first picture (f1489). S22 / S30 (a 2D arrow in 3 pictures, a 3D pointer turning) are the same move.
			motions: {y: measured('v7.cursor-fly-in')},
			params: {fromX: 5.4, fromY: 35.8, look: 'solid3d', anchor: 'tip', shutter: 1.25},
			reproduces: {y: ['v7.cursor-fly-in']},
		},
		diagonalIn: {
			// v5.cursor-fly-in S14: the beveled 3D arrow (~6% W) from beyond the bottom-right corner along a
			// near-straight diagonal, (86.9, 91.6) f1835 -> (75.2, 82.7) f1837 -> (69.9, 78.8) f1840 ->
			// (66.9, 76.9) f1842 -> (65.0, 75.8) f1845 -> (63.9, 75.3) f1847 -> (63.1, 75.2) f1850 -> rest
			// (62.6, 75.3)%, 26.0% W long; the curve is the distance along it. Tilt counter-clockwise 30 deg
			// (f1835-f1837) -> 24 (f1840) -> 14 (f1845) -> 8 (f1850) -> 4 (f1857) -> 0 (f1860): 25 f, ease not
			// fitted (closest token inOutGlideOver, rmse 0.067). Motion-blurred streak on its first picture
			motions: {progress: measured('v5.cursor-fly-in'), tilt: motion(25, EASE.inOutGlideOver)},
			params: {
				path: '24.3,16.3 12.6,7.4 7.3,3.5 4.3,1.6 2.4,0.5 1.3,0 0.5,-0.1 0,0',
				toX: 62.6,
				toY: 75.3,
				tilt: -30,
				cursorW: 6,
				look: 'solid3d',
				anchor: 'centre',
				shutter: 0.58,
			},
			reproduces: {progress: ['v5.cursor-fly-in']},
		},
		dive: {
			// v5.cursor-3d-dive-click S08: the chunky 3D arrow dives onto the button, x 88.78 -> 54.57% W (the
			// curve) and y 18.5 -> 50.9% H on the same 15 f (only the ends are measured: a straight line).
			// The hover and spin before it (3D turns, not fitted) and the press after it are not measured here
			motions: {x: measured('v5.cursor-3d-dive-click')},
			params: {fromX: 88.78, fromY: 18.5, toX: 54.57, toY: 50.9, look: 'solid3d', anchor: 'centre'},
			reproduces: {x: ['v5.cursor-3d-dive-click']},
		},
		throw: {
			// v7.cursor-glide S14: thrown from a target, 710 px along a curve (down first, then right) to rest,
			// window-relative at the f1690 framing: (36.04, 41.82) -> (70.16, 82.63)%; the path is the template
			// track (577, 381.5) f1731 -> (591, 413.5) f1734 -> streak centroids (672, 543) / (836, 685) / (946, 737)
			// f1736-f1742 -> (1019, 763) f1744 -> ... -> (1178, 796) px f1761 with the push-in taken out
			// (O = (816, 457), scale 1.033 -> 1.124 across f1731-f1761), as offsets from rest; the curve is the
			// length along it (its y leads x by 8-9 f, which the path shape gives). Streaks on the fastest pictures
			motions: {progress: measured('v7.cursor-glide')},
			params: {
				path: '-34.12,-40.81 -33.16,-37.40 -28.32,-23.91 -18.69,-9.36 -12.34,-4.24 -8.18,-1.77 -5.43,-1.02 -3.47,-0.60 -2.04,-0.38 -1.13,-0.35 -0.17,-0.11 0,0',
				toX: 70.16,
				toY: 82.63,
				look: 'flat',
				anchor: 'centre',
				shutter: 1.25,
			},
			reproduces: {progress: ['v7.cursor-glide']},
		},
		glideClick: {
			// v5.cursor-glide-click S20: glides from a card down to the send button, y 55.2 -> 92.7% H (the curve,
			// in-out) with x 68.6 -> 80.9% W on the same progress. Variant frame F is f3185 + F - 5 (the curve's
			// 2% start is its token frame 5). Press: scale 1 -> 0.70 (the .i2 curve) from f3210 (frame 30), held
			// 2 pictures (f3215-f3217), back to 1.00 by f3225 (8 f from frame 37; ease not fitted: outFirm).
			// S21 exit: (80.9, 92.8) -> (99.9, 54.2)% from f3258 (frame 78) in 14 f, accelerating (ease not
			// fitted: inAccelerate), gone from f3275 (frame 95)
			motions: {
				y: measured('v5.cursor-glide-click'),
				press: measured('v5.cursor-glide-click.i2', 30),
				release: motion(8, EASE.outFirm, 37),
				exit: motion(14, EASE.inAccelerate, 78),
			},
			params: {fromX: 68.6, fromY: 55.2, toX: 80.9, toY: 92.7, pressTo: 0.7, exitX: 99.9, exitY: 54.2, goneAt: 95, look: 'flat', anchor: 'centre'},
			reproduces: {y: ['v5.cursor-glide-click']},
		},
		windUp: {
			// v5.cursor-swoop S14: the parked 3D arrow (~6% W) winds up from 62.79% W (f1860) to 61.56 (f1867):
			// -1.23% W in 7 f (0.24 / 0.43 / 1.23 at +2 / +5 / +7 f, fit inAccelerate2), then swoops right and up
			// (the curve, x 62.79 -> 88.01% W from f1870 = frame 10) through (74.8, 53.4) f1875 and (83.1, 47.6)
			// f1880 to (88.0, 42.8)%; the wind-up is let go as the swoop progresses. Tilts clockwise up to ~40-60
			// deg in flight (50, the middle) and lands upright (f1887-f1892): the tilt follows the speed (peak
			// ~52 px/f)
			motions: {wind: motion(7, EASE.inAccelerate2), x: measured('v5.cursor-swoop', 10)},
			params: {
				path: '62.8,75.7 74.8,53.4 83.1,47.6 88.0,42.8',
				fromX: 62.79,
				toX: 88.01,
				windX: -1.23,
				tiltMax: 50,
				cursorW: 6,
				look: 'solid3d',
				anchor: 'centre',
			},
			reproduces: {x: ['v5.cursor-swoop']},
		},
		constant: {
			// v8.cursor-glide S16: an arrow glides at near-constant speed (16-18 px/f) on a path bending from
			// up-left to left, no click: (1313, 896) f1997 -> (1288, 859) f1998 -> (1262, 834) f2000 -> (1234, 816)
			// f2002 -> (1174, 795) f2006 -> (1142, 790) f2008 -> (1110, 789) px f2010 = 80.9 -> 68.4% W,
			// 97.6 -> 85.9% H (242 px in 13 f, linear along the path), as offsets from the last point
			motions: {progress: motion(13, linear)},
			params: {path: '12.52,11.66 10.97,7.63 9.37,4.90 7.64,2.94 3.95,0.65 1.97,0.11 0,0', toX: 68.43, toY: 85.95, look: 'flat', anchor: 'centre'},
			covers: ['v8.cursor-glide'],
		},
		flyOut: {
			// v7.cursor-fly-out S30: the 3D pointer accelerates off right and up: (1064, 517) f3676 -> (1094, 516)
			// f3679 -> (1178, 504) f3681 -> (1308, 481) f3684 -> (1497, 416) px f3686 (10 / 42 / 44 / 100 px per
			// frame), as offsets from the start (65.60, 56.32)%; length along the path 0 / 0.07 / 0.26 / 0.55 / 1
			// at +0 / 3 / 5 / 8 / 10 f (fit inAccelerate2, rmse 0.034); it keeps its last speed past the
			// measured end and leaves the frame; smeared (the tumble is not measured)
			motions: {progress: motion(10, EASE.inAccelerate2)},
			params: {path: '0,0 1.85,-0.11 7.03,-1.42 15.04,-3.92 26.70,-11.00', fromX: 65.6, fromY: 56.32, look: 'solid3d', anchor: 'centre', shutter: 1.25},
			covers: ['v7.cursor-fly-out'],
		},
	},
	demoFrames: 60,
	demoTone: 'light',
};
