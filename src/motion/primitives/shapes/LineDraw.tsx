import type React from 'react';
import {useId} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {mix, num, str, useFrame, useProgress, variantOf} from '../../engine/anim';
import {scheme, type Scheme, type Tone} from '../../tokens/colors';
import {FONT} from '../../tokens/type';
import type {DemoProps} from '../types';
import {clamp01, contrastGrey, cyc, greyOf, nums, stepAt} from './kit';
import {spec} from './LineDraw.spec';

/**
 * A stroke to draw on, as SVG path data in px of a 1080-high frame (x runs to width x 1080 / height),
 * written from the end the line grows from. `cross`: a vertical of edgeToEdge (its own timing);
 * `fine`: a lattice connector of edgeToEdge (thin, the second curve).
 */
export type Stroke = {d: string; cross?: boolean; fine?: boolean};

export type LineDrawProps = {
	tone?: Tone;
	variant?: string;
	/** the strokes (edgeToEdge, roundedTurns, backToFront, trimThicken, trimSteps); the other variants draw measured geometry */
	paths?: (string | Stroke)[];
	/** stroke width in px at 1080 where the variant does not measure it */
	width?: number;
	/** echoReveal: corner radius of the outlines in px at 1080 (not measured) */
	radius?: number;
	/** stroke colour role (default ink) */
	color?: 'ink' | 'inkSoft' | 'muted' | 'line' | 'surface';
	/** drawn under the strokes */
	children?: React.ReactNode;
};

const asStroke = (x: string | Stroke): Stroke => (typeof x === 'string' ? {d: x} : x);

/** A path trimmed to the first `k` (0..1) of its length. */
const Trim: React.FC<{d: string; k: number; width: number; color: string; cap?: 'round' | 'butt'}> = ({d, k, width, color, cap = 'butt'}) => {
	const t = clamp01(k);
	if (t <= 0) return null;
	return (
		<path
			d={d}
			pathLength={1}
			fill="none"
			stroke={color}
			strokeWidth={width}
			strokeLinecap={cap}
			strokeLinejoin="round"
			strokeDasharray={t >= 1 ? undefined : `${t} 2`}
		/>
	);
};

const colorOf = (s: Scheme, role: LineDrawProps['color']) => s[role ?? 'ink'];

