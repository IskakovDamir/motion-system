import type {PrimitiveSpec} from '../types';

// A step reveal: no eased motion. Each letter position fills in a seeded out-of-order sequence, one
// every framesPerLetter, first as a placeholder bar or dot, then as its glyph one interval later.

export const spec: PrimitiveSpec = {
	name: 'Scramble',
	kind: 'text',
	description: 'A word resolves out of order through placeholder bars and dots, letter by letter, until every glyph has settled.',
	defaultVariant: 'decode',
	variants: {
		decode: {
			// v7.text-scramble-decode S01: title word 1 resolves out of order through placeholder bars and dots,
			// 2.7 f per letter (f19-f46 = 27 f). Inter 700, cap 6.0 % H, title case, white on a dark box
			motions: {},
			params: {framesPerLetter: 2.7, glyphs: 'l,·', font: 'ui', weight: 700, capHeight: 6.0, case: 'title', color: 'onAccent', tone: 'light'},
			covers: ['v7.text-scramble-decode'],
		},
	},
	demoFrames: 60,
	demoTone: 'light',
};
