import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {PullBack} from '../../motion/primitives/camera-zoom/PullBack';
import {SlowZoom} from '../../motion/primitives/camera-zoom/SlowZoom';
import {AmbientLoop} from '../../motion/primitives/icons/AmbientLoop';
import {ScalePop} from '../../motion/primitives/icons/ScalePop';
import {SpawnField} from '../../motion/primitives/icons/SpawnField';
import {LumaPulse} from '../../motion/primitives/light-fx/LumaPulse';
import {RadialBurst} from '../../motion/primitives/light-fx/RadialBurst';
import {EdgeRise} from '../../motion/primitives/text-motion/EdgeRise';
import {RiseFade} from '../../motion/primitives/text-motion/RiseFade';
import {WarpFlyIn} from '../../motion/primitives/text-motion/WarpFlyIn';
import {Scramble} from '../../motion/primitives/text-reveal/Scramble';
import {SoftFrontReveal} from '../../motion/primitives/text-reveal/SoftFrontReveal';
import {Backdrop} from '../../motion/primitives/shapes/Backdrop';
import {LineDraw} from '../../motion/primitives/shapes/LineDraw';
import {StepScroll} from '../../motion/primitives/ui-feed/StepScroll';
import {scheme} from '../../motion/tokens/colors';
import {At, BEAT, Bolt, Cloud, Cue, Fall, STEP, Streak, Txt} from './parts';

// The weather turns: cloud builds, rain, the hourly log, a thunderclap and the pressure falling.

/** Light. Floating clouds under a pull-back that shows the clouds past the frame edges; the headline stays put. */
export const CloudScene: React.FC = () => {
	const {width} = useVideoConfig();
	const cw = (pct: number) => (pct / 100) * width;
	return (
		<AbsoluteFill>
			<PullBack variant="centreTail">
				<AbsoluteFill>
					<At x={50} y={64}>
						<AmbientLoop variant="sineFloat" tone="light" columns={4} gap={cw(3)} items={[22, 15, 25, 17].map((w) => <Cloud key={w} w={cw(w)} tone="light" />)} />
					</At>
					<At x={72} y={33}>
						<AmbientLoop variant="sineFloat" tone="light" columns={2} gap={cw(6)} seed="high" items={[12, 9].map((w) => <Cloud key={w} w={cw(w)} tone="light" fill="bgAlt" />)} />
					</At>
					<At x={-4} y={40}>
						<Cloud w={cw(16)} tone="light" fill="bgAlt" />
					</At>
					<At x={104} y={88}>
						<Cloud w={cw(18)} tone="light" />
					</At>
				</AbsoluteFill>
			</PullBack>
			<At x={7} y={12} ax={0} ay={0}>
				<Cue at={BEAT}>
					<RiseFade text="Cloud builds at 2 400 m" variant="wordRise" tone="light" />
				</Cue>
			</At>
		</AbsoluteFill>
	);
};

/** Dark. Rain streaks spawn at random spots and the field recedes; the word falls in stretched and a reading decodes under it. */
export const Rain: React.FC = () => {
	const s = scheme('dark');
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill>
			<SlowZoom variant="recede">
				<SpawnField variant="randomScatter" tone="dark" items={[<Streak key="streak" tone="dark" />]} count={34} clear={[34, 72]} seed="rain" />
			</SlowZoom>
			<At x={50} y={46}>
				<Cue at={BEAT}>
					<WarpFlyIn text="Rain" variant="rubbery" tone="dark" />
				</Cue>
			</At>
			<At x={50} y={63}>
				<Cue at={4 * BEAT}>
					<div style={{backgroundColor: s.accent, padding: `${height * 0.018}px ${height * 0.04}px`}}>
						<Scramble text="4.2 mm since 13:00" variant="decode" tone="dark" />
					</div>
				</Cue>
			</At>
		</AbsoluteFill>
	);
};

const HOURS: [string, string, number][] = [
	['11:00', '13°', 0],
	['12:00', '15°', 0.4],
	['13:00', '16°', 1.2],
	['14:00', '14°', 2.1],
	['15:00', '12°', 0.5],
	['16:00', '11°', 0],
	['17:00', '10°', 0],
];

