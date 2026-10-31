// Typography tokens. Families are the closest free fonts to what the references set (see
// MOTION_SPEC.md, typography). The faces are local @fontsource files registered by
// src/motion/engine/loadFonts.ts. The size, tracking and reveal tokens are filled from the
// measured stills in step 7.

export const FONT = {
	/** interface text: chips, prompts, labels, body */
	ui: `'Inter Variable', system-ui, sans-serif`,
	/** headlines */
	display: `'Inter Tight', 'Inter Variable', sans-serif`,
	/** wide black display (Archivo at wdth 125) */
	wide: `'Archivo Variable', 'Inter Tight', sans-serif`,
	/** rounded geometric display */
	round: `'Unbounded', 'Inter Tight', sans-serif`,
	/** code, counters, timers */
	mono: `'JetBrains Mono', ui-monospace, monospace`,
} as const;

export type FontRole = keyof typeof FONT;
