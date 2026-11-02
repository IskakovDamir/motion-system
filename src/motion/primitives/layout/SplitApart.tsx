import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {flag, maybe, mix, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FootageSlot} from '../footage/FootageSlot';
import type {DemoProps} from '../types';
import {Arrow, motionOf, perPart, Tile, Words, type LayoutType} from './kit';
import {spec} from './SplitApart.spec';

export type SplitApartProps = {
	/** the parts that move apart; an item given as an array (a line's words) moves part by part */
	items: (React.ReactNode | React.ReactNode[])[];
	tone?: Tone;
	variant?: string;
	/** how the items sit at rest: a column of lines, a row, a grid, or stacked on one spot (item 0 in front) */
	layout?: 'column' | 'row' | 'grid' | 'stack';
	/** grid: number of columns */
	columns?: number;
	/** grid: cell size, px at 1080 */
	cell?: [number, number];
	/** grid: row pitch, px at 1080 (the column pitch is the variant's) */
	pitchY?: number;
	/** space between items (column / row), px at 1080 */
	gap?: number;
	/** space between the parts of an array item, px at 1080 */
	partGap?: number;
	align?: React.CSSProperties['alignItems'];
	/** per-item wrapper style (alignment of one line, z-order ...); motion is applied inside it */
	itemStyle?: React.CSSProperties[];
	style?: React.CSSProperties;
};

// Item i moves by fromX/fromY + travelX/travelY x progress of its x / y motion from its delay, and scales
// fromScale -> toScale on its scale motion. In a grid, cell positions about the grid centre scale by the
// spacing factor spreadFrom -> 1 on motion x. With goneAfter, an item (or part) is gone once its x
// motion has run (it left the frame on an ease-in).
export const SplitApart: React.FC<SplitApartProps> = ({items, variant, layout = 'column', columns = 1, cell, pitchY, gap = 0, partGap = 0, align = 'center', itemStyle, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, h, px} = useFrame();
	const gone = flag(v, 'goneAfter');
	const spreadFrom = maybe(v, 'spreadFrom');
	const factor = spreadFrom === undefined ? 1 : mix(p('x'), spreadFrom, 1);
	const pitchX = w(maybe(v, 'pitchX') ?? 0);
	const rows = Math.ceil(items.length / columns);

	const move = (i: number, extra: number, node: React.ReactNode, key: React.Key) => {
		const d = (perPart(v, 'delays', i) ?? 0) + extra;
		const xm = motionOf(v, 'x', i);
		const ym = motionOf(v, 'y', i);
		let dx = w(perPart(v, 'fromX', i) ?? 0) + w(perPart(v, 'travelX', i) ?? 0) * p(xm, d);
		let dy = h(perPart(v, 'fromY', i) ?? 0) + h(perPart(v, 'travelY', i) ?? 0) * p(ym, d);
		if (layout === 'grid' && spreadFrom !== undefined) {
			dx = (factor - 1) * ((i % columns) - (columns - 1) / 2) * pitchX;
			dy = (factor - 1) * (Math.floor(i / columns) - (rows - 1) / 2) * px(pitchY ?? 0);
		}
		const scale = mix(p(motionOf(v, 'scale', i), d), perPart(v, 'fromScale', i) ?? 1, perPart(v, 'toScale', i) ?? 1);
		const m = v.motions[xm];
		const left = gone && m !== undefined && frame > d + m.delay + m.duration;
		return (
			<div key={key} style={{transform: `translate(${dx}px, ${dy}px) scale(${scale})`, visibility: left ? 'hidden' : 'inherit', flexShrink: 0}}>
				{node}
			</div>
		);
	};

	const container: React.CSSProperties =
		layout === 'grid'
			? {
					display: 'grid',
					gridTemplateColumns: `repeat(${columns}, ${px(cell?.[0] ?? 0)}px)`,
					gridAutoRows: `${px(cell?.[1] ?? 0)}px`,
					columnGap: pitchX - px(cell?.[0] ?? 0),
					rowGap: px((pitchY ?? 0) - (cell?.[1] ?? 0)),
				}
			: layout === 'stack'
				? {display: 'grid', justifyItems: 'center', alignItems: 'center'}
				: {display: 'flex', flexDirection: layout, alignItems: align, gap: px(gap)};

	return (
		<div style={{...container, ...style}}>
			{items.map((item, i) => (
				<div
					key={i}
					style={{
						...(layout === 'stack' ? {gridArea: '1 / 1', zIndex: items.length - i} : {}),
						...itemStyle?.[i],
					}}
				>
					{Array.isArray(item) ? (
						<div style={{display: 'flex', alignItems: 'baseline', gap: px(partGap)}}>{item.map((part, j) => move(i, perPart(v, 'partDelays', j) ?? 0, part, j))}</div>
					) : (
						move(i, 0, item, 'item')
					)}
				</div>
			))}
		</div>
	);
};

