// The only file that knows colours. Primitives ask for a role (bg, ink, plate ...) in a tone,
// never for a hex value, so a new palette is a new set of values here and nothing else.
// Neutral grayscale on purpose: the references were analysed in grayscale, and colour only
// mattered where it drove motion (flashes and luminance dips), which the roles below keep.

export type Tone = 'light' | 'dark';

export type Scheme = {
	/** frame background */
	bg: string;
	/** a second background step (panels behind cards, the far plane of a 3D stage) */
	bgAlt: string;
	/** cards, windows, chips */
	surface: string;
	/** a raised or selected surface */
	surfaceAlt: string;
	/** primary text and marks */
	ink: string;
	/** secondary text */
	inkSoft: string;
	/** labels, captions, placeholder text */
	muted: string;
	/** hairlines, borders, grid lines */
	line: string;
	/** the one emphasis role (a palette swap usually puts the brand colour here) */
	accent: string;
	/** text on top of accent */
	onAccent: string;
	/** FootageSlot plate and its markings */
	plate: string;
	plateMark: string;
	/** full-frame luminance flash */
	flash: string;
};

export const SCHEMES: Record<Tone, Scheme> = {
	light: {
		bg: '#f3f3f3',
		bgAlt: '#e6e6e6',
		surface: '#ffffff',
		surfaceAlt: '#dadada',
		ink: '#111111',
		inkSoft: '#3b3b3b',
		muted: '#8c8c8c',
		line: '#cfcfcf',
		accent: '#2a2a2a',
		onAccent: '#f7f7f7',
		plate: '#8f8f8f',
		plateMark: '#a3a3a3',
		flash: '#ffffff',
	},
	dark: {
		bg: '#0e0e0e',
		bgAlt: '#1a1a1a',
		surface: '#202020',
		surfaceAlt: '#2c2c2c',
		ink: '#f5f5f5',
		inkSoft: '#c4c4c4',
		muted: '#7d7d7d',
		line: '#353535',
		accent: '#d6d6d6',
		onAccent: '#111111',
		plate: '#5e5e5e',
		plateMark: '#707070',
		flash: '#ffffff',
	},
};

export const scheme = (tone: Tone): Scheme => SCHEMES[tone];
