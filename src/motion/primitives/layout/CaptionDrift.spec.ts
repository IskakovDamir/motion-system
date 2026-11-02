import type {PrimitiveSpec} from '../types';

// Pixels: v5 is 1622x918 (% of that picture); velocities in % of frame width / height per 60 fps frame.
// The caption's lines (text split at \n) stand like stairs: line i is indented by the sum of the first i
// values of stepX (% W; a list gives one step per line, the last one holding), baselines pitch % H apart.
// The whole block slides velocityX / velocityY per frame from frame 0 on, with no ease, away from the
// direction its lines step. Type: the caption role with the measured weight and cap height.

export const spec: PrimitiveSpec = {
	name: 'CaptionDrift',
	kind: 'layout',
	description: 'Caption lines stand offset like stairs and the whole block slides at a constant velocity for its whole life, away from the direction its lines step.',
	defaultVariant: 'stairDrift',
	variants: {
		stairDrift: {
			// v5.text-caption-drift S06 caption 3: the block drifts at a constant -0.370% W and -0.076% H per frame (-15.00 /
			// -1.74 px per 24 fps picture, straight-line fit RMS 0.2 px over 11 pictures) for its whole life (f417-f484,
			// 67 f), already moving on its first picture and still on its last; v5.layout-caption-staircase, the same
			// caption: line 2 indented +105 px (+6.5% W), baseline pitch 62 px (6.75% H), left-side caption stepping right
			// while it drifts left; Inter SemiBold 600, cap 4.47% H
			motions: {},
			params: {velocityX: -0.37, velocityY: -0.076, stepX: 6.5, pitch: 6.75, weight: 600, capHeight: 4.47},
			covers: ['v5.text-caption-drift', 'v5.layout-caption-staircase'],
		},
	},
	demoFrames: 67,
	demoTone: 'dark',
};
