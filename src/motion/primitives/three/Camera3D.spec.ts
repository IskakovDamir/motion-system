import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// The v6 variants move a camera around the exploded phone stack of v6.3d-layer-explode (see LayerStack.spec.ts:
// layers 0.49 wide : 1 tall, 53.5 % H, turned 44 deg, back layer centre 33.7 % W left and 29.2 % H above the front
// one). The v8 transition variants work on the S17 screen stack (v8.3d-stack-fan-out: layer aspect 1.776, 26.5 deg yaw
// borrowed from v8.3d-card-turn-recede, perspective f = 2618 px = 161.4 % W).
const v6Stack = {yaw: 44, spreadX: 33.7, spreadY: 29.2, aspect: 0.49, layerH: 53.5, perspective: 161.4};
const v8Screens = {aspect: 1.776, yaw: 26.5, perspective: 161.4};

export const spec: PrimitiveSpec = {
	name: 'Camera3D',
	kind: '3d',
	description:
		'The camera moves through a 3D scene: orbits, dollies with parallax, swings into perspective and pushes in, pushes until a layer flattens to the screen, shrinks a flat page into a stack, or flies down a one-point tunnel.',
	defaultVariant: 'swingPush',
	variants: {
		swingPush: {
			// v5.cam-swing-3d-push: the camera pushes in on the focus (the 3D button) x1.00 -> 2.50 and recoils to 2.17
			// (the curve, 45 f, overshoot; its token dips 4.5 % first and starts rising at its frame 18 = f1022); the focus
			// swings across the screen with it: (46.2 % W, 77.9 % H) at f1022 -> (36.4, 58.8) at f1035 -> (49.9, 60.7) at
			// f1067, values only: two linear legs of 13 f and 32 f from frame 18
			motions: {scale: measured('v5.cam-swing-3d-push'), swing: motion(13, linear, 18), settle: motion(32, linear, 31)},
			params: {toScale: 2.1673, fromX: 46.2, fromY: 77.9, swingX: 36.4, swingY: 58.8, toX: 49.9, toY: 60.7},
			reproduces: {scale: ['v5.cam-swing-3d-push']},
		},
		orbitPush: {
			// v6.cam-orbit-push: orbit + push-in on the exploded stack: its left edge 421 -> 562 px (26.0 -> 34.6 % W) in 23 f
			// (the curve) while its ink extent grows 732 -> about 980 px (45.1 -> 60.4 % W)
			motions: {x: measured('v6.cam-orbit-push')},
			params: {...v6Stack, fromLeft: 26.0, toLeft: 34.6, fromWidth: 45.1, toWidth: 60.4},
			reproduces: {x: ['v6.cam-orbit-push']},
		},
		dollyReframe: {
			// v6.cam-dolly-reframe: the camera dollies to reframe: the stack's left edge 559 -> 339 px (34.5 -> 20.9 % W) in
			// 30 f (the curve, on the back layer), its top edge from 92 px (10.0 % H) out of the frame as the back layer rises
			// 208 -> 96.5 px (-12.1 % H); the layers neither start nor stop together: the second layer from the back moves
			// first (5 f before the curve, f673), the front layer keeps sliding right after the others stop
			// (1374.5 -> 1400 px = +1.6 % W over f706-f723: outStrongOver2 fits, rmse 0.054; frame 0 is f667, the lead
			// token starting to move at its frame 6, so the run-on starts at 39);
			// width kept at the orbit push's 60.4 % W
			motions: {
				lead: measured('v6.cam-dolly-reframe'),
				x: measured('v6.cam-dolly-reframe', 5),
				settle: motion(17, EASE.outStrongOver2, 39),
			},
			params: {...v6Stack, fromLeft: 34.5, toLeft: 20.9, width: 60.4, fromTop: 10.0, rise: 12.1, settleX: 1.6},
			reproduces: {x: ['v6.cam-dolly-reframe']},
		},
		dollyParallax: {
			// v6.cam-dolly-back-parallax: the camera dollies back with strong parallax in 18 f (the curve: x of the gauge on
			// the second layer): the back layer's corner moves (420, 254) -> (430.5, 162) px = +0.6 % W, -10.1 % H and shrinks
			// x0.91, the second layer's gauge (696, 291) -> (561.5, 223.5) px = -8.3 % W, -7.4 % H and x0.74 (their on-screen
			// spacing 276 -> 131 px); the nearer layers swing in from the right edge, right edge 87.7 -> 76.6 % W (their scale
			// and y are not measured: they take the second layer's); it starts from the dolly reframe's end framing (left
			// 20.9 % W, top 10.0 - 12.1 % H, width 60.4 % W), whose back-to-second spacing is 15.3 % W against the measured 17.0,
			// with the back layer 15.8 % H lower: it sank on its own just before (v6.3d-layer-sink, f693-f726)
			motions: {x: measured('v6.cam-dolly-back-parallax')},
			params: {
				...v6Stack,
				width: 60.4,
				fromLeft: 20.9,
				fromTop: -2.1,
				backSunk: 15.8,
				backDX: 0.6,
				backDY: -10.1,
				backScale: 0.91,
				midDX: -8.3,
				midDY: -7.4,
				midScale: 0.74,
				nearDX: -11.1,
			},
			reproduces: {x: ['v6.cam-dolly-back-parallax']},
		},
		pullWide: {
			// v6.cam-pull-back-wide: from a close three-quarter view to the wide exploded view in 17 f (the curve: ink extent
			// 884 -> 751.5 px = 54.5 -> 46.3 % W), bottom edge 917 -> 860 px (99.9 -> 93.7 % H); every layer shrinks x0.65
			// about the same (little parallax), so the layers spread apart on screen relative to their size
			motions: {scale: measured('v6.cam-pull-back-wide')},
			params: {...v6Stack, fromWidth: 54.5, toWidth: 46.3, fromBottom: 99.9, toBottom: 93.7, layerScale: 0.65},
			reproduces: {scale: ['v6.cam-pull-back-wide']},
		},
		orbitDrift: {
			// v5.cam-orbit-drift: a slow constant orbit on a close-up, linear, no ease inside the shot (S26, 15 f): the content
			// centre 51.1 -> 49.2 % W (-0.13 % W per frame) and 69.6 -> 69.1 % H, its slope -23.8 -> -18.8 deg over
			// f4022-f4032 (+0.5 deg per frame: -26.3 at the shot's start); S27 drifts alike (-0.12 % W per frame, tilt -7.3 -> -11.9)
			motions: {drift: motion(15, linear)},
			params: {driftX: -1.9, driftY: -0.5, fromTilt: -26.3, toTilt: -18.8},
			covers: ['v5.cam-orbit-drift'],
		},
		pushFlatten: {
			// v8.trans-stack-push-flatten (T17, 47 f): the far end swings out first (right extent 78.4 -> 81.7 % W, top edge
			// 28.5 -> 26.8 % H over f2210-f2220 = frame 0-10, values only: linear); from f2227 (17 f; the curve's token
			// starts moving at its frame 7: delay 10) the front card's left edge 23.3 -> 3.7 % W in
			// 31 f (the curve) while it turns toward the camera and grows (left-edge height 23.2 % H -> a flat page 92.0 % W x
			// 91.5 % H) and the layers behind slide in behind it: the stack is still 1288 px wide at f2242 (the curve at 0.37:
			// left edge 261 px), i.e. the front card plus the starting spread, and the front card is alone from about f2250
			// (the curve at 0.83: left edge 114 px)
			motions: {swing: motion(10, linear), x: measured('v8.trans-stack-push-flatten', 10)},
			params: {
				...v8Screens,
				fromLeft: 23.3,
				toLeft: 3.7,
				fromHeight: 23.2,
				toHeight: 91.5,
				farFrom: 78.4,
				farSwing: 81.7,
				farTopFrom: 28.5,
				farTopSwing: 26.8,
				centerY: 52.5,
				spreadHold: 0.37,
				aloneAt: 0.83,
			},
			reproduces: {x: ['v8.trans-stack-push-flatten']},
		},
		shrinkIntoStack: {
			// v8.trans-zoom-out-morph (T16): the full-frame page's rounded mask insets over 6 f (sides 0 -> 33.5-35.1 px =
			// 2.1 % W, bottom edge to 897 px: 2.3 % H, top at 24 px: 2.6 % H; 0 / 5.4 / 16.1 / 33.5 px at 0 / 2 / 4 / 6 f:
			// inGentle fits, rmse 0.007), then from 4 f the page shrinks x0.528 in 20 f (the curve), centre y 50-55 % H;
			// from f2022 (18 f) it starts to yaw, right side receding, into the front layer of the screen stack (values not
			// measured: 6 f linear to the stack's yaw by the fan-out at f2028); mask corner radius 30 px at 918 (T17)
			motions: {inset: motion(6, EASE.inGentle), scale: measured('v8.trans-zoom-out-morph', 4), yaw: motion(6, linear, 18)},
			params: {...v8Screens, toScale: 0.53, inset: 2.1, insetTop: 2.6, insetBottom: 2.3, radius: 35.3, centerY: 52.5},
			reproduces: {scale: ['v8.trans-zoom-out-morph']},
		},
		tunnelDolly: {
			// v8.3d-tunnel-flythrough: the camera dollies through a one-point tunnel: the walls stream outward 0.8-2.3 % W per
			// frame (2.3 at the frame edge), a wall panel passes the frame edge every 6-8 f (7); the items float out of the
			// depth and slow to a hover: scale 0.35 -> 1.05 in 27 f (the curve), size 7.8 % W at scale 1; measured on one item
			// at (60.3, 56.5) % -> (78.0, 44.1) %, which lies on a ray from (51.5, 62.7) % scaled with it (the items' vanishing point)
			motions: {scale: measured('v8.3d-tunnel-flythrough')},
			params: {fromScale: 0.35, toScale: 1.05, itemSize: 7.8, vpX: 51.5, vpY: 62.7, edgeFlow: 2.3, panelEvery: 7},
			reproduces: {scale: ['v8.3d-tunnel-flythrough']},
		},
	},
	demoFrames: 110,
	demoTone: 'light',
};
