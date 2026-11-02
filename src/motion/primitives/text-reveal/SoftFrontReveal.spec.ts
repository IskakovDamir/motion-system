import type {PrimitiveSpec} from '../types';
import {EASE, linear, motion} from '../../tokens/easing';
import {measured} from '../../tokens/measured';

// A front crosses the line left to right. fastFront: `progress` is the front position (share of the line)
// and each letter darkens behind it; featherFront: letters start on a fixed cadence and ramp in; fadeSlide /
// dissolveOut: `opacity` is the whole line's ink and a soft front `feather` line widths wide decides how
// it is shared out, left parts first (the mean over the line stays exactly the measured curve).
// Pixels of v8 are of a 1622 x 918 picture.

export const spec: PrimitiveSpec = {
	name: 'SoftFrontReveal',
	kind: 'text',
	description:
		'Text is revealed by a soft feathered front moving left to right: letters arrive light and darken behind the front; reversed, lines dissolve away letter-wise, left parts first.',
	defaultVariant: 'fastFront',
	variants: {
		fastFront: {
			// v8.text-stream-reveal S10: the heading's reveal front runs x 315 -> 1288 px in 14 f (near-linear, about
			// 75-80 px/f); letters arrive light and darken behind the front, the ink still growing about 12 f after
			// the front (S10); arrival ink: darkest pixel 168 against 15 at rest on the 248 page = 0.34 (S11),
			// darkening ease-out (S11 168 / 76 / 30 / 15 at +0 / 10 / 24 / 41 f: outStrong, rmse 0.006).
			// Inter 400, cap 5.2 % H, near-black, left at 19.4 % W
			motions: {progress: measured('v8.text-stream-reveal'), darken: motion(12, EASE.outStrong)},
			params: {arriveInk: 0.34, frontSpeed: 91, font: 'ui', weight: 400, capHeight: 5.2, x: 19.4, tone: 'light'},
			reproduces: {progress: ['v8.text-stream-reveal']},
		},
		featherFront: {
			// v8.text-status-type-on S07: the status word (11 letters) is revealed by a feathered front 548 -> 743 px
			// in 38 f, about 3.5 f per letter (5.1 px/f = 6.0 px at 1080); the last letters keep darkening about 10 f
			// after the front reaches the word end (S07 row 2; not fitted: linear). Inter 400, cap 2.9 % H, light grey,
			// after the name (600, cap 3.6 % H)
			motions: {feather: motion(10, linear)},
			params: {framesPerLetter: 3.5, frontSpeed: 6.0, font: 'ui', weight: 400, capHeight: 2.9, color: 'muted', nameCap: 3.6, tone: 'light'},
			covers: ['v8.text-status-type-on'],
		},
		fadeSlide: {
			// v8.text-label-fade-slide S05: the header name's ink 0 -> 1 in 51 f (main curve); a soft front: its left /
			// middle / right thirds reach half ink at f614 / f618 / f623, which a front 2.3 word widths wide gives
			// on that curve; the label slides right meanwhile with a long ease-out (.i2: S06 row title, 40.2 px =
			// 2.48 % W); the subtitle follows 3-4 f later (4: half-ink points +4 / +3 / +4 f). Name Inter 600, cap
			// 2.3 % H; subtitle Inter 400 light grey, cap 1.6 % H
			motions: {opacity: measured('v8.text-label-fade-slide'), x: measured('v8.text-label-fade-slide.i2')},
			params: {feather: 2.3, slide: 2.48, lineDelay: 4, font: 'ui', weight: 600, capHeight: 2.3, subCap: 1.6, tone: 'light'},
			reproduces: {opacity: ['v8.text-label-fade-slide']},
		},
		dissolveOut: {
			// v8.text-dissolve-out S19: all lines dissolve letter-wise in 19 f, the headline's summed ink 2240 -> 0
			// (main curve); left parts first: at f2486 the left half keeps 0.48, the right 0.65 of its ink (a front
			// 2.9 line widths wide); the sub lines lead the headline by 2-4 f (3); the block drifts up 385 -> 319 px
			// (66 px = 7.2 % H) from 6 f before the dissolve over 25 f, accelerating 1.5 -> 4.5 px/f (inGentle,
			// rmse 0.045). Headline Inter 600, cap 4.36 % H; sub lines Inter 400 grey, cap 2.83 % H
			motions: {opacity: measured('v8.text-dissolve-out'), drift: motion(25, EASE.inGentle)},
			params: {feather: 2.9, lineLead: 3, drift: 7.2, driftLead: 6, reverse: true, font: 'ui', weight: 600, capHeight: 4.36, subCap: 2.83, tone: 'light'},
			reproduces: {opacity: ['v8.text-dissolve-out']},
		},
	},
	demoFrames: 90,
	demoTone: 'light',
};
