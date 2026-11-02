import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {maybe, mix, num, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {splitText} from '../../engine/text';
import {scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {fontRole, RingMark, typeCss, unitsShown, type LayoutType} from './kit';
import {spec} from './LockupSlide.spec';

export type LockupSlideProps = {
	/** the mark; it fills the variant's mark box */
	children: React.ReactNode;
	/** the words that appear beside the mark */
	wordmark: string;
	tone?: Tone;
	variant?: string;
	style?: React.CSSProperties;
};

// Fills its parent (the frame). The mark starts centred at the variant's height, slides its travel on
// motion x (scaling on motion scale), and the wordmark appears in the room it leaves: whole, word by word
// or letter by letter, in the measured type.
export const LockupSlide: React.FC<LockupSlideProps> = ({children, wordmark, tone = 'light', variant, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {w, h, height} = useFrame();
	const travel = num(v, 'travelX');
	const toScale = maybe(v, 'toScale') ?? 1;
	const mw = w(num(v, 'markW'));
	const mh = h(num(v, 'markH'));
	const cx = w(num(v, 'markX')) + w(travel) * p('x');
	const cy = h(num(v, 'markY'));
	const scale = mix(p('scale'), 1, toScale);
	const t: LayoutType = {font: fontRole(str(v, 'font')), weight: num(v, 'weight'), capHeight: num(v, 'capHeight'), tracking: maybe(v, 'tracking')};
	const left = w(num(v, 'markX') + travel) + (mw * toScale) / 2 + w(num(v, 'gap'));
	const letterStep = maybe(v, 'letterStep');
	const wordStep = maybe(v, 'wordStep');
	const wordAt = maybe(v, 'wordAt') ?? 0;
	const ink = scheme(tone).ink;

	let word: React.ReactNode;
	if (letterStep !== undefined) {
		const rise = h(num(v, 'riseY'));
		word = splitText(wordmark, 'char').map((pc, k) =>
			pc.space ? (
				<span key={k}>{pc.text}</span>
			) : (
				<span
					key={k}
					style={{
						display: 'inline-block',
						opacity: p('letterFade', pc.index * letterStep),
						transform: `translateY(${rise * (1 - p('letterRise', pc.index * letterStep))}px)`,
					}}
				>
					{pc.text}
				</span>
			),
		);
	} else {
		const pieces = splitText(wordmark, 'word');
		const shown = unitsShown(frame, pieces.filter((pc) => !pc.space).length, wordAt, wordStep);
		word = pieces.map((pc, k) => (
			<span key={k} style={{visibility: pc.space || pc.index < shown ? 'inherit' : 'hidden'}}>
				{pc.text}
			</span>
		));
	}

	return (
		<div style={{position: 'absolute', inset: 0, ...style}}>
			<div style={{position: 'absolute', left, top: cy, transform: 'translateY(-50%)', color: ink, ...typeCss(t, height)}}>{word}</div>
			<div style={{position: 'absolute', left: cx - mw / 2, top: cy - mh / 2, width: mw, height: mh, transform: `scale(${scale})`}}>{children}</div>
		</div>
	);
};

// ---- isolated demo ----

const WORDS: Record<string, string> = {medium: 'Harbor', shrinkWide: 'Lantern', wide: 'Open Field', short: 'Meadow'};

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const tone: Tone = 'light';
	const name = variant ?? spec.defaultVariant;
	return (
		// the lockup's measured place is the frame's upper middle; the demo shows it lower and to the left so
		// no demo frame lays out like a reference picture (verify.py clean check)
		<AbsoluteFill style={{transform: 'translate(-22%, 30%)'}}>
			<LockupSlide variant={name} wordmark={WORDS[name] ?? 'Harbor'}>
				<RingMark tone={tone} />
			</LockupSlide>
		</AbsoluteFill>
	);
};
