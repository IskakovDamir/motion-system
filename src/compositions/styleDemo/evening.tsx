import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {SlowZoom} from '../../motion/primitives/camera-zoom/SlowZoom';
import {SlideSettle} from '../../motion/primitives/cards/SlideSettle';
import {FootageSlot} from '../../motion/primitives/footage/FootageSlot';
import {ScalePop} from '../../motion/primitives/icons/ScalePop';
import {StarFlare} from '../../motion/primitives/light-fx/StarFlare';
import {BlurIn} from '../../motion/primitives/text-motion/BlurIn';
import {RiseFade} from '../../motion/primitives/text-motion/RiseFade';
import {ShimmerSweep} from '../../motion/primitives/text-reveal/ShimmerSweep';
import {Typewriter} from '../../motion/primitives/text-reveal/Typewriter';
import {WordPop} from '../../motion/primitives/text-reveal/WordPop';
import {scheme, type Tone} from '../../motion/tokens/colors';
import {At, BEAT, Bolt, Cue, Disc, Moon, PlateCard, STEP, Txt} from './parts';

// Evening: the sky clears and the day pulls back into a wall of its own frames, night, and the close.

/** One frame of the day as a tile of the wall around the clearing shot (frame-sized; the pull-back shrinks it). */
type Tile = {at: [number, number]; tone: Tone; body: React.ReactNode};

const Big: React.FC<{tone: Tone; font?: 'display' | 'wide' | 'mono'; children: React.ReactNode}> = ({tone, font = 'display', children}) => (
	<Txt role="display" tone={tone} font={font} cap={17} weight={font === 'display' ? 400 : 800} upper={font !== 'display'}>
		{children}
	</Txt>
);

const Small: React.FC<{tone: Tone; children: React.ReactNode}> = ({tone, children}) => (
	<Txt role="subhead" tone={tone} color="muted" cap={7}>
		{children}
	</Txt>
);

const Stack: React.FC<{children: React.ReactNode}> = ({children}) => (
	<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4%'}}>{children}</AbsoluteFill>
);

const useTiles = (): Tile[] => {
	const {height} = useVideoConfig();
	return [
		{at: [-1, -1], tone: 'dark', body: (<Stack><Disc d={height * 0.3} tone="dark" fill="inkSoft" /><Big tone="dark">05:42</Big></Stack>)},
		{at: [0, -1], tone: 'light', body: <FootageSlot tone="light" label="sky" />},
		{at: [1, -1], tone: 'light', body: (<Stack><Small tone="light">noon</Small><Big tone="light">19 °C</Big></Stack>)},
		{at: [-1, 0], tone: 'dark', body: (<Stack><Small tone="dark">wind</Small><Big tone="dark">31 km/h</Big></Stack>)},
		{at: [1, 0], tone: 'dark', body: (<Stack><Big tone="dark" font="wide">Rain</Big><Small tone="dark">4.2 mm</Small></Stack>)},
		{at: [-1, 1], tone: 'light', body: (<Stack><Big tone="light" font="wide">Gusts 42</Big></Stack>)},
		{at: [0, 1], tone: 'dark', body: (<Stack><Bolt h={height * 0.32} tone="dark" /><Big tone="dark" font="mono">16:20</Big></Stack>)},
		{at: [1, 1], tone: 'light', body: (<Stack><Small tone="light">pressure</Small><Big tone="light">1004 hPa</Big></Stack>)},
	];
};

/** Frames of the wall, as a share of the frame size between tile centres. */
const PITCH = 1.06;

/** The day's frames around the shot, out of sight until the stepped pull-back reveals them. */
const Wall: React.FC = () => {
	const tiles = useTiles();
	const ground = scheme('light');
	const reach = (PITCH + 0.5) * 100;
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', left: `${50 - reach}%`, top: `${50 - reach}%`, width: `${2 * reach}%`, height: `${2 * reach}%`, backgroundColor: ground.bgAlt}} />
			<AbsoluteFill style={{backgroundColor: ground.bg}} />
			{tiles.map(({at: [i, j], tone, body}) => (
				<div
					key={`${i}${j}`}
					style={{
						position: 'absolute',
						left: `${i * PITCH * 100}%`,
						top: `${j * PITCH * 100}%`,
						width: '100%',
						height: '100%',
						overflow: 'hidden',
						backgroundColor: scheme(tone).bg,
					}}
				>
					{body}
				</div>
			))}
		</AbsoluteFill>
	);
};

/** Light. The sky clears beside a staircase caption; then the whole day steps back into a wall of its frames. */
export const Clearing: React.FC = () => {
	const {width, height} = useVideoConfig();
	return (
		<AbsoluteFill>
			<Wall />
			<At x={93} y={50} ax={1}>
				<PlateCard w={width * 0.4} h={height * 0.66} tone="light" label="sky">
					<SlowZoom variant="easeOutPush">
						<FootageSlot tone="light" label="sky" />
					</SlowZoom>
				</PlateCard>
			</At>
			<At x={7} y={28} ax={0} ay={0}>
				<BlurIn text={'Clear again\nby six'} variant="letterSweep" tone="light" />
			</At>
			<At x={7} y={66} ax={0} ay={0}>
				<Cue at={3 * BEAT}>
					<RiseFade variant="blockRise" tone="light">
						<ShimmerSweep variant="once" tone="light" delay={BEAT}>
							<Txt role="subhead" tone="light" color="inkSoft">
								11 °C, wind 3 km/h
							</Txt>
						</ShimmerSweep>
					</RiseFade>
				</Cue>
			</At>
		</AbsoluteFill>
	);
};

/** Dark. Stars in depth, the moon pops in, the time types on with a caret and the caption sweeps in letter by letter. */
export const Night: React.FC = () => {
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill>
			<StarFlare variant="depthField" tone="dark" />
			<At x={78} y={32}>
				<Cue at={STEP}>
					<ScalePop variant="strongOut" tone="dark">
						<Moon d={height * 0.22} tone="dark" />
					</ScalePop>
				</Cue>
			</At>
			<At x={7} y={26} ax={0} ay={0}>
				<Cue at={BEAT}>
					<Typewriter text="21:30" variant="steadyCaret" tone="dark" />
				</Cue>
			</At>
			<At x={7} y={44} ax={0} ay={0}>
				<Cue at={3 * BEAT}>
					<BlurIn text={'Night, 3 °C\nstill air'} variant="letterSweep" tone="dark" />
				</Cue>
			</At>
		</AbsoluteFill>
	);
};

const STATS: [string, string][] = [
	['low', '3 °C'],
	['high', '19 °C'],
	['rain', '4.2 mm'],
];

/** Light. The day in one line, word by word, and its three numbers slide in under it while the group creeps. */
export const Close: React.FC = () => {
	const {height} = useVideoConfig();
	return (
		<SlowZoom variant="groupCreep">
			<AbsoluteFill>
				<At x={50} y={40}>
					<WordPop text="Ridge Station, one day" variant="spaced" tone="light" />
				</At>
				<At x={50} y={64}>
					<Cue at={3 * BEAT}>
						<SlideSettle
							variant="fadeSlide"
							tone="light"
							gap={height * 0.09}
							items={STATS.map(([k, v]) => (
								<div key={k} style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
									<Txt role="label" tone="light" color="muted">
										{k}
									</Txt>
									<Txt role="headline" tone="light">
										{v}
									</Txt>
								</div>
							))}
						/>
					</Cue>
				</At>
			</AbsoluteFill>
		</SlowZoom>
	);
};
