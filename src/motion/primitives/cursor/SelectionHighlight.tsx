import type React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {DirectionalBlur} from '../../engine/blur';
import {mix, num, str, useFrame, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {at as prog, atSpeed, Block, keyframesAt, nums, Pointer, smear, useRefFrame, Word} from './kit';
import {CursorState} from './CursorState';
import {spec} from './SelectionHighlight.spec';

/** An item's box: centre x / y and size, % of frame width / height. */
export type Rect = {x: number; y: number; w: number; h: number};

export type SelectionHighlightProps = {
	/** the elements, each centred in its rect */
	items: React.ReactNode[];
	/** where each item sits (layout) */
	rects: Rect[];
	tone?: Tone;
	variant?: string;
	/** the highlighted, lifted or first-selected item (default 0) */
	index?: number;
	/** jump: the item the selection jumps to (default: the last) */
	to?: number;
	/** hop: the selector frame drawing, centred on the hopping x and the items' row */
	selector?: React.ReactNode;
	/** rowSweep: pointer height, px at 1080 (no pointer without it) */
	pointerSize?: number;
	/** lift: the card the outline is drawn around (default: the box around all items) */
	card?: Rect;
	/** corner radius of the pill, outlines, tile highlights and the slot, px at 1080 (layout; default square) */
	radius?: number;
};

/** A step counts as moving while its progress is inside its 2% window. */
const SETTLED = 0.02;

const place = (r: Rect, w: (p: number) => number, h: (p: number) => number): React.CSSProperties => ({
	position: 'absolute',
	left: w(r.x - r.w / 2),
	top: h(r.y - r.h / 2),
	width: w(r.w),
	height: h(r.h),
});

const Centred: React.FC<{r: Rect; children: React.ReactNode; transform?: string}> = ({r, children, transform}) => {
	const {w, h} = useFrame();
	return <div style={{...place(r, w, h), display: 'flex', alignItems: 'center', justifyContent: 'center', transform}}>{children}</div>;
};

const bounds = (rs: Rect[]): Rect => {
	const l = Math.min(...rs.map((r) => r.x - r.w / 2));
	const r = Math.max(...rs.map((q) => q.x + q.w / 2));
	const t = Math.min(...rs.map((q) => q.y - q.h / 2));
	const b = Math.max(...rs.map((q) => q.y + q.h / 2));
	return {x: (l + r) / 2, y: (t + b) / 2, w: r - l, h: b - t};
};

export const SelectionHighlight: React.FC<SelectionHighlightProps> = ({items, rects, tone = 'light', variant, index = 0, to, selector, pointerSize, card, radius = 0}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const f = useRefFrame();
	const {w, h, px} = useFrame();
	const s = scheme(tone);
	const rect = (i: number): Rect => rects[i] ?? rects[0] ?? {x: 50, y: 50, w: 0, h: 0};
	const plain = items.map((item, i) => (
		<Centred key={i} r={rect(i)}>
			{item}
		</Centred>
	));

	if (name === 'fadeWiden') {
		const r = rect(index);
		const k = prog(v, 'widen', f);
		const pw = mix(k, num(v, 'fromW'), num(v, 'toW'));
		const ph = mix(k, num(v, 'fromH'), num(v, 'toH'));
		return (
			<AbsoluteFill>
				<div
					style={{...place({x: r.x, y: r.y, w: pw, h: ph}, w, h), borderRadius: px(radius), backgroundColor: s.surfaceAlt, opacity: prog(v, 'opacity', f)}}
				/>
				{plain}
			</AbsoluteFill>
		);
	}

	if (name === 'lift') {
		const c = card ?? bounds(rects);
		const sc = mix(prog(v, 'scale', f), 1, num(v, 'liftScale'));
		return (
			<AbsoluteFill>
				<div
					style={{
						...place(c, w, h),
						boxSizing: 'border-box',
						borderRadius: px(radius),
						border: `${px(num(v, 'lineW'))}px solid ${s.line}`,
						opacity: prog(v, 'outline', f),
					}}
				/>
				{items.map((item, i) => (
					<Centred key={i} r={rect(i)} transform={i === index ? `scale(${sc})` : undefined}>
						{item}
					</Centred>
				))}
			</AbsoluteFill>
		);
	}

	if (name === 'rowSweep') {
		const lit = nums(v, 'litAt');
		const dim = f >= num(v, 'dimAt');
		const lw = px(num(v, 'lineW'));
		// pointer keyframes: `frame:@k` = centre of item k, `frame:x,y` = a point in %
		const keys = str(v, 'pointer')
			.trim()
			.split(/\s+/)
			.map((item): [number, number, number] => {
				const [fr, where] = item.split(':');
				if (where?.startsWith('@')) {
					const r = rect(Number(where.slice(1)));
					return [Number(fr), r.x, r.y];
				}
				const [x, y] = (where ?? '').split(',').map(Number);
				return [Number(fr), x ?? 50, y ?? 50];
			});
		const [cx, cy] = keyframesAt(keys, f);
		return (
			<AbsoluteFill>
				{items.map((item, i) => {
					const on = f >= (lit[i] ?? Infinity);
					const r = rect(i);
					return (
						<div key={i}>
							{on ? (
								<>
									<div style={{...place(r, w, h), borderRadius: px(radius), backgroundColor: s.surfaceAlt, opacity: dim ? num(v, 'dimFill') : 1}} />
									<div
										style={{
											...place(r, w, h),
											boxSizing: 'border-box',
											borderRadius: px(radius),
											border: `${lw}px solid ${s.muted}`,
											opacity: dim ? num(v, 'dimBorder') : 1,
										}}
									/>
								</>
							) : null}
							<Centred r={r}>{item}</Centred>
						</div>
					);
				})}
				{pointerSize ? <Pointer tone={tone} h={px(pointerSize)} look="flat" anchor="tip" x={w(cx)} y={h(cy)} /> : null}
			</AbsoluteFill>
		);
	}

	if (name === 'holdSlot') {
		const starts = nums(v, 'steps');
		const dips = nums(v, 'dips');
		// list scroll: the steps, the flick and the base drift
		let scroll = num(v, 'drift') * Math.max(0, f);
		starts.forEach((st) => (scroll += num(v, 'stepH') * prog(v, 'step', f, st)));
		scroll += num(v, 'flickH') * prog(v, 'flick', f);
		// slot dip: rises with each step's progress, drifts back between steps (never above its rest)
		const stepP = (t: number): number[] => [...starts.map((st) => prog(v, 'step', t, st)), prog(v, 'flick', t)];
		let o = 0;
		let prev = stepP(-1);
		for (let t = 0; t <= Math.floor(f); t++) {
			const cur = stepP(t);
			let moving = false;
			cur.forEach((p, k) => {
				o += (dips[k] ?? 0) * (p - (prev[k] ?? 0));
				if (p > SETTLED && p < 1 - SETTLED) moving = true;
			});
			if (!moving) o = Math.max(0, o - num(v, 'back'));
			prev = cur;
		}
		const r0 = rect(0);
		const slotTop = num(v, 'slotTop') + o;
		return (
			<AbsoluteFill style={{overflow: 'hidden'}}>
				<div style={{position: 'absolute', left: w(r0.x - r0.w / 2), top: h(slotTop), width: w(r0.w), height: h(r0.h), borderRadius: px(radius), backgroundColor: s.surfaceAlt}} />
				{items.map((item, i) => {
					const r = rect(i);
					return (
						<Centred key={i} r={{...r, y: r.y - scroll}}>
							{item}
						</Centred>
					);
				})}
			</AbsoluteFill>
		);
	}

	if (name === 'jump') {
		const target = to ?? items.length - 1;
		const sel = f >= num(v, 'at') ? target : index;
		const r = rect(sel);
		return (
			<AbsoluteFill>
				<div style={{...place(r, w, h), borderRadius: h(r.h) / 2, backgroundColor: s.ink, opacity: num(v, 'selAlpha')}} />
				{plain}
			</AbsoluteFill>
		);
	}

	// hop: the selector frame rides hop 1 then hop 2 along the items' row
	const xAt = (t: number, rd: typeof prog) => num(v, 'x0') + (num(v, 'x1') - num(v, 'x0')) * rd(v, 'hop1', t) + (num(v, 'x2') - num(v, 'x1')) * rd(v, 'x', t);
	const x = xAt(f, prog);
	const blur = smear(num(v, 'shutter'), w(xAt(f, atSpeed) - xAt(f - 1, atSpeed)), 0);
	const row = rect(index);
	return (
		<AbsoluteFill>
			{plain}
			<DirectionalBlur x={blur.x} y={blur.y} style={{position: 'absolute', inset: 0}}>
				<div style={{position: 'absolute', left: w(x), top: h(row.y), transform: 'translate(-50%, -50%)'}}>
					{selector}
				</div>
			</DirectionalBlur>
		</AbsoluteFill>
	);
};

// ---- Demo ----

const Thumb: React.FC<{tone: Tone; w: number; h: number; fill?: 'plate' | 'surfaceAlt' | 'surface' | 'line'}> = ({tone, w, h, fill = 'plate'}) => {
	const s = scheme(tone);
	return <div style={{width: w, height: h, borderRadius: Math.min(w, h) * 0.14, backgroundColor: s[fill]}} />;
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const {w, h, px, height} = useFrame();
	const l = scheme('light');
	const d = scheme('dark');
	const word = (t: string, tone: Tone = 'light') => (
		<Word tone={tone} height={height} role="label">
			{t}
		</Word>
	);
	switch (variant) {
		case 'lift': {
			// a result row on a card: a line of text and a dark button that lifts
			const rects: Rect[] = [
				{x: 36, y: 50, w: 30, h: 8},
				{x: 66, y: 50, w: 14.2, h: 5.4},
			];
			const button = (
				<Block tone="light" w={w(14.2)} h={h(5.4)} fill="ink" radius={h(2.7)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
					<Word tone="light" height={height} role="label" color="onAccent">
						Open
					</Word>
				</Block>
			);
			return (
				<AbsoluteFill>
					<SelectionHighlight variant={variant} rects={rects} index={1} radius={32} card={{x: 50, y: 50, w: 64, h: 14}} items={[word('Weekly notes, 12 pages'), button]} />
				</AbsoluteFill>
			);
		}
		case 'rowSweep': {
			const rects: Rect[] = Array.from({length: 25}, (_, i) => ({x: 26 + (i % 5) * 15.4, y: 20 + Math.floor(i / 5) * 15.5, w: 13.4, h: 13.5}));
			return (
				<AbsoluteFill style={{backgroundColor: d.bg}}>
					<SelectionHighlight
						variant={variant}
						tone="dark"
						rects={rects}
						radius={14}
						pointerSize={56}
						items={rects.map((_, i) => (
							<Thumb key={i} tone="dark" w={w(11.4)} h={h(10.5)} fill="surface" />
						))}
					/>
				</AbsoluteFill>
			);
		}
		case 'holdSlot': {
			const rects: Rect[] = Array.from({length: 14}, (_, i) => ({x: 48, y: num(v, 'slotTop') + 10 + i * num(v, 'stepH'), w: 56, h: 20}));
			return (
				<AbsoluteFill>
					<SelectionHighlight
						variant={variant}
						rects={rects}
						radius={36}
						items={rects.map((_, i) => (
							<div key={i} style={{display: 'flex', alignItems: 'center', gap: px(28), width: w(50)}}>
								<Thumb tone="light" w={px(110)} h={px(110)} fill="line" />
								<div style={{display: 'flex', flexDirection: 'column', gap: px(14)}}>
									{word(`Item ${i + 1}`)}
									<div style={{width: px(320), height: px(16), borderRadius: px(8), backgroundColor: l.line}} />
								</div>
							</div>
						))}
					/>
				</AbsoluteFill>
			);
		}
		case 'jump': {
			const labels = ['All', 'New', 'Saved'];
			const rects: Rect[] = labels.map((_, i) => ({x: 33.9 + i * 13, y: 52, w: 10.4, h: 6.3}));
			return (
				<AbsoluteFill style={{backgroundColor: d.bg}}>
					<div style={{position: 'absolute', left: w(18), top: h(30), width: w(64), height: h(56), borderRadius: px(36), backgroundColor: d.bgAlt}} />
					<SelectionHighlight variant={variant} tone="dark" rects={rects} items={labels.map((t) => word(t, 'dark'))} />
					<JumpGrid at={num(v, 'at')} />
					<Sequence from={num(v, 'tapAt')}>
						<CursorState variant="pressRipple" at={[rects[2]?.x ?? 50, 52]} />
					</Sequence>
				</AbsoluteFill>
			);
		}
		case 'hop': {
			const xs = [num(v, 'x2'), num(v, 'x0'), num(v, 'x1')];
			const rects: Rect[] = xs.map((x) => ({x, y: 50, w: 17, h: 20}));
			const frame = <div style={{width: w(17.5), height: h(21), boxSizing: 'border-box', borderRadius: px(28), border: `${px(6)}px solid ${l.muted}`}} />;
			return (
				<AbsoluteFill>
					<div style={{position: 'absolute', left: w(30), top: h(38), width: w(58), height: h(24), borderRadius: px(24), backgroundColor: l.bgAlt}} />
					<SelectionHighlight variant={variant} rects={rects} index={1} selector={frame} items={rects.map((_, i) => <Thumb key={i} tone="light" w={w(15.5)} h={h(17)} />)} />
				</AbsoluteFill>
			);
		}
		case 'fadeWiden':
		default: {
			const rows = ['Open', 'Copy', 'Move', 'Rename', 'Share'];
			const rects: Rect[] = rows.map((_, i) => ({x: 50, y: 22 + i * 14, w: 50, h: 10}));
			return (
				<AbsoluteFill>
					<div style={{position: 'absolute', left: w(18), top: h(12), width: w(64), height: h(76), borderRadius: px(36), backgroundColor: l.surface, border: `${px(2)}px solid ${l.line}`}} />
					<SelectionHighlight
						variant={variant}
						rects={rects}
						index={3}
						radius={22}
						items={rows.map((t) => (
							<div key={t} style={{width: w(44)}}>
								{word(t)}
							</div>
						))}
					/>
				</AbsoluteFill>
			);
		}
	}
};

/** jump demo: a small result grid that empties in the picture the selection jumps. */
const JumpGrid: React.FC<{at: number}> = ({at}) => {
	const f = useRefFrame();
	const {w, h} = useFrame();
	if (f >= at) return null;
	return (
		<>
			{Array.from({length: 4}, (_, i) => (
				<div key={i} style={{position: 'absolute', left: w(24 + i * 13.5), top: h(64), width: w(11), height: h(14), borderRadius: 14, backgroundColor: scheme('dark').surfaceAlt}} />
			))}
		</>
	);
};
