import type React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {COMPONENTS} from '../motion/primitives/index';
import {SPECS} from '../motion/primitives/specs';
import {scheme} from '../motion/tokens/colors';
import {FONT} from '../motion/tokens/type';
import {SHOWCASE_ORDER} from './showcaseOrder';

// Every primitive plays once in its default variant, isolated, with its name on screen.

const entries = SHOWCASE_ORDER.map((name, i) => {
	const spec = SPECS.find((s) => s.name === name);
	if (!spec) throw new Error(`showcase lists ${name}, which has no spec`);
	const from = SHOWCASE_ORDER.slice(0, i).reduce((sum, n) => sum + (SPECS.find((s) => s.name === n)?.demoFrames ?? 0), 0);
	return {spec, from};
});

export const showcaseLength = () => Math.max(1, entries.reduce((sum, e) => sum + e.spec.demoFrames, 0));

const Caption: React.FC<{name: string; kind: string; index: number; tone: 'light' | 'dark'}> = ({name, kind, index, tone}) => {
	const s = scheme(tone);
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 0 36px 48px', pointerEvents: 'none'}}>
			<div style={{display: 'flex', gap: 18, alignItems: 'baseline', fontFamily: FONT.mono, fontSize: 22, color: s.muted}}>
				<span>{String(index + 1).padStart(2, '0')}/{String(entries.length).padStart(2, '0')}</span>
				<span style={{color: s.ink}}>{name}</span>
				<span>{kind}</span>
			</div>
		</AbsoluteFill>
	);
};

export const MotionShowcase: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: scheme('light').bg}}>
		{entries.map(({spec, from}, i) => {
			const Demo = COMPONENTS[spec.name];
			if (!Demo) throw new Error(`${spec.name} has no component`);
			return (
				<Sequence key={spec.name} from={from} durationInFrames={spec.demoFrames} name={spec.name}>
					<AbsoluteFill style={{backgroundColor: scheme(spec.demoTone).bg}}>
						<Demo variant={spec.defaultVariant} />
					</AbsoluteFill>
					<Caption name={spec.name} kind={spec.kind} index={i} tone={spec.demoTone} />
				</Sequence>
			);
		})}
	</AbsoluteFill>
);