export const LineDraw: React.FC<LineDrawProps> = ({tone = 'light', variant, paths = [], width, radius, color, children}) => {
	const name = variant ?? spec.defaultVariant;
	const v = variantOf(spec, variant);
	const p = useProgress(spec, variant);
	const frame = useCurrentFrame();
	const {width: fw, height: fh} = useFrame();
	const clipBase = `ld${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	const s = scheme(tone);
	const ink = colorOf(s, color);
	// the drawing space: px of a 1080-high frame
	const W = (fw * 1080) / fh;
	const H = 1080;
	const X = (pct: number) => (pct / 100) * W;
	const Y = (pct: number) => (pct / 100) * H;
	const need = (what: string) => {
		if (width === undefined) throw new Error(`LineDraw/${name} needs a width prop (${what} not measured)`);
		return width;
	};

	let body: React.ReactNode = null;

	if (name === 'edgeToEdge') {
		const starts = nums(v, 'starts');
		const fineStarts = nums(v, 'fineStarts');
		let main = 0;
		let fine = 0;
		body = paths.map(asStroke).map((st, i) => {
			if (st.fine) {
				const k = p('fine', cyc(fineStarts, fine++));
				return <Trim key={i} d={st.d} k={k} width={num(v, 'fineWidth')} color={ink} />;
			}
			const k = p(st.cross ? 'cross' : 'progress', cyc(starts, main++));
			return <Trim key={i} d={st.d} k={k} width={num(v, 'width')} color={ink} />;
		});
	}

	if (name === 'roundedTurns') {
		const sw = need('stroke width');
		body = paths.map(asStroke).map((st, i) => <Trim key={i} d={st.d} k={p('progress')} width={sw} color={ink} cap="round" />);
	}

	if (name === 'backToFront') {
		const sw = need('stroke width');
		const starts = nums(v, 'starts');
		body = paths.map(asStroke).map((st, i) => <Trim key={i} d={st.d} k={p('progress', cyc(starts, i))} width={sw} color={ink} />);
	}

	if (name === 'growInward') {
		const rows = nums(v, 'rows');
		const lag = num(v, 'lag');
		body = rows.flatMap((y, i) => [
			<Trim
				key={`r${i}`}
				d={`M ${W} ${Y(y)} L ${W - X(num(v, 'lengthR'))} ${Y(y)}`}
				k={p('grow')}
				width={num(v, 'width')}
				color={contrastGrey(s, num(v, 'contrastR') * clamp01(p('darken')))}
			/>,
			<Trim
				key={`l${i}`}
				d={`M 0 ${Y(y)} L ${X(num(v, 'lengthL'))} ${Y(y)}`}
				k={p('grow', lag)}
				width={num(v, 'width')}
				color={contrastGrey(s, num(v, 'contrastL') * clamp01(p('darken', lag)))}
			/>,
		]);
	}

	if (name === 'rightToLeft') {
		const sw = need('hairline width');
		body = <Trim d={`M ${X(num(v, 'from'))} ${Y(num(v, 'y'))} L ${X(num(v, 'to'))} ${Y(num(v, 'y'))}`} k={p('progress')} width={sw} color={ink} />;
	}

	if (name === 'closeLoop') {
		const l = X(num(v, 'left'));
		const r = X(num(v, 'right'));
		const t = Y(num(v, 'top'));
		const b = Y(num(v, 'bottom'));
		const rr = (b - t) / 2;
		// from the right end of the bottom line: bottom right to left, left end, top left to right, right end
		const d = `M ${r - rr} ${b} L ${l + rr} ${b} A ${rr} ${rr} 0 0 1 ${l + rr} ${t} L ${r - rr} ${t} A ${rr} ${rr} 0 0 1 ${r - rr} ${b}`;
		body = <Trim d={d} k={p('progress')} width={num(v, 'width')} color={ink} />;
	}

	if (name === 'trimThicken') {
		const sw = mix(clamp01(p('weight')), num(v, 'fromWidth'), num(v, 'toWidth'));
		body = paths.map(asStroke).map((st, i) => <Trim key={i} d={st.d} k={p('progress')} width={sw} color={ink} cap="round" />);
	}

	if (name === 'trimSteps') {
		const k = stepAt(str(v, 'steps'), frame, 0);
		const sw = stepAt(str(v, 'widths'), frame, 0);
		body = paths.map(asStroke).map((st, i) => <Trim key={i} d={st.d} k={k} width={sw} color={ink} cap="round" />);
	}

	if (name === 'echoReveal') {
		if (radius === undefined) throw new Error('LineDraw/echoReveal needs a radius prop (corner radius not measured)');
		const sw = need('stroke width');
		const c = X(num(v, 'centre'));
		const scale = mix(p('x'), 1 / num(v, 'widen'), 1);
		const gap = num(v, 'bandGap');
		const sides = nums(v, 'sides');
		const bottoms = nums(v, 'bottoms');
		body = (
			<>
				<defs>
					<filter id={`${clipBase}soft`} x="-20%" y="-20%" width="140%" height="140%">
						{/* two dark bands `gap` apart around a light ridge: band 1.5 gap wide, ridge 0.5 gap, softened by gap / 4 */}
						<feGaussianBlur stdDeviation={gap / 4} />
					</filter>
				</defs>
				{sides.map((side, i) => {
					const x = c + (X(side) - c) * scale;
					const bottom = Y(cyc(bottoms, i));
					const dir = x < c ? 1 : -1;
					// the outline's side comes down from above the frame, turns at the bottom corner and runs to the centre
					const d = `M ${x} ${-radius} L ${x} ${bottom - radius} A ${radius} ${radius} 0 0 ${dir > 0 ? 0 : 1} ${x + dir * radius} ${bottom} L ${c} ${bottom}`;
					const shown = clamp01(p(`reveal${i}`)) * (bottom + sw);
					const soft = clamp01(p(`soften${i}`));
					return (
						<g key={i}>
							<clipPath id={`${clipBase}c${i}`}>
								<rect x={0} y={0} width={W} height={Math.max(0, shown)} />
							</clipPath>
							<g clipPath={`url(#${clipBase}c${i})`}>
								<path d={d} fill="none" stroke={greyOf(s, num(v, 'thinTone'))} strokeWidth={sw} opacity={1 - soft} />
								<g opacity={soft} filter={`url(#${clipBase}soft)`}>
									<path d={d} fill="none" stroke={greyOf(s, num(v, 'softTone'))} strokeWidth={gap * 1.5} />
									<path d={d} fill="none" stroke={s.bg} strokeWidth={gap * 0.5} />
								</g>
							</g>
						</g>
					);
				})}
			</>
		);
	}

	return (
		<AbsoluteFill>
			{children ? <AbsoluteFill>{children}</AbsoluteFill> : null}
			<svg viewBox={`0 0 ${W} ${H}`} width={fw} height={fh} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				{body}
			</svg>
		</AbsoluteFill>
	);
};

