// Easing tokens. Filled from analysis/tokens_fit.json in step 7.

export type Ease =
	| {kind: 'bezier'; x1: number; y1: number; x2: number; y2: number}
	| {kind: 'spring'; stiffness: number; damping: number; mass: number}
	| {kind: 'linear'};

/** A motion token: how long (frames at 60 fps), how late, and with which curve. */
export type Motion = {duration: number; delay: number; ease: Ease};

export const bezier = (x1: number, y1: number, x2: number, y2: number): Ease => ({kind: 'bezier', x1, y1, x2, y2});
export const springEase = (stiffness: number, damping: number, mass = 1): Ease => ({kind: 'spring', stiffness, damping, mass});
export const linear: Ease = {kind: 'linear'};

export const motion = (duration: number, ease: Ease, delay = 0): Motion => ({duration, delay, ease});
