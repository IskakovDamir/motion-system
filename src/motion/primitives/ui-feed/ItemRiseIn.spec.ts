import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Pixels: v1-v4 are 1920x1080 (px = px at 1080); v7-v8 are 1622x918 (x 1080/918 for px at 1080).

export const spec: PrimitiveSpec = {
	name: 'ItemRiseIn',
	kind: 'ui',
	description:
		'List or feed items appear one at a time below the earlier ones: each fades in while rising a few pixels on an ease-out, or pops in at full value one per picture, in reading order.',
	defaultVariant: 'riseFade',
	variants: {
		riseFade: {
			// v2.ui-list-item-rise-fade S13: rows fade 0 -> 1 in 5 f and rise +7 px -> 0 in 3 f with the fade
			// (top 602, 598, 596, 595: ease-out, outFirm over 4 f fits it, rmse 0.019); one every 11.3 f
			// (11, 11, 12, 11, 12, 11); earlier rows stay put (list grows downward)
			motions: {opacity: measured('v2.ui-list-item-rise-fade'), y: motion(4, EASE.outFirm)},
			params: {rise: 7, stagger: 11.3, anchor: 'top'},
			reproduces: {opacity: ['v2.ui-list-item-rise-fade']},
		},
		makeRoomRise: {
			// v4.ui-chat-item-rise-fade-in: bubble opacity + top edge 696 -> 683 (13 px up) on one curve,
			// bezier D=13 (the same device as the opacity curve); status line 12 f after the bubble (S03);
			// the bottom-anchored list makes room in the frame the item starts
			motions: {opacity: measured('v4.ui-chat-item-rise-fade-in'), y: motion(13, EASE.outStrong)},
			params: {rise: 13, stagger: 12, anchor: 'bottom'},
			reproduces: {opacity: ['v4.ui-chat-item-rise-fade-in']},
		},
		fadeInPlace: {
			// v3.ui-row-fade-in: rows fade in place, edges fixed within 1 px (no slide); the new rows start
			// 15 f after the request bubble (f235 -> f250, S03)
			motions: {opacity: measured('v3.ui-row-fade-in')},
			params: {rise: 0, stagger: 15, anchor: 'top'},
			reproduces: {opacity: ['v3.ui-row-fade-in']},
		},
		quickFade: {
			// v1.ui-chat-bubble-in: request block fades in about 6 f, ease-out, no move; the reply
			// (avatar + bubble) starts 30 f later (f665 -> f695)
			motions: {opacity: motion(6, EASE.outFirm)},
			params: {rise: 0, stagger: 30, anchor: 'top'},
			covers: ['v1.ui-chat-bubble-in'],
		},
		popStagger: {
			// v7.ui-list-stagger-in S02: rows pop in at full value on their first picture, one per picture,
			// mean stagger 3.0 f (f174 / 176 / 179 / 181 / 186)
			motions: {},
			params: {rise: 0, stagger: 3, pop: true, anchor: 'top'},
			covers: ['v7.ui-list-stagger-in'],
		},
		fadeAcross: {
			// v7.ui-card-stagger-fade: 4 thumbnail cards fade in left to right, 50% points 1.8 / 1.5 / 3.5 f
			// apart (2.3 f mean); luma only, no move
			motions: {opacity: measured('v7.ui-card-stagger-fade')},
			params: {rise: 0, stagger: 2.3, direction: 'row', anchor: 'top'},
			reproduces: {opacity: ['v7.ui-card-stagger-fade']},
		},
		lateFade: {
			// v8.ui-reply-meta-fade-in: the name row fades in 20 f, unscaled and unmoved: opacity 0.24 / 0.46 /
			// 0.64 / 0.76 / 0.84 / 0.94 / 0.99 / 1.0 at f1472-f1492 (from f1470: outFirm over 20 f, rmse 0.018);
			// the action row starts 23 f after the name row (f1472 -> f1495)
			motions: {opacity: motion(20, EASE.outFirm)},
			params: {rise: 0, stagger: 23, anchor: 'top'},
			covers: ['v8.ui-reply-meta-fade-in'],
		},
		blurSlide: {
			// v8.ui-thumb-slide-in-blur: thumbnails slide up from below the visible area, top edge 701 -> 481.5
			// card px (219.5 px x 0.109% H = 23.9% H = 258 px at 1080); the first on a diagonal from the lower
			// right (ink centroid u 379 -> 153 card px = 226 px x 0.062% W = 14.0% W), the second straight up
			// 6 f later (top edge 643 at f2938 against the first's 701 at f2932)
			motions: {y: measured('v8.ui-thumb-slide-in-blur')},
			params: {rise: 258, firstFromX: 14.0, stagger: 6, direction: 'row', clip: true, anchor: 'top'},
			reproduces: {y: ['v8.ui-thumb-slide-in-blur']},
		},
	},
	demoFrames: 120,
	demoTone: 'light',
};
