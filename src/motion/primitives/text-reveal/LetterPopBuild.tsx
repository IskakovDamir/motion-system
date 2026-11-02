import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {maybe, mix, num, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {splitText} from '../../engine/text';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {capOf, colorOf, listOf, numsOf, seededOrder, toneOf, trackAt, trackOf, typeCss, typeOf} from './kit';
import {spec} from './LetterPopBuild.spec';

export type LetterPopBuildProps = {
	text: string;
	tone?: Tone;
	variant?: string;
	/** the mark the row builds from (mixedPops: the icon that re-centres; tighten: the glyph on its tile) */
	mark?: React.ReactNode;
	delay?: number;
	style?: React.CSSProperties;
};

// Baseline of an Inter line box with line-height normal: ascent 0.969 em of 1.211 em, 80 % from the top.
const BASELINE = '50% 80%';

const Mark: React.FC<{size: number; color: string; hole: string}> = ({size, color, hole}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<circle cx={50} cy={50} r={46} fill={color} />
		<circle cx={50} cy={50} r={20} fill={hole} />
	</svg>
);

const MixedPops: React.FC<LetterPopBuildProps> = ({text, tone = 'light', variant, mark, delay = 0, style}) => {
	const v = variantOf(spec, variant);
	const t = useCurrentFrame() - delay;
	const {height} = useFrame();
	const s = scheme(tone);
	const type = typeOf(v);
	const ink = colorOf(v, 'color', tone);
	const cap = capOf(type, height);
	const kinds = listOf(v, 'kinds');
	const onsets = numsOf(v, 'onsets');
	const amounts = numsOf(v, 'amounts');
	const tr = (key: string) => trackOf(v, key);
	const pieces = splitText(text, 'char');
	const letters = pieces.filter((p) => !p.space).length;
	const slots = kinds.length;
	const slotOf = (i: number) => (letters <= 1 ? 0 : Math.round((i * (slots - 1)) / (letters - 1)));
	const r = trackAt(tr('recentre'), t);
	const icon = num(v, 'iconSize') * cap;

	const glyphs = pieces.map((piece, i) => {
		if (piece.space) return <span key={i}>{piece.text}</span>;
		const j = slotOf(piece.index);
		const kind = kinds[j] ?? 'slideIn';
		const a = t - (onsets[j] ?? 0);
		const amount = (amounts[j] ?? 0) * cap;
		let transform = '';
		let dot: React.ReactNode = null;
		let shown = piece.text;
		if (kind === 'slideIn') transform = `translateX(${amount * trackAt(tr('slideIn'), a)}px)`;
		if (kind === 'split') transform = `translateX(${amount * trackAt(tr('split'), a)}px) scale(${trackAt(tr('splitScale'), a)})`;
		if (kind === 'speckSpin') transform = `scale(${trackAt(tr('speckScale'), a)}) rotate(${trackAt(tr('spin'), a)}deg)`;
		if (kind === 'speckBase') transform = `scale(${trackAt(tr('speckBase'), a)})`;
		if (kind === 'slideOut' || kind === 'slideOutShort') transform = `translateX(${amount * trackAt(tr(kind), a)}px)`;
		if (kind === 'stem') {
			transform = `scaleY(${trackAt(tr('stem'), a)})`;
			if (piece.text === 'i') {
				// the dotted stem: a dotless i plus a dot that hangs, drops into the stem and bounces
				shown = 'ı';
				const dotTr = tr('dotY');
				if (a >= (dotTr[0]?.[0] ?? 0)) {
					const size = num(v, 'dotSize') * cap * trackAt(tr('dotScale'), a);
					dot = (
						<span
							style={{
								position: 'absolute',
								left: '50%',
								bottom: `calc(20% + ${trackAt(dotTr, a) * cap - size}px)`,
								width: size,
								height: size,
								marginLeft: -size / 2,
								borderRadius: '50%',
								backgroundColor: ink,
							}}
						/>
					);
				}
			}
		}
		return (
			<span key={i} style={{position: 'relative', display: 'inline-block', opacity: a >= 0 ? 1 : 0}}>
				<span style={{display: 'inline-block', transform, transformOrigin: kind === 'speckSpin' ? '50% 50%' : BASELINE}}>{shown}</span>
				{dot}
			</span>
		);
	});

	return (
		<div
			style={{
				...typeCss(type, height),
				color: ink,
				position: 'relative',
				marginLeft: icon,
				paddingLeft: num(v, 'iconGap') * cap,
				transform: `translateX(${(1 - r) * 50}%)`,
				...style,
			}}
		>
			<div style={{position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', width: icon, height: icon}}>
				{mark ?? <Mark size={icon} color={ink} hole={s.bg} />}
			</div>
			{glyphs}
		</div>
	);
};

const Tighten: React.FC<LetterPopBuildProps> = ({text, tone = 'light', variant, mark, delay = 0, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const t = frame - delay;
	const {height, w, h} = useFrame();
	const s = scheme(tone);
	const type = typeOf(v);
	const ink = colorOf(v, 'color', tone);
	const slide = w(num(v, 'travel')) * (1 - p('x', delay));
	const grow = mix(p('scale', delay), num(v, 'fromScale'), 1);
	const glyph = h(num(v, 'glyphSize'));
	const tileSize = h(num(v, 'tileSize'));
	const ta = t - num(v, 'tileFrom');
	const pieces = splitText(text, 'char');
	const letters = pieces.filter((x) => !x.space).length;
	// letter 1 first (it rides the glyph), the rest in a seeded order
	const order = [0, ...seededOrder(letters - 1, `tighten-${text}`).map((k) => k + 1)];
	const rank = new Map(order.map((idx, k) => [idx, k]));
	const from = num(v, 'lettersFrom');
	const per = num(v, 'framesPerLetter');
	return (
		<div style={{display: 'flex', alignItems: 'center', ...style}}>
			<div style={{position: 'relative', width: tileSize, height: tileSize, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						borderRadius: tileSize * 0.24,
						backgroundColor: s.surfaceAlt,
						opacity: ta >= 0 ? 1 : 0,
						transform: `scale(${trackAt(trackOf(v, 'tile'), ta)})`,
					}}
				/>
				<div style={{width: glyph, height: glyph, transform: `translateX(${slide}px) scale(${grow})`, transformOrigin: 'right center'}}>
					{mark ?? <Mark size={glyph} color={ink} hole={s.surfaceAlt} />}
				</div>
			</div>
			<div style={{...typeCss(type, height), color: ink, marginLeft: h(num(v, 'letterGap'))}}>
				{pieces.map((piece, i) => {
					if (piece.space) return <span key={i}>{piece.text}</span>;
					const k = rank.get(piece.index) ?? 0;
					const on = t >= from + k * per;
					return (
						<span key={i} style={{display: 'inline-block', opacity: on ? 1 : 0, transform: piece.index === 0 ? `translateX(${slide}px)` : undefined}}>
							{piece.text}
						</span>
					);
				})}
			</div>
		</div>
	);
};

export const LetterPopBuild: React.FC<LetterPopBuildProps> = (props) => {
	const v = variantOf(spec, props.variant);
	return maybe(v, 'travel') === undefined ? <MixedPops {...props} /> : <Tighten {...props} />;
};

// ---- isolated demo ----

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const tone = toneOf(v);
	const s = scheme(tone);
	const text = str(v, 'case') === 'mixed' ? 'Pinstriped' : 'Waterfalls';
	return (
		<AbsoluteFill style={{backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center'}}>
			<LetterPopBuild text={text} tone={tone} variant={variant} />
		</AbsoluteFill>
	);
};
