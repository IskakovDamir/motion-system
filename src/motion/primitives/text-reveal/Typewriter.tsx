import type React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {flag, maybe, mix, num, useFrame, useProgress, variantOf} from '../../engine/anim';
import {motionLength} from '../../engine/progress';
import {splitText} from '../../engine/text';
import {scheme, type Tone} from '../../tokens/colors';
import {REVEAL} from '../../tokens/type';
import type {DemoProps} from '../types';
import {capOf, colorOf, jitterOnsets, numsOf, onPicture, optStr, sizeOf, toneOf, typeCss, typeOf, uniformOnsets} from './kit';
import {spec} from './Typewriter.spec';

export type TypewriterProps = {
	text: string;
	tone?: Tone;
	variant?: string;
	/** shown in the muted colour until the first character replaces it */
	placeholder?: string;
	/** characters already in place at frame 0 */
	start?: number;
	/** frames before the typing starts */
	delay?: number;
	/** cap height override (% H); the variant's measured one otherwise */
	capHeight?: number;
	/** a second line of the same technique set another way (stretchFade): its look and rate */
	look?: string;
	framesPerChar?: number;
	style?: React.CSSProperties;
};

const look = (params: Record<string, unknown> | undefined) => (typeof params?.look === 'string' ? params.look : 'cut');

/**
 * Frame (from the start of the typing) each character appears at; -Infinity for characters already in
 * place. Uniform, jittered and step-list cadences come from params; a `progress` motion is the share of
 * the remaining characters shown, sampled on the capture's pictures and with its 1-frame holds.
 */
const useOnsets = (variant: string | undefined, n: number, start: number, delay: number, rate?: number): number[] => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const pre = Array.from({length: start}, () => -Infinity);
	const m = n - start;
	const curve = v.motions.progress;
	if (curve) {
		const pf = maybe(v, 'pictureFrames') ?? 0;
		const hold = maybe(v, 'holdEvery');
		const from = Math.max(start, Math.round((maybe(v, 'fromShare') ?? 0) * n));
		const shownAt = (t: number): number => {
			let g = onPicture(t, pf);
			if (hold !== undefined && t % hold === hold - 1) g = t - 1;
			const prog = Math.min(1, Math.max(0, p('progress', frame - g)));
			// the curve is the measured count of characters shown: a character is in once the count rounds up to it
			return Math.min(n, from + Math.round(prog * (n - from)));
		};
		const out = Array.from({length: n}, (_, i) => (i < from ? -Infinity : Infinity));
		const end = motionLength(curve) + Math.ceil(pf) + (hold ?? 0) + 2;
		let shown = from;
		for (let t = 0; t <= end && shown < n; t++) {
			const now = shownAt(t);
			for (let i = shown; i < now; i++) out[i] = t;
			shown = Math.max(shown, now);
		}
		return out;
	}
	const steps = numsOf(v, 'stepFrames');
	if (steps.length) {
		const counts = numsOf(v, 'stepCounts');
		const total = counts[counts.length - 1] ?? 1;
		const out: number[] = [];
		steps.forEach((f, k) => {
			const upTo = Math.round(((counts[k] ?? total) / total) * m);
			while (out.length < upTo) out.push(f);
		});
		return [...pre, ...out];
	}
	const gapMean = maybe(v, 'gapMean');
	if (gapMean !== undefined) {
		return [
			...pre,
			...jitterOnsets(m, {
				mean: gapMean,
				min: num(v, 'gapMin'),
				max: num(v, 'gapMax'),
				pause: maybe(v, 'pause'),
				pauseAt: maybe(v, 'pauseAt'),
				seed: `typewriter-${variant ?? spec.defaultVariant}`,
			}),
		];
	}
	const fpc = rate ?? maybe(v, 'framesPerChar') ?? REVEAL.typewriterChar.framesPerUnit;
	const lead = numsOf(v, 'leadGaps');
	if (lead.length) {
		// the measured first gaps, then the steady rate
		const out: number[] = [];
		for (let i = 0; i < m; i++) out.push(i === 0 ? 0 : (out[i - 1] as number) + (lead[i - 1] ?? fpc));
		return [...pre, ...out];
	}
	return [...pre, ...uniformOnsets(m, fpc, maybe(v, 'charsPerPicture') ?? 1)];
};

