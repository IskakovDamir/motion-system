import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// scale: the press, rest 1 -> pressScale about the element's centre; release: back from the pressed
// size to releaseScale (default 1), overshoot included. The release delay is the press start to the
// release start (press + hold). swap: the swapped (pressed / selected) state fades in from its delay
// (a hard swap at swapAt when there is no swap motion; unswapAt hands back to the rest state).
// restSize: the measured element's rest size (px at 1080; v5-v8 px x 1080/918) the Demo lays out at.

export const spec: PrimitiveSpec = {
	name: 'PressBounce',
	kind: 'ui',
	description:
		'A pressed button, chip or row squashes about its centre, holds, and springs back (or stays pressed); state changes land on the deepest picture.',
	defaultVariant: 'quick',
	variants: {
		quick: {
			// v1.ui-button-press: 1 -> 0.90 in 4 f (f81-f85), held 2 f, back in 4 f (.i2, f87-f91: release
			// starts 6 f after the press); send button 95.9 px across
			motions: {scale: measured('v1.ui-button-press'), release: measured('v1.ui-button-press.i2', 6)},
			params: {pressScale: 0.9, restSize: 95.9},
			reproduces: {scale: ['v1.ui-button-press']},
		},
		deep: {
			// v4.ui-button-press: 1 -> 0.862 in 4 f (f297-f301), holds 1-2 f inside the slow start of the
			// release (.i2 from f301, 5 f); 44 px disc
			motions: {scale: measured('v4.ui-button-press'), release: measured('v4.ui-button-press.i2', 4)},
			params: {pressScale: 0.862, restSize: 44},
			reproduces: {scale: ['v4.ui-button-press']},
		},
		held: {
			// v5.ui-button-press S08: 1 -> 0.78 in 13 f and stays pressed
			motions: {scale: measured('v5.ui-button-press')},
			params: {pressScale: 0.783},
			reproduces: {scale: ['v5.ui-button-press']},
		},
		springBack: {
			// v5.ui-chip-press: 1 -> 0.818 in 8 f (f857-f865), holds 3 pictures (chip 2: f930-f935, 5 f) and
			// springs back with a 1% overshoot (.i2, chip 2 f935-f953); its light outline appears at the
			// pressed size and its label brightens luma 136 -> 142 (+5) -> 182 (+8) -> 251 (+20)
			// (inGentle-shaped: inOutGlide over 9 f from +3, rmse 0.001)
			motions: {scale: measured('v5.ui-chip-press'), release: measured('v5.ui-chip-press.i2', 13), swap: motion(9, EASE.inOutGlide, 3)},
			params: {pressScale: 0.818},
			reproduces: {scale: ['v5.ui-chip-press']},
		},
		pressSwap: {
			// v5.ui-select-swap: the new row 1 -> 0.788 in 7 f (f880-f887) and straight back in 10 f (.i2,
			// active from f887); its highlight and check fade in at the pressed size: luma 0.2 of the way
			// (f885, +5), 0.8 (f887, +7); the old row's check fades +5..+10 (gone f890), its highlight lingers
			// to f890 and is gone at f892 (+12); highlight 487 px wide at 918
			motions: {
				scale: measured('v5.ui-select-swap'),
				release: measured('v5.ui-select-swap.i2', 6),
				swap: motion(4, linear, 4),
				oldOut: motion(5, linear, 5),
			},
			params: {pressScale: 0.788, oldGoneAt: 12, restSize: 573},
			reproduces: {scale: ['v5.ui-select-swap']},
		},
		glowRelease: {
			// v7.ui-button-press: disc 228 -> 221 / 198 / 186 px at +2 / +4 / +7 (x0.816; inOutGlideOver over
			// 5 f from +1, rmse 0.011); fill luma 106.6 -> 144.8 in one picture at the bottom of the press
			// (+7), then -> 161 (+22) -> 174 (+34), linear; release from +9: 188 / 196 / 207 / 221 / 232 px at
			// +9 / +12 / +14 / +17 / +19 (linear over 9 f from +10, rmse 0.020), camera-compensated to 222 px
			// = x0.974 of rest; disc 228 px at 918
			motions: {scale: motion(5, EASE.inOutGlideOver, 1), release: motion(9, linear, 10), glow: motion(27, linear, 7)},
			params: {pressScale: 0.816, releaseScale: 0.974, fillLuma: 106.6, stepLuma: 144.8, glowLuma: 174, restSize: 268},
			covers: ['v7.ui-button-press'],
		},
		longHold: {
			// v8.ui-button-press: 83 -> 80 / 71 / 53 / 46.5 / 45 px at +1 / +3 / +5 / +7 / +9 (x0.542; outSoft
			// over 10 f, rmse 0.025), on screen to f401 (+14), then 57 / 76 / 83 px at +15 / +17 / +19
			// (outFirm over 7 f from +14, rmse 0.022); 83 px at 918
			motions: {scale: motion(10, EASE.outSoft), release: motion(7, EASE.outFirm, 14)},
			params: {pressScale: 0.542, restSize: 97.6},
			covers: ['v8.ui-button-press'],
		},
		dropPress: {
			// v7.ui-folder-drop-bounce: folder 247 -> 235 (+2) -> 196 (+4) -> 193.5 px (x0.783) to f2791 (+11)
			// (inOutWhip2 over 5 f, rmse 0.011); back 209 / 242 / 247 px at +14 / +16 / +19 (outSoft2 over 6 f
			// from +12, rmse 0.008); near-white while pressed (+2..+11, swapped state), grey again from the
			// return; the dropped chip shrinks on its front from +2 and is gone at +14; folder 247 px at 918
			motions: {scale: motion(5, EASE.inOutWhip2), release: motion(6, EASE.outSoft2, 12), chipOut: motion(12, linear, 2)},
			params: {pressScale: 0.783, swapAt: 2, unswapAt: 12, restSize: 290.6},
			covers: ['v7.ui-folder-drop-bounce'],
		},
	},
	demoFrames: 60,
	demoTone: 'light',
};
