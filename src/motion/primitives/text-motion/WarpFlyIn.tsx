import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {maybe, mix, num, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import type {Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {spec} from './WarpFlyIn.spec';
import {inkOf, sideAt, sizeOf, TextCells, TypeOn, typeCss, typeOf, type Align, type Unit} from './textKit';

export type WarpFlyInProps = {text: string; tone?: Tone; variant?: string};

type Inner = {text: string; tone: Tone; variant?: string};

// Lines fly in from opposite sides (the curve's side on `x`, the other on `xOther`) while all rise (`y`).
const Lines: React.FC<Inner> = ({text, tone, variant}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {w, h, height} = useFrame();
	const sides = str(v, 'sides');
	const curveSide = str(v, 'curveSide');
	const travel = num(v, 'travel');
	const travelOther = maybe(v, 'travelOther') ?? travel;
	const dy = h(maybe(v, 'rise') ?? 0) * (1 - p('y'));
	return (
		<TextCells
			text={text}
			unit="line"
			css={{...typeCss(typeOf(v), height), color: inkOf(v, 'ink', tone)}}
			align={str(v, 'align') as Align}
			look={(c) => {
				const side = sideAt(sides, c.index);
				const onCurve = side === curveSide;
				const dist = w(onCurve ? travel : travelOther) * (side === 'L' ? -1 : 1);
				return {style: {transform: `translate(${dist * (1 - p(onCurve ? 'x' : 'xOther'))}px, ${dy}px)`}};
			}}
		/>
	);
};

// One block flies in on a diagonal from the left (x) and from above or below (y), stretched tall at
// first (stretchY on `stretch`).
const Block: React.FC<Inner> = ({text, tone, variant}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {w, h, height} = useFrame();
	const dx = -w(num(v, 'travel')) * (1 - p('x'));
	const dy = h(num(v, 'rise')) * (1 - p('y'));
	const sy = mix(p('stretch'), num(v, 'stretchY'), 1);
	return (
		<TextCells
			text={text}
			unit="block"
			css={{...typeCss(typeOf(v), height), color: inkOf(v, 'ink', tone)}}
			align={str(v, 'align') as Align}
			look={() => ({style: {transform: `translate(${dx}px, ${dy}px) scaleY(${sy})`}})}
		/>
	);
};

const Lens: React.FC<{width: number; height: number; color: string; opacity: number}> = ({width, height, color, opacity}) => (
	<svg
		width={width}
		height={height}
		viewBox="0 0 100 20"
		preserveAspectRatio="none"
		style={{position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', opacity, overflow: 'visible'}}
	>
		<path d="M0 10 Q50 -10 100 10 Q50 30 0 10 Z" fill={color} />
	</svg>
);

// Each line starts as a lens-shaped blob where it begins, which gives way to the line typing on.
const Blob: React.FC<Inner> = ({text, tone, variant}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, height} = useFrame();
	const t = typeOf(v);
	const stagger = maybe(v, 'stagger') ?? 0;
	const rate = num(v, 'typeRate');
	const bottomFirst = v.params?.bottomFirst === true;
	const ink = inkOf(v, 'ink', tone);
	return (
		<TextCells
			text={text}
			unit={str(v, 'unit') as Unit}
			css={{...typeCss(t, height), color: ink}}
			align={str(v, 'align') as Align}
			look={(c, n) => {
				const off = (bottomFirst ? n - 1 - c.index : c.index) * stagger;
				const started = frame >= off;
				return {
					before: <Lens width={w(num(v, 'blob'))} height={(t.capHeight / 100) * height} color={ink} opacity={started ? 1 - p('blob', off) : 0} />,
					content: <TypeOn text={c.text} start={off} rate={rate} fade={0} />,
				};
			}}
		/>
	);
};

// Two lines enter as horizontal smears from opposite edges: the upper from the right (bold), the
// lower from the left, its right end first (head) while its left end catches up (capital), then the
// whole lockup scales to rest (scale).
const Smear: React.FC<Inner> = ({text, tone, variant}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, h, height} = useFrame();
	const t = typeOf(v);
	const [upper = '', lower = ''] = text.split('\n');
	const boldStart = v.motions.bold?.delay ?? 0;
	const stretch = mix(p('capital'), num(v, 'smear'), 1);
	return (
		<div
			style={{
				...typeCss(t, height),
				color: inkOf(v, 'ink', tone),
				textAlign: str(v, 'align') as React.CSSProperties['textAlign'],
				lineHeight: `${h(num(v, 'pitch'))}px`,
				transform: `scale(${mix(p('scale'), num(v, 'scaleFrom'), 1)})`,
			}}
		>
			<div>
				<span
					style={{
						display: 'inline-block',
						opacity: frame >= boldStart ? 1 : 0,
						transform: `translateX(${w(num(v, 'boldTravel')) * (1 - p('bold'))}px)`,
					}}
				>
					{upper}
				</span>
			</div>
			<div>
				<span
					style={{
						display: 'inline-block',
						fontWeight: maybe(v, 'otherWeight'),
						fontSize: sizeOf(t, height, maybe(v, 'capHeightOther') ?? t.capHeight),
						transformOrigin: 'right center',
						transform: `translateX(${-w(num(v, 'headTravel')) * (1 - p('head'))}px) scaleX(${stretch})`,
					}}
				>
					{lower}
				</span>
			</div>
		</div>
	);
};

export const WarpFlyIn: React.FC<WarpFlyInProps> = ({text, tone = 'dark', variant}) => {
	const mode = str(variantOf(spec, variant), 'mode');
	const C = mode === 'block' ? Block : mode === 'blob' ? Blob : mode === 'smear' ? Smear : Lines;
	return <C text={text} tone={tone} variant={variant} />;
};

// ---- Demo ----

const TEXT: Record<string, string> = {
	liquid: 'RUN FAR\nNOW',
	rubbery: 'THREE SMALL WORDS',
	blobMorph: 'LEFT PANEL\nRIGHT PANEL',
	chromeSmear: 'Quiet\nWater',
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const right = variant === 'blobMorph';
	return (
		<AbsoluteFill style={{justifyContent: 'center', alignItems: right ? 'flex-end' : 'center', paddingRight: right ? '62%' : 0, overflow: 'hidden'}}>
			<WarpFlyIn variant={variant} tone={spec.demoTone} text={TEXT[variant] ?? 'PLAIN WORDS'} />
		</AbsoluteFill>
	);
};
