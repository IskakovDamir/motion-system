import type {PrimitiveSpec} from '../types';
import {linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Scales are about pivotX / pivotY (% of frame); px are of the analysed picture (v1-v4 1920 x 1080,
// v5-v8 1622 x 918). A drift has no curve: it is linear at its measured rate (ratePerFrame, % of scale
// per frame) over the measured span of one instance (the motion), and the rate is what reuses it.
// `still` names what the reference keeps screen-fixed while the layer zooms (the demo shows it).

export const spec: PrimitiveSpec = {
	name: 'SlowZoom',
	kind: 'camera',
	description:
		'Slow zoom or drift during holds so the frame is never still: an eased push-in that settles before the next cut, a near-linear creep, or a constant linear scale drift of the whole layout or of one held group.',
	defaultVariant: 'layerPush',
	variants: {
		layerPush: {
			// v2.ui-slow-push-in S07: the UI dialog (not the headline above it) 1.0000 -> 1.0351 about the dialog
			// centre (974, 601) px of 1920 x 1080; full speed from the cut frame, settled at 0.84-0.89 of the time to
			// the next cut (other instances 1.0196-1.0499 at three durations, one normalised shape)
			motions: {scale: measured('v2.ui-slow-push-in')},
			params: {toScale: 1.0351, pivotX: 50.7, pivotY: 55.6, still: 'headline'},
			reproduces: {scale: ['v2.ui-slow-push-in']},
		},
		easeOutPush: {
			// v1.cam-slow-push-in S02: the whole network 0.98385 -> 1.01810 (x1.0348) about the frame centre, an
			// ease-out from full speed that settles as the fade begins
			motions: {scale: measured('v1.cam-slow-push-in')},
			params: {toScale: 1.0348, pivotX: 50, pivotY: 50},
			reproduces: {scale: ['v1.cam-slow-push-in']},
		},
		easedPush: {
			// v7.cam-slow-push-in S14: the whole scene x1.17 about (816, 457) px of 1622 x 918, ease-in-out over 83 f,
			// settling just before the next cut
			motions: {scale: measured('v7.cam-slow-push-in')},
			params: {toScale: 1.17, pivotX: 50.3, pivotY: 49.8},
			reproduces: {scale: ['v7.cam-slow-push-in']},
		},
		creep: {
			// v7.cam-slow-push-creep S03: x1.0115 in 16 f about the frame centre (ECC fixed points 804-811,
			// 456-467 px of 1622 x 918), an even straight ramp
			motions: {scale: measured('v7.cam-slow-push-creep')},
			params: {toScale: 1.0115, pivotX: 50, pivotY: 50},
			reproduces: {scale: ['v7.cam-slow-push-creep']},
		},
		linearDrift: {
			// v6.cam-slow-zoom-drift S15: the whole lockup -0.042% per frame, linear, over 63 f (the median of the
			// five zoom-out holds -0.037 / -0.041 / -0.042 / -0.043 / -0.057); the pivot is not measured: frame centre.
			// v5.cam-hold-drift: holds keep a linear scale drift of -0.09 to +0.03% per frame
			motions: {scale: motion(63, linear)},
			params: {ratePerFrame: -0.042, pivotX: 50, pivotY: 50},
			covers: ['v5.cam-hold-drift', 'v6.cam-slow-zoom-drift'],
		},
		groupCreep: {
			// v8.layout-scale-creep S26: the foreground group x1.000 -> x1.064 over 176 f, 0.035% per frame, linear,
			// about (50.0% W, 50.1% H) while the background stays put (best fit x1.000).
			// v5.logo-scale-creep: the title 1.000 -> 1.035 over 63 f about the frame centre, near-linear
			motions: {scale: motion(176, linear)},
			params: {ratePerFrame: 0.035, pivotX: 50.0, pivotY: 50.1, still: 'background'},
			covers: ['v5.logo-scale-creep', 'v8.layout-scale-creep'],
		},
		recede: {
			// v5.layout-slow-recede S15: the whole graphic group -0.033% per frame, linear, 159 f to the cut, about
			// (49.7% W, 50.5% H) while the cursor and the background grid stay unscaled.
			// v8.cam-slow-pull-back: the 3D stack x0.89 over 116 f, about -0.09% per frame, slowing at the end
			motions: {scale: motion(159, linear)},
			params: {ratePerFrame: -0.033, pivotX: 49.7, pivotY: 50.5, still: 'background'},
			covers: ['v5.layout-slow-recede', 'v8.cam-slow-pull-back'],
		},
	},
	demoFrames: 180,
	demoTone: 'light',
};
