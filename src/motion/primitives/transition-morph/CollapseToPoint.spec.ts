import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Frame 0 is the first frame of the variant's first motion token (60 fps). v1-v4 px are of a 1920x1080
// picture (px at 1080 as read); v5-v8 px of 1622x918: % W = px / 16.22, % H = px / 9.18. Values after
// `layout:` are the measured arrangement the Demo uses; the component collapses whatever it is given.

export const spec: PrimitiveSpec = {
	name: 'CollapseToPoint',
	kind: 'shape',
	description:
		'A group folds into one point or one cell: a plane wraps into a globe and shrinks to a dot, cells shrink into the centre one by one, rings fold inward step by step, a glowing blob implodes, merged shapes shrink to nothing.',
	defaultVariant: 'cellsInward',
	variants: {
		cellsInward: {
			// v3.shape-hex-collapse: the centre cell eases 1.00 -> 0.90 (188 -> 169 px, the curve; token start
			// f1198); the six outer cells, counter-clockwise from the upper right, start 3 f apart from f1199
			// (+1 f): each scales 1 -> 0 about a point 61 px from the centre-cell centre on its axis (0.298 of
			// the 204.5 px pitch; centre distance 204.5 -> 118.5 px at scale 0.40, its last visible size,
			// then hidden under the centre cell), on the gather's ease-in-out shape over about 14.6 f (best
			// token inOutGlide 12 f). layout: flat-top hexagons 188 x 170 px round (50.0% W, 35.1% H)
			motions: {scale: measured('v3.shape-hex-collapse'), cell: motion(12, EASE.inOutGlide, 1)},
			params: {stepGap: 3, toScale: 0.8994, pivot: 0.298, pitch: 204.5, cellW: 188, cellH: 170, x: 50.0, y: 35.1},
			reproduces: {scale: ['v3.shape-hex-collapse']},
		},
		sphereWrap: {
			// v2.trans-sphere-collapse: the whole field shrinks into a point at the frame centre (the curve:
			// size 1 -> 0, centre magnification, then the square root of the covered area; token start f99)
			// while it wraps into a globe: its outline curls from the frame into a disc, the sides first, round
			// from f108 (+9 f; the curl's own pace is not measured: linear); the
			// last dot (0.013) vanishes at f114 (+15 f) and the next layout appears in that same frame
			motions: {scale: measured('v2.trans-sphere-collapse'), wrap: motion(9, linear)},
			params: {cut: 15},
			reproduces: {scale: ['v2.trans-sphere-collapse']},
		},
		ringFold: {
			// v4.particle-ring-collapse: the centre cell grows 59 -> 106.6 px (x1.807, the curve; token start
			// f1379) and the surviving cells grow with it (median width 58 -> 102 px: x1.76), the lattice
			// opening with them (ring-2 corners at 205 px = 2 pitches, edges at 183 px = 1.73 pitches at
			// f1424-f1427, ring 1 at 117 px at f1435); the outermost ring folds at each step, f1396 / 1409 /
			// 1419 / 1427 / 1436 (+17 / 30 / 40 / 48 / 57 f): its cells move into the next ring inward (ring 1:
			// 117 -> 56 px from the centre, 0.48) while they shrink to a dot (88 -> 5 px: 0.06) in 9 f (not
			// fitted: the radial flow peaks 2-4 f into each step: inOutWhip), then vanish. layout: cells 58 px
			// at a rest pitch of 73 px (104 px at f1424 over the growth x1.43 the curve has reached there)
			motions: {scale: measured('v4.particle-ring-collapse'), fold: motion(9, EASE.inOutWhip)},
			params: {steps: '17 30 40 48 57', centreTo: 1.807, cellTo: 1.76, inward: 0.48, dot: 0.06, cell: 58, pitch: 73},
			reproduces: {scale: ['v4.particle-ring-collapse']},
		},
		meltImplode: {
			// v5.trans-melt-implode: the layer blooms toward white (frame luma 41.4 -> 143.8 = a 0.48 white
			// wash, ease-in over 10 f: 47.4 / 65.6 / 95.7 at +3 / +5 / +7 f, best token inGentleOver); from
			// f3915 (+10 f) it is one glowing blob on a dark frame that collapses onto the frame centre (the
			// curve: RMS radius of the bright core 26.82% W -> 0.06% W, the layer scaled by it)
			// and turns clockwise -7.1 -> +29.1 deg over its first 5 f (UNCERTAIN, 3 pictures: linear); the
			// next scene shows from f3937 (+32 f)
			motions: {bloom: motion(10, EASE.inGentleOver), scale: measured('v5.trans-melt-implode', 10), spin: motion(5, linear, 10)},
			params: {wash: 0.48, radius: 26.82, toRadius: 0.06, spin: 36.2, cut: 32},
			reproduces: {scale: ['v5.trans-melt-implode']},
		},
		blobMerge: {
			// v5.logo-sphere-drop-merge: from f1462 (frame 0, all three spheres in) the stack drops onto its
			// target, decelerating: blob centre relative to where it vanishes (dx, dy px of 918: 110,-268 /
			// 59,-173 / 21,-110 / -7,-99 / -26,-60 / -27,-42 / -17,-31 / -3,-20 / 0,0 at f1462 / 1465 / 1467 /
			// 1470 / 1472 / 1475 / 1477 / 1480 / 1482); the spheres stack into one blob by f1470 (+8 f;
			// total area constant meanwhile; how they close up is not measured: linear); from f1470 the blob
			// shrinks to a point (the curve: area 30.23k -> 0 px, so its size goes as the square root) and is
			// gone at f1485, uncovering what is under it. layout: sphere 9.4k px area = 128.7 px across at 1080
			motions: {area: measured('v5.logo-sphere-drop-merge', 8), stack: motion(8, linear)},
			params: {
				pathX: '0:6.78 3:3.64 5:1.29 8:-0.43 10:-1.6 13:-1.66 15:-1.05 18:-0.18 20:0',
				pathY: '0:-29.19 3:-18.85 5:-11.98 8:-10.78 10:-6.54 13:-4.58 15:-3.38 18:-2.18 20:0',
				sphere: 128.7,
			},
			reproduces: {area: ['v5.logo-sphere-drop-merge']},
		},
		clusterSnap: {
			// v8.particle-mascot-converge: every element moves straight to the centre, all together, on an
			// ease-in that ends at full speed (the curve: outermost centre distance 1390 -> 0 px; token start
			// f2603); the merged cluster then snaps down 224 -> 152 / 109 / 83 / 69 / 40 px (1 / 0.679 / 0.487
			// / 0.371 / 0.308 / 0.179) at f2623 / 2624 / 2626 / 2628 / 2630 / 2632 (+20 f; ease-out, not
			// fitted: these pictures) into one small element at (49.7% W, 50.6% H)
			motions: {scale: measured('v8.particle-mascot-converge')},
			params: {snap: '20:1 21:0.679 23:0.487 25:0.371 27:0.308 29:0.179', x: 49.7, y: 50.6},
			reproduces: {scale: ['v8.particle-mascot-converge']},
		},
	},
	demoFrames: 100,
	demoTone: 'light',
};
