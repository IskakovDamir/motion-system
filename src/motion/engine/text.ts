// Splits a string into the units a text reveal animates: characters, words or lines.
// Spaces stay in the output (so layout does not shift) but never count as a unit.

export type TextUnit = 'char' | 'word' | 'line';

export type Piece = {
	text: string;
	/** index among animated units (spaces excluded); -1 for a space */
	index: number;
	space: boolean;
};

export const splitText = (text: string, unit: TextUnit): Piece[] => {
	const raw = unit === 'line' ? text.split('\n') : unit === 'word' ? text.split(/(\s+)/) : Array.from(text);
	let i = 0;
	const out: Piece[] = [];
	for (const t of raw) {
		if (t === '') continue;
		const space = unit !== 'line' && /^\s+$/.test(t);
		out.push({text: t, index: space ? -1 : i++, space});
	}
	return out;
};

export const unitCount = (pieces: Piece[]) => pieces.filter((p) => !p.space).length;