// ---- Demo ----

const Hex: React.FC<{x: number; y: number; r: number; fill: string; mark: string}> = ({x, y, r, fill, mark}) => {
	const pts = Array.from({length: 6}, (_, i) => {
		const a = ((60 * i - 90) * Math.PI) / 180;
		return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
	}).join(' ');
	return (
		<g>
			<polygon points={pts} fill={fill} />
			<circle cx={x} cy={y} r={r * 0.32} fill={mark} />
		</g>
	);
};

const Frame1080: React.FC<{children: React.ReactNode}> = ({children}) => {
	const {width, height} = useFrame();
	return (
		<svg viewBox={`0 0 ${(width * 1080) / height} 1080`} width={width} height={height} style={{position: 'absolute', inset: 0}}>
			{children}
		</svg>
	);
};

const Word: React.FC<{text: string; x: number; y: number; size: number; color: string; weight?: number}> = ({text, x, y, size, color, weight = 500}) => (
	<div
		style={{
			position: 'absolute',
			left: `${x}%`,
			top: `${y}%`,
			transform: 'translate(-50%, -50%)',
			fontFamily: FONT.ui,
			fontWeight: weight,
			fontSize: size,
			color,
			whiteSpace: 'nowrap',
		}}
	>
		{text}
	</div>
);

