import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(90);
Config.setOverwriteOutput(true);
// three.js scenes need a GPU-backed GL in headless Chrome on macOS
Config.setChromiumOpenGlRenderer('angle');
Config.setDelayRenderTimeoutInMilliseconds(120000);
