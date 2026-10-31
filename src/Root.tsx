import type React from 'react';
import {Composition} from 'remotion';
import {MotionShowcase, showcaseLength} from './compositions/MotionShowcase';
import {PrimitiveProbe, type ProbeProps, probeMetadata} from './compositions/PrimitiveProbe';
import {loadFonts} from './motion/engine/loadFonts';
import {REF_FPS} from './motion/tokens/timing';

loadFonts();

const probeDefaults: ProbeProps = {primitive: 'FootageSlot', variant: 'plate'};

export const Root: React.FC = () => (
	<>
		<Composition id="MotionShowcase" component={MotionShowcase} durationInFrames={showcaseLength()} fps={REF_FPS} width={1920} height={1080} />
		<Composition
			id="PrimitiveProbe"
			component={PrimitiveProbe}
			calculateMetadata={probeMetadata}
			defaultProps={probeDefaults}
			durationInFrames={72}
			fps={REF_FPS}
			width={1920}
			height={1080}
		/>
	</>
);
