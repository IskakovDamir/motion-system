import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Stroke widths are px at 1080 (v5-v8 pictures are 918 high: px x 1080/918). Positions are % of
// frame width / height. Starts and steps are frames from the primitive's start.

export const spec: PrimitiveSpec = {
	name: 'LineDraw',
	kind: 'shape',
	description:
		'A line or stroke draws on along its path: connectors grow edge to edge, a bracket draws out with rounded turns, edge ticks grow in, wireframe edges draw from back to front, an outline closes around a pill, a path draws on while its stroke thickens, or outline copies are revealed one after another.',
	defaultVariant: 'edgeToEdge',
	variants: {
		edgeToEdge: {
			// v3.shape-connector-draw-on S01: 4 px connectors grow from badge edge to badge edge, rows left to
			// right on the curve (top f15, bottom +3 f), verticals top to bottom in 6 f (left f24, right f27;
			// right end y 387 .. 702 at f28-f33: inOutGlide). S02 lattice: 1.2 px connectors drawn on the
			// measured .i2 curve in waves from f150: f150, 153, 157, 169, 172, 179, 184, 189, 198, 201.
			motions: {
				progress: measured('v3.shape-connector-draw-on'),
				cross: motion(6, EASE.inOutGlide),
				fine: measured('v3.shape-connector-draw-on.i2'),
			},
			params: {width: 4, fineWidth: 1.2, starts: '0 3 9 12', fineStarts: '0 3 7 19 22 29 34 39 48 51'},
			reproduces: {progress: ['v3.shape-connector-draw-on']},
		},
		roundedTurns: {
			// v5.shape-connector-draw: the bracket draws out from the parent node with rounded 90-degree turns
			// down to the outer children and a short stem to the middle one, all branches together, about
			// 10 f (ease not measured: the v3 connector's shape, inOutGlideOver). Stroke width not measured.
			motions: {progress: motion(10, EASE.inOutGlideOver)},
			covers: ['v5.shape-connector-draw'],
		},
		growInward: {
			// v6.shape-edge-lines-grow: 4 ticks per side at y 496 / 574 / 653 / 731 of 918 (8.5% H apart)
			// grow in from the frame edges, right side first, the left 3 f later: right 14-23 px (f513) ->
			// 49-50 (f516) -> 50-53 px (3.1-3.3% W) in 3-5 f (outSoft3), left to 48-50 px (3.0-3.1% W);
			// they darken over about 10 f to 61-84 luma below the field on the right, 50-53 on the left
			// (outSoft4); 2-3 px thick (2.4-3.5 px at 1080); screen-locked.
			motions: {grow: motion(4, EASE.outSoft3), darken: motion(10, EASE.outSoft4)},
			params: {rows: '54.0 62.5 71.1 79.6', lengthR: 3.2, lengthL: 3.05, width: 2.9, contrastR: 72.5, contrastL: 51.5, lag: 3},
			covers: ['v6.shape-edge-lines-grow'],
		},
		backToFront: {
			// v6.shape-wireframe-edges: thin lines through the layers' matching corners draw on from the back
			// layer to the front one (curve); the bottom-left edge from f586, the top edge from f588.
			// Stroke width not measured.
			motions: {progress: measured('v6.shape-wireframe-edges')},
			params: {starts: '0 2'},
			reproduces: {progress: ['v6.shape-wireframe-edges']},
		},
		rightToLeft: {
			// v8.shape-divider-draw-on: a hairline divider at y 16.2% H draws on from its right end (fixed at
			// 77.1% W) to the left end at 19.7% W in 36 f, near-constant speed (about 23 px/f). Hairline
			// width not measured.
			motions: {progress: motion(36, linear)},
			params: {y: 16.2, from: 77.1, to: 19.7},
			covers: ['v8.shape-divider-draw-on'],
		},
		closeLoop: {
			// v8.ui-pill-outline-draw: a 2 px outline (2.35 px at 1080) around the pill (rest box x 34.9-65.1% W,
			// y 54.1-62.9% H) drawn as one stroke from the right end of the bottom line: bottom right to left,
			// rounded left end, top left to right, rounded right end. S01 closes it in 12 f (bottom by +4,
			// top by +10, closed +12 in still crops: linear rmse 0.035); the S26 replay takes 36 f
			// (inOutGlideOver2) and is not used.
			motions: {progress: motion(12, linear)},
			params: {left: 34.9, right: 65.1, top: 54.1, bottom: 62.9, width: 2.35},
			covers: ['v8.ui-pill-outline-draw'],
		},
		trimThicken: {
			// v6.logo-stroke-draw-on S04: drawn length 4 / 42 / 84 / 94 / 100% at +0 / +3 / +5 / +8 / +10 f
			// (outSoft3 rmse 0.026) while the stroke thickens 2.8 -> 11.2 px (3.3 -> 13.2 px at 1080; widest
			// 2.8 / 6.0 / 6.4 / 8.0 / 11.2, linear the closest token).
			motions: {progress: motion(10, EASE.outSoft3), weight: motion(10, linear)},
			params: {fromWidth: 3.3, toWidth: 13.2},
			covers: ['v6.logo-stroke-draw-on'],
		},
		trimSteps: {
			// v7.icon-stroke-draw-on: the mark draws on in 3 pictures in 5 f, then reaches full weight: path
			// 222 / 309 / 349 / 373 px (0.595 / 0.828 / 0.936 / 1 of the path) with stroke 4 / 8 / 11 / 12 px
			// (4.7 / 9.4 / 12.9 / 14.1 px at 1080) at +0 / +2 / +5 / +7 f, each held to the next picture.
			motions: {},
			params: {steps: '0:0.595 2:0.828 5:0.936 7:1', widths: '0:4.7 2:9.4 5:12.9 7:14.1'},
			covers: ['v7.icon-stroke-draw-on'],
		},
		echoReveal: {
			// v6.shape-echo-outlines: enlarged rounded-rectangle outlines whose tops lie above the frame are
			// revealed down from the top edge one after another: L1 from f976 (lower end 10 / 27 / 55 / 116 px
			// at +0 / +2 / +5 / +7, whole at +11: inAccelerate2), L2 from f987 (whole by f989), R1 from f989
			// (28 / 96 px, whole at +4). The layer widens with the punch-in about x 810 px (49.9% W): the L1
			// side 419 -> 333 px is the curve, x 1.22 about that centre. Settled sides and bottoms (% of the
			// 1622 x 918 picture): L1 20.5% W / 44.9% H, L2 12.3% W / 15.8% H, R1 81.0% W / 45.5% H. Each then
			// softens from a thin dark stroke (min luma 121-145: 0.52) into a light ridge between two soft
			// dark bands 9-10 px apart (11.2 px at 1080; min luma 168-188: 0.70): L2 f993-f1001, R1 f1001-f1008,
			// L1 f1003-f1008. Stroke width and corner radius not measured.
			motions: {
				x: measured('v6.shape-echo-outlines'),
				reveal0: motion(11, EASE.inAccelerate2),
				reveal1: motion(2, EASE.inAccelerate2, 11),
				reveal2: motion(4, EASE.inAccelerate2, 13),
				soften0: motion(5, linear, 27),
				soften1: motion(8, linear, 17),
				soften2: motion(7, linear, 25),
			},
			params: {
				sides: '20.5 12.3 81.0',
				bottoms: '44.9 15.8 45.5',
				centre: 49.9,
				widen: 1.22,
				thinTone: 0.52,
				softTone: 0.7,
				bandGap: 11.2,
			},
			reproduces: {x: ['v6.shape-echo-outlines']},
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
