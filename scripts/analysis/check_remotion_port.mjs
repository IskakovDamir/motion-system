// Prints Remotion's own spring / measureSpring / bezier numbers as JSON so remotion_math.py can be
// checked against them: node scripts/analysis/check_remotion_port.mjs | python check_port.py
import {Easing, interpolate, measureSpring, spring} from 'remotion';

const fps = 60;
const springs = [
	{damping: 10, mass: 1, stiffness: 100},
	{damping: 200, mass: 1, stiffness: 100},
	{damping: 15.35, mass: 1, stiffness: 115},
	{damping: 28, mass: 1, stiffness: 420},
	{damping: 8, mass: 0.6, stiffness: 180},
];
const out = {springs: [], stretched: [], beziers: []};
for (const config of springs) {
	const values = [];
	for (let f = 0; f < 90; f++) values.push(spring({frame: f, fps, config}));
	const frac = [0.5, 3.25, 10.75].map((f) => spring({frame: f, fps, config}));
	out.springs.push({config, values, frac, natural: measureSpring({fps, config})});
	const stretched = [];
	for (let f = 0; f < 40; f++) stretched.push(spring({frame: f, fps, config, durationInFrames: 24}));
	out.stretched.push({config, durationInFrames: 24, values: stretched});
}
const curves = [
	[0.42, 0, 0.58, 1],
	[0.16, 1, 0.3, 1],
	[0.7, 0, 0.84, 0],
	[0.2, 0.9, 0.3, 1.25],
	[0.85, 0, 0.15, 1],
];
for (const c of curves) {
	const e = Easing.bezier(c[0], c[1], c[2], c[3]);
	const values = [];
	for (let f = 0; f <= 30; f++)
		values.push(interpolate(f, [0, 27], [0, 1], {easing: e, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	out.beziers.push({curve: c, duration: 27, values});
}
console.log(JSON.stringify(out));
