import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// px at 1080 = px of the 918-high v5-v8 pictures x 1.176. Step lists are `frame:value` (or
// `frame:x,y`), frames from the variant's frame 0.

export const spec: PrimitiveSpec = {
	name: 'CursorState',
	kind: 'ui',
	description:
		'The pointer changes form or marks a click: it glows up and swaps for a 3D pointer that turns frontal, sharpens and dims to rest, swaps in one picture hidden in a fast move, or leaves a small expanding ring.',
	defaultVariant: 'glowMorph',
	variants: {
		glowMorph: {
			// v7.cursor-glow-morph-3d S11, frame 0 = f1284. Glow = mean luma of a 400 x 380 px box around the
			// pointer, as a level (luma - 28) / (149.7 - 28) that sets the light halo's opacity and, once the 3D
			// pointer is in, the pointer's own brightness over the background: the 2D outline cursor glows up
			// 28 -> 87 near-linearly in 17 f (0 -> 0.485); in one picture (f1304, frame 20) it is replaced by
			// the 3D pointer at 150 (1); that decays to 58.2 (0.248), the curve (it dims and keeps a soft glow), whose 2% start f1306 is its
			// token frame 3 (delay 19). Camera pulse on the whole scene (1 = f1294): x0.977 creeping to 1 over
			// f1284-f1294 ("already +2.4%", linear), pushed to x1.103 over f1294-f1301 (1.021 / 1.058 / 1.103 at
			// +2 / +5 / +7 f, fit inGentle, rmse 0.035), pulled back to x0.9175 (the .i2 curve, from f1301 =
			// frame 17). Pointer height 205 px of 918 = 22.3% H at the end of the zoom before (f1281)
			motions: {
				ramp: motion(17, linear),
				opacity: measured('v7.cursor-glow-morph-3d', 19),
				creep: motion(10, linear),
				push: motion(7, EASE.inGentle, 10),
				pull: measured('v7.cursor-glow-morph-3d.i2', 17),
			},
			params: {rampTo: 0.485, restGlow: 0.248, swapAt: 20, creepFrom: 0.977, pushTo: 1.103, pullTo: 0.9175, cursorH: 22.3},
			reproduces: {opacity: ['v7.cursor-glow-morph-3d']},
		},
		hiddenSwap: {
			// v7.cursor-swap-in-blur S31, frame 0 = f3819 (the last 3D picture, smeared; f3820 repeats it); the
			// flat 2D arrow from f3821 (frame 2). Softness from the edge gradient (p99.5) in the cursor box against
			// the sharp level (528-595 from f3851, 560): ghost f3824-f3833 and soft f3834 280 (taken for the whole
			// ghost), double-edged f3836-f3838 219, soft f3839-f3840 286, f3841 457, sharp from f3851 (frame 32);
			// as a Gaussian on an edge 1 px wide, sigma = sqrt((560 / g)^2 - 1) px of 918 = 1.73 / 2.35 / 1.68 /
			// 0.71, px at 1080: 2.04 / 2.77 / 1.98 / 0.83. Own jumps with the camera taken out (the middle of each
			// measured range, px of 918 -> px at 1080): f3834 (frame 15) 1.75 right, 9 below; f3836-f3838 (17) 9
			// left, 5 below; f3839-f3840 (20) 2.25 left, 2.5 above; f3841-f3843 (22) 4.5 left, 7 below; on its spot
			// from f3844 (25). One-picture steps, no easing. 3D pointer ink 144 px of 918 tall at rest = 15.7% H
			motions: {},
			params: {
				swapAt: 2,
				soft: '2:2.04 17:2.77 20:1.98 22:0.83 32:0',
				jump: '15:2.06,10.59 17:-10.59,5.88 20:-2.65,-2.94 22:-5.29,8.24 25:0,0',
				cursorH: 15.7,
			},
			covers: ['v7.cursor-swap-in-blur'],
		},
		pressRipple: {
			// v8.cursor-tap-ripple S22, frame 0 = f2917: a white dot (r about 4 px of 918, +123-137 luma over a
			// chip of luma 38: white at 130 / 217 = 0.6) with a thin ring, r 17 px (f2917-f2918) -> 20 (f2920) ->
			// 23 (f2922): px at 1080 20.0 -> 23.5 -> 27.1 (ringGrow 7.1), stepped (3 pictures); gone at f2924
			// (frame 7). Centre (59.9% W, 52.0% H). The ring's width is not measured ("thin"): ringW is a hairline
			motions: {},
			params: {x: 59.9, y: 52.0, dot: 4.7, dotAlpha: 0.6, ring: '0:20.0 3:23.5 5:27.1', ringGrow: 7.1, ringW: 2, goneAt: 7},
			covers: ['v8.cursor-tap-ripple'],
		},
	},
	demoFrames: 60,
	demoTone: 'dark',
};
