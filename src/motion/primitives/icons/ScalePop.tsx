import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {maybe, mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FONT, TYPE, fontSize} from '../../tokens/type';
import type {DemoProps} from '../types';
import {cyc, nums, stepIndex} from './geom';
import {Shape, Tile} from './shapes';
import {spec} from './ScalePop.spec';

export type ScalePopProps = {
	children: React.ReactNode;
	tone?: Tone;
	variant?: string;
	/** content width in px; variants that start from an absolute size (glowGrow: a dot 1% W across) need it */
	width?: number;
	/** discGrow: draw the thread connector under the element (on by default when the variant has one) */
	connector?: boolean;
	/** connector stroke in px (not measured) */
	lineWidth?: number;
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const ScalePop: React.FC<ScalePopProps> = ({children, tone = 'light', variant, width, connector = true, lineWidth = 2}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, h, px} = useFrame();
	const s = scheme(tone);

	// a grid that builds cell by cell: each child is one cell, laid out 2 x 2 in reading order
	if (v.params?.cellOffsets !== undefined) {
		const offs = nums(v, 'cellOffsets');
		const from = num(v, 'fromScale');
		return (
			<div style={{display: 'grid', gridTemplateColumns: 'repeat(2, auto)'}}>
				{React.Children.toArray(children).map((c, i) => {
					const off = cyc(offs, i);
					return (
						<div key={i} style={{transform: `scale(${mix(p('cell', off), from, 1)})`, opacity: frame >= off ? 1 : 0}}>
							{c}
						</div>
					);
				})}
			</div>
		);
	}

	let scale = 1;
	let opacity = 1;
	if (v.params?.stepFrames !== undefined) {
		// a pop shown on a few pictures: the measured value of each picture, held until the next
		const k = stepIndex(frame, nums(v, 'stepFrames'));
		scale = k < 0 ? 0 : cyc(nums(v, 'scaleSteps'), k);
		opacity = k < 0 ? 0 : cyc(nums(v, 'opacitySteps'), k);
	} else {
		const fromWidth = maybe(v, 'fromWidth');
		const from = fromWidth !== undefined ? (width ? w(fromWidth) / width : 0) : num(v, 'fromScale');
		if (v.motions.scaleUp) {
			const peak = num(v, 'peakScale');
			scale = mix(p('scaleUp'), from, peak) + (1 - peak) * p('scaleSettle');
		} else if (v.params?.steps !== undefined) {
			// the curve is the envelope; only its value at each picture is shown
			const steps = nums(v, 'steps');
			const k = stepIndex(frame, steps);
			scale = k < 0 ? 0 : mix(p('scale', frame - cyc(steps, k)), from, 1);
			opacity = k < 0 ? 0 : 1;
		} else {
			scale = mix(p('scale'), from, 1);
		}
		if (v.motions.opacity) opacity = clamp01(mix(p('opacity'), maybe(v, 'fromOpacity') ?? 0, 1));
	}
	const fromAngle = maybe(v, 'fromAngle');
	const rotate = (fromAngle !== undefined ? mix(p('rotate'), fromAngle, 0) : 0) + (maybe(v, 'restAngle') ?? 0);
	const conn = maybe(v, 'connectorLength');

	return (
		<div style={{position: 'relative', display: 'inline-block'}}>
			{conn !== undefined && connector ? (
				<div
					style={{
						position: 'absolute',
						left: '50%',
						top: `${(0.5 + num(v, 'connectorTop')) * 100}%`,
						width: px(lineWidth),
						marginLeft: -px(lineWidth) / 2,
						height: Math.max(0, h(conn) * p('connector')),
						backgroundColor: s.line,
						borderRadius: px(lineWidth),
					}}
				/>
			) : null}
			<div style={{transform: `rotate(${rotate}deg) scale(${Math.max(0, scale)})`, transformOrigin: '50% 50%', opacity}}>{children}</div>
		</div>
	);
};

// ---- Demo: one neutral shape (or a chip, a 2 x 2 grid) alone at the centre ----

