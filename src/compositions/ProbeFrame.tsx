import type React from 'react';
import {AbsoluteFill, Freeze, Sequence, useCurrentFrame} from 'remotion';
import type {DemoProps, PrimitiveSpec} from '../motion/primitives/types';
import {scheme} from '../motion/tokens/colors';
import {PROBE_LEAD} from './probe';

// One primitive variant on its own: the first PROBE_LEAD frames hold the variant's first frame, then
// it plays, so probe frame PROBE_LEAD + n is motion frame n. It takes the spec and component directly
// (no registry import), so scripts/probe_group.py can bundle one group without the others.

export const ProbeFrame: React.FC<{spec: PrimitiveSpec; Demo: React.FC<DemoProps>; variant: string}> = ({spec, Demo, variant}) => {
	const frame = useCurrentFrame();
	if (!spec.variants[variant]) throw new Error(`${spec.name} has no variant ${variant}`);
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
