import type React from 'react';
import {AbsoluteFill} from 'remotion';
import {DirectionalBlur} from '../../engine/blur';
import {maybe, mix, num, useFrame, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {at as prog, atSpeed, Block, nums, onward, Pointer, smear, streak, useRefFrame, Word} from './kit';
import {spec} from './DragDrop.spec';

export type DragDropProps = {
	/** the dragged units: carryIn items[0]; ghostTrail the selected items (drawn in place, their outlines travel); dragOut the block's tiles; strip variants the clips */
	items: React.ReactNode[];
	tone?: Tone;
	variant?: string;
	/** carryIn: the drop target, centred on targetAt (default: the drop point); it presses as the item goes in */
	target?: React.ReactNode;
	targetAt?: [number, number];
	/** carryIn: the pointer's tip offset from the item's centre, px at 1080 (where it holds the item); no pointer without it */
	grip?: [number, number];
	/** pointer height, px at 1080 */
	pointerSize?: number;
	/** dragOut / strip variants: the block's top edge, % of frame height (default: the frame centre line) */
	top?: number;
	/** strip variants: clip widths, % of frame width */
	widths?: number[];
	/** dragOut: gap between tiles, px at 1080 (layout) */
	gap?: number;
	/** rippleEdit: the boundaries where the two gaps open (default: the first two that closed) */
	openAt?: [number, number];
};

export const DragDrop: React.FC<DragDropProps> = ({items, tone = 'dark', variant, target, targetAt, grip, pointerSize, top, widths, gap = 0, openAt}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const f = useRefFrame();
	const {w, h, px} = useFrame();
	const s = scheme(tone);
	const midY = top ?? 50;

	if (name === 'carryIn') {
		const pill = (t: number, rd: typeof prog): [number, number] => {
			const p = rd(v, 'y', t);
			return [mix(p, num(v, 'fromX'), num(v, 'toX')), mix(p, num(v, 'fromY'), num(v, 'toY'))];
		};
		// the item's centre keeps its measured offset from the tracked pill centre
		const ox = num(v, 'dropX') - num(v, 'toX');
		const oy = num(v, 'dropY') - num(v, 'toY');
		const [x, y] = pill(f, prog);
		const [ax, ay] = pill(f - 1, atSpeed);
		const [bx, by] = pill(f, atSpeed);
		const blur = smear(num(v, 'shutter'), w(bx - ax), h(by - ay));
		const scale = 1 - prog(v, 'drop', f);
		const pressTo = num(v, 'pressTo');
		const creepTo = num(v, 'creepTo');
		const tScale = 1 - (1 - pressTo) * prog(v, 'press', f) + (creepTo - pressTo) * prog(v, 'creep', f) + (1 - creepTo) * prog(v, 'release', f);
		const [tx, ty] = targetAt ?? [num(v, 'dropX'), num(v, 'dropY')];
		const cx = w(x + ox);
		const cy = h(y + oy);
		return (
			<AbsoluteFill>
				{target ? (
					<div style={{position: 'absolute', left: w(tx), top: h(ty), transform: `translate(-50%, -50%) scale(${tScale})`}}>{target}</div>
				) : null}
				{f < num(v, 'goneAt') ? (
					<DirectionalBlur x={blur.x} y={blur.y} style={{position: 'absolute', inset: 0}}>
						<div style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) scale(${scale})`}}>{items[0]}</div>
					</DirectionalBlur>
				) : null}
				{grip && pointerSize ? (
					<Pointer tone={tone} h={px(pointerSize)} look="flat" x={cx + px(grip[0])} y={cy + px(grip[1])} smear={streak(num(v, 'shutter'), w(bx - ax), h(by - ay))} />
				) : null}
			</AbsoluteFill>
		);
	}

	if (name === 'ghostTrail') {
		const cols = num(v, 'cols');
		const n = items.length;
		const lastCol = Math.min(cols, n) - 1;
		// the grid hangs from its measured top-right box
		const x0 = num(v, 'topRightX') - lastCol * num(v, 'pitchX');
		const y0 = num(v, 'topRightY');
		const boxes = items.map((_, i) => [x0 + (i % cols) * num(v, 'pitchX'), y0 + Math.floor(i / cols) * num(v, 'pitchY')] as [number, number]);
		const shown = f >= num(v, 'appearAt') && f < num(v, 'goneAt');
		const dx = w(num(v, 'travelX') * prog(v, 'x', f));
		const dy = h(num(v, 'travelY') * prog(v, 'y', f));
		const bw = w(num(v, 'boxW'));
		const bh = h(num(v, 'boxH'));
		const lw = px(num(v, 'lineW'));
		return (
			<AbsoluteFill>
				{items.map((item, i) => {
					const [bxp, byp] = boxes[i] ?? [x0, y0];
					return (
						<div key={i} style={{position: 'absolute', left: w(bxp), top: h(byp), transform: 'translate(-50%, -50%)'}}>
							{item}
						</div>
					);
				})}
				{shown ? (
					<>
						<AbsoluteFill style={{backgroundColor: s.flash, opacity: num(v, 'lift')}} />
						{boxes.map(([bxp, byp], i) => (
							<div
								key={i}
								style={{
									position: 'absolute',
									left: w(bxp) - bw / 2 + dx,
									top: h(byp) - bh / 2 + dy,
									width: bw,
									height: bh,
									boxSizing: 'border-box',
									border: `${lw}px solid rgba(255, 255, 255, ${num(v, 'outline')})`,
									backgroundColor: `rgba(255, 255, 255, ${num(v, 'fill')})`,
								}}
							/>
						))}
					</>
				) : null}
			</AbsoluteFill>
		);
	}

	if (name === 'dragOut') {
		const left = (t: number, rd: (t: number) => number) => mix(rd(t), num(v, 'fromX'), num(v, 'toX'));
		const now = left(f, (t) => onward(v, 'x', t));
		const prev = left(f - 1, (t) => onward(v, 'x', t));
		const dxPct = now - num(v, 'fromX');
		const blur = smear(num(v, 'shutter'), w(now - prev), h(num(v, 'slopeY') * (now - prev)));
		return (
			<AbsoluteFill style={{overflow: 'hidden'}}>
				<DirectionalBlur x={blur.x} y={blur.y} style={{position: 'absolute', inset: 0}}>
					<div
						style={{
							position: 'absolute',
							left: w(now),
							top: h(midY + num(v, 'slopeY') * dxPct),
							display: 'grid',
							gridTemplateColumns: `repeat(${num(v, 'cols')}, max-content)`,
							gap: px(gap),
						}}
					>
						{items.map((item, i) => (
							<div key={i}>{item}</div>
						))}
					</div>
				</DirectionalBlur>
			</AbsoluteFill>
		);
	}

	// strip variants: clips laid end to end from the strip's left end, with a gap after each
	const ws = widths ?? items.map(() => 100 / Math.max(1, items.length));
	let leftPct: number;
	let gapAfter: (i: number) => number;
	let retract = 0;
	if (name === 'stripDock') {
		leftPct = mix(prog(v, 'x', f), num(v, 'fromX'), num(v, 'toX'));
		retract = num(v, 'gap') * prog(v, 'split', f);
		gapAfter = () => 0;
	} else {
		leftPct = num(v, 'left');
		const g = num(v, 'gaps');
		const start = num(v, 'startGap');
		const [aTo, bTo] = nums(v, 'openTo');
		const [ia, ib] = openAt ?? [1, 2];
		gapAfter = (i) => {
			let x = 0;
			// the widened gap closes with the last of the others
			if (i === 0) x = mix(prog(v, 'widen', f), start, num(v, 'widenTo')) * (1 - prog(v, 'close', f, (g - 2) * num(v, 'closeStagger')));
			else if (i < g) x = start * (1 - prog(v, 'close', f, (i - 1) * num(v, 'closeStagger')));
			if (i === ia) x += (aTo ?? 0) * prog(v, 'openA', f);
			if (i === ib) x += (bTo ?? 0) * prog(v, 'openB', f);
			return x;
		};
	}
	let cursor = leftPct;
	const placed = items.map((item, i) => {
		const width = ws[i] ?? 0;
		const x = cursor;
		cursor += width + gapAfter(i);
		return {item, x, width: Math.max(0, width - retract)};
	});
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			{placed.map(({item, x, width}, i) => (
				<div key={i} style={{position: 'absolute', left: w(x), top: h(midY), width: w(width), overflow: 'hidden', transform: 'translateY(-50%)'}}>
					{item}
				</div>
			))}
		</AbsoluteFill>
	);
};

// ---- Demo ----

/** A clip bar: a rounded strip with a label band (neutral, gray). */
const Clip: React.FC<{tone: Tone; w: number; h: number; label: string}> = ({tone, w, h, label}) => {
	const s = scheme(tone);
	const {height} = useFrame();
	return (
		<div style={{width: w, height: h, borderRadius: h * 0.12, backgroundColor: s.muted, overflow: 'hidden', position: 'relative'}}>
			<div style={{height: h * 0.32, backgroundColor: s.plate, paddingLeft: h * 0.1, display: 'flex', alignItems: 'center'}}>
				<Word tone={tone} height={height * 0.3} role="label" color="ink">
					{label}
				</Word>
			</div>
		</div>
	);
};

const Tile: React.FC<{tone: Tone; w: number; h: number}> = ({tone, w, h}) => {
	const s = scheme(tone);
	return <div style={{width: w, height: h, borderRadius: Math.min(w, h) * 0.12, backgroundColor: s.plate}} />;
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const {w, h, px, height} = useFrame();
	const s = scheme('dark');
	switch (variant) {
		case 'ghostTrail': {
			const items = Array.from({length: 9}, (_, i) => <Tile key={i} tone="dark" w={w(num(v, 'boxW')) * 0.86} h={h(num(v, 'boxH')) * 0.7} />);
			return (
				<AbsoluteFill>
					<div style={{position: 'absolute', left: 0, right: 0, top: h(70), height: h(30), backgroundColor: s.bgAlt}} />
					<DragDrop variant={variant} items={items} />
				</AbsoluteFill>
			);
		}
		case 'dragOut': {
			const items = Array.from({length: 25}, (_, i) => <Tile key={i} tone="dark" w={w(13)} h={h(13.5)} />);
			return (
				<AbsoluteFill>
					<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: w(15), backgroundColor: s.bgAlt}} />
					<DragDrop variant={variant} items={items} top={12} gap={28} />
				</AbsoluteFill>
			);
		}
		case 'stripDock':
		case 'rippleEdit': {
			const widths = variant === 'stripDock' ? [16, 11, 14, 9, 13, 12] : [12, 17, 12, 10, 11, 9, 12];
			const items = widths.map((cw, i) => <Clip key={i} tone="dark" w={w(cw)} h={h(7)} label={`0${i + 1}`} />);
			return (
				<AbsoluteFill>
					<div style={{position: 'absolute', left: 0, right: 0, top: h(44), height: h(12), backgroundColor: s.bgAlt}} />
					<DragDrop variant={variant} items={items} widths={widths} />
				</AbsoluteFill>
			);
		}
		case 'carryIn':
		default: {
			const chip = (
				<div style={{display: 'flex', alignItems: 'center', gap: px(14)}}>
					<Tile tone="dark" w={px(134)} h={px(96)} />
					<Block tone="dark" w={px(300)} h={px(76)} fill="surfaceAlt" radius={px(38)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<Word tone="dark" height={height} role="label">
							draft 02
						</Word>
					</Block>
				</div>
			);
			const folder = (
				<div style={{position: 'relative', width: px(300), height: px(220)}}>
					<div style={{position: 'absolute', left: 0, top: 0, width: px(120), height: px(40), borderRadius: px(14), backgroundColor: s.line}} />
					<div style={{position: 'absolute', left: 0, top: px(24), width: px(300), height: px(196), borderRadius: px(20), backgroundColor: s.surfaceAlt}} />
				</div>
			);
			return (
				<AbsoluteFill>
					<DragDrop variant={variant} items={[chip]} target={folder} targetAt={[num(v, 'dropX'), num(v, 'dropY') - 4]} grip={[74, 6]} pointerSize={120} />
				</AbsoluteFill>
			);
		}
	}
};