const Box: React.FC<{size: number; h?: number; children: React.ReactNode}> = ({size, h, children}) => (
	<div style={{width: size, height: h ?? size}}>{children}</div>
);

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const {px, height} = useFrame();
	const s = scheme('light');
	const rest = (fallback: number) => px(maybe(v, 'restSize') ?? fallback);
	let content: React.ReactNode;
	let width: number | undefined;
	switch (variant) {
		case 'strongOut':
			content = <Box size={rest(0)}><Shape kind="square" fill={s.ink} /></Box>;
			break;
		case 'fadeGrow':
			content = <Box size={px(220)}><Shape kind="square" fill={s.ink} /></Box>;
			break;
		case 'spinTilt':
			content = <Box size={rest(0)}><Tile kind="plus" tile={s.ink} mark={s.onAccent} /></Box>;
			break;
		case 'longTail':
			content = (
				<Box size={rest(0)}>
					<div style={{width: '100%', height: '100%', borderRadius: '50%', border: `${px(4)}px solid ${s.ink}`, backgroundColor: s.muted, boxSizing: 'border-box'}} />
				</Box>
			);
			break;
		case 'sliverGrow':
			content = <Box size={rest(0)}><Tile kind="triangle" tile={s.accent} mark={s.onAccent} /></Box>;
			break;
		case 'rideIn':
		case 'springDip':
			content = <Box size={rest(0)}><Shape kind="disc" fill={s.inkSoft} /></Box>;
			break;
		case 'discGrow':
			content = <Box size={rest(0)}><Shape kind="disc" fill={s.muted} /></Box>;
			break;
		case 'glowGrow':
			// an inline-sized icon (not measured): the 1% W dot grows a few times, as in the reference line
			width = px(60);
			content = <Box size={width}><Tile kind="diamond" tile={s.ink} mark={s.surface} /></Box>;
			break;
		case 'cellByCell': {
			const c = px(num(v, 'cellSize'));
			// an array, so each cell reaches ScalePop as its own child
			content = [0, 1, 2, 3].map((i) => (
				<div key={i} style={{padding: c * 0.12}}>
					<div style={{width: c, height: c, borderRadius: c * 0.28, backgroundColor: s.ink}} />
				</div>
			));
			break;
		}
		case 'threeStep':
			content = (
				<div
					style={{
						width: px(num(v, 'restW')),
						height: px(num(v, 'restH')),
						borderRadius: px(num(v, 'restH')) / 2,
						backgroundColor: s.accent,
						color: s.onAccent,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontFamily: FONT[TYPE.ui.font],
						fontSize: fontSize('ui', height),
					}}
				>
					Ready
				</div>
			);
			break;
		case 'glowSettle':
			content = <Box size={rest(0)}><Shape kind="square" fill={s.muted} /></Box>;
			break;
		case 'twoPicture':
			content = <Box size={rest(0)}><Tile kind="triangle" tile={s.ink} mark={s.surface} /></Box>;
			break;
		case 'overshootPeak':
			content = <Box size={rest(0)}><Tile kind="plus" tile={s.inkSoft} mark={s.surface} round /></Box>;
			break;
		case 'blurOvershoot':
			content = <Box size={px(num(v, 'restW'))} h={px(num(v, 'restH'))}><Shape kind="diamond" fill={s.ink} /></Box>;
			break;
		case 'spinSpring':
			// the glyph spins inside a tile that holds still
			return (
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
					<div style={{width: px(200), height: px(200), borderRadius: px(44), backgroundColor: s.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<ScalePop variant={variant}>
							<Box size={px(96)}><Shape kind="plus" fill={s.ink} /></Box>
						</ScalePop>
					</div>
				</AbsoluteFill>
			);
		default:
			content = <Box size={px(200)}><Shape kind="square" fill={s.ink} /></Box>;
	}
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<ScalePop variant={variant} width={width}>
				{content}
			</ScalePop>
		</AbsoluteFill>
	);
};
