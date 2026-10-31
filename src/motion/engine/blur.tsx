import type React from 'react';
import {useId} from 'react';

// Directional (motion) blur: a Gaussian with separate x and y deviations, the way the references
// smear a layer along its travel. Amounts are px at the rendered size; below 0.05 px on both axes
// the filter is off. The tree is the same either way, so children never remount mid-motion.

export const DirectionalBlur: React.FC<{x?: number; y?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
	x = 0,
	y = 0,
	style,
	children,
}) => {
	const id = `dblur${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	const on = x >= 0.05 || y >= 0.05;
	return (
		<>
			<svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
				<filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
					<feGaussianBlur stdDeviation={`${Math.max(0, x)} ${Math.max(0, y)}`} edgeMode="none" />
				</filter>
			</svg>
			<div style={{...style, filter: on ? `url(#${id})` : undefined}}>{children}</div>
		</>
	);
};
