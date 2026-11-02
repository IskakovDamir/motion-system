import type {TransitionPresentation, TransitionPresentationComponentProps, TransitionTiming} from '@remotion/transitions';
import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {num, variantOf} from '../../engine/anim';
import {mix} from '../../engine/progress';
import {splitText} from '../../engine/text';
import {motionTiming} from '../../engine/transition';
import {scheme, type Tone} from '../../tokens/colors';
import {linear} from '../../tokens/easing';
import type {DemoProps, VariantSpec} from '../types';
import {At, keyAt, keys, mot, motionEnd, prog, Shape, useT, Word} from './kit';
import {spec} from './ContentSwap.spec';

// One picture of a content swap at frame t (60 fps from its start): the outgoing content and the
// incoming content of one slot of a held layout, each with its visibility, opacity and offset.
// ContentSwap and contentSwapPresentation draw the same pictures.

type Side = {shown: boolean; opacity: number; x: number; y: number};
type Picture = {from: Side; to: Side; words: number};

const lengthOf = (name: string, v: VariantSpec): number =>
	name === 'titleFade' ? num(v, 'popAt') + 1 : Math.max(...Object.values(v.motions).map(motionEnd));

/** dropThrough's outgoing offset (% H): its ease-in, then on at its last measured speed. */
const dropOut = (v: VariantSpec, t: number): number => {
	const end = motionEnd(mot(v, 'out'));
	return num(v, 'outDrop') * prog(v, 'out', Math.min(t, end)) + num(v, 'outSpeed') * Math.max(0, t - end);
};

const picture = (name: string, v: VariantSpec, t: number, height: number): Picture => {
	const px = (at1080: number) => (at1080 * height) / 1080;
	const ph = (pct: number) => (pct / 100) * height;
	const still: Side = {shown: true, opacity: 1, x: 0, y: 0};

	if (name === 'titleFade') {
		const pop = num(v, 'popAt');
		return {
			from: {...still, shown: prog(v, 'opacity', t) < 1, opacity: 1 - prog(v, 'opacity', t)},
			to: {...still, shown: t >= pop},
			words: t < pop ? 0 : Math.floor((t - pop) / num(v, 'wordGap')) + 1,
		};
	}
	if (name === 'slideThrough') {
		const po = prog(v, 'out', t);
		const pi = prog(v, 'opacity', t);
		const cut = num(v, 'cut');
		return {
			from: {shown: t < cut, opacity: mix(po, 1, num(v, 'outTo')), x: px(mix(po, 0, num(v, 'outShift'))), y: 0},
			to: {shown: t >= cut, opacity: pi, x: px(mix(pi, num(v, 'inShift'), 0)), y: 0},
			words: Number.POSITIVE_INFINITY,
		};
	}
	if (name === 'dropThrough') {
		const cut = num(v, 'cut');
		return {
			from: {...still, shown: t < cut, y: ph(dropOut(v, t))},
			to: {...still, shown: t >= cut, y: ph(mix(prog(v, 'y', t), -num(v, 'travel'), 0))},
			words: Number.POSITIVE_INFINITY,
		};
	}
	if (name === 'crossfadeSlide') {
		const a = keyAt(keys(v, 'outAlpha'), t);
		return {
			from: {...still, shown: a > 0, opacity: a},
			to: {...still, shown: a < 1, opacity: 1 - a, y: ph(mix(prog(v, 'y', t), num(v, 'travel'), 0))},
			words: Number.POSITIVE_INFINITY,
		};
	}
	if (name === 'oneFrame') {
		const p = prog(v, 'swap', t);
		return {
			from: {...still, shown: p < 1},
			to: {...still, shown: p > 0, opacity: mix(prog(v, 'brighten', t), num(v, 'fromBright'), 1)},
			words: Number.POSITIVE_INFINITY,
		};
	}
	throw new Error(`ContentSwap has no variant ${name}`);
};

