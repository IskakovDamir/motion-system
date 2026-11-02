import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {num, useFrame, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {TYPE} from '../../tokens/type';
import {FootageSlot} from '../footage/FootageSlot';
import type {DemoProps} from '../types';
import {perPart, typeCss, type LayoutType} from './kit';
import {spec} from './CaptionDrift.spec';

export type CaptionDriftProps = {
	/** caption lines separated by \n */
	text: string;
	tone?: Tone;
	variant?: string;
	style?: React.CSSProperties;
};

// The lines stand like stairs (indents from stepX, baselines pitch apart) and the block slides at the
// variant's constant velocity from its first frame to its last; there is no settle.
export const CaptionDrift: React.FC<CaptionDriftProps> = ({text, tone = 'dark', variant, style}) => {
	const v = variantOf(spec, variant);
	const frame = useCurrentFrame();
	const {w, h, height} = useFrame();
	const caption = TYPE.caption;
	const t: LayoutType = {font: caption.font, weight: num(v, 'weight'), capHeight: num(v, 'capHeight'), tracking: caption.tracking};
	const pitch = h(num(v, 'pitch'));
	let indent = 0;
	return (
		<div style={{transform: `translate(${w(num(v, 'velocityX')) * frame}px, ${h(num(v, 'velocityY')) * frame}px)`, ...style}}>
			{text.split('\n').map((line, i) => {
				if (i > 0) indent += w(perPart(v, 'stepX', i - 1) ?? 0);
				return (
					<div key={i} style={{...typeCss(t, height), color: scheme(tone).ink, height: pitch, lineHeight: `${pitch}px`, marginLeft: indent}}>
						{line}
					</div>
				);
			})}
		</div>
	);
};

// ---- isolated demo ----

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'dark';
	// a still plate behind, so the drift reads against it; the caption starts where S06 caption 3 stood on its
	// first picture (line 1 at 7.6% W / 39.1% H 35 f in, moved back by 35 f of drift)
	return (
		<AbsoluteFill>
			<FootageSlot tone={tone} />
			<div style={{position: 'absolute', left: '20.6%', top: '39.8%'}}>
				<CaptionDrift variant={variant} tone={tone} text={'keep it simple\nand let it breathe'} />
			</div>
		</AbsoluteFill>
	);
};
