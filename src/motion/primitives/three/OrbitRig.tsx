import {ThreeCanvas} from '@remotion/three';
import type React from 'react';
import {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {flag, num, useFrame, variantOf} from '../../engine/anim';
import {scheme, type Tone} from '../../tokens/colors';
import {FONT, fontSize} from '../../tokens/type';
import type {DemoProps, VariantSpec} from '../types';
import {spec} from './OrbitRig.spec';

export type OrbitRigProps = {children: React.ReactNode; tone?: Tone; variant?: string};

const rad = (deg: number) => (deg * Math.PI) / 180;
const RINGS = ['A', 'B', 'S'] as const;

/** The rig's frame in camera space (x right, y up, z toward the viewer): its z is the spin axis. */
const rigBasis = (v: VariantSpec): THREE.Quaternion => {
	const tilt = rad(num(v, 'axisTilt'));
	const sc = rad(num(v, 'axisScreen'));
	// screen projection from upper left to lower right, the upper end toward or away from the viewer
	const z = new THREE.Vector3(-Math.sin(sc) * Math.sin(tilt), Math.cos(sc) * Math.sin(tilt), Math.cos(tilt) * (flag(v, 'axisAway') ? -1 : 1));
	const x = new THREE.Vector3(0, 0, 1).cross(z).normalize();
	const y = z.clone().cross(x);
	return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
};

/** A ring's plane, as the rotation that takes the local z onto its normal (polar angle from the axis, azimuth). */
const ringTilt = (v: VariantSpec, ring: string): THREE.Quaternion => {
	const th = rad(num(v, `polar${ring}`));
	const ph = rad(num(v, `azimuth${ring}`));
	const n = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th));
	return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
};

/** Halftone band: two rows of dots one pitch apart, the second row offset half a pitch. */
const bandPoints = (radius: number, pitch: number): Float32Array => {
	const out: number[] = [];
	[-0.5, 0.5].forEach((row, k) => {
		const r = radius + row * pitch;
		const n = Math.round((2 * Math.PI * r) / pitch);
		for (let i = 0; i < n; i++) {
			const a = ((i + k * 0.5) / n) * 2 * Math.PI;
			out.push(r * Math.cos(a), r * Math.sin(a), 0);
		}
	});
	return new Float32Array(out);
};

const circlePoints = (radius: number, segments: number): Float32Array =>
	new Float32Array(Array.from({length: segments}, (_, i) => [radius * Math.cos((i / segments) * 2 * Math.PI), radius * Math.sin((i / segments) * 2 * Math.PI), 0]).flat());

const dotSprite = (): THREE.Texture => {
	const c = document.createElement('canvas');
	c.width = c.height = 64;
	const g = c.getContext('2d');
	if (g) {
		g.fillStyle = '#ffffff';
		g.beginPath();
		g.arc(32, 32, 30, 0, 2 * Math.PI);
		g.fill();
	}
	return new THREE.CanvasTexture(c);
};

/** The rig in one canvas; `keep` = 1 draws the half toward the viewer, -1 the half behind the content. */
const RigCanvas: React.FC<{v: VariantSpec; keep: 1 | -1; spin: THREE.Quaternion; tone: Tone; dots: boolean}> = ({v, keep, spin, tone, dots}) => {
	const {width, height, w, h} = useFrame();
	const color = scheme(tone).inkSoft;
	const sprite = useMemo(() => (dots ? dotSprite() : null), [dots]);
	const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, keep), 0), [keep]);
	const pitch = dots ? w(num(v, 'pitch')) : 0;
	const geoms = useMemo(
		() =>
			RINGS.map((r) => {
				const g = new THREE.BufferGeometry();
				const radius = w(num(v, `radius${r}`));
				g.setAttribute('position', new THREE.BufferAttribute(dots ? bandPoints(radius, pitch) : circlePoints(radius, 256), 3));
				return g;
			}),
		[v, w, dots, pitch],
	);
	const basis = useMemo(() => rigBasis(v), [v]);
	return (
		<ThreeCanvas
			width={width}
			height={height}
			dpr={1}
			orthographic
			camera={{position: [0, 0, 2000], zoom: 1, near: 0.1, far: 6000}}
			gl={{antialias: true, alpha: true}}
			onCreated={({gl}) => {
				gl.localClippingEnabled = true;
			}}
		>
			<group position={[w(num(v, 'centerX')) - width / 2, height / 2 - h(num(v, 'centerY')), 0]}>
				<group quaternion={spin}>
					<group quaternion={basis}>
						{RINGS.map((r, i) => (
							<group key={r} quaternion={ringTilt(v, r)}>
								{dots ? (
									<points geometry={geoms[i]}>
										<pointsMaterial
											color={color}
											size={pitch / 2}
											sizeAttenuation={false}
											map={sprite}
											alphaTest={0.5}
											clippingPlanes={[plane]}
										/>
									</points>
								) : (
									<lineLoop geometry={geoms[i]}>
										<lineBasicMaterial color={color} transparent opacity={num(v, 'opacity')} />
									</lineLoop>
								)}
							</group>
						))}
					</group>
				</group>
			</group>
		</ThreeCanvas>
	);
};

export const OrbitRig: React.FC<OrbitRigProps> = ({children, tone = 'dark', variant}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const frame = useCurrentFrame();
	const basis = useMemo(() => rigBasis(v), [v]);
	if (name === 'tumble') {
		// two rotations at the measured rates, so no single in-plane turn fits the strokes
		const spin = new THREE.Quaternion().setFromEuler(new THREE.Euler(rad(num(v, 'rateB') * frame), rad(num(v, 'rateA') * frame), 0, 'YXZ'));
		return (
			<AbsoluteFill>
				<AbsoluteFill>
					<RigCanvas v={v} keep={1} spin={spin} tone={tone} dots={false} />
				</AbsoluteFill>
				<AbsoluteFill>{children}</AbsoluteFill>
			</AbsoluteFill>
		);
	}
	// rigid spin about the axis: in camera space, a turn about the basis' z
	const axis = new THREE.Vector3(0, 0, 1).applyQuaternion(basis);
	const spin = new THREE.Quaternion().setFromAxisAngle(axis, rad(num(v, 'phase') + num(v, 'degPerFrame') * frame));
	return (
		<AbsoluteFill>
			<AbsoluteFill>
				<RigCanvas v={v} keep={-1} spin={spin} tone={tone} dots />
			</AbsoluteFill>
			<AbsoluteFill>{children}</AbsoluteFill>
			<AbsoluteFill>
				<RigCanvas v={v} keep={1} spin={spin} tone={tone} dots />
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** Isolated demo: one plain word in the middle of the rig. */
export const Demo: React.FC<DemoProps> = ({variant}) => {
	const s = scheme(spec.demoTone);
	const {height} = useFrame();
	return (
		<OrbitRig variant={variant} tone={spec.demoTone}>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: fontSize('display', height), color: s.ink, letterSpacing: '-0.02em'}}>core</div>
			</AbsoluteFill>
		</OrbitRig>
	);
};
