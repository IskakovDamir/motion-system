import * as THREE from 'three';

// The folded flyer of DepthFlyer, made in code: a paper-crane-like body (nose, tail, a raised back fold, a keel)
// with two swept wings, flat facets. Unit length along +x (nose), about 1.9 long; a pose that shows the folds.

const N = [1.0, 0.05, 0];
const T = [-0.9, 0.22, 0];
const K = [-0.1, 0.16, 0];
const B = [0.0, -0.3, 0];
const L = [-0.38, 0.6, 0.85];
const R = [-0.38, 0.6, -0.85];

const faces = [
	[N, K, L],
	[K, T, L],
	[N, R, K],
	[K, R, T],
	[N, B, K],
	[K, B, T],
	[N, K, B],
	[K, T, B],
];

export const flyerGeometry = (): THREE.BufferGeometry => {
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(faces.flat(2), 3));
	g.computeVertexNormals();
	return g;
};

/** Roll about the flight line and pitch into the screen, so the wings and keel catch the light. */
export const FLYER_POSE = {roll: 0.6, pitch: -0.45};

/** Metallic foil: material and light setup of the flyers. */
export const FOIL = {metalness: 0.25, roughness: 0.35, ambient: 0.7, key: 3.2, keyAt: [-1, 1.4, 2] as const, fill: 1.2, fillAt: [1.5, -1, 1] as const};
