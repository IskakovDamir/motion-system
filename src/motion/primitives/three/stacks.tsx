import type React from 'react';
import {mix} from '../../engine/anim';

// Layer layouts shared by LayerStack and Camera3D. Everything is in px of the current frame; the
// callers convert the spec's % params first. A pose is a layer's centre, size, uniform scale and yaw
// (rotation about its vertical axis, positive = right side receding), drawn under one perspective.

export type Pose = {x: number; y: number; w: number; h: number; s: number; yaw: number; opacity?: number};

const cos = (deg: number) => Math.cos((deg * Math.PI) / 180);

/** On-screen width of a posed layer (weak perspective). */
export const projectedWidth = (p: Pose) => p.w * p.s * Math.abs(cos(p.yaw));

export type Box = {left: number; right: number; top: number; bottom: number};

export const boxOf = (poses: Pose[]): Box => ({
	left: Math.min(...poses.map((p) => p.x - projectedWidth(p) / 2)),
	right: Math.max(...poses.map((p) => p.x + projectedWidth(p) / 2)),
	top: Math.min(...poses.map((p) => p.y - (p.h * p.s) / 2)),
	bottom: Math.max(...poses.map((p) => p.y + (p.h * p.s) / 2)),
});

/**
 * The v6 phone stack, back layer first: the front layer at (frontX, frontY), each layer behind offset
 * along the diagonal (-dx, -dy) * k * spread, k = 1 for the back layer and 0 for the front one.
 */
export const diagonalStack = (o: {n: number; spread: number; yaw: number; frontX: number; frontY: number; dx: number; dy: number; w: number; h: number}): Pose[] =>
	Array.from({length: o.n}, (_, i) => {
		const k = o.n > 1 ? (o.n - 1 - i) / (o.n - 1) : 0;
		return {x: o.frontX - o.dx * k * o.spread, y: o.frontY - o.dy * k * o.spread, w: o.w, h: o.h, s: 1, yaw: o.yaw};
	});

/**
 * The v8 screen stack, back layer first: the front layer's left edge at frontLeft, the back layer's right
 * edge at farRight and its centre `rise` higher, the layers between spread evenly.
 */
export const screenStack = (o: {n: number; frontLeft: number; farRight: number; cy: number; rise: number; w: number; h: number; yaw: number}): Pose[] => {
	const pw = o.w * Math.abs(cos(o.yaw));
	const front = o.frontLeft + pw / 2;
	const back = o.farRight - pw / 2;
	return Array.from({length: o.n}, (_, i) => {
		const k = o.n > 1 ? (o.n - 1 - i) / (o.n - 1) : 0;
		return {x: mix(k, front, back), y: o.cy - o.rise * k, w: o.w, h: o.h, s: 1, yaw: o.yaw};
	});
};

/**
 * The v8 card deck: depth slot d (0 = front) of a deck of `slots` cards seen from the right; the far slot
 * sits at the left frame edge at `farScale`. Returns the card's left edge (px) and scale about its left-middle.
 */
export const deckSlot = (d: number, slots: number, frontLeft: number, farScale: number) => {
	const k = slots > 1 ? (1 / farScale - 1) / (slots - 1) : 0;
	const s = 1 / (1 + d * k);
	return {left: (frontLeft * (s - farScale)) / (1 - farScale), s};
};

/** Draws one posed layer; children fill it. Layers are painted in the order given (back first). */
export const PoseLayer: React.FC<{pose: Pose; children: React.ReactNode; style?: React.CSSProperties}> = ({pose, children, style}) => (
	<div
		style={{
			position: 'absolute',
			left: pose.x - pose.w / 2,
			top: pose.y - pose.h / 2,
			width: pose.w,
			height: pose.h,
			transform: `scale3d(${pose.s}, ${pose.s}, ${pose.s}) rotateY(${pose.yaw}deg)`,
			opacity: pose.opacity,
			...style,
		}}
	>
		{children}
	</div>
);
