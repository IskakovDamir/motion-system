import type {TransitionTiming} from '@remotion/transitions';
import type {Motion} from '../tokens/easing';
import {motionLength, progressAt} from './progress';

// Transitions that overlap two compositions are TransitionSeries presentations. Their timing is a
// spec motion, so the transition plays the measured curve and lasts until it settles.

export const motionTiming = (motion: Motion): TransitionTiming => ({
	getDurationInFrames: ({fps}) => motionLength(motion, fps),
	getProgress: ({frame, fps}) => progressAt(frame, motion, fps),
});
