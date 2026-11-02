import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FONT, fontSize} from '../../tokens/type';
import type {DemoProps} from '../types';
import {FootageSlot} from '../footage/FootageSlot';
import {footageOf, spherePoints} from './space';
import {spec} from './GlobeRise.spec';

export type GlobeRiseProps = {
	/** footage for the tiles (cycled); gray plates when absent */
	footage?: string[];
	tone?: Tone;
	variant?: string;
	/** tiles over the whole sphere (about a quarter face the camera) */
	count: number;
	/** tile width / height */
	tileAspect: number;
};

// A sphere in CSS 3D so the tiles stay FootageSlots: a shaded disc on the sphere's centre plane hides the far side,
// and each tile sits on the surface (rotateY longitude, rotateX latitude, translateZ radius) facing out.
export const GlobeRise: React.FC<GlobeRiseProps> = ({footage, tone = 'light', variant, count, tileAspect}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, h} = useFrame();
	const s = scheme(tone);
	const r = w(num(v, 'radius'));
	const cx = w(num(v, 'centerX'));
	const cy = h(num(v, 'top')) + r;
	const tw = w(num(v, 'tile'));
	const th = tw / tileAspect;
	const spin = num(v, 'degPerFrame') * frame;
	const lift = h(mix(p('y'), num(v, 'rise'), 0));
	const points = spherePoints(count);
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<div
				style={{
					position: 'absolute',
					left: cx - r,
					top: cy - r,
					width: 2 * r,
					height: 2 * r,
					transformStyle: 'preserve-3d',
					transform: `translateY(${lift}px)`,
				}}
			>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						borderRadius: '50%',
						background: `radial-gradient(circle at 50% 30%, ${s.surface} 0%, ${s.bgAlt} 70%, ${s.surfaceAlt} 100%)`,
					}}
				/>
				<div style={{position: 'absolute', left: r, top: r, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `rotateY(${spin}deg)`}}>
					{points.map((pt, i) => {
						const src = footage && footage.length > 0 ? footage[i % footage.length] : undefined;
						return (
							<div
								key={i}
								style={{
									position: 'absolute',
									left: -tw / 2,
									top: -th / 2,
									width: tw,
									height: th,
									overflow: 'hidden',
									backfaceVisibility: 'hidden',
									WebkitBackfaceVisibility: 'hidden',
									transform: `rotateY(${pt.lon}deg) rotateX(${pt.lat}deg) translateZ(${r}px)`,
								}}
							>
								<FootageSlot tone={tone} footage={src ? footageOf(src) : undefined} />
							</div>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};

/** Isolated demo: a headline above the dome, gray plates as the tiles. */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const s = scheme(spec.demoTone);
	const {height, h} = useFrame();
	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					top: h(8),
					width: '100%',
					textAlign: 'center',
					fontFamily: FONT.display,
					fontWeight: 800,
					fontSize: fontSize('display', height) * 0.85,
					color: s.ink,
				}}
			>
				12 cities
			</div>
			<GlobeRise variant={variant} tone={spec.demoTone} count={64} tileAspect={0.75} />
		</AbsoluteFill>
	);
};
