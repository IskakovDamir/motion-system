import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {flag, maybe, num, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FootageSlot} from '../footage/FootageSlot';
import type {DemoProps} from '../types';
import {Bar, Disc, Panel, Word} from './kit';
import {spec} from './ItemRiseIn.spec';

export type ItemRiseInProps = {
	items: React.ReactNode[];
	tone?: Tone;
	variant?: string;
	/** space between items, px at 1080 (layout, not motion) */
	gap?: number;
	style?: React.CSSProperties;
};

// Items enter one after another, `stagger` frames apart: each fades (opacity motion) while it rises
// `rise` px into its slot (y motion), or pops at full value in its first frame. A bottom-anchored
// list takes the new item's slot in the frame it starts, so the earlier items make room in one frame;
// a clipped list hides the items until they rise in through its edge.
export const ItemRiseIn: React.FC<ItemRiseInProps> = ({items, variant, gap = 0, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {px, w} = useFrame();
	const stagger = num(v, 'stagger');
	const rise = num(v, 'rise');
	const pop = flag(v, 'pop');
	const row = v.params?.direction === 'row';
	const bottom = str(v, 'anchor') === 'bottom';
	const firstFromX = maybe(v, 'firstFromX');
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: row ? 'row' : 'column',
				justifyContent: bottom ? 'flex-end' : 'flex-start',
				gap: px(gap),
				width: '100%',
				height: '100%',
				overflow: flag(v, 'clip') ? 'hidden' : undefined,
				...style,
			}}
		>
			{items.map((item, i) => {
				const off = i * stagger;
				if (bottom && frame < off) return null;
				const opacity = pop ? (frame >= off ? 1 : 0) : p('opacity', off);
				const left = 1 - p('y', off);
				const dx = i === 0 && firstFromX !== undefined ? w(firstFromX) * left : 0;
				return (
					<div key={i} style={{opacity, transform: `translate(${dx}px, ${px(rise) * left}px)`, flexShrink: 0}}>
						{item}
					</div>
				);
			})}
		</div>
	);
};

// ---- isolated demo ----

const H = 1080;

const FeedRow: React.FC<{tone: Tone; word: string; n: number}> = ({tone, word, n}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: 24, height: 96}}>
		<Disc tone={tone} d={56} fill="line" />
		<div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
			<Word tone={tone} height={H}>
				{word}
			</Word>
			<Bar tone={tone} w={260 + (n % 3) * 90} h={14} />
		</div>
	</div>
);

