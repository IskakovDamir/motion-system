import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {flag, maybe, mix, num, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {cyc} from './geom';
import {spec} from './MarkBars.spec';

export type MarkBarsProps = {
	tone?: Tone;
	variant?: string;
	/** bar colour (default the tone's ink) */
	color?: string;
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Two bars centred on the point where the component is placed (it takes no layout space). */
export const MarkBars: React.FC<MarkBarsProps> = ({tone = 'light', variant, color}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {px} = useFrame();
	const ink = color ?? scheme(tone).ink;
	const bw = px(num(v, 'barW'));
	const bh = px(num(v, 'barH'));
	const gap = px(maybe(v, 'gap') ?? num(v, 'barW'));
	const closed = maybe(v, 'closedScale') ?? 1;

	let tx = 0;
	let ty = 0;
	let sx = 1;
	let sy = 1;
	let glyph = 'bar';
	if (name === 'slideSquash') {
		const k = p('x');
		tx = mix(k, num(v, 'fromX'), num(v, 'toX'));
		ty = mix(p('y'), num(v, 'fromY'), num(v, 'toY'));
		// the squash peaks mid-move and is gone at both ends of it
		const bump = 4 * clamp01(k) * (1 - clamp01(k));
		sy = mix(bump, 1, num(v, 'squash'));
		sx = mix(bump, 1, num(v, 'stretch'));
	} else if (name === 'squashShut') {
		sy = mix(p('shut'), 1, closed) + (1 - closed) * p('scaleY');
	} else if (name === 'squashPair') {
		sy = mix(p('close') - p('open'), 1, closed);
	} else if (name === 'openFromDash' || name === 'openToPills') {
		sy = mix(p('height'), closed, 1);
	} else if (name === 'slideHoldReturn') {
		tx = num(v, 'outX') * p('out') + (num(v, 'backX') - num(v, 'outX')) * p('x');
		ty = num(v, 'outY') * p('out') + (num(v, 'backY') - num(v, 'outY')) * p('x');
	} else if (name === 'glyphSwap') {
		glyph = cyc(str(v, 'glyphs').split(' '), Math.floor(frame / num(v, 'every')));
	}

	const radius = flag(v, 'round') ? bw / 2 : 0;
	const bar = (side: -1 | 1) => {
		const cx = side * (gap / 2 + bw / 2);
		const common: React.CSSProperties = {position: 'absolute', left: cx - bw / 2, top: -bh / 2, width: bw, height: bh};
		if (glyph === 'dash') return <div key={side} style={{...common, top: (-bh * closed) / 2, height: bh * closed, backgroundColor: ink}} />;
		if (glyph === 'ring')
			return <div key={side} style={{...common, top: -bw / 2, height: bw, borderRadius: '50%', border: `${bw / 4}px solid ${ink}`, boxSizing: 'border-box'}} />;
		if (glyph === 'dot') return <div key={side} style={{...common, top: -bw / 2, height: bw, borderRadius: '50%', backgroundColor: ink}} />;
		return <div key={side} style={{...common, borderRadius: radius, backgroundColor: ink, transform: `scaleY(${Math.max(0, sy)})`, transformOrigin: '50% 50%'}} />;
	};

	return (
		<div style={{position: 'relative', width: 0, height: 0, transform: `translate(${px(tx)}px, ${px(ty)}px) scaleX(${sx})`}}>
			{bar(-1)}
			{bar(1)}
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => (
	<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
		<MarkBars variant={variant} />
	</AbsoluteFill>
);
