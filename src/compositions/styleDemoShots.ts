// The StyleDemo edit as a list of shots (frames at STYLE_DEMO_FPS). A shot is what a viewer sees between
// two boundaries: durationInFrames runs from the picture where the shot first shows to the picture where
// the next one replaces it. StyleDemo.tsx builds its TransitionSeries from this list: each sequence is
// the shot plus the frames it spends hidden or overlapped inside its two transitions, so the
// composition is the sum of the sequences minus the transition overlaps, which equals the sum of the
// shots. Lengths are SHOT tokens or the midpoint of two neighbouring ones (MOTION_SPEC section 2).
// Plain data only: scripts/sample_curves.ts imports this file in Node.
import {SHOT} from '../motion/tokens/timing';

export const STYLE_DEMO_FPS = 60;

/**
 * How a shot hands over to the next one (the boundary after it):
 *   cut        hard cut
 *   flash      LightFlash ringBloom: the frame blooms to white on the cut and the next shot comes down from it
 *   zoom       ZoomThrough cutContinue: the zoom on the frame centre carries through the cut and settles
 *   slideExit  AccelerateExit left into a cut; the next shot arrives still sliding (CutInSettle slideLeft)
 *   push       AccelerateExit anticipateUp (dip, then out of the top edge); the next shot is thrown up from
 *              below (CutInSettle throwUp)
 *   liftExit   AccelerateExit up into a cut; the next shot arrives low and soft (CutInSettle blurLow)
 *   drop       ContentSwap dropThrough: the shot drops away and the next drops in from above
 *   steps      SteppedZoom pullBack: twelve quick steps back to a wide view, cut on the last picture
 *   whip       WhipCut pushLeft: the view eases left with growing blur, the next one arrives moving and settles
 *   whipUp     WhipCut riseUp: the same upward, the next shot rising in from below
 *   dip        DipToBackground groupFade: the shot fades out in place, one empty frame, the next shot pops in
 * whip, whipUp and dip draw the ground of the next shot's tone, so they join shots of one tone. A whip
 * hides the outgoing shot by visibility, which LightFlash's incoming side overrides, so no whip follows
 * a shot that came in on the flash.
 */
export type Into = 'cut' | 'flash' | 'zoom' | 'slideExit' | 'push' | 'liftExit' | 'drop' | 'steps' | 'whip' | 'whipUp' | 'dip';

export type Shot = {name: string; durationInFrames: number; into?: Into};

const mid = (a: number, b: number) => Math.round((a + b) / 2);

export const STYLE_DEMO_SHOTS: Shot[] = [
	{name: 'dawn', durationInFrames: SHOT.base, into: 'flash'},
	{name: 'sky', durationInFrames: mid(SHOT.base, SHOT.long), into: 'dip'},
	{name: 'noon', durationInFrames: mid(SHOT.quick, SHOT.base), into: 'zoom'},
	{name: 'wind', durationInFrames: mid(SHOT.base, SHOT.long), into: 'slideExit'},
	{name: 'gusts', durationInFrames: SHOT.quick, into: 'whip'},
	{name: 'cloud', durationInFrames: SHOT.base, into: 'push'},
	{name: 'rain', durationInFrames: SHOT.long, into: 'cut'},
	{name: 'log', durationInFrames: SHOT.base, into: 'drop'},
	{name: 'storm', durationInFrames: mid(SHOT.quick, SHOT.base), into: 'liftExit'},
	{name: 'pressure', durationInFrames: SHOT.quick, into: 'whipUp'},
	{name: 'clearing', durationInFrames: SHOT.long, into: 'steps'},
	{name: 'night', durationInFrames: SHOT.base, into: 'cut'},
	{name: 'close', durationInFrames: mid(SHOT.base, SHOT.long)},
];