/** One hour of the log: time, temperature, and the rain in that hour as a bar. */
const Hour: React.FC<{time: string; temp: string; mm: number}> = ({time, temp, mm}) => {
	const s = scheme('light');
	const {width, height} = useVideoConfig();
	const most = Math.max(...HOURS.map((h) => h[2]));
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: width * 0.03}}>
			<div style={{width: width * 0.1}}>
				<Txt role="code" tone="light" color="muted">
					{time}
				</Txt>
			</div>
			<div style={{width: width * 0.2}}>
				<Txt role="display" tone="light">
					{temp}
				</Txt>
			</div>
			<div style={{width: width * 0.24 * (mm / most), minWidth: height * 0.012, height: height * 0.024, borderRadius: height * 0.012, backgroundColor: mm ? s.inkSoft : s.line}} />
			<Txt role="label" tone="light" color="muted">
				{mm.toFixed(1)} mm
			</Txt>
		</div>
	);
};

/** Light. The hourly log steps up one hour at a time over a slow drift, on a dot grid that drifts with it. */
export const Log: React.FC = () => (
	<Backdrop variant="dotGridDrift" tone="light">
		<AbsoluteFill>
			<div style={{position: 'absolute', left: '7%', right: '7%', top: 0, bottom: 0}}>
				<StepScroll variant="eased" tone="light" steps={3} items={HOURS.map(([time, temp, mm]) => <Hour key={time} time={time} temp={temp} mm={mm} />)} />
			</div>
			<At x={93} y={7} ax={1} ay={0}>
				<RiseFade text="hourly log" variant="fadeInPlace" tone="light" />
			</At>
		</AbsoluteFill>
	</Backdrop>
);

/** Dark. A bolt flashes for two pictures as shock rings spread from it; the time drops in heavy and the note fades in. */
export const Storm: React.FC = () => {
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill>
			<RadialBurst variant="shockRings" tone="dark" origin={{x: 50, y: 30}} />
			<At x={50} y={30}>
				<LumaPulse variant="layerFlash" tone="dark">
					<Bolt h={height * 0.28} tone="dark" />
				</LumaPulse>
			</At>
			<At x={50} y={66}>
				<Cue at={BEAT}>
					<EdgeRise text="16:20" variant="popDrop" tone="dark" />
				</Cue>
			</At>
			<At x={50} y={88}>
				<Cue at={2 * BEAT}>
					<RiseFade text="thunder, 3 km out" variant="fadeInPlace" tone="dark" />
				</Cue>
			</At>
		</AbsoluteFill>
	);
};

/** The pressure trace over the day, in px of a 1080-high frame: 1012 hPa at 09:00 falling to 1004. */
const TRACE = 'M 420 560 L 600 572 L 780 596 L 960 632 L 1140 680 L 1320 724 L 1480 760';

/** Light. Arrives low and soft; the line is revealed by a fast front, the trace draws on and a falling mark pops in at its end. */
export const Pressure: React.FC = () => {
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill>
			<At x={50} y={28}>
				<SoftFrontReveal text="Pressure falls to 1004 hPa" variant="fastFront" tone="light" />
			</At>
			<Cue at={STEP}>
				<LineDraw variant="backToFront" tone="light" width={6} paths={[TRACE]} />
			</Cue>
			<At x={20} y={52} ax={1}>
				<Cue at={STEP}>
					<RiseFade text="1012" variant="quickFade" tone="light" />
				</Cue>
			</At>
			<At x={81} y={71}>
				<Cue at={2 * BEAT}>
					<ScalePop variant="overshootPeak" tone="light">
						<Fall d={height * 0.06} tone="light" />
					</ScalePop>
				</Cue>
			</At>
			<At x={50} y={86}>
				<Cue at={2 * BEAT}>
					<RiseFade text="since 09:00" variant="softBlockRise" tone="light" />
				</Cue>
			</At>
		</AbsoluteFill>
	);
};
