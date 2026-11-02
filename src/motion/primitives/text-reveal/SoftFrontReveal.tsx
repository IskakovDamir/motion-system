import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {flag, maybe, mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {motionLength} from '../../engine/progress';
import {splitText} from '../../engine/text';
import {scheme, type Scheme, type Tone} from '../../tokens/colors';
import type {DemoProps} from '../types';
import {colorOf, softFront, toneOf, typeCss, typeOf} from './kit';
import {spec} from './SoftFrontReveal.spec';

export type SoftFrontRevealProps = {
	/** one line */
	text: string;
	tone?: Tone;
	variant?: string;
	/** frames before this line starts (negative: it leads) */
	delay?: number;
	/** overrides of the variant's measured type, for a second line in another style */
	capHeight?: number;
	weight?: number;
	color?: keyof Scheme;
	style?: React.CSSProperties;
};

export const SoftFrontReveal: React.FC<SoftFrontRevealProps> = ({text, tone = 'light', variant, delay = 0, capHeight, weight, color, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const t = frame - delay;
	const {height, w} = useFrame();
	const type = typeOf(v);
	const ink = color ? scheme(tone)[color] : colorOf(v, 'color', tone);
	const pieces = splitText(text, 'char');
	const n = pieces.length;
	const at = (i: number) => (i + 0.5) / n;

	let inkOf: (i: number) => number;
	if (v.motions.progress) {
		// the front passes letter i when the progress reaches its place; from then it darkens from arriveInk
		const front = (g: number) => p('progress', frame - g);
		const end = motionLength(v.motions.progress) + 1;
		const cross = pieces.map((_, i) => {
			const u = at(i);
			let prev = front(0);
			if (prev >= u) return 0;
			for (let g = 1; g <= end; g++) {
				const cur = front(g);
				if (cur >= u) return g - 1 + (u - prev) / Math.max(1e-6, cur - prev);
				prev = cur;
			}
			return end;
		});
		inkOf = (i) => {
			const c = cross[i] ?? Infinity;
			return t < c ? 0 : mix(p('darken', c + delay), num(v, 'arriveInk'), 1);
		};
	} else if (v.motions.feather) {
		inkOf = (i) => (t < i * num(v, 'framesPerLetter') ? 0 : p('feather', i * num(v, 'framesPerLetter') + delay));
	} else {
		const total = p('opacity', delay);
		const reverse = flag(v, 'reverse');
		inkOf = (i) => (reverse ? 1 - softFront(total, at(i), num(v, 'feather')) : softFront(total, at(i), num(v, 'feather')));
	}
	const slide = maybe(v, 'slide');
	const x = slide === undefined ? 0 : -w(slide) * (1 - p('x', delay));
	return (
		<div
			style={{
				...typeCss({...type, weight: weight ?? type.weight}, height, capHeight ?? type.capHeight),
				color: ink,
				transform: x ? `translateX(${x}px)` : undefined,
				...style,
			}}
		>
			{pieces.map((piece, i) => (
				<span key={i} style={{opacity: Math.max(0, Math.min(1, inkOf(i)))}}>
					{piece.text}
				</span>
			))}
		</div>
	);
};

// ---- isolated demo ----

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const tone = toneOf(v);
	const s = scheme(tone);
	const p = useProgress(spec, variant);
	const {w, h, height} = useFrame();
	const left = w(maybe(v, 'x') ?? 26);
	let body: React.ReactNode;
	if (variant === 'featherFront') {
		const type = typeOf(v);
		body = (
			<div style={{display: 'flex', alignItems: 'baseline', gap: w(1.2)}}>
				<span style={{...typeCss({...type, weight: 600}, height, num(v, 'nameCap')), color: s.ink}}>Notes</span>
				<SoftFrontReveal text="Organizing" tone={tone} variant={variant} />
			</div>
		);
	} else if (variant === 'fadeSlide') {
		body = (
			<div style={{display: 'flex', flexDirection: 'column', gap: h(0.9)}}>
				<SoftFrontReveal text="Notebook" tone={tone} variant={variant} />
				<SoftFrontReveal text="three open pages" tone={tone} variant={variant} delay={num(v, 'lineDelay')} capHeight={num(v, 'subCap')} weight={400} color="muted" />
			</div>
		);
	} else if (variant === 'dissolveOut') {
		const lead = -num(v, 'lineLead');
		body = (
			<div style={{display: 'flex', flexDirection: 'column', gap: h(1.6), transform: `translateY(${-h(num(v, 'drift')) * p('drift', -num(v, 'driftLead'))}px)`}}>
				<SoftFrontReveal text="Plans for the week" tone={tone} variant={variant} />
				<SoftFrontReveal text="Two tasks left, both small and quick." tone={tone} variant={variant} delay={lead} capHeight={num(v, 'subCap')} weight={400} color="inkSoft" />
				<SoftFrontReveal text="Next check in on Friday morning." tone={tone} variant={variant} delay={lead} capHeight={num(v, 'subCap')} weight={400} color="inkSoft" />
			</div>
		);
	} else {
		body = <SoftFrontReveal text="Here is a short summary of the plan." tone={tone} variant={variant} />;
	}
	return (
		<AbsoluteFill style={{backgroundColor: s.bg, justifyContent: 'center'}}>
			<div style={{marginLeft: left}}>{body}</div>
		</AbsoluteFill>
	);
};