export const Demo: React.FC<DemoProps> = ({variant}) => {
	const s = scheme('light');
	const v = variantOf(spec, variant);
	const {px} = useFrame();
	switch (variant) {
		case 'roundedTurns':
			return (
				<AbsoluteFill style={{backgroundColor: scheme('dark').bg}}>
					<LineDraw
						tone="dark"
						variant={variant}
						width={3}
						color="inkSoft"
						paths={['M 960 330 L 960 430 L 560 430 Q 520 430 520 470 L 520 560', 'M 960 430 L 1360 430 Q 1400 430 1400 470 L 1400 560', 'M 960 430 L 960 560']}
					/>
					<Frame1080>
						<rect x={880} y={250} width={160} height={80} rx={18} fill={scheme('dark').surfaceAlt} />
						{[520, 960, 1400].map((x) => (
							<rect key={x} x={x - 130} y={560} width={260} height={180} rx={22} fill={scheme('dark').surface} />
						))}
					</Frame1080>
				</AbsoluteFill>
			);
		case 'growInward':
			return (
				<AbsoluteFill>
					<LineDraw variant={variant} />
					<Frame1080>
						{/* the cards' outer edges sit where the ticks end */}
						<rect x={62} y={520} width={640} height={360} rx={36} fill={s.surfaceAlt} />
						<rect x={1218} y={520} width={640} height={360} rx={36} fill={s.ink} />
					</Frame1080>
					<Word text="Twelve" x={50} y={30} size={px(150)} color={s.ink} weight={800} />
				</AbsoluteFill>
			);
		case 'backToFront': {
			// three thin plates spaced in depth; edges through their matching corners draw from the back plate to the front
			const plates = [0, 1, 2].map((i) => ({x: 560 + i * 330, y: 330 - i * 70}));
			const pw = 240;
			const ph = 460;
			const first = plates[0];
			const last = plates[2];
			if (!first || !last) return null;
			const edge = (dx: number, dy: number) => `M ${first.x + dx} ${first.y + dy} L ${last.x + dx} ${last.y + dy}`;
			return (
				<AbsoluteFill>
					<Frame1080>
						{plates.map((pl, i) => (
							<rect key={i} x={pl.x} y={pl.y} width={pw} height={ph} rx={18} fill={i === 1 ? s.surface : s.inkSoft} stroke={s.line} strokeWidth={2} />
						))}
					</Frame1080>
					<LineDraw variant={variant} width={2} color="muted" paths={[edge(0, ph), edge(pw, 0), edge(0, 0), edge(pw, ph)]} />
				</AbsoluteFill>
			);
		}
		case 'rightToLeft':
			return (
				<AbsoluteFill>
					<Word text="Notes" x={27} y={10} size={px(52)} color={s.ink} weight={600} />
					<LineDraw variant={variant} width={2} color="muted" />
					{[0, 1, 2].map((i) => (
						<div key={i} style={{position: 'absolute', left: '22%', top: `${26 + i * 9}%`, width: `${[40, 52, 30][i]}%`, height: px(20), borderRadius: px(10), backgroundColor: s.surfaceAlt}} />
					))}
				</AbsoluteFill>
			);
		case 'closeLoop':
			return (
				<AbsoluteFill>
					<Word text="Ready" x={50} y={40} size={px(110)} color={s.ink} weight={700} />
					<Word text="always on" x={50} y={58.5} size={px(60)} color={s.ink} />
					<LineDraw variant={variant} />
				</AbsoluteFill>
			);
		case 'trimThicken':
		case 'trimSteps':
			return (
				<AbsoluteFill>
					<LineDraw
						variant={variant}
						paths={['M 928 476 C 928 446 964 440 973 464 C 982 488 1012 494 1012 464 C 1012 434 982 446 982 476 C 982 518 952 530 931 512']}
					/>
					<Word text="loop" x={50} y={58} size={px(56)} color={s.inkSoft} />
				</AbsoluteFill>
			);
		case 'echoReveal':
			return (
				<AbsoluteFill>
					<LineDraw variant={variant} width={3} radius={70} />
					<Frame1080>
						<rect x={960 * (num(v, 'centre') / 50) - 230} y={120} width={460} height={900} rx={70} fill={s.inkSoft} />
						<rect x={960 * (num(v, 'centre') / 50) - 200} y={160} width={400} height={820} rx={50} fill={s.ink} />
					</Frame1080>
					<Word text="Echo" x={num(v, 'centre')} y={50} size={px(80)} color={s.surface} weight={700} />
				</AbsoluteFill>
			);
		default: {
			// edgeToEdge: four badges on a slanted frame; each row's connector grows edge to edge, left to right,
			// then the two slanted sides top to bottom; a fine lattice of small marks below joins on its own waves
			const r = 64;
			const top: [number, number][] = [[300, 260], [1380, 260]];
			const bottom: [number, number][] = [[540, 660], [1620, 660]];
			const row = (a: [number, number], b: [number, number]) => `M ${a[0] + r} ${a[1]} L ${b[0] - r} ${b[1]}`;
			const side = (a: [number, number], b: [number, number]) => {
				const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
				const ux = (b[0] - a[0]) / len;
				const uy = (b[1] - a[1]) / len;
				return {d: `M ${a[0] + ux * r} ${a[1] + uy * r} L ${b[0] - ux * r} ${b[1] - uy * r}`, cross: true};
			};
			const small = Array.from({length: 6}, (_, i) => 420 + i * 216);
			const fine = small.slice(0, -1).map((x) => ({d: `M ${x + 18} 900 L ${x + 198} 900`, fine: true}));
			const nodes = [...top, ...bottom];
			return (
				<AbsoluteFill>
					<LineDraw
						variant={variant}
						color="line"
						paths={[row(top[0]!, top[1]!), row(bottom[0]!, bottom[1]!), side(top[0]!, bottom[0]!), side(top[1]!, bottom[1]!), ...fine]}
					/>
					<Frame1080>
						{nodes.map(([x, y], i) => (
							<Hex key={i} x={x} y={y} r={r} fill={i % 3 === 0 ? s.ink : s.surface} mark={i % 3 === 0 ? s.surface : s.inkSoft} />
						))}
						{small.map((x) => (
							<circle key={x} cx={x} cy={900} r={14} fill={s.muted} />
						))}
					</Frame1080>
				</AbsoluteFill>
			);
		}
	}
};