const Words: React.FC<{text: string; count: number}> = ({text, count}) => (
	<>
		{splitText(text, 'word').map((piece, i) => (
			<span key={i} style={{visibility: piece.space || piece.index < count ? 'inherit' : 'hidden', whiteSpace: 'pre'}}>
				{piece.text}
			</span>
		))}
	</>
);

const SideView: React.FC<{side: Side; children: React.ReactNode}> = ({side, children}) => (
	<AbsoluteFill style={{visibility: side.shown ? 'inherit' : 'hidden', opacity: side.opacity, transform: `translate(${side.x}px, ${side.y}px)`}}>
		{children}
	</AbsoluteFill>
);

const content = (node: React.ReactNode, words: number) =>
	typeof node === 'string' ? (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<span style={{whiteSpace: 'nowrap'}}>
				<Words text={node} count={words} />
			</span>
		</AbsoluteFill>
	) : (
		node
	);

export type ContentSwapProps = {
	/** what the slot shows before; a string is set as one centred line */
	from: React.ReactNode;
	/** what the slot shows after; a string pops in word by word where the variant does */
	to: React.ReactNode;
	tone?: Tone;
	variant?: string;
};

/** Fills its parent (the slot); a parent with overflow hidden clips the swap like a panel edge. */
export const ContentSwap: React.FC<ContentSwapProps> = ({from, to, variant}) => {
	const t = useT();
	const {height} = useVideoConfig();
	const name = variant ?? spec.defaultVariant;
	const pic = picture(name, variantOf(spec, variant), t, height);
	return (
		<AbsoluteFill>
			<SideView side={pic.from}>{content(from, Number.POSITIVE_INFINITY)}</SideView>
			<SideView side={pic.to}>{content(to, pic.words)}</SideView>
		</AbsoluteFill>
	);
};

type SwapPresentationProps = {variant: string};

const SwapPresentation: React.FC<TransitionPresentationComponentProps<SwapPresentationProps>> = ({
	children,
	presentationDirection,
	presentationProgress,
	passedProps,
}) => {
	const {height} = useVideoConfig();
	const v = variantOf(spec, passedProps.variant);
	const pic = picture(passedProps.variant, v, presentationProgress * lengthOf(passedProps.variant, v), height);
	return <SideView side={presentationDirection === 'exiting' ? pic.from : pic.to}>{children}</SideView>;
};

/** The swap as a TransitionSeries presentation between two whole scenes (a scene pops in as one block). */
export const contentSwapPresentation = (variant?: string): TransitionPresentation<SwapPresentationProps> => ({
	component: SwapPresentation,
	props: {variant: variant ?? spec.defaultVariant},
});

/** Its timing: a steady clock over the variant's length; the measured curves run inside the presentation. */
export const contentSwapTiming = (variant?: string): TransitionTiming => {
	const name = variant ?? spec.defaultVariant;
	return motionTiming({duration: lengthOf(name, variantOf(spec, variant)), delay: 0, ease: linear});
};

// ---- Demo: one slot of a held layout swaps, the rest stays ----

const Bars: React.FC<{tone: Tone; rows: number[]; dark?: boolean}> = ({tone, rows, dark}) => {
	const s = scheme(tone);
	return (
		<div style={{display: 'flex', flexDirection: 'column', gap: '7%', padding: '10%', height: '100%', boxSizing: 'border-box'}}>
			{rows.map((w, i) => (
				<div key={i} style={{width: `${w}%`, height: '8%', borderRadius: 999, backgroundColor: i === 0 || dark ? s.inkSoft : s.line}} />
			))}
		</div>
	);
};

const Panel: React.FC<{tone: Tone; style?: React.CSSProperties; children?: React.ReactNode}> = ({tone, style, children}) => {
	const s = scheme(tone);
	return <div style={{position: 'absolute', backgroundColor: s.surface, border: `2px solid ${s.line}`, borderRadius: 28, overflow: 'hidden', ...style}}>{children}</div>;
};