const Bubble: React.FC<{tone: Tone; mine?: boolean; children: React.ReactNode}> = ({tone, mine, children}) => {
	const s = scheme(tone);
	return (
		<div style={{display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', width: 760}}>
			<div
				style={{
					backgroundColor: mine ? s.accent : s.surfaceAlt,
					borderRadius: 28,
					padding: '20px 30px',
					display: 'flex',
					alignItems: 'center',
					gap: 16,
				}}
			>
				{children}
			</div>
		</div>
	);
};

const Thumb: React.FC<{w: number; h: number; label?: string}> = ({w, h, label}) => (
	<div style={{width: w, height: h, borderRadius: 18, overflow: 'hidden', position: 'relative'}}>
		<FootageSlot label={label} />
	</div>
);

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const centre: React.CSSProperties = {alignItems: 'center', justifyContent: 'center'};
	if (variant === 'makeRoomRise') {
		const items = [
			<Bubble key="a" tone={tone} mine>
				<Word tone={tone} height={H} color="onAccent">
					sort the list
				</Word>
			</Bubble>,
			<div key="b" style={{display: 'flex', alignItems: 'center', gap: 14, width: 760, height: 48}}>
				<Disc tone={tone} d={22} fill="muted" />
				<Word tone={tone} height={H} color="muted">
					sorting
				</Word>
			</div>,
			<Bubble key="c" tone={tone}>
				<Disc tone={tone} d={36} fill="ink" />
				<Word tone={tone} height={H}>
					done, 12 rows
				</Word>
			</Bubble>,
			<Bubble key="d" tone={tone} mine>
				<Word tone={tone} height={H} color="onAccent">
					thanks
				</Word>
			</Bubble>,
		];
		return (
			<AbsoluteFill style={centre}>
				<Panel tone={tone} style={{width: 840, height: 820, padding: 40, display: 'flex', flexDirection: 'column', gap: 28}}>
					<div style={{flex: 1, minHeight: 0}}>
						<ItemRiseIn variant={variant} items={items} gap={24} />
					</div>
					<div style={{height: 84, borderRadius: 42, border: `2px solid ${s.line}`, display: 'flex', alignItems: 'center', padding: '0 32px'}}>
						<Word tone={tone} height={H} color="muted">
							write here
						</Word>
					</div>
				</Panel>
			</AbsoluteFill>
		);
	}
	if (variant === 'fadeAcross') {
		const items = [0, 1, 2, 3].map((i) => <Thumb key={i} w={330} h={420} label={`${i + 1}`} />);
		return (
			<AbsoluteFill style={centre}>
				<div style={{width: 1440, height: 420}}>
					<ItemRiseIn variant={variant} items={items} gap={40} />
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'blurSlide') {
		// the visible lane is as tall as the measured rise, so each thumbnail starts just below its edge
		const lane = num(variantOf(spec, variant), 'rise');
		const items = [0, 1].map((i) => <Thumb key={i} w={190} h={lane - 14} label={`${i + 1}`} />);
		return (
			<AbsoluteFill style={centre}>
				<Panel tone={tone} style={{width: 520, padding: 40, display: 'flex', flexDirection: 'column', gap: 30}}>
					<Word tone={tone} height={H}>
						two clips
					</Word>
					<div style={{height: lane}}>
						<ItemRiseIn variant={variant} items={items} gap={40} />
					</div>
					<Bar tone={tone} w={300} h={18} />
				</Panel>
			</AbsoluteFill>
		);
	}
	if (variant === 'popStagger') {
		const words = ['open', 'copy', 'move', 'rename', 'share'];
		const items = [
			<Word key="h" tone={tone} height={H} color="muted" style={{display: 'block', paddingBottom: 12}}>
				menu
			</Word>,
			...words.map((w, i) => (
				<div key={w} style={{display: 'flex', alignItems: 'center', gap: 22, height: 76, width: 520}}>
					<div style={{width: 34, height: 34, borderRadius: 8, border: `3px solid ${s.inkSoft}`}} />
					<Word tone={tone} height={H}>
						{w}
					</Word>
					<div style={{flex: 1}} />
					<Word tone={tone} height={H} color="muted">
						{`${i + 1}`}
					</Word>
				</div>
			)),
		];
		return (
			<AbsoluteFill style={centre}>
				<Panel tone={tone} style={{width: 600, height: 560, padding: 40}}>
					<ItemRiseIn variant={variant} items={items} />
				</Panel>
			</AbsoluteFill>
		);
	}
	if (variant === 'lateFade') {
		const icons = (
			<div key="act" style={{display: 'flex', alignItems: 'center', gap: 34, height: 60}}>
				{['4', '12', '2', '9'].map((n, i) => (
					<div key={n + i} style={{display: 'flex', alignItems: 'center', gap: 10}}>
						<div style={{width: 26, height: 26, borderRadius: i % 2 ? 13 : 6, border: `3px solid ${s.muted}`}} />
						<Word tone={tone} height={H} color="muted">
							{n}
						</Word>
					</div>
				))}
			</div>
		);
		const items = [
			<div key="name" style={{display: 'flex', alignItems: 'center', gap: 20, height: 70}}>
				<Disc tone={tone} d={52} fill="ink" />
				<Word tone={tone} height={H}>
					river
				</Word>
				<Word tone={tone} height={H} color="muted">
					2 min
				</Word>
			</div>,
			icons,
			<div key="link" style={{display: 'flex', alignItems: 'center', gap: 16, height: 60}}>
				<Word tone={tone} height={H} color="muted">
					...
				</Word>
				<Word tone={tone} height={H} color="muted">
					3 more
				</Word>
			</div>,
			<div key="name2" style={{display: 'flex', alignItems: 'center', gap: 20, height: 70}}>
				<Disc tone={tone} d={52} fill="muted" />
				<Word tone={tone} height={H}>
					stone
				</Word>
			</div>,
		];
		return (
			<AbsoluteFill style={centre}>
				<Panel tone={tone} style={{width: 720, height: 520, padding: 50}}>
					<ItemRiseIn variant={variant} items={items} gap={30} />
				</Panel>
			</AbsoluteFill>
		);
	}
	if (variant === 'quickFade') {
		const items = [
			<div key="ask" style={{display: 'flex', flexDirection: 'column', gap: 16, width: 760}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
					<Disc tone={tone} d={22} fill="muted" />
					<Word tone={tone} height={H} color="muted">
						asked
					</Word>
				</div>
				<div style={{backgroundColor: s.bgAlt, borderRadius: 16, padding: '18px 26px'}}>
					<Word tone={tone} height={H} mono>
						count rows
					</Word>
				</div>
			</div>,
			<div key="reply" style={{display: 'flex', alignItems: 'center', gap: 20, width: 760}}>
				<Disc tone={tone} d={56} fill="ink" />
				<div style={{flex: 1, backgroundColor: s.surfaceAlt, borderRadius: 40, padding: '20px 30px'}}>
					<Word tone={tone} height={H}>
						there are 48
					</Word>
				</div>
			</div>,
		];
		return (
			<AbsoluteFill style={centre}>
				<Panel tone={tone} style={{width: 860, height: 440, padding: 50}}>
					<ItemRiseIn variant={variant} items={items} gap={50} />
				</Panel>
			</AbsoluteFill>
		);
	}
	if (variant === 'fadeInPlace') {
		const items = [
			<Bubble key="ask" tone={tone} mine>
				<Word tone={tone} height={H} color="onAccent">
					add two numbers
				</Word>
			</Bubble>,
			<div key="run" style={{display: 'flex', flexDirection: 'column', gap: 14, width: 760}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 14}}>
					<Disc tone={tone} d={20} fill="muted" />
					<Word tone={tone} height={H} color="muted">
						running
					</Word>
				</div>
				<div style={{backgroundColor: s.bgAlt, borderRadius: 14, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8}}>
					<Word tone={tone} height={H} mono>
						a = 4
					</Word>
					<Word tone={tone} height={H} mono>
						b = a + 3
					</Word>
				</div>
			</div>,
			<div key="reply" style={{display: 'flex', alignItems: 'center', gap: 18, width: 760}}>
				<Disc tone={tone} d={48} fill="ink" />
				<div style={{backgroundColor: s.surfaceAlt, borderRadius: 30, padding: '14px 26px'}}>
					<Word tone={tone} height={H}>
						b is 7
					</Word>
				</div>
			</div>,
		];
		return (
			<AbsoluteFill style={centre}>
				<Panel tone={tone} style={{width: 860, height: 640, padding: 50}}>
					<ItemRiseIn variant={variant} items={items} gap={40} />
				</Panel>
			</AbsoluteFill>
		);
	}
	// riseFade (default)
	const words = ['plan', 'draft', 'check', 'send', 'done'];
	return (
		<AbsoluteFill style={centre}>
			<Panel tone={tone} style={{width: 760, height: 760, padding: 50, display: 'flex', flexDirection: 'column', gap: 30}}>
				<Word tone={tone} height={H} color="muted">
					today
				</Word>
				<ItemRiseIn variant={variant ?? spec.defaultVariant} items={words.map((w, i) => <FeedRow key={w} tone={tone} word={w} n={i} />)} gap={22} />
			</Panel>
		</AbsoluteFill>
	);
};
