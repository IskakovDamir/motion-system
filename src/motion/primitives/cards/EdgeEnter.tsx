import React, {createContext, useContext} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DirectionalBlur} from '../../engine/blur';
import {flag, maybe, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FootageSlot} from '../footage/FootageSlot';
import type {DemoProps} from '../types';
import {BOX_TO_SIGMA, Bar, Disc, Lines, Surface, Word, smearBox, stepAt} from './kit';
import {spec} from './EdgeEnter.spec';

export type EdgeEnterProps = {children: React.ReactNode; tone?: Tone; variant?: string; style?: React.CSSProperties};

type Smear = {x: number; y: number; dx: number; dy: number};
const SmearContext = createContext<Smear>({x: 0, y: 0, dx: 0, dy: 0});

/**
 * Marks the parts of an EdgeEnter child that smear when the variant smears parts only (smearParts):
 * they take the motion blur, pushed half a box forward along the travel when the smear runs forward.
 * Elsewhere it is a plain wrapper.
 */
export const EdgeSmear: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => {
	const s = useContext(SmearContext);
	return (
		<DirectionalBlur x={s.x} y={s.y} style={{transform: `translate(${s.dx}px, ${s.dy}px)`, ...style}}>
			{children}
		</DirectionalBlur>
	);
};

// The element travels from its start offset (fromX / fromY, beyond a frame edge in the demo) to rest on
// the variant's x or y motion (both axes share that progress). Before the motion starts it may drift
// on held pictures (drift: % H beyond the start). The blur is the shutter box along the travel at the
// current speed: on the whole element, or only on EdgeSmear parts (smearParts). trailFrames: for that
// many frames a long exposure of the element trails from where it started.
export const EdgeEnter: React.FC<EdgeEnterProps> = ({children, variant, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, h} = useFrame();
	const prop = 'y' in v.motions ? 'y' : 'x';
	const travelX = w(maybe(v, 'fromX') ?? 0);
	const travelY = h(maybe(v, 'fromY') ?? 0);
	const q = p(prop);
	const ahead = p(prop, -1) - q; // progress to the next frame
	const drift = typeof v.params?.drift === 'string' ? h(stepAt(v.params.drift, frame, 0)) * Math.sign(travelY) : 0;
	const dx = travelX * (1 - q);
	const dy = travelY * (1 - q) + drift;
	const shutter = maybe(v, 'shutter') ?? 0;
	const boxX = smearBox(shutter, travelX * ahead);
	const boxY = smearBox(shutter, travelY * ahead);
	const blur = {x: boxX * BOX_TO_SIGMA, y: boxY * BOX_TO_SIGMA};
	const parts = flag(v, 'smearParts');
	const fwd = flag(v, 'forward') ? 0.5 : 0;
	const smear: Smear = parts ? {...blur, dx: -Math.sign(travelX) * boxX * fwd, dy: -Math.sign(travelY) * boxY * fwd} : {x: 0, y: 0, dx: 0, dy: 0};
	const whole = parts ? {x: 0, y: 0} : blur;
	const trailFrames = maybe(v, 'trailFrames');
	const trail = trailFrames !== undefined && frame <= trailFrames ? {x: Math.abs(travelX) * q, y: Math.abs(travelY) * q} : undefined;
	return (
		<SmearContext.Provider value={smear}>
			<div style={{position: 'relative', transform: `translate(${dx}px, ${dy}px)`, ...style}}>
				{trail ? (
					<DirectionalBlur
						x={trail.x * BOX_TO_SIGMA}
						y={trail.y * BOX_TO_SIGMA}
						style={{position: 'absolute', inset: 0, transform: `translate(${Math.sign(travelX) * trail.x * 0.5}px, ${Math.sign(travelY) * trail.y * 0.5}px)`}}
					>
						{children}
					</DirectionalBlur>
				) : null}
				<DirectionalBlur x={whole.x} y={whole.y}>
					{children}
				</DirectionalBlur>
			</div>
		</SmearContext.Provider>
	);
};

// ---- isolated demo ----