// ---- isolated demo ----

const heavy = (font: LayoutType['font'], weight: number, capHeight: number, stretch?: number): LayoutType => ({font, weight, capHeight, stretch, upper: true});

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const name = variant ?? spec.defaultVariant;
	if (name === 'splitMorph') {
		// one centred line; its two parts centred on the measured 33.5% and 69.6% W at 50.1% H
		return (
			<AbsoluteFill>
				<div style={{position: 'absolute', inset: 0}}>
					<SplitApart
						variant={name}
						layout="row"
						items={[
							<Words key="a" tone={tone} t={heavy('wide', 800, 10.8, 75)}>
								FAST AND
							</Words>,
							<Words key="b" tone={tone} t={heavy('wide', 900, 10.8, 125)}>
								CALM
							</Words>,
						]}
						itemStyle={[
							{position: 'absolute', left: '33.5%', top: '50.1%', translate: '-50% -50%'},
							{position: 'absolute', left: '69.6%', top: '50.1%', translate: '-50% -50%'},
						]}
					/>
				</div>
			</AbsoluteFill>
		);
	}
	if (name === 'whipOut') {
		// the split state, low in the frame: line 1 at the left edge, the arrow under it, line 2 beside the arrow
		// at the right edge
		const t1 = heavy('square', 800, 14.7, 87.5);
		const t2: LayoutType = {font: 'display', weight: 600, capHeight: 14.6, upper: true};
		return (
			<AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 1.5% 6%'}}>
				<SplitApart
					variant={name}
					gap={10}
					partGap={56}
					align="stretch"
					style={{position: 'relative'}}
					items={[
						['ONE', 'BY', 'ONE'].map((word, k) => (
							<Words key={k} tone={tone} t={t1}>
								{word}
							</Words>
						)),
						<Arrow key="arrow" tone={tone} w={560} h={90} />,
						<Words key="l2" tone={tone} t={t2} color="inkSoft">
							THEN GO
						</Words>,
					]}
					itemStyle={[{alignSelf: 'flex-start'}, {position: 'absolute', left: 20, bottom: 50}, {alignSelf: 'flex-end'}]}
				/>
			</AbsoluteFill>
		);
	}
	if (name === 'gridSpread') {
		const cellW = 280;
		const cellH = 200;
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
				<SplitApart
					variant={name}
					layout="grid"
					columns={5}
					cell={[cellW, cellH]}
					pitchY={290}
					items={Array.from({length: 15}, (_, i) => (
						<Tile key={i} tone={tone} w={cellW} h={cellH} radius={22}>
							<FootageSlot label={`${i + 1}`} />
						</Tile>
					))}
				/>
			</AbsoluteFill>
		);
	}
	if (name === 'kickApart') {
		// two settled, centred lines; line 1's left edge at the measured 40.7% W
		const t = heavy('round', 800, 5.8);
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<SplitApart
					variant={name}
					gap={30}
					items={[
						<Words key="a" tone={tone} t={t}>
							STAY CLOSE
						</Words>,
						<Words key="b" tone={tone} t={heavy('round', 900, 7.2)}>
							KEEP MOVING
						</Words>,
					]}
				/>
			</AbsoluteFill>
		);
	}
	if (name === 'mirrorPair') {
		// two plain shapes about 16% W wide on one spot at the frame centre (y 50.2% H), the light one in front
		const d = 300;
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<SplitApart
					variant={name}
					layout="stack"
					items={[
						<Tile key="a" tone={tone} w={d} h={d} radius={80} fill="surfaceAlt" />,
						<div key="b" style={{width: d * 0.9, height: d * 0.9, borderRadius: d, backgroundColor: s.inkSoft}} />,
					]}
				/>
			</AbsoluteFill>
		);
	}
	// splitShift (default): a centred 2-line block
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
			<SplitApart
				variant={name}
				gap={30}
				items={[
					<Words key="a" tone={tone} t={heavy('square', 800, 14.7, 87.5)}>
						STAND STILL
					</Words>,
					<Words key="b" tone={tone} t={{font: 'display', weight: 600, capHeight: 14.6, upper: true}}>
						MOVE ON
					</Words>,
				]}
			/>
		</AbsoluteFill>
	);
};
