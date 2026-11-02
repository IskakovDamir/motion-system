import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DirectionalBlur} from '../../engine/blur';
import {flag, maybe, mix, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {Disc, letters, motionOf, perPart, sizeOf, SquareGlyph, speedOf, streakSigma, Tile, unitsShown, Words, type LayoutType} from './kit';
import {spec} from './MakeRoom.spec';

export type MakeRoomProps = {
	/** the settled block, or its parts as an array (each part moves on its own values of the variant) */
	children: React.ReactNode | React.ReactNode[];
	/** what arrives in the room: units (letters, words or one block) revealed from the variant's arriveAt */
	incoming?: React.ReactNode[];
	tone?: Tone;
	variant?: string;
	/** how the parts sit (layout, not motion) */
	direction?: 'row' | 'column';
	/** space between parts, px at 1080 */
	gap?: number;
	/** space between the block and the incoming content (slot below or right), px at 1080 */
	incomingGap?: number;
	/** per-part placement (absolute positions of parts that stand apart); motion is applied inside it */
	place?: React.CSSProperties[];
	/** transform origin of every part (scale pivots here) */
	origin?: string;
	align?: React.CSSProperties['alignItems'];
	style?: React.CSSProperties;
};

// Every part moves by fromX/fromY + travelX/travelY x progress of its x / y motion, plus a creep (creepX /
// creepY on the creep motion) when the variant has one, and scales fromScale -> toScale on its scale
// motion. The incoming units appear in the room on the variant's arrival frames. With blurExposure, a
// part's horizontal speed smears it (a streak of blurExposure frames of travel, at most blurMax % W;
// DirectionalBlur, one tree throughout).
export const MakeRoom: React.FC<MakeRoomProps> = ({children, incoming, variant, direction = 'row', gap = 0, incomingGap = 0, place, origin = 'center', align = 'center', style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, h, px} = useFrame();
	const parts = Array.isArray(children) ? children : [children];
	const slot = typeof v.params?.slot === 'string' ? v.params.slot : undefined;
	const exposure = maybe(v, 'blurExposure');
	const blurMax = maybe(v, 'blurMax');
	const shown = incoming ? unitsShown(frame, incoming.length, maybe(v, 'arriveAt') ?? 0, maybe(v, 'arriveRate')) : 0;
	const scaleOf = (i: number) => mix(p(motionOf(v, 'scale', i)), perPart(v, 'fromScale', i) ?? 1, perPart(v, 'toScale', i) ?? 1);

	// below the block the shown units stay centred (the line grows from the middle); elsewhere every unit
	// keeps its final place, shown first to last, or last to first with arriveReverse
	const reverse = flag(v, 'arriveReverse');
	const units = incoming ? (
		<div style={{display: 'flex', alignItems: 'baseline', whiteSpace: 'nowrap'}}>
			{(slot === 'below' ? incoming.slice(0, shown) : incoming).map((u, k) => (
				<div key={k} style={{visibility: (reverse ? incoming.length - 1 - k : k) < shown ? 'inherit' : 'hidden', display: 'flex'}}>
					{u}
				</div>
			))}
		</div>
	) : null;

	const slotted = (i: number) => {
		if (!units || i !== parts.length - 1) return null;
		if (slot === 'below') return <div style={{position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: px(incomingGap)}}>{units}</div>;
		if (slot === 'right') return <div style={{position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: px(incomingGap)}}>{units}</div>;
		return null;
	};

	const nodes: React.ReactNode[] = [];
	parts.forEach((part, i) => {
		const xm = motionOf(v, 'x', i);
		const ym = motionOf(v, 'y', i);
		const travelX = w(perPart(v, 'travelX', i) ?? 0);
		const creepX = w(maybe(v, 'creepX') ?? 0);
		const dx = w(perPart(v, 'fromX', i) ?? 0) + travelX * p(xm) + creepX * p('creep');
		const dy = h(perPart(v, 'fromY', i) ?? 0) + h(perPart(v, 'travelY', i) ?? 0) * p(ym) + h(maybe(v, 'creepY') ?? 0) * p('creep');
		const streak = (Math.abs(travelX) * speedOf(p, xm) + Math.abs(creepX) * speedOf(p, 'creep')) * (exposure ?? 0);
		const blur = streakSigma(blurMax === undefined ? streak : Math.min(streak, w(blurMax)), 1);
		if (i === 1 && slot === 'between' && units) {
			nodes.push(
				<div key="incoming" style={{transform: `scale(${scaleOf(0)})`, transformOrigin: origin, flexShrink: 0}}>
					{units}
				</div>,
			);
		}
		nodes.push(
			<div key={i} style={{flexShrink: 0, ...place?.[i]}}>
				<div style={{position: 'relative', transform: `translate(${dx}px, ${dy}px) scale(${scaleOf(i)})`, transformOrigin: origin}}>
					<DirectionalBlur x={blur}>{part}</DirectionalBlur>
					{slotted(i)}
				</div>
			</div>,
		);
	});
	return <div style={{display: 'flex', flexDirection: direction, alignItems: align, gap: px(gap), ...style}}>{nodes}</div>;
};

// ---- isolated demo ----

const square = (weight: number, capHeight: number): LayoutType => ({font: 'square', weight, capHeight, upper: true});
const inter = (weight: number, capHeight: number): LayoutType => ({font: 'ui', weight, capHeight});
const at = (x: number, y: number): React.CSSProperties => ({position: 'absolute', left: `${x}%`, top: `${y}%`, translate: '-50% -50%'});

// a prompt box drawn large (the send button BUTTON px wide, its centre INSET px from the box's right end)
const BOX_H = 300;
const BUTTON = 156;
const INSET = 72 + BUTTON / 2;

const PromptBox: React.FC<{tone: Tone; width: number; withChip?: boolean}> = ({tone, width, withChip}) => {
	const s = scheme(tone);
	return (
		<Tile tone={tone} w={width} h={BOX_H} radius={72} line style={{display: 'flex', alignItems: 'center', gap: 44, padding: '0 72px'}}>
			{withChip ? (
				<div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '16px 34px', borderRadius: 50, backgroundColor: s.bgAlt}}>
					<Disc tone={tone} d={40} fill="muted" />
					<Words tone={tone} t={inter(500, 3.6)} color="inkSoft">
						quick mode
					</Words>
				</div>
			) : null}
			<div style={{flex: 1, height: 30, borderRadius: 15, backgroundColor: s.line}} />
			<Disc tone={tone} d={BUTTON} fill="accent" />
		</Tile>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const name = variant ?? spec.defaultVariant;
	if (name === 'riseShort') {
		const t = inter(700, 6.0);
		return (
			<AbsoluteFill>
				<div style={at(50, 48.7)}>
					<MakeRoom variant={name} incoming={letters(tone, t, 'for every day', 'inkSoft')} incomingGap={34}>
						<div style={{display: 'flex', alignItems: 'center', gap: 28}}>
							<SquareGlyph tone={tone} d={92} />
							<Words tone={tone} t={t}>
								Daily notes
							</Words>
						</div>
					</MakeRoom>
				</div>
			</AbsoluteFill>
		);
	}
	if (name === 'shrinkAside') {
		return (
			<AbsoluteFill>
				<div style={at(49.3, 51.4)}>
					<MakeRoom variant={name}>
						<div style={{display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'flex-start'}}>
							<Words tone={tone} t={{...square(600, 17.3), stretch: 87.5}} color="muted">
								BIG
							</Words>
							<Words tone={tone} t={{...square(800, 17.3), stretch: 87.5}}>
								PLANS
							</Words>
						</div>
					</MakeRoom>
				</div>
			</AbsoluteFill>
		);
	}
	if (name === 'openGap') {
		const t = inter(700, 6.0);
		return (
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<MakeRoom variant={name} gap={80} incoming={letters(tone, t, 'Morning')}>
					{[
						<SquareGlyph key="g" tone={tone} d={92} />,
						<Words key="w" tone={tone} t={t}>
							notes
						</Words>,
					]}
				</MakeRoom>
			</AbsoluteFill>
		);
	}
	if (name === 'reflow') {
		return (
			<AbsoluteFill>
				<MakeRoom variant={name} place={[at(33.5, 10.6), at(69.6, 85.5)]}>
					{[
						<Words key="a" tone={tone} t={{font: 'wide', weight: 800, capHeight: 10.7, stretch: 75, upper: true}}>
							STEP BY
						</Words>,
						<Words key="b" tone={tone} t={{font: 'wide', weight: 900, capHeight: 11.8, stretch: 125, upper: true}}>
							STEP
						</Words>,
					]}
				</MakeRoom>
			</AbsoluteFill>
		);
	}
	if (name === 'liftShrink') {
		return (
			<AbsoluteFill>
				<div style={at(50, 48.4)}>
					<MakeRoom variant={name}>
						<Words tone={tone} t={{font: 'wide', weight: 900, capHeight: 8.7, stretch: 125, upper: true}}>
							ROOM TO GROW
						</Words>
					</MakeRoom>
				</div>
			</AbsoluteFill>
		);
	}
	if (name === 'recenter') {
		const t = inter(700, 6.6);
		const glyph = (
			<div key="glyph" style={{marginRight: 26, alignSelf: 'center'}}>
				<SquareGlyph tone={tone} d={100} fill="muted" />
			</div>
		);
		return (
			<AbsoluteFill>
				{/* label 1's icon centre starts at the measured 30.9% W, 50.3% H */}
				<div style={{position: 'absolute', left: 'calc(30.9% - 50px)', top: '50.3%', translate: '0 -50%'}}>
					<MakeRoom variant={name} incoming={[glyph, ...letters(tone, t, 'Notebooks')]} incomingGap={170}>
						<div style={{display: 'flex', alignItems: 'center', gap: 28}}>
							<SquareGlyph tone={tone} d={100} />
							<Words tone={tone} t={t}>
								Open Desk
							</Words>
						</div>
					</MakeRoom>
				</div>
			</AbsoluteFill>
		);
	}
	if (name === 'centreSlide' || name === 'groupSnap') {
		// the send button's centre starts at the measured point; the box runs out of the frame on the left
		const width = 2200;
		const snap = name === 'groupSnap';
		const start = snap ? {x: 89.0, y: 29.5} : {x: 75.7, y: 50.1};
		const group = (
			<div style={{display: 'flex', flexDirection: 'column', gap: 26, width}}>
				<PromptBox tone={tone} width={width} withChip={snap} />
				{snap ? (
					<Tile tone={tone} w={900} h={380} radius={44} line style={{alignSelf: 'flex-end', marginRight: 120, padding: 50, display: 'flex', flexDirection: 'column', gap: 44}}>
						{['steady', 'careful'].map((label) => (
							<div key={label} style={{display: 'flex', alignItems: 'center', gap: 28}}>
								<Disc tone={tone} d={56} fill="line" />
								<Words tone={tone} t={inter(500, 3.6)} color="inkSoft">
									{label}
								</Words>
							</div>
						))}
					</Tile>
				) : null}
			</div>
		);
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<div style={{position: 'absolute', left: `calc(${start.x}% - ${width - INSET}px)`, top: `calc(${start.y}% - ${BOX_H / 2}px)`}}>
					<MakeRoom variant={name} origin={`${width - INSET}px ${BOX_H / 2}px`}>
						{group}
					</MakeRoom>
				</div>
			</AbsoluteFill>
		);
	}
	// riseTop (default): the block's line-1 centre starts at the measured 47.5% H
	const l1 = square(700, 13.5);
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: '50%', top: `calc(47.5% - ${sizeOf(l1, 1080) / 2}px)`, translate: '-50% 0'}}>
				<MakeRoom variant={name}>
					<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36}}>
						<div style={{display: 'flex', gap: 40}}>
							<Words tone={tone} t={l1} color="muted">
								12
							</Words>
							<Words tone={tone} t={l1}>
								ROADS
							</Words>
						</div>
						<Words tone={tone} t={square(800, 10.3)}>
							AHEAD
						</Words>
					</div>
				</MakeRoom>
			</div>
		</AbsoluteFill>
	);
};