const H = 1080;
const W = 1920;

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const s = scheme(tone);
	const v = variantOf(spec, variant);
	if (variant === 'smearRise') {
		// rest: the chip's label centre at 49.4% H
		const chipCentre = 60;
		return (
			<AbsoluteFill>
				<div style={{position: 'absolute', left: 0, right: 0, top: (num(v, 'restY') / 100) * H - chipCentre, display: 'flex', justifyContent: 'center'}}>
					<EdgeEnter variant={variant}>
						<Surface tone={tone} w={760} h={420} style={{padding: 34, display: 'flex', flexDirection: 'column', gap: 30}}>
							<div style={{display: 'flex', alignItems: 'center', gap: 14, height: 52, alignSelf: 'flex-start', padding: '0 24px', borderRadius: 26, backgroundColor: s.surfaceAlt}}>
								<Disc tone={tone} d={18} fill="ink" />
								<Word tone={tone}>done</Word>
							</div>
							<div style={{flex: 1, position: 'relative', borderRadius: 16, overflow: 'hidden'}}>
								<FootageSlot label="result" />
							</div>
						</Surface>
					</EdgeEnter>
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'dropDecelerate') {
		// rest: the window's bottom edge at 95.73% H; the sidebar, the small label and the input bar smear
		const winH = 820;
		return (
			<AbsoluteFill>
				<div style={{position: 'absolute', left: 0, right: 0, top: (num(v, 'restBottom') / 100) * H - winH, display: 'flex', justifyContent: 'center'}}>
					<EdgeEnter variant={variant}>
						<Surface tone={tone} w={1500} h={winH} style={{display: 'flex'}}>
							<EdgeSmear style={{width: 260, height: '100%'}}>
								<div style={{width: 260, height: '100%', backgroundColor: s.bgAlt, padding: 32, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 30}}>
									{[0, 1, 2, 3, 4].map((i) => (
										<div key={i} style={{display: 'flex', alignItems: 'center', gap: 14}}>
											<div style={{width: 30, height: 30, borderRadius: 8, border: `3px solid ${s.muted}`}} />
											<Bar tone={tone} w={110} h={14} fill="muted" />
										</div>
									))}
								</div>
							</EdgeSmear>
							<div style={{flex: 1, padding: '70px 90px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28}}>
								<EdgeSmear>
									<Word tone={tone} color="muted" role="ui">
										board
									</Word>
								</EdgeSmear>
								<Word tone={tone} role="headline">
									What comes next?
								</Word>
								<div style={{display: 'flex', gap: 24, marginTop: 30}}>
									{[0, 1, 2].map((i) => (
										<Surface key={i} tone={tone} w={300} h={200} fill="bgAlt" line={false} radius={18} />
									))}
								</div>
								<div style={{flex: 1}} />
								<EdgeSmear>
									<div style={{width: 900, height: 96, borderRadius: 48, border: `3px solid ${s.line}`, display: 'flex', alignItems: 'center', padding: '0 34px', boxSizing: 'border-box'}}>
										<Word tone={tone} color="muted">
											write here
										</Word>
									</div>
								</EdgeSmear>
							</div>
						</Surface>
					</EdgeEnter>
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'blurSlide') {
		// rest: the dial's left edge at 48.0% W
		const d = 560;
		const r1 = 250;
		const r2 = 205;
		const ticks = Array.from({length: 60}, (_, i) => i);
		const arc = 0.72;
		const c = 2 * Math.PI * r2;
		return (
			<AbsoluteFill>
				<div style={{position: 'absolute', left: 200, top: H / 2 - 60}}>
					<Word tone={tone} role="headline">
						Turn it up
					</Word>
				</div>
				<div style={{position: 'absolute', left: (num(v, 'restLeft') / 100) * W, top: (H - d) / 2}}>
					<EdgeEnter variant={variant}>
						<svg width={d} height={d} viewBox={`0 0 ${d} ${d}`}>
							{ticks.map((i) => {
								const a = (i / 60) * 2 * Math.PI;
								const c0 = d / 2;
								return (
									<line
										key={i}
										x1={c0 + Math.cos(a) * (r1 - 16)}
										y1={c0 + Math.sin(a) * (r1 - 16)}
										x2={c0 + Math.cos(a) * r1}
										y2={c0 + Math.sin(a) * r1}
										stroke={i % 5 === 0 ? s.inkSoft : s.line}
										strokeWidth={4}
									/>
								);
							})}
							<circle cx={d / 2} cy={d / 2} r={r2} fill="none" stroke={s.surfaceAlt} strokeWidth={22} />
							<circle
								cx={d / 2}
								cy={d / 2}
								r={r2}
								fill="none"
								stroke={s.ink}
								strokeWidth={22}
								strokeDasharray={`${c * arc} ${c}`}
								transform={`rotate(-90 ${d / 2} ${d / 2})`}
								strokeLinecap="round"
							/>
							<circle cx={d / 2 + Math.cos(arc * 2 * Math.PI - Math.PI / 2) * r2} cy={d / 2 + Math.sin(arc * 2 * Math.PI - Math.PI / 2) * r2} r={26} fill={s.surface} stroke={s.ink} strokeWidth={6} />
							<text x={d / 2} y={d / 2 + 34} textAnchor="middle" fontFamily="Inter Variable, sans-serif" fontSize={96} fill={s.ink}>
								72
							</text>
						</svg>
					</EdgeEnter>
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'trailSlide') {
		// rest: tip at 40.6% W, 36.6% W long, centre y 86.1% H
		const len = (num(v, 'length') / 100) * W;
		const shaft = num(v, 'shaft');
		const head = shaft * 3.2;
		const tip = (num(v, 'restTip') / 100) * W;
		return (
			<AbsoluteFill>
				<div style={{position: 'absolute', left: W * 0.5, top: H * 0.3}}>
					<Word tone={tone} role="display">
						Then
					</Word>
				</div>
				<div style={{position: 'absolute', left: tip - len, top: (num(v, 'restY') / 100) * H - head}}>
					<EdgeEnter variant={variant}>
						<svg width={len} height={head * 2} viewBox={`0 0 ${len} ${head * 2}`}>
							<line x1={0} y1={head} x2={len - shaft * 0.7} y2={head} stroke={s.ink} strokeWidth={shaft} />
							<path d={`M ${len - head} ${head - head + shaft / 2} L ${len - shaft * 0.7} ${head} L ${len - head} ${head * 2 - shaft / 2}`} fill="none" stroke={s.ink} strokeWidth={shaft} strokeLinejoin="miter" />
						</svg>
					</EdgeEnter>
				</div>
			</AbsoluteFill>
		);
	}
	if (variant === 'streakDrop') {
		// rest: tip at 67.32% H, x 86.2% W, 32.4% H long, right of a label
		const len = (num(v, 'length') / 100) * H;
		const x = (num(v, 'restX') / 100) * W;
		const tipY = (num(v, 'restTipY') / 100) * H;
		const sw = 8;
		const head = 34;
		return (
			<AbsoluteFill>
				<div style={{position: 'absolute', right: W - x + 60, top: tipY - 120, textAlign: 'right'}}>
					<Word tone={tone} role="headline">
						scroll on
					</Word>
				</div>
				<div style={{position: 'absolute', left: x - head, top: tipY - len}}>
					<EdgeEnter variant={variant}>
						<svg width={head * 2} height={len} viewBox={`0 0 ${head * 2} ${len}`}>
							<line x1={head} y1={0} x2={head} y2={len - sw} stroke={s.ink} strokeWidth={sw} />
							<path d={`M ${sw} ${len - head} L ${head} ${len - sw / 2} L ${head * 2 - sw} ${len - head}`} fill="none" stroke={s.ink} strokeWidth={sw} />
						</svg>
					</EdgeEnter>
				</div>
			</AbsoluteFill>
		);
	}
	// hardLand (default): rest top 29.37% H, 16.2% W x 38.7% H, rising from just below the bottom edge
	const cw = (num(v, 'cardW') / 100) * W;
	const ch = (num(v, 'cardH') / 100) * H;
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: (W - cw) / 2, top: (num(v, 'restTop') / 100) * H}}>
				<EdgeEnter variant={variant ?? spec.defaultVariant}>
					<Surface tone={tone} w={cw} h={ch} style={{display: 'flex', flexDirection: 'column'}}>
						<div style={{flex: 1, position: 'relative'}}>
							<FootageSlot label="clip" />
						</div>
						<div style={{padding: 22, display: 'flex', flexDirection: 'column', gap: 12}}>
							<Word tone={tone}>plain</Word>
							<Lines tone={tone} widths={[200, 150]} h={12} gap={10} />
						</div>
					</Surface>
				</EdgeEnter>
			</div>
		</AbsoluteFill>
	);
};
