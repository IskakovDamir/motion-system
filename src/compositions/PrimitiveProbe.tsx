import type React from 'react';
import {AbsoluteFill, type CalculateMetadataFunction, Freeze, Sequence, useCurrentFrame} from 'remotion';
import {COMPONENTS} from '../motion/primitives/index';
import {SPECS} from '../motion/primitives/specs';
import {scheme} from '../motion/tokens/colors';
import {PROBE_LEAD} from './probe';

// One primitive variant on its own, used by scripts/compare_sheets.py: the first PROBE_LEAD frames
// hold the variant's first frame, then it plays, so probe frame PROBE_LEAD + n is motion frame n.

export type ProbeProps = {primitive: string; variant: string};

export const PrimitiveProbe: React.FC<ProbeProps> = ({primitive, variant}) => {
	const frame = useCurrentFrame();
	const spec = SPECS.find((s) => s.name === primitive);
	const Demo = COMPONENTS[primitive];
	if (!spec || !Demo) throw new Error(`unknown primitive ${primitive}`);
	if (!spec.variants[variant]) throw new Error(`${primitive} has no variant ${variant}`);
	return (
		<AbsoluteFill style={{backgroundColor: scheme(spec.demoTone).bg}}>
			<Freeze frame={PROBE_LEAD} active={frame < PROBE_LEAD}>
				<Sequence from={PROBE_LEAD}>
					<Demo variant={variant} />
				</Sequence>
			</Freeze>
		</AbsoluteFill>
	);
};

export const probeMetadata: CalculateMetadataFunction<ProbeProps> = ({props}) => {
	const spec = SPECS.find((s) => s.name === props.primitive);
	const motions = Object.values(spec?.variants[props.variant]?.motions ?? {});
	// long enough for the slowest motion of the variant to settle and hold
	const settle = Math.max(0, ...motions.map((m) => Math.ceil(m.delay + m.duration))) + 30;
	return {durationInFrames: PROBE_LEAD + Math.max(spec?.demoFrames ?? 60, settle)};
};
