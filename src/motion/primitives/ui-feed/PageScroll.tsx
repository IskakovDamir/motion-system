import type React from 'react';
import {AbsoluteFill} from 'remotion';
import {num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FONT} from '../../tokens/type';
import {FootageSlot} from '../footage/FootageSlot';
import type {DemoProps} from '../types';
import {Bar, Disc, Panel, Word} from './kit';
import {spec} from './PageScroll.spec';

export type PageScrollProps = {children: React.ReactNode; tone?: Tone; variant?: string; style?: React.CSSProperties};

// The content layer moves up `travel` % of frame height with the variant's y motion; the frame around
// it (the parent: a window, a device, the whole picture) holds and clips it.
export const PageScroll: React.FC<PageScrollProps> = ({children, variant, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {h} = useFrame();
	return (
		<div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style}}>
			<div style={{transform: `translateY(${-h(num(v, 'travel')) * p('y')}px)`}}>{children}</div>
		</div>
	);
};

// ---- isolated demo ----

const H = 1080;

const Chart: React.FC<{tone: Tone}> = ({tone}) => {
	const s = scheme(tone);
	const bars = [42, 68, 55, 90, 74, 110, 96, 130];
	return (
		<svg width={900} height={300} viewBox="0 0 900 300">
			<line x1={0} y1={290} x2={900} y2={290} stroke={s.line} strokeWidth={3} />
			{bars.map((b, i) => (
				<rect key={i} x={30 + i * 108} y={290 - b * 2} width={70} height={b * 2} rx={8} fill={i === 5 ? s.accent : s.surfaceAlt} />
			))}
		</svg>
	);
};

const Page: React.FC<{tone: Tone; sections: number}> = ({tone, sections}) => (
	<div style={{display: 'flex', flexDirection: 'column', gap: 70, padding: '80px 120px'}}>
		{Array.from({length: sections}, (_, k) => (
			<div key={k} style={{display: 'flex', flexDirection: 'column', gap: 28}}>
				<Word tone={tone} height={H} role="headline">
					{['weekly totals', 'by region', 'next steps', 'notes', 'archive'][k % 5]}
				</Word>
				{k % 2 === 0 ? <Chart tone={tone} /> : null}
				{[0, 1, 2].map((r) => (
					<Bar key={r} tone={tone} w={900 - r * 140} h={22} />
				))}
				{k % 2 === 1 ? (
					<div style={{width: 900, height: 260, borderRadius: 20, overflow: 'hidden', position: 'relative'}}>
						<FootageSlot label="image" />
					</div>
				) : null}
			</div>
		))}
	</div>
);

const ListRow: React.FC<{tone: Tone; i: number}> = ({tone, i}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: 34, height: 180}}>
		<div style={{width: 260, height: 150, borderRadius: 16, overflow: 'hidden', position: 'relative', flexShrink: 0}}>
			<FootageSlot />
		</div>
		<div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
			<Word tone={tone} height={H}>
				{['item one', 'item two', 'item three', 'item four', 'item five', 'item six', 'item seven', 'item eight', 'item nine', 'item ten'][i % 10]}
			</Word>
			<Bar tone={tone} w={420} h={16} />
		</div>
	</div>
);

const Code: React.FC<{tone: Tone; first: number; count: number; pitch: number}> = ({tone, first, count, pitch}) => {
	const s = scheme(tone);
	return (
		<div style={{display: 'flex', flexDirection: 'column'}}>
			{Array.from({length: count}, (_, k) => (
				<div key={k} style={{height: pitch, display: 'flex', alignItems: 'center', gap: 14}}>
					<span style={{fontFamily: FONT.mono, fontSize: pitch * 0.62, color: s.muted, width: 22, textAlign: 'right'}}>{`${first + k}`}</span>
					<Bar tone={tone} w={70 + ((k * 7) % 5) * 34} h={pitch * 0.34} strong={k % 4 === 0} />
					<Bar tone={tone} w={40 + ((k * 3) % 4) * 22} h={pitch * 0.34} />
				</div>
			))}
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const v = variantOf(spec, variant);
	const {h} = useFrame();
	if (variant === 'decelerate') {
		// one row is exactly the measured travel tall, so the scroll lands on the next row under a fixed bar
		const row = h(num(v, 'travel'));
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<PageScroll variant={variant}>
					{[0, 1, 2].map((i) => (
						<div key={i} style={{height: row, padding: '70px 360px 170px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 26}}>
							<div style={{display: 'flex', alignItems: 'center', gap: 20}}>
								<Disc tone={tone} d={52} fill={i % 2 ? 'muted' : 'ink'} />
								<Word tone={tone} height={H}>
									{['first', 'second', 'third'][i]}
								</Word>
							</div>
							<div style={{flex: 1, borderRadius: 26, overflow: 'hidden', position: 'relative'}}>
								<FootageSlot label={`${i + 1}`} />
							</div>
						</div>
					))}
				</PageScroll>
				<div
					style={{
						position: 'absolute',
						left: 360,
						right: 360,
						bottom: 40,
						height: 96,
						borderRadius: 48,
						backgroundColor: s.surface,
						border: `2px solid ${s.line}`,
						display: 'flex',
						alignItems: 'center',
						padding: '0 36px',
					}}
				>
					<Word tone={tone} height={H} color="muted">
						ask here
					</Word>
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'momentum') {
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<Panel tone={tone} style={{width: 1200, height: 900, overflow: 'hidden', position: 'relative'}}>
					<PageScroll variant={variant}>
						<div style={{padding: '60px 80px', display: 'flex', flexDirection: 'column'}}>
							{Array.from({length: 14}, (_, i) => (
								<ListRow key={i} tone={tone} i={i} />
							))}
						</div>
					</PageScroll>
				</Panel>
			</AbsoluteFill>
		);
	}
	if (variant === 'slowBack') {
		// the panel is drawn at the measured line pitch and shown at 2x, as a camera would; the code layer
		// starts |travel| up, so the scroll back down lands on line 1
		const pitch = h(num(v, 'linePitch'));
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{transform: 'scale(2)'}}>
					<Panel tone={tone} style={{width: 560, height: 330, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 14}}>
						<div style={{height: 40, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: `1px solid ${s.line}`, flexShrink: 0}}>
							<Disc tone={tone} d={9} fill="line" />
							<Disc tone={tone} d={9} fill="line" />
							<Disc tone={tone} d={9} fill="line" />
							<Bar tone={tone} w={70} h={8} style={{marginLeft: 14}} />
						</div>
						<div style={{flex: 1, minHeight: 0, padding: '0 20px'}}>
							<PageScroll variant={variant}>
								<div style={{transform: `translateY(${h(num(v, 'travel'))}px)`}}>
									<Code tone={tone} first={1} count={24} pitch={pitch} />
								</div>
							</PageScroll>
						</div>
					</Panel>
				</div>
			</AbsoluteFill>
		);
	}
	// easeInOut (default)
	return (
		<AbsoluteFill style={{backgroundColor: s.surface}}>
			<PageScroll variant={variant ?? spec.defaultVariant}>
				<Page tone={tone} sections={5} />
			</PageScroll>
		</AbsoluteFill>
	);
};
