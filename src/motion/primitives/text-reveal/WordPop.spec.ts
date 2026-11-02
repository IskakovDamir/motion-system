import type {PrimitiveSpec} from '../types';

// Every unit is cut on in one frame at full ink in its final place: no motions, only the cadence
// (framesPerWord or a measured gap list, cycling) and the unit.

export const spec: PrimitiveSpec = {
	name: 'WordPop',
	kind: 'text',
	description:
		'Words (or whole lines) of a pre-laid line appear one at a time, each in a single frame at full ink in its final place, with no fade, slide or scale; the cadence in frames per unit carries the rhythm.',
	defaultVariant: 'even',
	variants: {
		brisk: {
			// v1.text-word-pop S05: 4 words of a pre-laid centred line pop at 7 f per word (f793-f814).
			// Inter Tight 400, cap 8.5 % H, sentence case
			motions: {},
			params: {unit: 'word', framesPerWord: 7, font: 'display', weight: 400, capHeight: 8.5, align: 'center', tone: 'light'},
			covers: ['v1.text-word-pop'],
		},
		even: {
			// v2.text-word-pop S06: 6 words + period at f395, 401, 406, 411, 417, 422 (gaps 6, 5, 5, 6, 5 = 5.4 f).
			// Inter 400, lower case, ascender 8.1 % H, line width matches Inter at -0.010 em, centred
			motions: {},
			params: {unit: 'word', framesPerWord: 5.4, gaps: '6,5,5,6,5', font: 'ui', weight: 400, capHeight: 8.1, tracking: -0.01, case: 'lower', align: 'center', tone: 'light'},
			covers: ['v2.text-word-pop'],
		},
		spaced: {
			// v3.text-word-pop S01: 7 words at f11, 17, 23, 29, 35, 41, 47 (6 f per word), darkness 0 -> 0.995 in one
			// frame, no move. Inter Tight 400, cap 7.9 % H, centred
			motions: {},
			params: {unit: 'word', framesPerWord: 6, font: 'display', weight: 400, capHeight: 7.9, align: 'center', tone: 'light'},
			covers: ['v3.text-word-pop'],
		},
		rapid: {
			// v1.text-stream-words S03: grey bullet at f402, words at f404, 406, 408, 411, 413, 415, 417 (2-3 f per
			// word), wrapping; v3.ui-text-stream: replies stream word by word at 2-3 f per word.
			// JetBrains Mono 400, cap 3.1 % H, light on dark
			motions: {},
			params: {unit: 'word', framesPerWord: 2.2, gaps: '2,2,2,3,2,2,2', bullet: true, font: 'mono', weight: 400, capHeight: 3.1, tone: 'dark'},
			covers: ['v1.text-stream-words', 'v3.ui-text-stream'],
		},
		lineSteps: {
			// v4.ui-terminal-line-step S02: whole lines, one per event, at fixed slots of a 29 px line pitch
			// (2.69 % H), never scrolling, gaps 10, 23, 5, 4, 2, 3, 19, 5, 19, 21, 15 f. JetBrains Mono 400,
			// cap 1.2-1.5 % H (UNCERTAIN; 1.35)
			motions: {},
			params: {unit: 'line', framesPerWord: 11.5, gaps: '10,23,5,4,2,3,19,5,19,21,15', linePitch: 2.69, font: 'mono', weight: 400, capHeight: 1.35, tone: 'dark'},
			covers: ['v4.ui-terminal-line-step'],
		},
		ghostSnap: {
			// v5.text-word-ghost-type S20: each word shows for 1-2 pictures (2 pictures = 5 f) at 40-50 % ink and
			// 1.9-2.2 % H below its place, then snaps up to full; word starts f3135, 3142, 3150, 3161, 3167, 3177,
			// 3181 (gaps 7, 8, 11, 6, 10, 4); the pill's right end extends to fit each word. Inter 400, cap 3.6 % H
			motions: {},
			params: {
				unit: 'word',
				framesPerWord: 7.7,
				gaps: '7,8,11,6,10,4',
				ghostFrames: 5,
				ghostInk: 0.45,
				ghostDrop: 2.0,
				flow: true,
				font: 'ui',
				weight: 400,
				capHeight: 3.6,
				tone: 'dark',
			},
			covers: ['v5.text-word-ghost-type'],
		},
		allAtOnce: {
			// v5.text-caption-hard-on S30: a one-line caption appears complete at full white in one picture and holds.
			// Inter Medium 500, caps, cap 3.1 % H, centred
			motions: {},
			params: {unit: 'line', framesPerWord: 0, font: 'ui', weight: 500, capHeight: 3.1, case: 'upper', align: 'center', tone: 'dark'},
			covers: ['v5.text-caption-hard-on'],
		},
	},
	demoFrames: 140,
	demoTone: 'light',
};
