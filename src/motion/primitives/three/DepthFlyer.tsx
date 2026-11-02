import {ThreeCanvas} from '@remotion/three';
import type React from 'react';
import {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {DoubleSide} from 'three';
import {mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {FLYER_POSE, FOIL, flyerGeometry} from './origami';
import {spec} from './DepthFlyer.spec';

export type DepthFlyerProps = {
	tone?: Tone;
	variant?: string;
	/** a flyer's length at scale 1, % of frame width */
	size: number;
};

/** One flyer: screen position (% W, % H), scale, and the screen direction it flies in. */
type Flight = {x: number; y: number; s: number; dx: number; dy: number};

const Flyers: React.FC<{flights: Flight[]; size: number; tone: Tone}> = ({flights, size, tone}) => {
	const {width, height, w, h} = useFrame();
	const geometry = useMemo(() => flyerGeometry(), []);
	const color = scheme(tone).ink;
	return (
		<ThreeCanvas
			width={width}
			height={height}
			dpr={1}
			orthographic
			camera={{position: [0, 0, 1000], zoom: 1, near: 0.1, far: 4000}}
			gl={{antialias: true, alpha: true}}
		>
			<ambientLight intensity={FOIL.ambient} />
			<directionalLight position={[...FOIL.keyAt]} intensity={FOIL.key} />
			<directionalLight position={[...FOIL.fillAt]} intensity={FOIL.fill} />
			{flights.map((f, i) => (
				// three's y points up; the flight direction turns the nose
				<group key={i} position={[w(f.x) - width / 2, height / 2 - h(f.y), 0]} rotation={[0, 0, Math.atan2(-h(f.dy), w(f.dx))]}>
					<mesh geometry={geometry} rotation={[FLYER_POSE.roll, FLYER_POSE.pitch, 0]} scale={(w(size) / 2) * f.s}>
						<meshStandardMaterial color={color} metalness={FOIL.metalness} roughness={FOIL.roughness} flatShading side={DoubleSide} />
					</mesh>
				</group>
			))}
		</ThreeCanvas>
	);
};

export const DepthFlyer: React.FC<DepthFlyerProps> = ({tone = 'dark', variant, size}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const {height, w} = useFrame();
	const flights: Flight[] = [];
	if (name === 'dive') {
		// the lower extent is measured: nose down, the flyer's centre sits half its length above it
		const y = mix(p('y'), num(v, 'fromY'), num(v, 'toY'));
		flights.push({x: num(v, 'x'), y: y - ((w(size) / 2) / height) * 100, s: 1, dx: 0, dy: 1});
	} else {
		const x = p('x');
		const t = p('top');
		const n = p('near');
		flights.push(
			{
				x: mix(n, num(v, 'nearX0'), num(v, 'nearX1')),
				y: mix(n, num(v, 'nearY0'), num(v, 'nearY1')),
				s: mix(n, num(v, 'topS0'), num(v, 'topS1')),
				dx: num(v, 'nearX1') - num(v, 'nearX0'),
				dy: num(v, 'nearY1') - num(v, 'nearY0'),
			},
			{
				x: num(v, 'topX'),
				y: mix(t, num(v, 'topY0'), num(v, 'topY1')),
				s: mix(t, num(v, 'topS0'), num(v, 'topS1')),
				dx: 0,
				dy: num(v, 'topY1') - num(v, 'topY0'),
			},
			{
				x: mix(x, num(v, 'rightX0'), num(v, 'rightX1')),
				y: mix(x, num(v, 'rightY0'), num(v, 'rightY1')),
				s: mix(x, num(v, 'rightS0'), num(v, 'rightS1')),
				dx: num(v, 'rightX1') - num(v, 'rightX0'),
				dy: num(v, 'rightY1') - num(v, 'rightY0'),
			},
		);
	}
	return (
		<AbsoluteFill>
			<Flyers flights={flights.slice(0, name === 'dive' ? 1 : num(v, 'count'))} size={size} tone={tone} />
		</AbsoluteFill>
	);
};

/** Isolated demo: the flyers alone on the dark ground. */
export const Demo: React.FC<DemoProps> = ({variant}) => <DepthFlyer variant={variant} tone={spec.demoTone} size={variant === 'dive' ? 4 : 9} />;
