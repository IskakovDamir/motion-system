import type React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {num, variantOf} from '../../motion/engine/anim';
import {SlowZoom} from '../../motion/primitives/camera-zoom/SlowZoom';
import {OversizeSettle} from '../../motion/primitives/cards/OversizeSettle';
import {spec as oversizeSpec} from '../../motion/primitives/cards/OversizeSettle.spec';
import {FootageSlot} from '../../motion/primitives/footage/FootageSlot';
import {ScalePop} from '../../motion/primitives/icons/ScalePop';
import {BlurIn} from '../../motion/primitives/text-motion/BlurIn';
import {BlurSlideIn} from '../../motion/primitives/text-motion/BlurSlideIn';
import {RiseFade} from '../../motion/primitives/text-motion/RiseFade';
import {Typewriter} from '../../motion/primitives/text-reveal/Typewriter';
import {WordPop} from '../../motion/primitives/text-reveal/WordPop';
import {Counter} from '../../motion/primitives/ui-controls/Counter';
import {spec as counterSpec} from '../../motion/primitives/ui-controls/Counter.spec';
import {FloatingPill} from '../../motion/primitives/ui-feed/FloatingPill';
import {Marquee} from '../../motion/primitives/ui-feed/Marquee';
import {scheme} from '../../motion/tokens/colors';
import {At, BEAT, Chip, Cue, Disc, PlateCard, STEP, Txt} from './parts';

// Morning at Ridge Station: first light, a clear sky, the noon high, the wind and its gusts.

/** Dark. A sun disc grows on the horizon under a slow push-in; the time types on and two wide lines slide in from opposite edges. */
export const Dawn: React.FC = () => {
	const s = scheme('dark');
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill>
			<SlowZoom variant="easedPush">
				<AbsoluteFill>
					<At x={50} y={76}>
						<Cue at={STEP}>
							<ScalePop variant="discGrow" tone="dark" connector={false}>
								<Disc d={height * 0.26} tone="dark" fill="inkSoft" />
							</ScalePop>
						</Cue>
					</At>
					{/* the ground below the horizon hides the lower half of the sun */}
					<div style={{position: 'absolute', left: '-10%', right: '-10%', top: '76%', bottom: '-20%', backgroundColor: s.bg, borderTop: `2px solid ${s.line}`}} />
				</AbsoluteFill>
			</SlowZoom>
			<At x={7} y={8} ax={0} ay={0}>
				<Cue at={BEAT}>
					<Typewriter text="05:42" variant="fastSteps" tone="dark" />
				</Cue>
				<Cue at={2 * BEAT}>
					<RiseFade text="Ridge Station, 1 240 m" variant="softBlockRise" tone="dark" />
				</Cue>
			</At>
			<At x={50} y={42}>
				<Cue at={3 * BEAT}>
					<BlurSlideIn text={'First\nlight'} variant="oppositeEdges" tone="dark" />
				</Cue>
			</At>
		</AbsoluteFill>
	);
};

/** Light. A sky plate in a large card creeps under its own drift; a reading drops in as a pill and the caption resolves word by word. */
export const Sky: React.FC = () => {
	const {width, height} = useVideoConfig();
	return (
		<AbsoluteFill>
			<SlowZoom variant="groupCreep">
				<At x={50} y={41}>
					<PlateCard w={width * 0.84} h={height * 0.62} tone="light" label="sky">
						<SlowZoom variant="linearDrift">
							<FootageSlot tone="light" label="sky" />
						</SlowZoom>
					</PlateCard>
				</At>
			</SlowZoom>
			<Cue at={BEAT}>
				<FloatingPill variant="dropIn" x={80} y={17}>
					<Chip tone="light" filled>
						<Txt role="ui" tone="light">
							6 °C
						</Txt>
						<Txt role="ui" tone="light" color="muted">
							calm
						</Txt>
					</Chip>
				</FloatingPill>
			</Cue>
			<At x={50} y={84}>
				<Cue at={BEAT}>
					<BlurIn text="Clear sky over the ridge" variant="wordRise" tone="light" />
				</Cue>
			</At>
		</AbsoluteFill>
	);
};

/** Light. The noon high swaps in one reading per picture under its label; the zoom-through out of it starts on the number. */
export const Noon: React.FC = () => {
	const cap = num(variantOf(counterSpec, 'perPictureSwap'), 'capHeight');
	return (
		<AbsoluteFill>
			<At x={50} y={30}>
				<RiseFade text="Noon" variant="dropIn" tone="light" />
			</At>
			<At x={50} y={52}>
				<Cue at={STEP}>
					<Counter
						variant="perPictureSwap"
						from={6}
						to={19}
						tone="light"
						suffix={() => (
							<Txt role="counter" tone="light" color="muted" cap={cap}>
								°C
							</Txt>
						)}
					/>
				</Cue>
			</At>
			<At x={50} y={72}>
				<Cue at={2 * BEAT}>
					<RiseFade text="high of the day" variant="softBlockRise" tone="light" />
				</Cue>
			</At>
		</AbsoluteFill>
	);
};

/** Dark. A dial fast-forwards through the afternoon while the wind speed counts up; the headline pops word by word. */
export const Wind: React.FC = () => (
	<AbsoluteFill>
		<At x={50} y={16}>
			<Cue at={BEAT}>
				<WordPop text="wind turns west" variant="even" tone="dark" />
			</Cue>
		</At>
		{/* in place on the cut frame: the zoom-through carries straight into the dial */}
		<At x={50} y={61}>
			<Cue at={0}>
				<Counter
					variant="fastForward"
					from={4}
					to={31}
					tone="dark"
					ring={470}
					timer={{from: 9, to: 15, format: (h) => `${String(h).padStart(2, '0')}:00`}}
					unit={
						<Txt role="label" tone="dark" color="muted">
							km/h
						</Txt>
					}
				/>
			</Cue>
		</At>
	</AbsoluteFill>
);

const GUSTS = ['14:02  31', '14:09  38', '14:15  42', '14:21  35', '14:30  29', '14:41  33'];

/** Light. Arrives sliding; the wide word lands oversized and settles while a row of gust readings runs under it. */
export const Gusts: React.FC = () => {
	const v = variantOf(oversizeSpec, 'settle');
	const {height} = useVideoConfig();
	return (
		<AbsoluteFill>
			<At x={num(v, 'restLeft')} y={44} ax={0}>
				<OversizeSettle variant="settle">
					<div style={{display: 'flex', alignItems: 'baseline', gap: height * 0.045}}>
						<Txt role="display" tone="light" color="muted" font="wide" weight={900} cap={num(v, 'capH')} upper>
							Gusts
						</Txt>
						<Txt role="display" tone="light" font="wide" weight={900} cap={num(v, 'capH')}>
							42
						</Txt>
						<Txt role="label" tone="light" color="muted">
							km/h
						</Txt>
					</div>
				</OversizeSettle>
			</At>
			<div style={{position: 'absolute', left: 0, right: 0, top: '70%', height: '12%'}}>
				<Marquee
					variant="constant"
					pitch={19}
					items={GUSTS.map((g) => (
						<Chip key={g} tone="light">
							<Txt role="code" tone="light" color="inkSoft">
								{g}
							</Txt>
						</Chip>
					))}
				/>
			</div>
		</AbsoluteFill>
	);
};
