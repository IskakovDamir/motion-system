import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// pattern: where the units sit and in which order they spawn. Every unit gets the variant's pop at
// its own offset. Px are at 1080 (v1-v4 as read; v8's 1622x918 picture converted to % W).

export const spec: PrimitiveSpec = {
	name: 'SpawnField',
	kind: 'shape',
	description:
		'Many elements appear by a spawn pattern, each with the same small pop: one by one in reading order, as opposite pairs around a ring, on a radial front, at random spots, at the edges of a growing lattice, or in radial bursts.',
	defaultVariant: 'radialFront',
	variants: {
		radialFront: {
			// v2.grid-hex-radial-pop: a honeycomb of touching 147 x 133 px cells fills the frame from one cell
			// at (51.6% W, 55.0% H); a radial front at a constant 19.6 px/f (1.02% W per frame, +-2.1 f rms
			// jitter per cell) starts each cell's pop (first visible frame = 4.05 + 0.0509 x distance in px;
			// the first cell shows at f7, 2.95 f behind that law, so later cells start 2.95 f sooner relative
			// to it); opacity on the curve, scale 0.59 -> 1 one frame later (79, 104, 116 ... 133 px: outStrong, 7 f)
			motions: {opacity: measured('v2.grid-hex-radial-pop'), scale: motion(7, EASE.outStrong, 1)},
			params: {pattern: 'honeycomb', fromScale: 0.59, cellW: 147, cellH: 133, originX: 51.6, originY: 55.0, frontSpeed: 1.02, firstLag: 2.95, jitter: 2.1},
			reproduces: {opacity: ['v2.grid-hex-radial-pop']},
		},
		readingOrder: {
			// v1.icon-stagger-pop-in: 8 icons, upper four then lower four, left to right, 3 f apart; opacity
			// on the curve, scale 0.68 -> 1 from the first visible frame (0.78, 0.86, 0.90, 0.93 ... in 9 f)
			motions: {opacity: measured('v1.icon-stagger-pop-in'), scale: motion(9, EASE.outStrong, 1)},
			params: {pattern: 'grid', columns: 4, stagger: 3, fromScale: 0.68},
			reproduces: {opacity: ['v1.icon-stagger-pop-in']},
		},
		gridOrder: {
			// v2.icon-stagger-pop-in: a centred 2-row grid in reading order every 3.6 f (4, 4, 3, 4, 3 ... f);
			// opacity on the curve, scale 0.50 -> 0.96 in 10 f from the first visible frame, then a creep to
			// 1.00 over 30 f (0.97 at +10, 0.98 at +15, 0.99 at +22, 1.00 at +30: nearly even)
			motions: {opacity: measured('v2.icon-stagger-pop-in'), scale: motion(10, EASE.outStrong, 1), creep: motion(30, linear, 11)},
			params: {pattern: 'grid', rows: 2, stagger: 3.6, fromScale: 0.5, midScale: 0.96},
			reproduces: {opacity: ['v2.icon-stagger-pop-in']},
		},
		ringPairs: {
			// v2.icon-ring-pop-in: icons on an ellipse pop as diametrically opposite pairs in a clockwise sweep
			// from 3 and 9 o'clock, 1.57 f per pair; scale 0.585 -> 0.995 (= rest) and opacity from about 0.09
			// (ink / scale^2 at the first visible frame) on the same progress. The ellipse (semi-axes 37.9% W x
			// 33.7% H) is the ring the same icons ride in v2.icon-ring-orbit
			motions: {scale: measured('v2.icon-ring-pop-in'), opacity: measured('v2.icon-ring-pop-in')},
			params: {pattern: 'ring', rx: 37.9, ry: 33.7, stagger: 1.57, fromScale: 0.588, fromOpacity: 0.09},
			reproduces: {scale: ['v2.icon-ring-pop-in']},
		},
		randomScatter: {
			// v2.particle-hex-scatter-pop: births at random spots, alternating top and bottom band, gaps 2, 1 f
			// (one every 1.5 f); each scales 0.46 -> 1 (curve) while its fill goes 237 -> 17 on a 250 page
			// (opacity 0.056 -> 1: 0.45, 0.67, 0.79, 0.88 ... in 9 f); sizes 146-207 px
			motions: {scale: measured('v2.particle-hex-scatter-pop'), opacity: motion(9, EASE.outStrong2)},
			params: {pattern: 'scatter', stagger: 1.5, fromScale: 0.46, fromOpacity: 0.056, minSize: 146, maxSize: 207},
			reproduces: {scale: ['v2.particle-hex-scatter-pop']},
		},
		latticeGrow: {
			// v1.grid-hex-network-grow: lattice cells added around the centre mark, inner ring right, left,
			// lower-left, upper-left, lower-right, upper-right at +0 / 5 / 8 / 11 / 13 / 16 f, the next ring from
			// +18 f about every 1.8 f (f143, 145, 147, 148, 150, 152); each fades in on the curve while it
			// scales 0.7 -> 1 in 6 f from its first visible frame (0.72, 0.82, 0.89, 0.94, 0.97 ...); 10-11 f
			// later a line draws in 2 f from every neighbour already there across the gap between the badges
			// (0.24 of the cell width)
			motions: {opacity: measured('v1.grid-hex-network-grow'), scale: motion(6, EASE.outFirm, 1), line: motion(2, linear, 10)},
			params: {pattern: 'lattice', fromScale: 0.7, ring1: '0 5 8 11 13 16', ring2Start: 18, ring2Step: 1.8, lineGap: 0.24},
			reproduces: {opacity: ['v1.grid-hex-network-grow']},
		},
		burstRing: {
			// v8.particle-mascot-burst-ring (burst 2, the curve): the field's outermost centre distance goes
			// 1125 -> 1386 px of 1622 (69.4% -> 85.4% W) with an ease-in and an overshoot (+3.5%) while every
			// element shrinks 105 -> 59 px (6.47% W, x0.562); 12 new ones appear in one picture 16-18 f in
			// (10 -> 17 -> 21 -> 22) at inner positions
			motions: {radius: measured('v8.particle-mascot-burst-ring'), scale: measured('v8.particle-mascot-burst-ring'), appear: motion(2, linear, 16)},
			params: {pattern: 'burst', fromExtent: 69.4, toExtent: 85.4, fromSize: 6.47, shrink: 0.562, firstCount: 10},
			reproduces: {radius: ['v8.particle-mascot-burst-ring']},
		},
	},
	demoFrames: 120,
	demoTone: 'light',
};