export const Typewriter: React.FC<TypewriterProps> = ({text, tone = 'light', variant, placeholder, start = 0, delay = 0, capHeight, look: lookAs, framesPerChar, style}) => {
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {height} = useFrame();
	const s = scheme(tone);
	const t = frame - delay;
	const type = typeOf(v);
	const cap = capHeight ?? type.capHeight;
	const pieces = splitText(text, 'char');
	const n = pieces.length;
	const onsets = useOnsets(variant, n, Math.min(start, n), delay, framesPerChar);
	const count = onsets.filter((o) => o <= t).length;
	const kind = lookAs ?? look(v.params);
	const ink = colorOf(v, 'color', tone);
	const letters = pieces.filter((x) => !x.space).length;
	const taperFrom = maybe(v, 'taperFrom');
	const taperTo = maybe(v, 'taperTo');
	const flow = flag(v, 'flow');
	const last = onsets[n - 1] ?? 0;
	const caretOn = flag(v, 'caret') && t >= 0 && (count < n || t - last < (maybe(v, 'caretHold') ?? 0));
	const dots = numsOf(v, 'dotFrames').filter((d) => count === n && t - last >= d).length;
	const capPx = capOf(type, height, cap);

	const caret = (
		<span key="caret" style={{display: 'inline-block', width: 0, overflow: 'visible', color: ink}}>
			|
		</span>
	);

	const chars = pieces.map((piece, i) => {
		const at = onsets[i] ?? Infinity;
		const on = at <= t;
		if (flow && !on) return null;
		const age = t - at;
		let opacity = on ? 1 : 0;
		let transform: string | undefined;
		let color = ink;
		if (on && kind === 'fade') opacity = p('opacity', at + delay);
		if (on && kind === 'trail') opacity = age < num(v, 'trailFrames') ? num(v, 'trailInk') : 1;
		if (on && kind === 'stretch') {
			const k = p('stretch', at + delay);
			transform = `translateX(${mix(k, (num(v, 'fromGap') - num(v, 'restGap')) * capPx, 0)}px) scaleX(${mix(k, num(v, 'fromScaleX'), 1)})`;
		}
		if (on && kind === 'flash' && i === count - 1 && age < num(v, 'pictureFrames')) color = s.flash;
		let fontSize: number | undefined;
		if (taperFrom !== undefined && taperTo !== undefined && piece.index >= 0) {
			fontSize = sizeOf(type, height, mix(letters > 1 ? piece.index / (letters - 1) : 1, taperFrom, taperTo));
		}
		return (
			<span
				key={i}
				style={{
					opacity,
					color,
					fontSize,
					display: transform ? 'inline-block' : undefined,
					transform,
					transformOrigin: 'left center',
				}}
			>
				{piece.text}
			</span>
		);
	});

	const shown = count > 0 || !placeholder;
	const body: React.ReactNode[] = [];
	chars.forEach((c, i) => {
		body.push(c);
		if (caretOn && i === count - 1) body.push(caret);
	});
	if (caretOn && count === 0) body.unshift(caret);

	return (
		<div style={{...typeCss(type, height, cap), color: ink, textAlign: optStr(v, 'align') === 'center' ? 'center' : 'left', position: 'relative', ...style}}>
			{shown ? body : <span style={{color: s.muted}}>{placeholder}</span>}
			{dots > 0 ? <span>{'.'.repeat(dots)}</span> : null}
		</div>
	);
};

// ---- isolated demo ----

const DEMO: Record<string, string> = {
	steadyCaret: 'Make a list of 12 plants for the porch',
	jittered: 'Sort these photos by date and size, please',
	linearRate: 'Write a short note to the team about the new desk layout on floor 4',
	fastSteps: 'Turn this rough sketch into a clean diagram',
	letterFade: 'Ready to go.',
	fadeTrail: 'Plan a quiet weekend by the lake.',
	stretchFade: 'Morning',
	acceleratingDots: 'Sorting the files',
	leadingEdge: 'LINES',
	flashLetter: 'NEW LIGHTS',
};

const H = 1080;

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const v = variantOf(spec, variant);
	const tone = toneOf(v);
	const s = scheme(tone);
	const p = useProgress(spec, variant);
	const {w, px} = useFrame();
	const text = DEMO[variant] ?? 'Plain words';
	const type = typeOf(v);
	const fieldWidth = maybe(v, 'fieldWidth');

	if (variant === 'leadingEdge') {
		// a huge line pans left; the next word types on just inside the right edge and rides the pan
		const x = -num(v, 'panTravel') * p('pan');
		return (
			<AbsoluteFill style={{backgroundColor: s.bg}}>
				<div style={{position: 'absolute', inset: 0, transform: `translateX(${w(x)}px)`}}>
					<div style={{position: 'absolute', right: w(100 - num(v, 'edgeX')), top: '50%', transform: 'translateY(-50%)', ...typeCss(type, H), color: s.ink}}>
						{'WIDE '}
					</div>
					<div style={{position: 'absolute', left: w(num(v, 'edgeX')), top: '50%', transform: 'translateY(-50%)'}}>
						<Typewriter text={text} tone={tone} variant={variant} />
					</div>
				</div>
			</AbsoluteFill>
		);
	}

	if (variant === 'stretchFade') {
		// title line 1 types with a faint newest letter; line 2 stretches its letters in once line 1 is done
		return (
			<AbsoluteFill style={{backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center'}}>
				<div style={{backgroundColor: s.accent, padding: `${px(36)}px ${px(90)}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: px(12)}}>
					<Typewriter text="Morning" tone={tone} variant={variant} />
					<Typewriter text="Notes" tone={tone} variant={variant} look="stretch" framesPerChar={num(v, 'stretchFramesPerChar')} delay={num(v, 'stretchDelay')} />
				</div>
			</AbsoluteFill>
		);
	}

	const box = (() => {
		const t = <Typewriter text={text} tone={tone} variant={variant} placeholder={variant === 'jittered' || variant === 'linearRate' ? 'Ask anything' : undefined} />;
		if (variant === 'acceleratingDots') {
			return (
				<div style={{backgroundColor: s.surfaceAlt, borderRadius: px(200), padding: `${px(24)}px ${px(56)}px`}}>{t}</div>
			);
		}
		if (variant === 'fastSteps' || variant === 'fadeTrail' || variant === 'steadyCaret' || variant === 'jittered') {
			return (
				<div
					style={{
						width: w(variant === 'fastSteps' ? 86 : 62),
						backgroundColor: s.surface,
						border: `1px solid ${s.line}`,
						borderRadius: px(variant === 'fastSteps' ? 120 : 36),
						padding: `${px(40)}px ${px(56)}px`,
					}}
				>
					{t}
				</div>
			);
		}
		if (fieldWidth !== undefined) {
			return (
				<div style={{backgroundColor: s.surface, border: `1px solid ${s.line}`, borderRadius: px(18), padding: `${px(22)}px ${px(28)}px`}}>
					<div style={{width: w(fieldWidth), overflow: 'hidden'}}>{t}</div>
				</div>
			);
		}
		return t;
	})();

	return <AbsoluteFill style={{backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center'}}>{box}</AbsoluteFill>;
};
