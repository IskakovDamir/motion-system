import type React from 'react';

// Plain geometric shapes for the icons group's demos (and any composition that needs a neutral
// icon): each fills its box, so the primitive or the layout around it decides the size.

export type ShapeKind = 'hex' | 'disc' | 'square' | 'ring' | 'plus' | 'diamond' | 'triangle';

const HEX = '25,3 75,3 98,50 75,97 25,97 2,50';

/** stretch: fill a non-square box instead of keeping the shape's proportions */
export const Shape: React.FC<{kind: ShapeKind; fill: string; stroke?: string; stretch?: boolean; style?: React.CSSProperties}> = ({kind, fill, stroke, stretch, style}) => (
	<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio={stretch ? 'none' : undefined} style={{display: 'block', overflow: 'visible', ...style}}>
		{kind === 'hex' ? <polygon points={HEX} fill={fill} stroke={stroke} strokeWidth={stroke ? 4 : 0} strokeLinejoin="round" /> : null}
		{kind === 'disc' ? <circle cx="50" cy="50" r="48" fill={fill} /> : null}
		{kind === 'square' ? <rect x="4" y="4" width="92" height="92" rx="22" fill={fill} /> : null}
		{kind === 'ring' ? <circle cx="50" cy="50" r="40" fill="none" stroke={fill} strokeWidth="14" /> : null}
		{kind === 'plus' ? <path d="M40 8h20v32h32v20H60v32H40V60H8V40h32z" fill={fill} /> : null}
		{kind === 'diamond' ? <polygon points="50,4 96,50 50,96 4,50" fill={fill} /> : null}
		{kind === 'triangle' ? <polygon points="50,8 95,90 5,90" fill={fill} strokeLinejoin="round" /> : null}
	</svg>
);

/** A shape on a rounded tile: the neutral stand-in for an app icon or a badge. */
export const Tile: React.FC<{kind: ShapeKind; tile: string; mark: string; round?: boolean}> = ({kind, tile, mark, round}) => (
	<div style={{width: '100%', height: '100%', borderRadius: round ? '50%' : '22%', backgroundColor: tile, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
		<div style={{width: '46%', height: '46%'}}>
			<Shape kind={kind} fill={mark} />
		</div>
	</div>
);