const Grid: React.FC<{tone: Tone; kind: 'square' | 'disc'}> = ({tone, kind}) => {
	const s = scheme(tone);
	return (
		<div style={{position: 'absolute', inset: '10%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10%'}}>
			{Array.from({length: 6}, (_, i) => (
				<div key={i} style={{aspectRatio: '1', width: '100%'}}>
					<Shape kind={kind} fill={i % 2 ? s.muted : s.inkSoft} />
				</div>
			))}
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const {height} = useVideoConfig();
	const keep = (
		<Panel tone={tone} style={{left: '8%', top: '16%', width: '30%', height: '68%'}}>
			<Bars tone={tone} rows={[60, 90, 75, 85, 40]} />
		</Panel>
	);
	if (variant === 'titleFade') {
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<At x={50} y={36} w={height * 1.6} h={height * 0.16} style={{fontFamily: 'inherit'}}>
					<Word tone={tone} role="display" style={{display: 'block', width: '100%', height: '100%'}}>
						<ContentSwap variant={variant} from="Plain words here" to="Three new words" />
					</Word>
				</At>
				{[30, 50, 70].map((x) => (
					<At key={x} x={x} y={68} w={height * 0.07} h={height * 0.07}>
						<Shape kind="disc" fill={s.inkSoft} />
					</At>
				))}
				<div style={{position: 'absolute', left: '30%', width: '40%', top: '68%', height: 3, marginTop: -1.5, backgroundColor: s.line}} />
			</AbsoluteFill>
		);
	}
	if (variant === 'dropThrough') {
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				{keep}
				<Panel tone={tone} style={{left: '44%', top: '16%', width: '48%', height: '68%'}}>
					<ContentSwap variant={variant} from={<Grid tone={tone} kind="square" />} to={<Grid tone={tone} kind="disc" />} />
				</Panel>
			</AbsoluteFill>
		);
	}
	if (variant === 'crossfadeSlide') {
		const screen = (rows: number[], word: string) => (
			<AbsoluteFill style={{backgroundColor: s.surface}}>
				<div style={{position: 'absolute', left: '10%', top: '8%'}}>
					<Word tone={tone} role="headline">
						{word}
					</Word>
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: '22%', bottom: 0}}>
					<Bars tone={tone} rows={rows} />
				</div>
			</AbsoluteFill>
		);
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				{keep}
				<Panel tone={tone} style={{left: '52%', top: '8%', width: height * 0.46, height: '84%', borderRadius: 48}}>
					<ContentSwap variant={variant} from={screen([70, 90, 60, 80, 50], 'Inbox')} to={screen([50, 85, 95, 40, 70], 'Plans')} />
				</Panel>
			</AbsoluteFill>
		);
	}
	if (variant === 'oneFrame') {
		const button = (kind: 'bars' | 'triangle') => (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{width: '100%', height: '100%', borderRadius: '50%', backgroundColor: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
					<div style={{width: '44%', height: '44%'}}>
						<Shape kind={kind} fill={s.onAccent} />
					</div>
				</div>
			</AbsoluteFill>
		);
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				{keep}
				<At x={62} y={50} w={height * 0.6} h={height * 0.12}>
					<Word tone={tone} role="headline" style={{display: 'block', width: '100%', height: '100%'}}>
						<ContentSwap variant={variant} from="Waiting" to="Done" />
					</Word>
				</At>
				<At x={84} y={50} w={height * 0.12} h={height * 0.12}>
					<ContentSwap variant={variant} from={button('bars')} to={button('triangle')} />
				</At>
			</AbsoluteFill>
		);
	}
	// slideThrough: a window inside a held two-window layout
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			{keep}
			<div style={{position: 'absolute', left: '44%', top: '16%', width: '48%', height: '68%'}}>
				<ContentSwap
					variant={variant}
					from={
						<Panel tone="dark" style={{inset: 0}}>
							<Bars tone="dark" rows={[40, 80, 65, 90, 55]} />
						</Panel>
					}
					to={
						<Panel tone="dark" style={{inset: 0}}>
							<Bars tone="dark" rows={[70, 50, 95, 60, 85]} dark />
						</Panel>
					}
				/>
			</div>
		</AbsoluteFill>
	);
};
