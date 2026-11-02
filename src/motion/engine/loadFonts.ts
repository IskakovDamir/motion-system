// Registers every font face of the type tokens once (call at module level of the Remotion root).
// Kept apart from tokens/type.ts so plain Node (scripts/sample_curves.ts) never imports a .woff2.
import archivo from '@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2';
import interVariable from '@fontsource-variable/inter/files/inter-latin-standard-normal.woff2';
import saira from '@fontsource-variable/saira/files/saira-latin-standard-normal.woff2';
import interTight400 from '@fontsource/inter-tight/files/inter-tight-latin-400-normal.woff2';
import interTight500 from '@fontsource/inter-tight/files/inter-tight-latin-500-normal.woff2';
import interTight600 from '@fontsource/inter-tight/files/inter-tight-latin-600-normal.woff2';
import interTight700 from '@fontsource/inter-tight/files/inter-tight-latin-700-normal.woff2';
import interTight800 from '@fontsource/inter-tight/files/inter-tight-latin-800-normal.woff2';
import mono400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2';
import mono600 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2';
import mono800 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-800-normal.woff2';
import unbounded600 from '@fontsource/unbounded/files/unbounded-latin-600-normal.woff2';
import unbounded800 from '@fontsource/unbounded/files/unbounded-latin-800-normal.woff2';
import unbounded900 from '@fontsource/unbounded/files/unbounded-latin-900-normal.woff2';
import {loadFontFile} from './fonts';

let loaded = false;

export const loadFonts = () => {
	if (loaded) return;
	loaded = true;
	loadFontFile('Inter Variable', interVariable, {weight: '100 900'});
	loadFontFile('Inter Tight', interTight400, {weight: '400'});
	loadFontFile('Inter Tight', interTight500, {weight: '500'});
	loadFontFile('Inter Tight', interTight600, {weight: '600'});
	loadFontFile('Inter Tight', interTight700, {weight: '700'});
	loadFontFile('Inter Tight', interTight800, {weight: '800'});
	loadFontFile('Archivo Variable', archivo, {weight: '100 900', stretch: '62% 125%'});
	loadFontFile('Unbounded', unbounded600, {weight: '600'});
	loadFontFile('Unbounded', unbounded800, {weight: '800'});
	loadFontFile('Unbounded', unbounded900, {weight: '900'});
	loadFontFile('Saira Variable', saira, {weight: '100 900', stretch: '50% 125%'});
	loadFontFile('JetBrains Mono', mono400, {weight: '400'});
	loadFontFile('JetBrains Mono', mono600, {weight: '600'});
	loadFontFile('JetBrains Mono', mono800, {weight: '800'});
};
