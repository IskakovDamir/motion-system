import {maybe, mix} from '../../engine/anim';
import type {VariantSpec} from '../types';
import {type Rig, still} from './camera';

// One rig for every zoom of this group, read from the variant's motions and params:
//   scale     the main zoom: fromScale (default 1) -> toScale about pivotX / pivotY (% of frame), in
//             linear or log scale (space: 'log'); a constant drift gives ratePerFrame (% per frame)
//             instead of toScale. scaleBy names another motion that drives the zoom (a curve measured
//             on a point the zoom carries: its progress is the zoom's).
//   x, y      translation of travelX / travelY (% of frame width / height).
//   jump      a scale jump inside a translation (jumpFromY -> jumpToY, % H of a point starting at fromY):
//             the zoom runs while that point crosses the jump.
//   creep     a second zoom (creepScale about creepX / creepY) that takes over from the first.
//   tail      a further factor (tailScale) on the same pivot after the main zoom.
//   drift     a linear scale drift (driftRate, % per frame) added to the main zoom.
//   second    a second pulse from wherever the zoom is to secondScale.

type Size = {width: number; height: number};

const range = (a: number, b: number, x: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));

export const zoomRig = (v: VariantSpec, {width, height}: Size): Rig => {
	const W = (pct: number) => (pct / 100) * width;
	const H = (pct: number) => (pct / 100) * height;
	const m = v.motions;
	const pivot = still(maybe(v, 'pivotX'), maybe(v, 'pivotY'));
	const by = typeof v.params?.scaleBy === 'string' ? v.params.scaleBy : 'scale';
	const drive = m[by];
	const from = maybe(v, 'fromScale') ?? 1;
	const rate = maybe(v, 'ratePerFrame');
	const to = rate !== undefined && drive ? from * (1 + (rate / 100) * drive.duration) : maybe(v, 'toScale') ?? from;
	const log = v.params?.space === 'log';
	const zoom = (p: number) => (log ? from * Math.exp(p * Math.log(to / from)) : mix(p, from, to));
	const jumpFrom = maybe(v, 'jumpFromY');
	const jumpTo = maybe(v, 'jumpToY');
	const fromY = maybe(v, 'fromY') ?? 0;
	const travelX = maybe(v, 'travelX');
	const travelY = maybe(v, 'travelY');

	return (f, P) => {
		let s = drive ? zoom(P(drive, f)) : 1;
		if (jumpFrom !== undefined && jumpTo !== undefined && m.y && travelY !== undefined) {
			// progress of the point at the jump's two ends: the zoom runs between them
			const p = P(m.y, f);
			s = mix(range((jumpFrom - fromY) / travelY, (jumpTo - fromY) / travelY, p), 1, maybe(v, 'toScale') ?? 1);
		}
		let x = m.x && travelX !== undefined ? W(travelX) * P(m.x, f) : 0;
		let y = m.y && travelY !== undefined ? H(travelY) * P(m.y, f) : 0;
		if (m.drift) s += ((maybe(v, 'driftRate') ?? 0) / 100) * m.drift.duration * P(m.drift, f);
		if (m.second) s = mix(P(m.second, f), s, maybe(v, 'secondScale') ?? s);
		if (m.tail) s *= mix(P(m.tail, f), 1, maybe(v, 'tailScale') ?? 1);
		if (m.creep) {
			// a zoom about (creepX, creepY) applied after the zoom about the pivot: the same scale about the
			// pivot plus a shift of (creep - pivot) * (1 - creep scale)
			const c = mix(P(m.creep, f), 1, maybe(v, 'creepScale') ?? 1);
			x = x * c + W((maybe(v, 'creepX') ?? pivot.px) - pivot.px) * (1 - c);
			y = y * c + H((maybe(v, 'creepY') ?? pivot.py) - pivot.py) * (1 - c);
			s *= c;
		}
		return {...pivot, x, y, s};
	};
};
