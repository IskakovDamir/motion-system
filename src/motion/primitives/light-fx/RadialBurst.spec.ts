import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Pixels of v5 and v7 are of a 1622x918 picture: % W = px / 16.22; px at 1080 = px x 1080 / 918.

export const spec: PrimitiveSpec = {
	name: 'RadialBurst',
	kind: 'fx',
	description:
		'Elements burst out radially from a point and expand past the frame edges while fading: glowing square tiles, concentric outline copies, soft shockwave rings, angular shards, a ring band of halftone dots.',
	defaultVariant: 'tileRing',
	variants: {
		tileRing: {
			// v5.particle-tile-burst S08: ring radius 0 -> 54.9 % W (past the frame edges) in 15 f; frame luma
			// 16.9 -> 74.2 -> 21.1 at f1105, 10 f after the ring's last in-frame picture (f1095): a tile fades
			// in those 10 f once the ring has passed it; tile luma 214-236 (S20) = 0.88; tiles 20-40 px
			// (the same glowing tiles in v5.fx-pixel-sweep S11) = 23.5-47 px at 1080
			motions: {radius: measured('v5.particle-tile-burst'), fade: motion(10, linear)},
			params: {toRadius: 54.9, tilePeak: 0.88, tileMin: 23.5, tileMax: 47},
			reproduces: {radius: ['v5.particle-tile-burst']},
		},
		echoZoom: {
			// v5.ui-ring-burst: 8-10 concentric rounded-square outlines; the outermost grows from the button
			// (124 px = 146 px at 1080) to x8.82 (1094 px) by +12 f, ease-in to a constant x1.22 per frame,
			// and leaves the frame at that rate; outer rings turn 0 -> 17 deg clockwise by f1672 (+19 f)
			motions: {scale: measured('v5.ui-ring-burst'), twist: motion(19, EASE.inOutGlide)},
			params: {count: 9, size: 146, toScale: 8.82, exitRate: 1.22, twist: 17},
			reproduces: {scale: ['v5.ui-ring-burst']},
		},
		shockRings: {
			// v5.shape-shockwave-ring: rings born at the centre every 17-19 f, expanding linearly:
			// 0 -> 52.2 % W in 12 f; +18.7 f: 0 -> 55.5 % W in 9 f; +17.4 f: 0 -> 41.3 % W in 7 f
			motions: {ring1: motion(12, linear), ring2: motion(9, linear, 18.7), ring3: motion(7, linear, 36.1)},
			params: {count: 3, ring1To: 52.2, ring2To: 55.5, ring3To: 41.3},
			covers: ['v5.shape-shockwave-ring'],
		},
		shardSpray: {
			// v7.particle-shard-burst: 5-11 shards fly out from the centre, radius 300-470 px (18.5-29.0 % W)
			// -> 500-700 px (30.8-43.2 % W) and area x2.5-7 (size x1.58-2.65) in 20 f; light while the
			// frame is inverted, dark after the polarity flips back at f151 (+12 f)
			motions: {fly: motion(20, EASE.outFirm)},
			params: {count: 8, fromMin: 18.5, fromMax: 29.0, toMin: 30.8, toMax: 43.2, growMin: 1.58, growMax: 2.65, flipAt: 12},
			covers: ['v7.particle-shard-burst'],
		},
		dotRing: {
			// v7.bg-halftone-ring-burst: a soft band over a static square dot grid (pitch 14.5 px = 0.89 % W);
			// inner edge 152 px = 9.4 % W -> 856 px = 52.8 % W, the outer edge 1.52x the inner (242 / 152,
			// 386 / 264, 590 / 388, 854 / 573); soft inner edge 10 % -> 90 % over 100-250 px (175 px =
			// 10.8 % W); the dots darken the band by up to 6 luma (S36) = 0.024; no fade while in frame
			motions: {progress: measured('v7.bg-halftone-ring-burst')},
			params: {fromRadius: 9.4, toRadius: 52.8, outerRatio: 1.52, pitch: 0.89, soft: 10.8, deficit: 0.024},
			reproduces: {progress: ['v7.bg-halftone-ring-burst']},
		},
	},
	demoFrames: 80,
	demoTone: 'dark',
};
