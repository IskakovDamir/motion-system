import type {PrimitiveSpec} from '../types';

export const spec: PrimitiveSpec = {
	name: 'FootageSlot',
	kind: 'footage',
	description:
		'The footage carrier: fills the card, window or mask around it with the user footage, or with a gray plate when none is given. Motion belongs to the frame that holds it.',
	defaultVariant: 'plate',
	variants: {
		plate: {motions: {}, params: {fit: 'cover'}},
	},
	demoFrames: 60,
	demoTone: 'light',
};
