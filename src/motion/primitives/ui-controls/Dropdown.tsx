import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DirectionalBlur} from '../../engine/blur';
import {maybe, mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {Bar, Check, Chevron, Glyph, smear, Text, useRate} from './kit';
import {spec} from './Dropdown.spec';

export type DropdownProps = {
	items: React.ReactNode[];
	/** the chip or label the menu opens from; drawn with its bottom-right corner at the anchor point */
	anchor?: React.ReactNode;
	/** the surrounding UI, re-framed with the anchor and the menu */
	children?: React.ReactNode;
	tone?: Tone;
	variant?: string;
	/** the anchor point (the menu's top-right corner) in % of the frame; unfold starts at its measured y */
	x?: number;
	y?: number;
	/** gap between the anchor and the menu, px at 1080 */
	gap?: number;
};

// The layer (children, anchor, menu) is re-framed about the anchor point; the menu hangs from it by its
// top-right corner and opens by unfolding down (unfold) or by scaling up about that corner (scaleIn),
// smeared by its own speed where the video's shutter is measured; it closes by shrinking into the
// measured point of the panel.
export const Dropdown: React.FC<DropdownProps> = ({items, anchor, children, tone = 'light', variant, x, y, gap = 16}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const rate = useRate(spec, variant);
	const frame = useCurrentFrame();
	const {w, h, px} = useFrame();
	const s = scheme(tone);
	const m = v.motions;
	const menuW = w(num(v, 'menuW'));
	let ax = w(x ?? 80);
	const ay = h(y ?? maybe(v, 'fromY') ?? 20);
	let layer = '';
	let menu = '';
	let origin = '100% 0%';
	let blur = 0;
	let pageBlur = 0;
	let visible = true;
	if (m.y) {
		// re-frame: the anchor rides from fromY to toY while the layer scales about it
		const k = p('y');
		const dy = h(mix(k, num(v, 'fromY'), num(v, 'toY')) - num(v, 'fromY'));
		layer = `translate(0px, ${dy}px) scale(${mix(k, 1, num(v, 'toScale'))})`;
		const open = p('open');
		visible = frame >= (m.open?.delay ?? 0);
		const close = m.close ? 1 - p('close') : 1;
		if (m.close && frame >= m.close.delay) {
			menu = `scale(${Math.max(0, close)})`;
			origin = `${num(v, 'closeX')}% ${num(v, 'closeY')}%`;
			visible = close > 0.002;
		} else {
			menu = `scaleY(${Math.max(0, open)})`;
			origin = '50% 0%';
		}
	} else {
		// scaleIn: apparent scale on the measured curve, split into the menu's own scale and the push
		const k = p('scale');
		const apparent = mix(k, num(v, 'apparentFrom'), 1);
		const own = mix(k, num(v, 'fromScale'), 1);
		const rest = x ?? num(v, 'right');
		ax = w(mix(k, num(v, 'fromRight'), rest));
		layer = `translate(${ax - w(rest)}px, 0px) scale(${apparent / own})`;
		menu = `scale(${own})`;
		// on-screen speeds: the menu's far corner runs at d(apparent) x its width (half that on average);
		// the page under the push at d(push) x half the frame. Blur is applied before the scales, so it
		// is divided by the scale it is drawn under.
		const shutter = maybe(v, 'shutter') ?? 0;
		const dk = rate('scale');
		const dApparent = dk * (1 - num(v, 'apparentFrom'));
		const dOwn = dk * (1 - num(v, 'fromScale'));
		const dPush = (dApparent * own - apparent * dOwn) / (own * own);
		blur = smear(shutter, dApparent * menuW * 0.5) / apparent;
		pageBlur = smear(shutter, dPush * w(50)) / (apparent / own);
		ax = w(rest);
	}
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{transform: layer, transformOrigin: `${ax}px ${ay}px`}}>
				<DirectionalBlur x={pageBlur} y={pageBlur} style={{position: 'absolute', inset: 0}}>
					{children}
				</DirectionalBlur>
				{anchor ? (
					<div style={{position: 'absolute', left: ax, top: ay - px(gap), transform: 'translate(-100%, -100%)'}}>{anchor}</div>
				) : null}
				<div
					style={{
						position: 'absolute',
						left: ax - menuW,
						top: ay,
						width: menuW,
						transform: menu,
						transformOrigin: origin,
						opacity: visible ? 1 : 0,
					}}
				>
					<DirectionalBlur x={blur} y={blur}>
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: px(8),
								padding: px(18),
								borderRadius: px(34),
								backgroundColor: s.surface,
								border: `2px solid ${s.line}`,
								boxSizing: 'border-box',
							}}
						>
							{items}
						</div>
					</DirectionalBlur>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// ---- isolated demo ----

