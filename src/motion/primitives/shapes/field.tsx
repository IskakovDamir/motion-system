import type React from 'react';
import {useId} from 'react';
import {useFrame} from '../../engine/anim';
import {clamp01} from './kit';

// The background field helper: soft blobs, dot grids and halftone dot fields, each a full-frame layer
// in frame px. Sizes and levels come in from Backdrop's spec; nothing here holds a measured number.

/** A soft round blob: `color` at its centre fading to nothing at radius `r` (px). */
export const Blob: React.FC<{x: number; y: number; r: number; color: string; opacity?: number}> = ({x, y, r, color, opacity = 1}) => (
	<div
		style={{
			position: 'absolute',
			left: x - r,
			top: y - r,
			width: 2 * r,
			height: 2 * r,
			borderRadius: '50%',
			opacity: clamp01(opacity),
			background: `radial-gradient(circle closest-side, ${color} 0%, transparent 100%)`,
		}}
	/>
);

/**
 * A full-frame field of round dots on a square pitch (px), shifted by (dx, dy) px so it can drift;
 * `mask`: SVG content in frame px painted white where the dots show (none: everywhere).
 */
export const DotField: React.FC<{
	pitch: number;
	dot: number;
	color: string;
	dx?: number;
	dy?: number;
	opacity?: number;
	mask?: React.ReactNode;
	maskDefs?: React.ReactNode;
}> = ({pitch, dot, color, dx = 0, dy = 0, opacity = 1, mask, maskDefs}) => {
	const {width, height} = useFrame();
	const id = `df${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	if (opacity <= 0) return null;
	const ox = ((dx % pitch) + pitch) % pitch;
	const oy = ((dy % pitch) + pitch) % pitch;
	return (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0, opacity: clamp01(opacity)}}>
			<defs>
				<pattern id={`${id}p`} width={pitch} height={pitch} patternUnits="userSpaceOnUse" patternTransform={`translate(${ox} ${oy})`}>
					<circle cx={pitch / 2} cy={pitch / 2} r={dot / 2} fill={color} />
				</pattern>
				{maskDefs}
				{mask ? (
					<mask id={`${id}m`} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
						{mask}
					</mask>
				) : null}
			</defs>
			<rect x={0} y={0} width={width} height={height} fill={`url(#${id}p)`} mask={mask ? `url(#${id}m)` : undefined} />
		</svg>
	);
};

/** A radial white-to-black gradient (for a DotField mask): full at (x, y), gone at radius r (px). */
export const RadialMask: React.FC<{id: string; x: number; y: number; r: number; strength?: number}> = ({id, x, y, r, strength = 1}) => (
	<radialGradient id={id} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={Math.max(1, r)}>
		<stop offset="0%" stopColor="white" stopOpacity={clamp01(strength)} />
		<stop offset="100%" stopColor="white" stopOpacity={0} />
	</radialGradient>
);
