import type React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile} from 'remotion';
import {scheme, type Tone} from '../tokens/colors';
import {FONT} from '../tokens/type';

// The one place footage enters the system. A slot fills its parent: the card, window or mask
// around it owns size, radius, clipping and motion, the way the references move masked windows
// that carry footage. Without `footage` the slot is a gray plate, so every composition renders
// and nothing in it comes from a reference.

export type Footage = {
	kind: 'video' | 'image';
	/** a file in public/ (passed through staticFile) or an absolute URL */
	src: string;
	/** first frame of the clip to show, in the clip's own frames */
	startFrom?: number;
};

export type FootageSlotProps = {
	footage?: Footage;
	tone?: Tone;
	fit?: 'cover' | 'contain';
	/** object-position of cropped footage, e.g. '50% 30%' */
	focus?: string;
	/** small caption on the plate; the slot's role in the layout */
	label?: string;
};

const resolve = (src: string) => (/^(https?:|data:|blob:)/.test(src) ? src : staticFile(src));

const Plate: React.FC<{tone: Tone; label?: string}> = ({tone, label}) => {
	const s = scheme(tone);
	return (
		<AbsoluteFill style={{backgroundColor: s.plate}}>
			<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute'}}>
				<line x1="0" y1="0" x2="100" y2="100" stroke={s.plateMark} strokeWidth="1" vectorEffect="non-scaling-stroke" />
				<line x1="100" y1="0" x2="0" y2="100" stroke={s.plateMark} strokeWidth="1" vectorEffect="non-scaling-stroke" />
			</svg>
			{label ? (
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
					<div
						style={{
							fontFamily: FONT.mono,
							fontSize: 18,
							letterSpacing: '0.12em',
							textTransform: 'uppercase',
							color: s.plateMark,
							backgroundColor: s.plate,
							padding: '4px 10px',
						}}
					>
						{label}
					</div>
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};

export const FootageSlot: React.FC<FootageSlotProps> = ({footage, tone = 'light', fit = 'cover', focus = '50% 50%', label}) => {
	if (!footage) return <Plate tone={tone} label={label} />;
	const style: React.CSSProperties = {width: '100%', height: '100%', objectFit: fit, objectPosition: focus};
	return (
		<AbsoluteFill style={{backgroundColor: scheme(tone).plate}}>
			{footage.kind === 'video' ? (
				<OffthreadVideo src={resolve(footage.src)} startFrom={footage.startFrom} muted style={style} />
			) : (
				<Img src={resolve(footage.src)} style={style} />
			)}
		</AbsoluteFill>
	);
};
