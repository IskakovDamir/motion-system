import {continueRender, delayRender} from 'remotion';

// Fonts are local files from @fontsource packages (bundled by webpack), so a render never needs
// the network. Each face holds the render until it has loaded.

const requested = new Set<string>();

export const loadFontFile = (family: string, url: string, descriptors: FontFaceDescriptors = {}) => {
	const key = `${family}|${url}|${JSON.stringify(descriptors)}`;
	if (requested.has(key) || typeof document === 'undefined') return;
	requested.add(key);
	const handle = delayRender(`Loading font ${family} ${descriptors.weight ?? ''}`);
	const face = new FontFace(family, `url(${url}) format('woff2')`, descriptors);
	face
		.load()
		.then(() => {
			document.fonts.add(face);
			continueRender(handle);
		})
		.catch((err: unknown) => {
			// a missing face falls back to the next family in the stack instead of hanging the render
			console.error(`font ${family} failed`, err);
			continueRender(handle);
		});
};
