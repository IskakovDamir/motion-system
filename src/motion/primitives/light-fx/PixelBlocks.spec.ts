import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Pixels of v5, v7 and v8 are of a 1622x918 picture: % W = px / 16.22; px at 1080 = px x 1080 / 918.

export const spec: PrimitiveSpec = {
	name: 'PixelBlocks',
	kind: 'fx',
	description:
		'Luminous pixel squares as an ornament: a cluster of them sweeps across an element, parks at its end and dims out, a soft grey pixel smear trails behind text and fades, or two squares slide into a corner-to-corner pair.',
	defaultVariant: 'parkSweep',
	variants: {
		parkSweep: {
			// v5.fx-pixel-sweep S08: the square cluster's centroid 64.9 -> 20.3 % W (right to left) in 15 f,
			// parks at the pill's left end; the squares dim out f780-f787 (+13 f, 7 f); tiles 20-40 px (S11)
			motions: {x: measured('v5.fx-pixel-sweep'), dim: motion(7, EASE.inOutGlide, 13)},
			params: {fromX: 64.9, travel: -44.6, tileMin: 23.5, tileMax: 47},
			reproduces: {x: ['v5.fx-pixel-sweep']},
		},
		smearSweep: {
			// v8.fx-pixel-smear-sweep: band centre 62.6 -> 42.3 % W behind the text, band 250-300 px wide
			// (17 % W), squares 30-40 px (41 px at 1080); the darkening of the pill under it rises to 105
			// luma by f404 (+8 f) and falls 98 / 37 / 24 / 12 / 5 / 0 at +4 / +14 / +16 / +18 / +20 / +22 f
			motions: {x: measured('v8.fx-pixel-smear-sweep'), energy: motion(8, linear), fade: motion(22, EASE.inOutGlide, 8)},
			params: {fromX: 62.6, travel: -20.3, width: 17, tile: 41, deficit: 0.41},
			reproduces: {x: ['v8.fx-pixel-smear-sweep']},
		},
		pairConverge: {
			// v7.shape-pixel-pair-converge: two grey squares at (10.3, 76.4) and (16.3, 83.6) % (f21) slide
			// diagonally into a corner-to-corner pair touching at (13.3, 80.2) % (f36), 15 f, on twos (a new
			// pose every 5 f)
			motions: {converge: motion(15, linear)},
			params: {ax: 10.3, ay: 76.4, bx: 16.3, by: 83.6, meetX: 13.3, meetY: 80.2, step: 5},
			covers: ['v7.shape-pixel-pair-converge'],
		},
	},
	demoFrames: 60,
	demoTone: 'dark',
};
