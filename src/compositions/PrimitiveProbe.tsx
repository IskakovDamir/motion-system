import type React from 'react';
import type {CalculateMetadataFunction} from 'remotion';
import {COMPONENTS} from '../motion/primitives/index';
import {SPECS} from '../motion/primitives/specs';
import {probeLength} from './probe';
import {ProbeFrame} from './ProbeFrame';

// One primitive variant on its own, looked up by name in the registry; used by
// scripts/compare_sheets.py. The frame layout is ProbeFrame's.

export type ProbeProps = {primitive: string; variant: string};

const lookup = (primitive: string) => {
	const spec = SPECS.find((s) => s.name === primitive);
	const Demo = COMPONENTS[primitive];
	if (!spec || !Demo) throw new Error(`unknown primitive ${primitive}`);
	return {spec, Demo};
};

export const PrimitiveProbe: React.FC<ProbeProps> = ({primitive, variant}) => {
	const {spec, Demo} = lookup(primitive);
	return <ProbeFrame spec={spec} Demo={Demo} variant={variant} />;
};

export const probeMetadata: CalculateMetadataFunction<ProbeProps> = ({props}) => ({
	durationInFrames: probeLength(lookup(props.primitive).spec, props.variant),
});
