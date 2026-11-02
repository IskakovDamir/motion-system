import type {PrimitiveSpec} from '../types';
import {EASE, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// The menu hangs from its anchor (the chip or label it opens from). A re-frame moves the whole layer
// (the surrounding UI, the anchor and the menu) as the references' camera does: the anchor's y in % of
// frame height and a scale about the anchor. v5 / v7 pictures are 1622x918: px / 16.22 = % W.

export const spec: PrimitiveSpec = {
	name: 'Dropdown',
	kind: 'ui',
	description:
		'A menu opens from its anchor: it unfolds or scales up with motion blur while the camera re-frames to it, and closes by squashing back into its anchor.',
	defaultVariant: 'unfold',
	variants: {
		unfold: {
			// v5.ui-dropdown-reveal S11 (mode menu): the layer tilts and pulls back on one curve, the anchor
			// y 50.38% -> 33.77% H and scale 1 -> 0.85 (f1555-f1575); the menu is there from f1560 and
			// unfolds down from its top edge, its bottom 251 px (f1565) -> 344 px (f1570) below the button
			// (0.73 of the way at +5: outSoft over 9 f from +1, rmse 0.001); it closes from f1615 (+63 on the
			// curve's clock) toward a point 115 px right and 38 px up of its centre (61.5% / 38.9% of the
			// 61.9% W x 36.8% H panel): group-relative width 0.99 / 0.90 / 0.73 / <= 0.29 / 0.03 / 0 at
			// +0 / +2 / +5 / +7 / +11 / +13 (inOutWhip6 over 11 f, rmse 0.029)
			motions: {y: measured('v5.ui-dropdown-reveal'), open: motion(9, EASE.outSoft, 9), close: motion(11, EASE.inOutWhip6, 63)},
			params: {fromY: 50.38, toY: 33.77, toScale: 0.85, closeX: 61.5, closeY: 38.9, menuW: 61.9},
			reproduces: {y: ['v5.ui-dropdown-reveal']},
		},
		scaleIn: {
			// v7.ui-dropdown-scale-in: the menu's apparent width (camera push included) 0.3528 -> 1 of its
			// 1081 px rest (66.6% W, x 29.8-96.4% W), its own scale about 0.58 -> 1 (the rest is the camera
			// push, about its top-right anchor); the anchor (top-right corner) 98.4% -> 96.4% W; heavy
			// directional smear down-left while it grows, sharp from f4239 (+23), the page smeared by the push
			// too: both blurred by their own speed with the v7 shutter, 1.25 f (180 deg at 24 fps)
			motions: {scale: measured('v7.ui-dropdown-scale-in')},
			params: {apparentFrom: 0.3528, fromScale: 0.58, fromRight: 98.4, right: 96.4, menuW: 66.6, shutter: 1.25},
			reproduces: {scale: ['v7.ui-dropdown-scale-in']},
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
