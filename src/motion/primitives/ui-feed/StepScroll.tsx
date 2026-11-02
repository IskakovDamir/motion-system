import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {maybe, num, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {Bar, Disc, Panel, Word} from './kit';
import {spec} from './StepScroll.spec';

export type StepScrollProps = {
	items: React.ReactNode[];
	tone?: Tone;
	variant?: string;
	/** centre of the first item before any step, % of frame height (default: the variant's measured startY, else the top edge) */
	startY?: number;
	/** how many steps play (default: one per item after the first) */
	steps?: number;
	/** bottom-anchored lists: items in view before the first step */
	initial?: number;
	/** bottom-anchored lists: space between items, px at 1080 (layout) */
	gap?: number;
	style?: React.CSSProperties;
};

// Top-anchored lists sit on a fixed pitch (`step` % H) and the whole column moves up one pitch per
// step, the steps `stepEvery` frames apart, plus a constant base drift. A bottom-anchored list takes
// each new item's slot in the frame of its step, so the list moves up by that item's height plus gap.
export const StepScroll: React.FC<StepScrollProps> = ({items, variant, startY, steps, initial = 1, gap = 0, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {h, px} = useFrame();
	const every = num(v, 'stepEvery');
	const drift = h(maybe(v, 'baseDrift') ?? 0) * frame;
	if (str(v, 'anchor') === 'bottom') {
		return (
			<div style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: px(gap), height: '100%', overflow: 'hidden', ...style}}>
				<div style={{display: 'flex', flexDirection: 'column', gap: px(gap), transform: `translateY(${-drift}px)`}}>
					{items.map((item, i) => {
						const k = i - initial;
						if (k >= 0 && p('y', k * every) < 0.5) return null;
						return (
							<div key={i} style={{flexShrink: 0}}>
								{item}
							</div>
						);
					})}
				</div>
			</div>
		);
	}
	const pitch = h(num(v, 'step'));
	const n = steps ?? items.length - 1;
	let done = 0;
	for (let k = 0; k < n; k++) done += p('y', k * every);
	const top = h(startY ?? maybe(v, 'startY') ?? 0) - pitch / 2;
	return (
		<div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style}}>
			<div style={{position: 'absolute', left: 0, right: 0, top, transform: `translateY(${-(done * pitch + drift)}px)`}}>
				{items.map((item, i) => (
					<div key={i} style={{height: pitch, display: 'flex', alignItems: 'center'}}>
						{item}
					</div>
				))}
			</div>
		</div>
	);
};

// ---- isolated demo ----

const H = 1080;
const WORDS = ['north', 'amber', 'seven', 'cedar', 'delta', 'maple', 'orbit', 'tide'];

const FeedRow: React.FC<{tone: Tone; i: number}> = ({tone, i}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: 40, paddingLeft: 360}}>
		<Disc tone={tone} d={150} fill={i % 2 ? 'muted' : 'ink'} />
		<div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
			<Word tone={tone} height={H} role="headline">
				{WORDS[i % WORDS.length]}
			</Word>
			<Bar tone={tone} w={520 + (i % 3) * 120} h={22} />
			<Bar tone={tone} w={380} h={22} />
		</div>
	</div>
);

const Block: React.FC<{tone: Tone; i: number}> = ({tone, i}) => (
	<div style={{display: 'flex', gap: 40, paddingLeft: 360, alignItems: 'flex-start'}}>
		<Disc tone={tone} d={110} fill={i % 2 ? 'muted' : 'ink'} />
		<div style={{display: 'flex', flexDirection: 'column', gap: 26}}>
			<Word tone={tone} height={H} role="headline">
				{WORDS[i % WORDS.length]}
			</Word>
			{[0, 1, 2, 3, 4].map((r) => (
				<Bar key={r} tone={tone} w={r === 4 ? 420 : 900 - ((r + i) % 3) * 80} h={24} />
			))}
		</div>
	</div>
);

const ChatRow: React.FC<{tone: Tone; i: number; mine: boolean}> = ({tone, i, mine}) => {
	const s = scheme(tone);
	return (
		<div style={{display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', width: 760}}>
			<div
				style={{
					backgroundColor: mine ? s.accent : s.surfaceAlt,
					borderRadius: 28,
					padding: '22px 30px',
					display: 'flex',
					alignItems: 'center',
					gap: 16,
				}}
			>
				{mine ? null : <Disc tone={tone} d={34} fill="ink" />}
				<Word tone={tone} height={H} color={mine ? 'onAccent' : 'ink'}>
					{`${WORDS[i % WORDS.length]} ${i * 7 + 3}`}
				</Word>
			</div>
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	if (variant === 'thread') {
		return (
			<AbsoluteFill>
				<StepScroll variant={variant} items={[0, 1, 2, 3, 4, 5].map((i) => <Block key={i} tone={tone} i={i} />)} startY={50} steps={3} />
			</AbsoluteFill>
		);
	}
	if (variant === 'jump') {
		const rows = [0, 1, 2, 3, 4, 5, 6].map((i) => (
			<div key={i} style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
				<ChatRow tone={tone} i={i} mine={i % 3 === 0} />
			</div>
		));
		return (
			<AbsoluteFill>
				<StepScroll variant={variant} items={rows} startY={34} steps={2} />
			</AbsoluteFill>
		);
	}
	if (variant === 'jumpBottom') {
		const rows = [0, 1, 2, 3, 4, 5].map((i) => <ChatRow key={i} tone={tone} i={i} mine={i % 2 === 0} />);
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<Panel tone={tone} style={{width: 840, height: 800, padding: 40, overflow: 'hidden'}}>
					<StepScroll variant={variant} items={rows} initial={2} gap={24} />
				</Panel>
			</AbsoluteFill>
		);
	}
	// eased (default)
	return (
		<AbsoluteFill>
			<StepScroll variant={variant ?? spec.defaultVariant} items={[0, 1, 2, 3, 4, 5, 6].map((i) => <FeedRow key={i} tone={tone} i={i} />)} steps={4} />
		</AbsoluteFill>
	);
};
