import {TransitionSeries} from '@remotion/transitions';
import type React from 'react';
import {AbsoluteFill, Sequence, Series} from 'remotion';
import {CutInSettle} from '../motion/primitives/camera-move/CutInSettle';
import type {Tone} from '../motion/tokens/colors';
import {HANDOVER, type Handover} from './styleDemo/handover';
import {Dawn, Gusts, Noon, Sky, Wind} from './styleDemo/morning';
import {Clearing, Close, Night} from './styleDemo/evening';
import {Ground} from './styleDemo/parts';
import {CloudScene, Log, Pressure, Rain, Storm} from './styleDemo/weather';
import {STYLE_DEMO_SHOTS} from './styleDemoShots';

// StyleDemo: one day at a fictional mountain weather station, cut from STYLE_DEMO_SHOTS. Each shot is a
// scene of primitives; each boundary is the shot's `into` handover (styleDemo/handover.tsx). A scene's
// frame 0 is the picture where the viewer first sees it: the frames its sequence spends hidden under
// the incoming transition are skipped with a Sequence offset, and a shot that follows an exit into a
// cut arrives with its CutInSettle. The ground under every scene is one layer that changes tone on the
// cuts, so a scene that moves off (a push, a drop, a pull-back) uncovers the ground the viewer expects.

const SCENES: Record<string, {tone: Tone; Scene: React.FC}> = {
	dawn: {tone: 'dark', Scene: Dawn},
	sky: {tone: 'light', Scene: Sky},
	noon: {tone: 'light', Scene: Noon},
	wind: {tone: 'dark', Scene: Wind},
	gusts: {tone: 'light', Scene: Gusts},
	cloud: {tone: 'light', Scene: CloudScene},
	rain: {tone: 'dark', Scene: Rain},
	log: {tone: 'light', Scene: Log},
	storm: {tone: 'dark', Scene: Storm},
	pressure: {tone: 'light', Scene: Pressure},
	clearing: {tone: 'light', Scene: Clearing},
	night: {tone: 'dark', Scene: Night},
	close: {tone: 'light', Scene: Close},
};

const NONE: Handover = HANDOVER.cut;

type Planned = {
	name: string;
	tone: Tone;
	Scene: React.FC;
	/** frames the viewer sees this shot */
	seen: number;
	/** frames of the sequence before the shot is first seen (hidden under the incoming transition) */
	lead: number;
	/** the TransitionSeries.Sequence length: the shot plus its hidden lead and the outgoing transition's frames after its cut */
	sequence: number;
	arrive?: string;
	out: Handover;
};

export const styleDemoPlan = (): Planned[] =>
	STYLE_DEMO_SHOTS.map((shot, i) => {
		const scene = SCENES[shot.name];
		if (!scene) throw new Error(`StyleDemo has no scene for shot ${shot.name}`);
		const prev = STYLE_DEMO_SHOTS[i - 1];
		const into = prev ? HANDOVER[prev.into ?? 'cut'] : NONE;
		const out = HANDOVER[shot.into ?? 'cut'];
		return {
			name: shot.name,
			tone: scene.tone,
			Scene: scene.Scene,
			seen: shot.durationInFrames,
			lead: into.cut,
			sequence: shot.durationInFrames + into.cut + (out.overlap - out.cut),
			arrive: into.arrive,
			out,
		};
	});

/** The sequences end to end minus the transition overlaps (equal to the sum of the shots as seen). */
export const styleDemoLength = (): number => {
	const plan = styleDemoPlan();
	return plan.reduce((sum, p) => sum + p.sequence, 0) - plan.slice(0, -1).reduce((sum, p) => sum + p.out.overlap, 0);
};

const Shot: React.FC<{p: Planned}> = ({p}) => {
	const body = <p.Scene />;
	return (
		<Sequence from={p.lead} name={p.name}>
			{p.arrive ? <CutInSettle variant={p.arrive}>{body}</CutInSettle> : body}
		</Sequence>
	);
};

export const StyleDemo: React.FC = () => {
	const plan = styleDemoPlan();
	return (
		<AbsoluteFill>
			<Series>
				{plan.map((p) => (
					<Series.Sequence key={p.name} durationInFrames={p.seen} name={`ground ${p.name}`}>
						<Ground tone={p.tone} />
					</Series.Sequence>
				))}
			</Series>
			<TransitionSeries>
				{plan.flatMap((p, i) => {
					const next = plan[i + 1];
					const seq = (
						<TransitionSeries.Sequence key={p.name} durationInFrames={p.sequence} name={p.name}>
							<Shot p={p} />
						</TransitionSeries.Sequence>
					);
					return next && p.out.element ? [seq, p.out.element(next.tone, `${p.name}-out`)] : [seq];
				})}
			</TransitionSeries>
		</AbsoluteFill>
	);
};
