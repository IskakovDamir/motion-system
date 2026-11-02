import type {PrimitiveSpec} from '../types';

// The rig of v5.shape-halftone-orbit-rings: three rings (radius 567 / 582 / 565 px = 35.0 / 35.9 / 34.8 % W; centred at
// the mean of their fitted centres, (50.6, 51.1) %) whose planes are 50 / 68 / 90 deg apart (A-B / A-S / B-S), each plane's
// normal 54-59 deg from the spin axis; the axis is 51 deg from the view axis, its screen projection 28 deg from vertical
// (upper left to lower right). The normals (polar angle from the axis, azimuth) and the rig angle at frame 0 are fitted to
// those plane angles and to the measured ellipse ratios (S 0.92 -> 0.48 -> 0.15 at f205 / f240 / f268, B 0.09 -> 0.33
// (f233) -> edge-on (f260-f268), A edge-on f228-f235 -> 0.15 -> 0.64) within 0.07: A (59.2, 0), B (125.5, 120.4),
// S (53.4, 180.4) deg, the axis's upper end leaning away from the viewer, rig angle 108.4 deg at f205, so 84.7 deg at
// f190, the rig's first picture (frame 0). The fit also gives the measured on-screen turn of the major axes (S 59 -> 107
// deg against 62 -> 106, B 119 -> 196 against 132 -> 199, A 28 -> 51 against 19 -> 58, f205-f268).
const rig = {
	radiusA: 35.0,
	radiusB: 35.9,
	radiusS: 34.8,
	centerX: 50.6,
	centerY: 51.1,
	axisTilt: 51,
	axisScreen: 28,
	axisAway: true,
	polarA: 59.2,
	azimuthA: 0,
	polarB: 125.5,
	azimuthB: 120.4,
	polarS: 53.4,
	azimuthS: 180.4,
	phase: 84.7,
};

export const spec: PrimitiveSpec = {
	name: 'OrbitRig',
	kind: '3d',
	description:
		'A rig of rings orbits a centre as one rigid unit: halftone-dot circles spin about a tilted axis, passing in front of and behind the content, or a faint wireframe of orbit ellipses tumbles behind it.',
	defaultVariant: 'rigidSpin',
	variants: {
		rigidSpin: {
			// v5.shape-halftone-orbit-rings: the rig spins as one rigid unit about its fixed axis at a constant 1.58 deg per
			// frame (rigid fit, f205-f268), passing in front of and behind the content; each ring a dotted band 1.1-1.7 % W wide
			// (1.4) with a dot pitch of 0.74-0.88 % W (0.81)
			motions: {},
			params: {...rig, degPerFrame: 1.58, band: 1.4, pitch: 0.81},
			covers: ['v5.shape-halftone-orbit-rings'],
		},
		tumble: {
			// v5.bg-orbit-wireframe-tumble: the same atom-orbit motif as faint thin strokes (luma 5-25 on a 0-15 ground: about
			// +20 of 255, 0.08) behind the content, tumbling the whole time: no single rotation fits, the stroke axes turn
			// 0.5-1.2 deg per frame in different senses (two rotations at those rates)
			motions: {},
			params: {...rig, opacity: 0.08, rateA: 1.2, rateB: 0.5},
			covers: ['v5.bg-orbit-wireframe-tumble'],
		},
	},
	demoFrames: 120,
	demoTone: 'dark',
};
