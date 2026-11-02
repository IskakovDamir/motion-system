import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Luma is 0-1 (measured 0-255 / 255). A white lift of a over rest r reaches r + a (1 - r), so a
// measured rise r -> q is a lift of (q - r) / (1 - r); the component computes it from rest and peak.

export const spec: PrimitiveSpec = {
	name: 'LumaPulse',
	kind: 'fx',
	description:
		'A brief luminance pulse on one element: a halo or bloom builds, holds and drains, a bloom covers a content swap, a layer flashes for two pictures, an element dips to near transparent, a screen flickers through its content swap, or a pressed fill brightens and fades.',
	defaultVariant: 'slowBloom',
	variants: {
		slowBloom: {
			// v7.fx-clip-glow-pulse: the bars' own fill brightens from the dock (136 -> 211 luma, f2150-f2206),
			// the halo in the band 4-12 px above them builds 20.8 -> 68.4 from f2172 (+22 f); the halo drains
			// from f2220 (+70 f), the bars from f2222 (+72 f) to 114, 22 darker than at the dock
			motions: {
				opacity: measured('v7.fx-clip-glow-pulse', 22),
				haloOut: measured('v7.fx-clip-glow-pulse.i2', 70),
				fill: measured('v7.fx-clip-glow-pulse.i3'),
				fillOut: measured('v7.fx-clip-glow-pulse.i4', 72),
			},
			// gains are the fill's luma over its docked 136: 211 / 136 = 1.55, 114 / 136 = 0.84;
			// halo reach 12 px of a 918-high picture = 14 px at 1080
			params: {rest: 0.082, peak: 0.187, haloPx: 14, fillPeak: 1.55, fillRest: 0.84},
			reproduces: {opacity: ['v7.fx-clip-glow-pulse']},
		},
		bloomCover: {
			// v7.fx-panel-glow-swap: a white bloom over the panel, luma 33 -> 159 (peak f1729, +48 f); the
			// content swaps at the peak and the bloom drains in 18 f
			motions: {opacity: measured('v7.fx-panel-glow-swap'), decay: measured('v7.fx-panel-glow-swap.i2', 48)},
			params: {rest: 0.129, peak: 0.494},
			reproduces: {opacity: ['v7.fx-panel-glow-swap']},
		},
		haloPeak: {
			// v5.ui-card-mention-glow: luma beside the card 0 -> 20.7 (peak +10 f, f3142) -> 0 (+18 f, f3150)
			motions: {rise: motion(10, EASE.inOutGlide), fall: motion(8, EASE.inOutGlide, 10)},
			params: {rest: 0, peak: 0.081},
			covers: ['v5.ui-card-mention-glow'],
		},
		layerFlash: {
			// v6.fx-layer-glow-pulse: interior luma 30.9 (f576) -> 91.9 (f578, held to f580) -> 76.1 (f581,
			// held to f582) -> 34.5 (f583): lifts (91.9 - 30.9) / 224.1 = 0.27 and (76.1 - 30.9) / 224.1 = 0.20
			motions: {},
			params: {steps: '2:0.27 5:0.20 7:0'},
			covers: ['v6.fx-layer-glow-pulse'],
		},
		opacityDip: {
			// v6.fx-opacity-dip S05: darkest ink luma 0 / 38 / 89 / 208 / 101 / 0 at +0 / +2 / +5 / +7 / +10 /
			// +12 f: the ink fades to 208 / 255 = 0.82 of the way to the (white) background and returns
			motions: {dip: motion(7, EASE.inAccelerate2), back: motion(5, EASE.inOutWhip6, 7)},
			params: {dipLuma: 0.82},
			covers: ['v6.fx-opacity-dip'],
		},
		flicker: {
			// v6.ui-screen-swap-flicker: screen luma 248 (+0) -> 170 / 75 / 148 / 155 -> 62 at +2 / +5 / +7 /
			// +10 / +12 f; the new content (rest 62) is up from +2, lifted (L - 62) / (255 - 62)
			motions: {},
			params: {swapAt: 2, steps: '2:0.56 5:0.07 7:0.45 10:0.48 12:0'},
			covers: ['v6.ui-screen-swap-flicker'],
		},
		fillGlow: {
			// v7.ui-button-press-glow: pill fill luma 27.7 -> 85.0 in 13 f, near-linear (41.4 / 60.5 / 70.8 /
			// 81.4 at +2 / +6 / +8 / +10 f), then back to about 30 in 12 f
			motions: {rise: motion(13, EASE.inOutGlideOver), fall: motion(12, EASE.inOutGlideOver, 13)},
			params: {rest: 0.109, peak: 0.224},
			covers: ['v7.ui-button-press-glow'],
		},
	},
	demoFrames: 60,
	demoTone: 'dark',
};
