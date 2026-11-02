import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// The content moves up `travel` % H inside a frame that holds (a negative travel scrolls back down).
// v2: 1920x1080; v6-v7: 1622x918.

export const spec: PrimitiveSpec = {
	name: 'PageScroll',
	kind: 'ui',
	description:
		'Page content scrolls inside a still frame on a smooth ease-in-out, on a momentum curve with a long deceleration, or arrives mid-scroll and decelerates to rest.',
	defaultVariant: 'easeInOut',
	variants: {
		easeInOut: {
			// v2.ui-page-scroll: the whole page scrolls up 560 px = 51.9% H, x fixed, no motion blur
			motions: {y: measured('v2.ui-page-scroll')},
			params: {travel: 51.9},
			reproduces: {y: ['v2.ui-page-scroll']},
		},
		momentum: {
			// v7.ui-page-scroll-momentum: page content inside a static window, 0 -> -104.1% H (956 px)
			motions: {y: measured('v7.ui-page-scroll-momentum')},
			params: {travel: 104.1},
			reproduces: {y: ['v7.ui-page-scroll-momentum']},
		},
		decelerate: {
			// v7.ui-scroll-settle: the cut lands mid-scroll, the list goes 0 -> -896 px = -97.6% H (one row)
			// under a fixed bar, decelerating to rest
			motions: {y: measured('v7.ui-scroll-settle')},
			params: {travel: 97.6},
			reproduces: {y: ['v7.ui-scroll-settle']},
		},
		slowBack: {
			// v6.ui-code-scroll: the code scrolls back down to its first line, at least 4.6 lines, slowing from
			// 0.06-0.08 to 0.027 lines per frame and at rest 107-127 f after f586; outFirm over 127 f fits those
			// speeds (4.65 lines). Line pitch 16.5 px of 918 at the f656 panel size = 1.8% H, so 4.6 lines =
			// 8.3% H, downward
			motions: {y: motion(127, EASE.outFirm)},
			params: {travel: -8.3, linePitch: 1.8},
			covers: ['v6.ui-code-scroll'],
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
