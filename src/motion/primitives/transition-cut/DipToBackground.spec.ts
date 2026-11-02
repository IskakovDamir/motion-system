import type {PrimitiveSpec} from '../types';
import {measured} from '../../tokens/measured';

// The outgoing layout fades out in place (opacity 1 -> 0 on the curve, scaling to exitScale about
// pivotX / pivotY), the empty background holds emptyFrames, and the next layout comes in: whole in one
// frame, or (zoomBuild) rising, growing and fading in, its title dropping in last.

export const spec: PrimitiveSpec = {
	name: 'DipToBackground',
	kind: 'transition',
	description:
		'The outgoing layout fades out in place on an ease-in (optionally scaling a few percent), the empty background holds for a few frames, and the next layout builds in.',
	defaultVariant: 'groupFade',
	variants: {
		groupFade: {
			// v3 T05 (the curve, f611-f618): mark, line and URL fade together in place, ease-in, bboxes fixed
			// (scale 0.9994-1.0000); one empty frame (f618), the next layout from f619 (the other dips hold
			// 1-3 empty frames)
			motions: {opacity: measured('v3.trans-dip-to-bg')},
			params: {emptyFrames: 1, exitScale: 1, pivotX: 50, pivotY: 50},
			reproduces: {opacity: ['v3.trans-dip-to-bg']},
		},
		quickDip: {
			// v1 T02 (the curve, f328-f337): network and counter fade with no scale (1.000); one empty frame
			// (f337), then the next layout
			motions: {opacity: measured('v1.trans-dip-to-bg')},
			params: {emptyFrames: 1, exitScale: 1, pivotX: 50, pivotY: 50},
			reproduces: {opacity: ['v1.trans-dip-to-bg']},
		},
		zoomBuild: {
			// v4 T01 (f214-f248): the layout fades out (v4.layout-zoom-fade-out) while it scales 1.000 ->
			// 1.0315 about the frame centre (959, 540) px (its .i2), both ease-in; f225 practically empty (no
			// held frame); from f225 (token frame 11) the next layout rises 30 px = 2.78% H, scales 0.970 ->
			// 1.000 and fades in on one ease-out (v4.card-rise-scale-fade-in); its headline drops 12 px =
			// 1.11% H into place while fading in from f234 (20, v4.text-headline-drop-in)
			motions: {
				opacity: measured('v4.layout-zoom-fade-out'),
				scale: measured('v4.layout-zoom-fade-out.i2'),
				enter: measured('v4.card-rise-scale-fade-in', 11),
				title: measured('v4.text-headline-drop-in', 20),
			},
			params: {emptyFrames: 0, exitScale: 1.0315, pivotX: 49.95, pivotY: 50, enterScale: 0.97, enterY: 2.78, titleY: -1.11},
			covers: ['v4.trans-dip-to-bg'],
		},
	},
	demoFrames: 60,
	demoTone: 'light',
};
