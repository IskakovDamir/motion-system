import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// Dot sizes are px at 1080 (v1-v4 pictures are 1080 high, so their px are used as measured).
// Hop timings are frames from the moment the dot pops on at its source node.

export const spec: PrimitiveSpec = {
	name: 'PacketHop',
	kind: 'shape',
	description:
		'Small dots travel between nodes along connectors: hop centre to centre on an ease-in-out whose length hardly depends on distance, relay node to node, dispatch once to a receiver, or ping-pong linearly on a shared period.',
	defaultVariant: 'easedHop',
	variants: {
		easedHop: {
			// v4.particle-edge-packets: an 18 px dot (S01) pops on at a node centre at full size, holds 1 f
			// (f36-f37), hops on the measured ease-in-out (24-28 f per hop whatever the distance: the curve's
			// 28 f carries its slow ends), rests 1 f on the target (S05 f1055-f1056) and pops off. A dispatch
			// cascade leaves the hub every 6 f; the returns start 54 f after the first dispatch (f759 -> f813),
			// 16.8 f apart (S04). A connector carrying a packet darkens 10 -> 21 (x2.1) over 20 f and fades
			// back over 25 f (S05, near-linear ramps).
			motions: {x: measured('v4.particle-edge-packets', 1), carry: motion(20, linear), release: motion(25, linear)},
			params: {dot: 18, restOut: 1, stagger: 6, returnAt: 54, returnStagger: 16.8, carry: 2.1},
			reproduces: {x: ['v4.particle-edge-packets']},
		},
		straightCarry: {
			// v1.particle-packet-hop: a 34 px grey dot appears with the sender's status line, dwells 2 f
			// (S04 f647-f649), carries the request on a straight line (curve), is gone 18 f after it appeared
			// (S04 f665), and the target shows the request in that frame (S03 f438).
			motions: {x: measured('v1.particle-packet-hop', 2)},
			params: {dot: 34, restOut: 5},
			reproduces: {x: ['v1.particle-packet-hop']},
		},
		relay: {
			// v3.particle-packet-relay: 30 px dots, dark and mid-grey in turn, hop node centre to node centre
			// in about 20 f whatever the length; the next dot leaves a node 14 f after the previous one left
			// the node before (left-up f48, top f62), as it arrives; an arrival rests 1-2 f, then vanishes; a
			// second relay starts 5 f after the first (right-down f53), so 2-3 are in flight.
			motions: {x: measured('v3.particle-packet-relay')},
			params: {dot: 30, hop: 20, rest: 2, handoff: 14, chains: '0 5'},
			reproduces: {x: ['v3.particle-packet-relay']},
		},
		dispatch: {
			// v3.particle-packet-dispatch: a 28 px dot appears on the sender, holds 1 f, travels the straight
			// line (curve) and vanishes 15 f after it appeared, the frame the receiver updates; the S03 hops
			// start at f249, f312, f335, f386 (back and forth).
			motions: {progress: measured('v3.particle-packet-dispatch', 1)},
			params: {dot: 28, arrive: 15, starts: '0 63 86 137'},
			reproduces: {progress: ['v3.particle-packet-dispatch']},
		},
		dwellHop: {
			// v1.particle-edge-packets: dots dwell 4 f on an icon (f180-f183) and hop to a neighbour on an
			// ease-in-out in about 10-16 f (13 used; ease not fitted: the house packet ease, inOutWhipOver),
			// continuously, many at once, drawn above the icons. Dot size not measured (prop).
			motions: {hop: motion(13, EASE.inOutWhipOver, 4)},
			params: {dwell: 4},
			covers: ['v1.particle-edge-packets'],
		},
		pingPong: {
			// v2.particle-packet-pingpong: one dot per connector ping-pongs linearly between 0.16 and 0.84 of
			// the line from the hub centre to its node, reversing within one frame, on one period for all
			// (42 f, a pass every 21 f); each line turns at the hub end at its own frame of the cycle; the
			// hub and the nodes cover the dots. Dot size not measured (prop).
			motions: {},
			params: {period: 42, near: 0.16, far: 0.84, phases: '0 6.3 10.9 15.5 21.8 26.5 32.8 37.4', under: true},
			covers: ['v2.particle-packet-pingpong'],
		},
	},
	demoFrames: 180,
	demoTone: 'light',
};
