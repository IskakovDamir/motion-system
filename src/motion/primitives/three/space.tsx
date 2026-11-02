import type React from 'react';
import {useLayoutEffect, useRef, useState} from 'react';
import type {Footage} from '../footage/FootageSlot';

// Shared by the three group: projective maps for keystone tapers and side-turns, an element-size hook,
// and the footage-string adapter. No measured number lives here; callers pass the spec's params.

export type Pt = readonly [number, number];
/** Corners in px of the element's own box: top-left, top-right, bottom-right, bottom-left. */
export type Quad = readonly [Pt, Pt, Pt, Pt];

/**
 * CSS matrix3d (with transform-origin 0 0) that maps the box (0,0)-(w,h) onto `q`: the projective
 * map (homography) of the unit square, so straight lines stay straight and sides may taper.
 */
export const quadMatrix = (w: number, h: number, q: Quad): string => {
	const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
	const dx1 = x1 - x2;
	const dx2 = x3 - x2;
	const dx3 = x0 - x1 + x2 - x3;
	const dy1 = y1 - y2;
	const dy2 = y3 - y2;
	const dy3 = y0 - y1 + y2 - y3;
	let g = 0;
	let k = 0;
	if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) {
		const det = dx1 * dy2 - dx2 * dy1;
		g = (dx3 * dy2 - dx2 * dy3) / det;
		k = (dx1 * dy3 - dx3 * dy1) / det;
	}
	const a = x1 - x0 + g * x1;
	const b = x3 - x0 + k * x3;
	const d = y1 - y0 + g * y1;
	const e = y3 - y0 + k * y3;
	// unit square -> quad, after box px -> unit square
	const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
	return `matrix3d(${m.map((n) => +n.toFixed(8)).join(',')})`;
};

/** The untransformed layout size of an element (px), kept current by a ResizeObserver. */
export const useSize = <T extends HTMLElement>() => {
	const ref = useRef<T>(null);
	const [size, setSize] = useState({w: 0, h: 0});
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const read = () => setSize((s) => (s.w === el.offsetWidth && s.h === el.offsetHeight ? s : {w: el.offsetWidth, h: el.offsetHeight}));
		read();
		const ro = new ResizeObserver(read);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	return [ref, size] as const;
};

/** Draws its children mapped onto the quad that `quad(w, h)` returns for their own box. */
export const Keystone: React.FC<{quad: (w: number, h: number) => Quad; style?: React.CSSProperties; children: React.ReactNode}> = ({
	quad,
	style,
	children,
}) => {
	const [ref, {w, h}] = useSize<HTMLDivElement>();
	const transform = w > 0 && h > 0 ? quadMatrix(w, h, quad(w, h)) : undefined;
	return (
		<div ref={ref} style={{...style, transformOrigin: '0 0', transform}}>
			{children}
		</div>
	);
};

/** A footage path as FootageSlot takes it: video by extension, otherwise an image. */
export const footageOf = (src: string): Footage => ({kind: /\.(mp4|webm|mov|m4v)$/i.test(src) ? 'video' : 'image', src});

/** Points spread evenly over a unit sphere (golden-angle spiral): latitude and longitude in degrees. */
export const spherePoints = (n: number): {lat: number; lon: number}[] => {
	const golden = Math.PI * (3 - Math.sqrt(5));
	return Array.from({length: n}, (_, i) => {
		const y = 1 - (2 * (i + 0.5)) / n;
		return {lat: (Math.asin(y) * 180) / Math.PI, lon: (((i * golden * 180) / Math.PI) % 360) - 180};
	});
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Standard normal CDF (Abramowitz-Stegun 7.1.26 erf, |error| < 1.5e-7): the edge profile of a Gaussian blur. */
export const normalCdf = (x: number): number => {
	const z = Math.abs(x) / Math.SQRT2;
	const t = 1 / (1 + 0.3275911 * z);
	const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
	return x >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
};