const H = 1080;

const Option: React.FC<{tone: Tone; title: string; sub: string; kind: 'circle' | 'square'; on?: boolean}> = ({tone, title, sub, kind, on}) => {
	const s = scheme(tone);
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 34, padding: '24px 30px', borderRadius: 24, backgroundColor: on ? s.surfaceAlt : 'transparent'}}>
			<Glyph size={96} tile={s.bgAlt} mark={s.inkSoft} kind={kind} />
			<div style={{display: 'flex', flexDirection: 'column', gap: 8, flex: 1}}>
				<Text role="ui" height={H} cap={2.9} weight={500} color={s.ink}>
					{title}
				</Text>
				<Text role="ui" height={H} cap={2.6} color={s.muted}>
					{sub}
				</Text>
			</div>
			<div style={{opacity: on ? 1 : 0}}>
				<Check size={64} color={s.ink} />
			</div>
		</div>
	);
};

const Row: React.FC<{tone: Tone; word: string}> = ({tone, word}) => {
	const s = scheme(tone);
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 40, padding: '30px 40px'}}>
			<div style={{width: 64, height: 64, borderRadius: 16, border: `6px solid ${s.inkSoft}`, boxSizing: 'border-box'}} />
			<Text role="ui" height={H} cap={4.2} color={s.ink}>
				{word}
			</Text>
		</div>
	);
};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	if (variant === 'scaleIn') {
		const page = (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 120, borderBottom: `2px solid ${s.line}`, backgroundColor: s.surface}} />
				<div style={{position: 'absolute', left: 80, top: 40}}>
					<Bar tone={tone} w={220} h={40} strong />
				</div>
				<div style={{position: 'absolute', left: 140, top: 240, display: 'flex', flexDirection: 'column', gap: 34}}>
					{[0, 1, 2, 3, 4, 5].map((r) => (
						<Bar key={r} tone={tone} w={1000 - ((r * 170) % 420)} h={30} />
					))}
				</div>
			</AbsoluteFill>
		);
		const disc = <div style={{width: 76, height: 76, borderRadius: 38, backgroundColor: s.inkSoft}} />;
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<Dropdown
					variant="scaleIn"
					y={12.5}
					anchor={disc}
					gap={10}
					items={['Profile', 'Settings', 'Shortcuts', 'Help', 'Log out'].map((t) => (
						<Row key={t} tone={tone} word={t} />
					))}
				>
					{page}
				</Dropdown>
			</AbsoluteFill>
		);
	}
	// unfold: a prompt card whose mode label opens a two-option menu, the layer re-framing to it
	const card = (
		<div style={{position: 'absolute', left: '12%', right: '12%', top: '30%', height: '24%', borderRadius: 44, backgroundColor: s.surface, border: `2px solid ${s.line}`}}>
			<div style={{position: 'absolute', left: 60, top: 54}}>
				<Bar tone={tone} w={640} h={34} strong />
			</div>
			<div style={{position: 'absolute', left: 60, bottom: 44, width: 84, height: 84, borderRadius: 42, border: `3px solid ${s.line}`, boxSizing: 'border-box'}} />
			<div style={{position: 'absolute', right: 44, bottom: 40, width: 96, height: 96, borderRadius: 26, backgroundColor: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<Chevron size={60} color={s.onAccent} />
			</div>
		</div>
	);
	const label = (
		<div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '18px 26px', borderRadius: 26, backgroundColor: s.surfaceAlt}}>
			<Text role="ui" height={H} cap={3.0} color={s.ink}>
				Quick
			</Text>
			<Chevron size={40} color={s.ink} dir="down" />
		</div>
	);
	return (
		<AbsoluteFill style={{backgroundColor: s.bg}}>
			<Dropdown
				variant="unfold"
				x={80.5}
				anchor={label}
				items={[
					<Option key="a" tone={tone} title="Quick answer" sub="A short and direct reply" kind="circle" on />,
					<Option key="b" tone={tone} title="Careful look" sub="Takes a little more time" kind="square" />,
				]}
			>
				{card}
			</Dropdown>
		</AbsoluteFill>
	);
};
