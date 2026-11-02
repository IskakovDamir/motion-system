# Primitive catalogue

Generated from `analysis/catalogue.json` by `scripts/analysis/catalogue_md.py`: 17 groups, 75 primitives, 455 variants, 468 techniques.

## text-reveal (6 primitives, 29 variants)

### Typewriter · text

Characters appear one at a time in their final places, left to right, in hard steps; optionally a solid caret, the newest letters drawn lighter and darkening behind, or each new letter flashing before it settles.

API: `{text: string; tone?: Tone; variant?: string}`

Params: `framesPerChar` (frames) mean frames between characters; `caret` (boolean) solid caret after the last character; `trailLetters` (count) newest letters drawn lighter than the settled ones

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `steadyCaret` | - | `v1.text-typewriter-char` |
| `jittered` | - | `v2.text-typewriter-char` |
| `linearRate` | `v4.text-typewriter-input` progress, grid:0.5,0.4,0.7,1.1, 52 f | `v4.text-typewriter-input` |
| `fastSteps` (default) | `v5.text-typewriter` progress, grid:0.5,0.4,0.7,1.1, 22 f | `v5.text-typewriter` |
| `letterFade` | `v7.text-type-letter-fade` opacity, grid:0.5,0.0,0.1,1.0, 19 f | `v7.text-type-letter-fade` |
| `fadeTrail` | - | `v8.text-type-on-fade-trail`, `v6.text-type-on` |
| `stretchFade` | - | `v7.text-type-on` |
| `acceleratingDots` | - | `v7.text-typewriter-capsule` |
| `leadingEdge` | - | `v6.text-type-on-pan` |
| `flashLetter` | `v5.text-type-on` progress, grid:0.5,0.4,0.7,1.1, 12 f | `v5.text-type-on` |

### WordPop · text

Words (or whole lines) of a pre-laid line appear one at a time, each in a single frame at full ink in its final place, with no fade, slide or scale; the cadence in frames per unit carries the rhythm.

API: `{text: string; tone?: Tone; variant?: string}`

Params: `framesPerWord` (frames) frames between successive words; `unit` (word|line) what appears at once

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `brisk` | - | `v1.text-word-pop` |
| `even` (default) | - | `v2.text-word-pop` |
| `spaced` | - | `v3.text-word-pop` |
| `rapid` | - | `v1.text-stream-words`, `v3.ui-text-stream` |
| `lineSteps` | - | `v4.ui-terminal-line-step` |
| `ghostSnap` | - | `v5.text-word-ghost-type` |
| `allAtOnce` | - | `v5.text-caption-hard-on` |

### Scramble · text

A word resolves out of order through placeholder bars and dots, letter by letter, until every glyph has settled.

API: `{text: string; tone?: Tone; variant?: string}`

Params: `framesPerLetter` (frames) frames between letters settling

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `decode` (default) | - | `v7.text-scramble-decode` |

### LetterPopBuild · text

A short row builds out of order: each letter enters by its own small move (grows from a speck, spins in, splits from a twin, drops and bounces, slides out from behind a neighbour) while the row tightens or re-centres.

API: `{text: string; tone?: Tone; variant?: string}`

Params: `framesPerLetter` (frames) mean frames between letter entries

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `mixedPops` (default) | - | `v6.text-letter-pop-mix`, `v6.text-type-recenter` |
| `tighten` | `v8.text-letter-pop-tighten` x, grid:0.0,1.2,0.4,1.1, 23 f | `v8.text-letter-pop-tighten` |

### SoftFrontReveal · text

Text is revealed by a soft feathered front moving left to right: letters arrive light and darken behind the front; reversed, lines dissolve away letter-wise, left parts first.

API: `{text: string; tone?: Tone; variant?: string}`

Params: `frontSpeed` (px1080/frame) speed of the reveal front; `slide` (%W) sideways slide of the line while it darkens

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `fastFront` (default) | `v8.text-stream-reveal` progress, grid:0.5,0.4,0.7,1.1, 14 f | `v8.text-stream-reveal` |
| `featherFront` | - | `v8.text-status-type-on` |
| `fadeSlide` | `v8.text-label-fade-slide` opacity, grid:0.2,0.8,0.2,1.0, 51 f | `v8.text-label-fade-slide` |
| `dissolveOut` | `v8.text-dissolve-out` opacity, grid:0.5,0.4,0.7,1.1, 19 f | `v8.text-dissolve-out` |

### ShimmerSweep · fx

A soft band of lighter or darker tone crosses text, a pill, a card or grid lines from left to right and leaves; once, on each rest, or on a loop.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `period` (frames) frames between sweeps when looping; `bandWidth` (%W) width of the band

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `slantedBand` (default) | `v8.fx-shimmer-sweep` x, grid:0.5,0.4,0.7,1.1, 16 f | `v8.fx-shimmer-sweep` |
| `darkBand` | - | `v2.ui-status-text-shimmer` |
| `looping` | - | `v8.text-status-fade-sweep` |
| `once` | - | `v8.text-shimmer-sweep` |
| `lineLight` | - | `v7.grid-light-sweep` |

## text-motion (6 primitives, 37 variants)

### RiseFade · text

Units (letters, words, lines or a block) fade in while rising or dropping a few pixels into place on one ease-out, on a fixed stagger; with no travel it is a plain fade in place.

API: `{text?: string; children?: React.ReactNode; tone?: Tone; variant?: string}`

Params: `unit` (letter|word|line|block) what moves as one; `rise` (%H) travel into place, negative = drop from above; `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `wordRise` (default) | `v4.text-word-rise-fade` opacity, grid:0.2,0.8,0.6,1.0, 20 f | `v4.text-word-rise-fade` |
| `letterRise` | `v4.text-letter-rise-fade` opacity, grid:0.2,0.4,0.3,1.0, 19 f | `v4.text-letter-rise-fade` |
| `softBlockRise` | `v4.text-tagline-rise-in` opacity, grid:0.2,0.4,0.3,1.0, 21 f | `v4.text-tagline-rise-in` |
| `dropIn` | `v4.text-headline-drop-in` opacity, grid:0.2,0.8,0.6,1.0, 14 f | `v4.text-headline-drop-in` |
| `steepStagger` | `v6.text-word-rise-stagger` y, bezier:v7.cam-push-in-blur.i3, 18 f | `v6.text-word-rise-stagger` |
| `blockRise` | `v8.text-block-rise-in` y, grid:0.2,0.8,0.2,1.0, 23 f | `v8.text-block-rise-in` |
| `cascade` | `v8.text-list-cascade-fade` opacity, grid:0.3,0.4,0.2,1.1, 28 f | `v8.text-list-cascade-fade` |
| `fadeInPlace` | `v2.text-label-fade-in` opacity, grid:0.2,0.4,0.3,1.0, 14 f | `v2.text-label-fade-in`, `v7.icon-mark-fade-in` |
| `quickFade` | - | `v8.shape-separator-fade-in` |

### BlurIn · text

Units fade in from defocused to sharp in their places, optionally rising a few pixels; staggered by letter, word or line, or rolling so each word peaks in focus and defocuses out as the next one peaks.

API: `{text: string; tone?: Tone; variant?: string}`

Params: `unit` (letter|word|line|block) what resolves as one; `blur` (%W) starting blur; `rise` (%H) travel into place; `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `wordRise` (default) | `v7.text-word-blur-rise` opacity, grid:0.3,0.4,0.2,1.1, 16 f | `v7.text-word-blur-rise` |
| `overlapWords` | `v7.ui-prompt-word-stream` opacity, grid:0.2,0.8,0.6,1.0, 21 f | `v7.ui-prompt-word-stream` |
| `inPlace` | `v8.text-label-blur-fade-in` opacity, grid:0.3,0.4,0.1,1.0, 33 f | `v8.text-label-blur-fade-in` |
| `letterSweep` | `v5.text-caption-word-fade` opacity, grid:0.3,0.4,0.2,1.1, 33 f | `v5.text-caption-word-fade` |
| `focusRoll` | `v5.text-caption-focus-roll` opacity, grid:0.4,0.0,0.4,1.2, 23 f | `v5.text-caption-focus-roll` |
| `verticalBlur` | - | `v6.text-rise-in-blur` |

### BlurSlideIn · text

Lines, words, letters or glyphs slide in from the frame edges with directional motion blur and lock into place on a hard ease-out or a stiff spring, sometimes overshooting; pairs come from opposite sides.

API: `{text: string; tone?: Tone; variant?: string}`

Params: `unit` (letter|word|line|glyph) what slides as one; `overshoot` (%W) travel past rest before settling; `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `oppositeEdges` (default) | `v5.text-line-slide-blur` x, grid:0.2,0.8,0.2,1.0, 11 f | `v5.text-line-slide-blur` |
| `overshoot` | `v5.text-line-slide-overshoot` x, grid:0.2,1.2,0.8,1.1, 18 f | `v5.text-line-slide-overshoot` |
| `converge` | `v5.text-converge-slide` x, grid:0.0,1.0,0.1,1.0, 5 f | `v5.text-converge-slide` |
| `typeAlong` | `v6.text-line-slide-blur` x, grid:0.2,0.4,0.3,1.0, 13 f | `v6.text-line-slide-blur` |
| `whipIn` | `v6.text-word-whip-in` x, grid:0.0,1.0,0.1,1.0, 15 f | `v6.text-word-whip-in` |
| `trackingSettle` | `v5.text-tracking-settle` x, grid:0.2,0.4,0.3,1.0, 12 f | `v5.text-tracking-settle` |
| `glyphConverge` | - | `v7.text-glyph-slide-in` |
| `edgeSpring` | `v6.text-bracket-spring-in` x, grid:0.2,1.2,0.8,1.1, 17 f | `v6.text-bracket-spring-in` |
| `allEdges` | `v6.text-letter-converge` y, grid:0.3,0.4,0.1,1.0, 20 f | `v6.text-letter-converge` |

### WarpFlyIn · text

Text flies in as a liquid, rubbery or chrome-like warped smear and resolves into its letterforms as it lands; a liquid blob can morph into the first letters.

API: `{text: string; tone?: Tone; variant?: string}`

Params: `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `liquid` (default) | `v5.text-liquid-flyin` x, bezier:v5.logo-chrome-smear-in.i4, 10 f | `v5.text-liquid-flyin` |
| `rubbery` | `v6.text-warp-fly-in` y, bezier:v7.icon-tile-scale-down-in, 17 f | `v6.text-warp-fly-in` |
| `blobMorph` | - | `v5.text-liquid-blob-morph` |
| `chromeSmear` | `v5.logo-chrome-smear-in` scale, bezier:v6.3d-layer-explode, 25 f | `v5.logo-chrome-smear-in` |

### EdgeRise · text

Text springs in vertically from beyond the frame edge or from far below its slot, overshoots and settles like a damped spring; elements follow on a stagger.

API: `{text: string; tone?: Tone; variant?: string}`

Params: `overshoot` (%H) travel past rest; `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `springUp` (default) | `v8.text-spring-rise` y, grid:0.1,0.8,0.2,1.2, 17 f | `v8.text-spring-rise` |
| `dropBounce` | `v8.text-word-drop-bounce` y, grid:0.2,1.4,0.2,1.2, 15 f | `v8.text-word-drop-bounce` |
| `typeRise` | `v8.text-tag-type-rise` y, grid:0.2,1.2,0.8,1.1, 27 f | `v8.text-tag-type-rise` |
| `popDrop` | - | `v6.text-label-drop` |

### TextFadeOut · text

Text fades out in place on an ease-in, all together or line by line in reading order, optionally defocusing as it goes; no move or scale.

API: `{text: string; tone?: Tone; variant?: string}`

Params: `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `easeIn` (default) | `v3.text-fade-out` opacity, grid:0.8,0.0,0.7,1.1, 9 f | `v3.text-fade-out` |
| `accelerating` | `v4.text-headline-fade-out` opacity, grid:0.7,0.0,0.9,0.6, 11 f | `v4.text-headline-fade-out` |
| `linear` | `v7.text-caption-fade-out` opacity, grid:0.5,0.4,0.7,1.1, 19 f | `v7.text-caption-fade-out` |
| `slowFade` | `v8.text-fade-out` opacity, grid:0.8,0.0,0.7,1.1, 26 f | `v8.text-fade-out` |
| `defocusLines` | `v5.text-caption-line-fade-out` opacity, springZ0.80, 12 f | `v5.text-caption-line-fade-out` |

## transition-cut (4 primitives, 25 variants)

### HardCut · transition

The picture is replaced between two frames; the next layout is complete in the cut frame or builds from the empty canvas; an overlay can hold across the cut, or a move can continue through it in the same direction.

API: `{from: React.ReactNode; to: React.ReactNode; tone?: Tone; variant?: string}; also <name>Presentation(variant?) and its timing for TransitionSeries`

Params: `emptyFrames` (frames) empty canvas frames before the next layout builds

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `plain` (default) | - | `v2.trans-hard-cut` |
| `motionMatch` | - | `v5.trans-motion-match-cut` |
| `overlayHold` | - | `v5.layout-overlay-holds-across-cut` |

### DipToBackground · transition

The outgoing layout fades out in place on an ease-in (optionally scaling a few percent), the empty background holds for a few frames, and the next layout builds in.

API: `{from: React.ReactNode; to: React.ReactNode; tone?: Tone; variant?: string}; also <name>Presentation(variant?) and its timing for TransitionSeries`

Params: `emptyFrames` (frames) empty background frames between the layouts; `exitScale` (factor) scale the outgoing layout reaches

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `groupFade` (default) | `v3.trans-dip-to-bg` opacity, grid:0.8,0.0,0.7,1.1, 8 f | `v3.trans-dip-to-bg` |
| `quickDip` | `v1.trans-dip-to-bg` opacity, grid:0.8,0.0,0.7,1.1, 9 f | `v1.trans-dip-to-bg` |
| `zoomBuild` | - | `v4.trans-dip-to-bg` |

### WhipCut · transition

Whip through a hidden cut: the outgoing view eases in along one axis with growing directional blur, the picture is replaced at speed, and the incoming view (the next layout or a closer framing of the same one) arrives still moving and decelerates on a strong ease-out.

API: `{from: React.ReactNode; to: React.ReactNode; tone?: Tone; variant?: string}; also <name>Presentation(variant?) and its timing for TransitionSeries`

Params: `axis` (x|y) direction of travel; `scaleJump` (factor) framing change at the cut, 1 for none; `blur` (%W) peak directional blur

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `pushLeft` (default) | `v7.trans-whip-push-left` x, grid:0.2,0.8,0.2,1.0, 29 f | `v7.trans-whip-push-left` |
| `pushRight` | `v7.trans-whip-push-right` x, grid:0.2,0.8,0.2,1.0, 32 f | `v7.trans-whip-push-right` |
| `blendLeft` | `v5.trans-whip-pan` x, grid:0.2,0.8,0.6,1.0, 12 f | `v5.trans-whip-pan` |
| `streakLeft` | `v6.trans-whip-left` x, grid:0.7,0.0,0.9,0.6, 23 f | `v6.trans-whip-left` |
| `creepLeft` | `v8.trans-whip-left` x, grid:0.2,0.8,0.6,1.0, 27 f | `v8.trans-whip-left` |
| `blurReframe` | `v8.trans-blur-whip-reframe` x, grid:0.2,0.8,0.1,0.8, 26 f | `v8.trans-blur-whip-reframe` |
| `layerBlur` | - | `v7.fx-layer-directional-blur` |
| `canvasDown` | `v5.trans-whip-tilt` y, bezier:v7.cursor-drag-file-in.i2, 46 f | `v5.trans-whip-tilt` |
| `pushUp` | `v7.trans-whip-push-up` y, grid:0.2,0.8,0.6,1.0, 15 f | `v7.trans-whip-push-up` |
| `riseUp` | `v8.trans-whip-up` y, grid:0.2,0.8,0.2,1.0, 20 f | `v8.trans-whip-up` |
| `sinkDown` | `v8.trans-whip-down` y, bezier:v7.icon-tile-scale-down-in, 29 f | `v8.trans-whip-down` |
| `punchUp` | `v7.trans-punch-in-whip-up` y, grid:0.2,0.8,0.6,1.0, 20 f | `v7.trans-punch-in-whip-up` |
| `punchZoom` | `v7.trans-punch-in-whip-zoom` y, grid:0.2,0.8,0.2,1.0, 18 f | `v7.trans-punch-in-whip-zoom` |
| `diagonalZoom` | `v7.trans-whip-down-left-zoom-in` scale, bezier:v7.icon-tile-scale-down-in, 33 f | `v7.trans-whip-down-left-zoom-in` |

### PushSlide · transition

Vertical push: the outgoing layout accelerates up out of the top edge and the next one rises in from below the frame and brakes to rest; the two may sit on one strip, overlap, or swap at a hidden cut.

API: `{from: React.ReactNode; to: React.ReactNode; tone?: Tone; variant?: string}; also <name>Presentation(variant?) and its timing for TransitionSeries`

Params: `travel` (%H) distance the strip travels

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `stacked` (default) | `v8.trans-push-up` y, grid:0.2,0.8,0.2,1.0, 19 f | `v8.trans-push-up` |
| `dipRise` | `v6.trans-push-up` y, grid:0.7,0.0,0.1,0.8, 23 f | `v6.trans-push-up` |
| `easeInDrift` | `v6.trans-push-up-ease-in` y, grid:0.8,0.0,1.0,0.6, 19 f | `v6.trans-push-up-ease-in` |
| `rippleRise` | `v8.trans-push-up-columns` y, grid:0.0,1.0,0.1,1.0, 26 f | `v8.trans-push-up-columns` |
| `sharedStrip` | `v2.trans-scroll-push` y, grid:0.7,0.0,0.2,1.1, 17 f | `v2.trans-scroll-push` |

## transition-morph (5 primitives, 28 variants)

### ZoomThrough · transition

A zoom on one point accelerates toward the camera and carries through into the next scene, which continues the motion and settles; with radial streaks, a dissolve, a spin, or one dark vignetted picture.

API: `{from: React.ReactNode; to: React.ReactNode; tone?: Tone; variant?: string}; also <name>Presentation(variant?) and its timing for TransitionSeries`

Params: `toScale` (factor) scale reached on the outgoing side

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `cutContinue` (default) | `v7.trans-zoom-through-cut` scale, bezier:v7.icon-tile-scale-down-in, 21 f | `v7.trans-zoom-through-cut` |
| `risingZoom` | `v1.trans-zoom-through-mark` scale, grid:0.7,0.0,0.2,1.1, 23 f | `v1.trans-zoom-through-mark` |
| `radialStreaks` | `v5.trans-zoom-through-radial` opacity, grid:0.2,0.8,0.2,1.0, 7 f | `v5.trans-zoom-through-radial` |
| `oversizeLanding` | `v6.trans-zoom-through` scale, grid:0.0,0.6,0.9,1.1, 10 f | `v6.trans-zoom-through` |
| `dissolve` | `v8.trans-zoom-through-dissolve` scale, grid:0.6,0.2,1.0,0.6, 17 f | `v8.trans-zoom-through-dissolve` |
| `tunnelExit` | `v8.footage-card-zoom-to-full` scale, grid:0.2,0.8,0.6,1.0, 26 f | `v8.trans-tunnel-exit-zoom-through` |
| `spin` | `v7.trans-spin-zoom-whip` rotate, grid:0.2,0.8,0.6,1.0, 21 f | `v7.trans-spin-zoom-whip` |

### CollapseToPoint · shape

A group folds into one point or one cell: a plane wraps into a globe and shrinks to a dot, cells shrink into the centre one by one, rings fold inward step by step, a glowing blob implodes, merged shapes shrink to nothing.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `stepGap` (frames) frames between successive cells or rings

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `cellsInward` (default) | `v3.shape-hex-collapse` scale, grid:0.6,0.0,0.2,1.0, 23 f | `v3.shape-hex-collapse` |
| `sphereWrap` | `v2.trans-sphere-collapse` scale, grid:0.6,0.0,0.7,1.0, 13 f | `v2.trans-sphere-collapse` |
| `ringFold` | `v4.particle-ring-collapse` scale, grid:0.7,0.0,0.2,1.1, 56 f | `v4.particle-ring-collapse` |
| `meltImplode` | `v5.trans-melt-implode` scale, springZ0.80, 15 f | `v5.trans-melt-implode` |
| `blobMerge` | `v5.logo-sphere-drop-merge` area, grid:0.5,0.4,0.7,1.1, 15 f | `v5.logo-sphere-drop-merge` |
| `clusterSnap` | `v8.particle-mascot-converge` scale, grid:0.8,0.0,0.7,1.1, 17 f | `v8.particle-mascot-converge` |

### FlyToSlots · shape

A set of elements travels on straight or arced paths into target slots on one shared ease-in-out, optionally scaling to the slot size; staggered starts, so speed scales with distance.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `stagger` (frames) frames between successive units; `toScale` (factor) scale at the slot

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `gather` (default) | `v3.trans-hex-gather` progress, grid:0.7,0.0,0.2,1.1, 24 f | `v3.trans-hex-gather` |
| `converge` | `v2.trans-icon-converge-morph` y, grid:0.7,0.0,0.2,1.1, 13 f | `v2.trans-icon-converge-morph` |
| `riseIntoSlots` | `v2.trans-hex-fly-into-ui` y, grid:0.7,0.0,0.2,1.1, 15 f | `v2.trans-hex-fly-into-ui` |
| `swirl` | `v4.particle-swarm-converge` progress, grid:0.7,0.0,0.2,1.1, 33 f | `v4.particle-swarm-converge` |
| `arcToSlot` | `v8.trans-mascot-converge-fly` x, grid:0.9,0.0,0.2,1.0, 33 f | `v8.trans-mascot-converge-fly` |
| `swoopAcross` | `v8.trans-avatar-fly-split` x, grid:0.7,0.0,0.2,1.1, 31 f | `v8.trans-avatar-fly-split` |

### ShapeSwap · shape

Each element swaps in place for another: the old one shrinks and fades while the new one grows and fades in, all at once or as a wave across the set.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `stagger` (frames) frames between successive units; `fromScale` (factor) start scale of the incoming shape

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `waveSwap` (default) | `v4.trans-tile-hex-morph` opacity, springZ0.80, 18 f | `v4.trans-tile-hex-morph` |
| `centreOutSwap` | `v3.icon-badge-to-hex` scale, grid:0.2,0.4,0.3,1.0, 13 f | `v3.icon-badge-to-hex` |
| `crossDissolve` | `v4.card-content-crossfade` opacity, grid:0.2,0.8,0.6,1.0, 31 f | `v4.card-content-crossfade` |
| `shrinkGrow` | `v2.ui-badge-swap-pop` scale, grid:0.2,0.8,0.2,1.0, 7 f | `v2.ui-badge-swap-pop` |

### ContentSwap · transition

Part of a held layout is replaced while the rest stays: a title fades and the next pops into its slot, a panel slides through, a grid drops out and the next drops in, a screen crossfades while its content slides up, or a label or glyph swaps in one frame.

API: `{from: React.ReactNode; to: React.ReactNode; tone?: Tone; variant?: string}; also <name>Presentation(variant?) and its timing for TransitionSeries`

Params: `travel` (%H) slide of the incoming content

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `titleFade` (default) | `v3.text-fade-out` opacity, grid:0.8,0.0,0.7,1.1, 9 f | `v3.trans-morph-title-swap` |
| `slideThrough` | `v4.card-slide-swap` opacity, grid:0.2,0.8,0.6,1.0, 11 f | `v4.card-slide-swap`, `v4.trans-panel-swap` |
| `dropThrough` | `v7.ui-folder-drop-in` y, springZ0.80, 11 f | `v7.ui-folder-drop-in`, `v7.ui-grid-drop-out` |
| `crossfadeSlide` | `v8.ui-screen-crossfade-slide` y, grid:0.5,0.0,0.1,1.0, 13 f | `v8.ui-screen-crossfade-slide` |
| `oneFrame` | - | `v4.ui-label-swap`, `v2.ui-send-button-swap`, `v8.ui-icon-state-swap` |

## light-fx (6 primitives, 30 variants)

### LightFlash · transition

Light covers the frame and the picture is replaced under it: a white disc grows from a point, a ring blooms into white and the next shot comes down from it, a flare band peaks on the cut, two stars split apart over the next shot, or a ring inverts what it passes.

API: `{from: React.ReactNode; to: React.ReactNode; tone?: Tone; variant?: string}; also <name>Presentation(variant?) and its timing for TransitionSeries`

Params: `holdWhite` (frames) frames held at full white

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `iris` (default) | `v7.trans-iris-white` progress, grid:0.8,0.0,1.0,0.6, 16 f | `v7.trans-iris-white` |
| `ringBloom` | `v5.trans-flash-white` opacity, grid:0.6,0.0,0.7,1.0, 18 f | `v5.trans-flash-white`, `v5.fx-exposure-recover` |
| `flareCut` | - | `v5.fx-flare-bloom-out` |
| `starSplit` | `v5.trans-star-flash` progress, grid:0.6,0.0,0.2,1.0, 10 f | `v5.trans-star-flash` |
| `invertRipple` | `v7.fx-ripple-invert` progress, grid:0.8,0.0,0.7,1.1, 20 f | `v7.fx-ripple-invert` |

### StarFlare · fx

A four-point sparkle star and its light streaks: a star drops in growing, a streak led by a sparkle sweeps along a title and parks at its end, a full-width anamorphic streak through a point light, or stars fixed in depth that ride the camera.

API: `{tone?: Tone; variant?: string}`

Params: `travel` (%W) sweep length

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `streakSweep` (default) | `v5.shape-flare-streak-sweep` x, grid:0.2,1.2,0.8,1.1, 17 f | `v5.shape-flare-streak-sweep` |
| `drop` | - | `v5.shape-star-drop` |
| `anamorphic` | - | `v5.fx-anamorphic-flare` |
| `depthField` | - | `v5.particle-sparkle-field` |

### LumaPulse · fx

A brief luminance pulse on one element: a halo or bloom builds and drains, a layer flashes for two pictures, an element dips to near transparent at its fastest, or a screen flickers through its content swap.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `peak` (luma 0-1) pulse peak above rest

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `slowBloom` (default) | `v7.fx-clip-glow-pulse` opacity, grid:0.6,0.0,0.7,1.0, 34 f | `v7.fx-clip-glow-pulse` |
| `bloomCover` | `v7.fx-panel-glow-swap` opacity, grid:0.8,0.0,0.7,1.1, 45 f | `v7.fx-panel-glow-swap` |
| `haloPeak` | - | `v5.ui-card-mention-glow` |
| `layerFlash` | - | `v6.fx-layer-glow-pulse` |
| `opacityDip` | - | `v6.fx-opacity-dip` |
| `flicker` | - | `v6.ui-screen-swap-flicker` |
| `fillGlow` | - | `v7.ui-button-press-glow` |

### RadialBurst · fx

Elements burst out radially from a point and expand past the frame edges while fading: glowing square tiles, concentric outline copies, soft shockwave rings, angular shards, a ring band of halftone dots.

API: `{tone?: Tone; variant?: string}`

Params: `count` (count) elements in the burst

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `tileRing` (default) | `v5.particle-tile-burst` radius, grid:0.2,0.0,0.9,0.6, 15 f | `v5.particle-tile-burst` |
| `echoZoom` | `v5.ui-ring-burst` scale, grid:0.7,0.0,0.9,0.6, 12 f | `v5.ui-ring-burst` |
| `shockRings` | - | `v5.shape-shockwave-ring` |
| `shardSpray` | - | `v7.particle-shard-burst` |
| `dotRing` | `v7.bg-halftone-ring-burst` progress, grid:0.2,0.8,0.6,1.0, 55 f | `v7.bg-halftone-ring-burst` |

### PixelBlocks · fx

Luminous pixel squares as an ornament: a band of them sweeps across an element and dims out, a soft pixel smear trails behind text, or two squares slide into a corner-to-corner pair.

API: `{tone?: Tone; variant?: string}`

Params: `travel` (%W) sweep length

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `parkSweep` (default) | `v5.fx-pixel-sweep` x, bezier:v6.3d-layer-explode, 15 f | `v5.fx-pixel-sweep` |
| `smearSweep` | `v8.fx-pixel-smear-sweep` x, grid:0.5,0.0,0.1,1.0, 22 f | `v8.fx-pixel-smear-sweep` |
| `pairConverge` | - | `v7.shape-pixel-pair-converge` |

### ToneShift · fx

An element's ink or fill changes tone in place: text lightens, or dims and returns, older lines fall back while a new one darkens, a tone sweep runs across a line, a fill darkens to its rest tone.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `toTone` (luma 0-1) tone reached

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `twoStage` (default) | `v7.ui-label-fill-darken` opacity, grid:0.2,0.4,0.3,1.0, 15 f | `v7.ui-label-fill-darken` |
| `darkenIn` | `v7.ui-dropdown-fill-darken` opacity, grid:0.6,0.0,0.7,1.0, 15 f | `v7.ui-dropdown-fill-darken` |
| `lighten` | - | `v6.text-dim-out` |
| `dimToggle` | - | `v8.text-word-dim-toggle` |
| `focusShift` | - | `v8.text-focus-dim` |
| `sweep` | - | `v6.text-tone-sweep` |

## camera-zoom (3 primitives, 25 variants)

### SlowZoom · camera

Slow zoom or drift during holds so the frame is never still: an eased push-in that settles before the next cut, a near-linear creep, or a constant linear scale or position drift of the whole layout.

API: `{children: React.ReactNode; variant?: string} (moves the whole layer it wraps)`

Params: `toScale` (factor) scale reached; `ratePerFrame` (% per frame) constant drift rate

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `layerPush` (default) | `v2.ui-slow-push-in` scale, springZ0.80, 97 f | `v2.ui-slow-push-in` |
| `easeOutPush` | `v1.cam-slow-push-in` scale, springZ0.80, 97 f | `v1.cam-slow-push-in` |
| `easedPush` | `v7.cam-slow-push-in` scale, grid:0.8,0.0,0.7,1.1, 83 f | `v7.cam-slow-push-in` |
| `creep` | `v7.cam-slow-push-creep` scale, grid:0.5,0.4,0.7,1.1, 16 f | `v7.cam-slow-push-creep` |
| `linearDrift` | - | `v5.cam-hold-drift`, `v6.cam-slow-zoom-drift` |
| `groupCreep` | - | `v5.logo-scale-creep`, `v8.layout-scale-creep` |
| `recede` | - | `v5.layout-slow-recede`, `v8.cam-slow-pull-back` |

### PushIn · camera

The camera pushes in on a region and settles: slow start, a fast blurred middle and an ease-out into a creep, about the frame centre or a point off it; or a scale jump in one picture after an accelerating approach.

API: `{children: React.ReactNode; variant?: string} (moves the whole layer it wraps)`

Params: `toScale` (factor) scale reached

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `blurSettle` (default) | `v7.cam-push-in-blur` scale, grid:0.6,0.0,0.2,1.0, 22 f | `v7.cam-push-in-blur` |
| `cornerSettle` | `v7.cam-push-in-corner-settle` y, grid:0.2,0.8,0.6,1.0, 33 f | `v7.cam-push-in-corner-settle` |
| `pivotBelow` | `v8.cam-push-in-pan` scale, bezier:v7.cam-push-in-blur.i3, 74 f | `v8.cam-push-in-pan` |
| `snap` | `v5.cam-snap-zoom` y, grid:0.9,0.0,0.2,1.0, 30 f | `v5.cam-snap-zoom` |
| `layerPunch` | `v6.ui-mockup-punch-in` scale, bezier:v7.cam-push-in-blur.i3, 27 f | `v6.ui-mockup-punch-in` |

### PullBack · camera

The camera pulls back to reveal more of the layout on an eased slow-fast-slow move (often eased in log scale), with blur on its fastest pictures, about the frame centre or a point near an edge, sometimes with a pan.

API: `{children: React.ReactNode; variant?: string} (moves the whole layer it wraps)`

Params: `toScale` (factor) scale reached

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `reveal` (default) | `v7.cam-pull-back-reveal` scale, grid:0.2,0.4,0.3,1.0, 54 f | `v7.cam-pull-back-reveal` |
| `logEase` | `v3.cam-network-pullback` scale, grid:0.7,0.0,0.2,1.1, 72 f | `v3.cam-network-pullback` |
| `panLead` | `v4.cam-pullback` scale, grid:0.7,0.0,0.2,1.1, 39 f | `v4.cam-pullback`, `v4.trans-pullback-morph` |
| `centred` | - | `v4.trans-pullback-reveal` |
| `centreTail` | `v7.cam-pull-back-centre` scale, grid:0.7,0.0,0.1,0.8, 48 f | `v7.cam-pull-back-centre` |
| `closeUpOut` | `v6.cam-zoom-out` scale, grid:0.6,0.0,0.2,1.0, 21 f | `v6.cam-zoom-out` |
| `twoPulses` | `v8.cam-zoom-out-reveal` scale, grid:0.7,0.0,0.2,1.1, 32 f | `v8.cam-zoom-out-reveal` |
| `whipReveal` | `v5.cam-whip-pullback` x, grid:0.9,0.0,0.2,1.0, 35 f | `v5.cam-whip-pullback` |
| `flatten` | `v5.cam-pull-back-snap` scale, bezier:v7.cam-push-in-blur.i3, 29 f | `v5.cam-pull-back-snap` |
| `speedRamp` | `v6.cam-pull-back-ramp` scale, bezier:v7.cam-push-in-blur.i3, 25 f | `v6.cam-pull-back-ramp` |
| `recoil` | `v7.cam-click-pull-back` scale, grid:0.6,0.0,0.2,1.0, 20 f | `v7.cam-click-pull-back` |
| `easeBack` | `v8.cam-pull-back-settle` x, grid:0.2,0.4,0.3,1.0, 38 f | `v8.cam-pull-back-settle` |
| `reframe` | `v5.cam-reframe-pullback` y, grid:0.7,0.0,0.1,0.8, 24 f | `v5.cam-reframe-pullback` |

## camera-move (4 primitives, 32 variants)

### CanvasPan · camera

The camera pans or tilts across one canvas on an eased curve with directional blur at peak speed, sometimes with a small zoom; whip-like pans start slowly, burst for a few pictures and settle long.

API: `{children: React.ReactNode; variant?: string} (moves the whole layer it wraps)`

Params: `travelX` (%W) horizontal travel; `travelY` (%H) vertical travel; `toScale` (factor) zoom during the pan

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `whipX` (default) | `v5.cam-whip-pan` x, grid:0.9,0.0,0.2,1.0, 30 f | `v5.cam-whip-pan` |
| `whipReframe` | - | `v5.cam-whip-pan-reframe` |
| `whipY` | `v5.cam-whip-tilt` y, bezier:v7.cursor-drag-file-in.i2, 26 f | `v5.cam-whip-tilt` |
| `typingPan` | `v6.cam-text-pan` x, grid:0.7,0.0,0.2,1.1, 25 f | `v6.cam-text-pan` |
| `panUpZoom` | `v7.cam-pan-up-zoom` y, grid:0.7,0.0,0.1,0.8, 30 f | `v7.cam-pan-up-zoom` |
| `reframeOut` | `v7.cam-reframe-pan-out` x, grid:0.9,0.0,0.2,1.0, 45 f | `v7.cam-reframe-pan-out` |
| `reveal` | `v8.cam-pan-reveal` x, grid:0.7,0.0,0.2,1.1, 30 f | `v8.cam-pan-reveal` |
| `tiltTwoPhase` | `v5.cam-tilt-reveal` y, grid:0.9,1.2,0.1,0.8, 28 f | `v5.cam-tilt-reveal` |
| `scrollUp` | `v7.cam-scroll-up` y, springZ0.80, 23 f | `v7.cam-scroll-up` |
| `scrollSettle` | `v8.cam-scroll-up-settle` y, bezier:v6.3d-layer-explode, 42 f | `v8.cam-scroll-up-settle` |

### AccelerateExit · camera

The whole layout (or one block) accelerates out along one axis or in scale on an ease-in with growing motion blur and is cut at speed, with no settle; optionally after an anticipation dip.

API: `{children: React.ReactNode; variant?: string} (moves the whole layer it wraps)`

Params: `axis` (x|y|scale) what accelerates; `toScale` (factor) scale at the cut

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `up` (default) | `v7.cam-whip-exit-up` y, grid:0.7,0.0,0.9,0.6, 27 f | `v7.cam-whip-exit-up` |
| `driftUp` | `v8.cam-scroll-exit-up` y, grid:0.7,0.0,0.9,0.6, 22 f | `v8.cam-scroll-exit-up` |
| `left` | `v8.cam-slide-exit-left` x, grid:0.8,0.0,1.0,0.6, 25 f | `v8.cam-slide-exit-left` |
| `drift` | `v7.cam-drift-accelerating-exit` x, grid:0.6,0.2,1.0,0.6, 80 f | `v7.cam-drift-accelerating-exit` |
| `blockUp` | `v8.text-block-exit-up` y, grid:0.7,0.0,0.9,0.6, 33 f | `v8.text-block-exit-up` |
| `anticipateUp` | `v6.layout-anticipate-exit-up` y, inSine, 12 f | `v6.layout-anticipate-exit-up` |
| `hoverUp` | `v5.3d-card-exit-up` y, grid:0.7,0.0,0.9,0.6, 40 f | `v5.3d-card-exit-up` |
| `peekSnap` | - | `v5.text-edge-peek-exit` |
| `pushIntoCut` | `v5.cam-push-in-accelerate` scale, grid:0.8,0.0,1.0,0.6, 20 f | `v5.cam-push-in-accelerate` |
| `punchBreak` | `v7.cam-push-in-accelerating` scale, grid:0.8,0.0,1.0,0.6, 42 f | `v7.cam-push-in-accelerating` |
| `oversizeLanding` | `v8.cam-push-in-accelerating` scale, grid:0.8,0.0,0.7,1.1, 28 f | `v8.cam-push-in-accelerating` |
| `pullIntoCut` | `v6.cam-pull-back-cut` scale, grid:0.8,0.0,1.0,0.6, 20 f | `v6.cam-pull-back-cut` |
| `blurPullExit` | `v7.cam-pull-back-blur-exit` scale, grid:0.8,0.0,1.0,0.6, 15 f | `v7.cam-pull-back-blur-exit` |

### CutInSettle · camera

After a hard cut the new view arrives offset, zoomed or blurred and still moving, and settles on a strong ease-out.

API: `{children: React.ReactNode; variant?: string} (moves the whole layer it wraps)`

Params: `fromScale` (factor) scale on the cut frame; `fromY` (%H) offset on the cut frame

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `zoomOut` (default) | `v7.cam-zoom-out-settle-in` scale, bezier:v7.icon-tile-scale-down-in, 26 f | `v7.cam-zoom-out-settle-in` |
| `blurLow` | `v8.cam-cut-in-settle` y, grid:0.2,0.8,0.2,1.0, 39 f | `v8.cam-cut-in-settle` |
| `throwUp` | `v8.cam-whip-in-settle` y, grid:0.2,0.8,0.1,0.8, 26 f | `v8.cam-whip-in-settle` |
| `slideLeft` | `v8.cam-slide-in-left-settle` x, bezier:v7.icon-tile-scale-down-in, 25 f | `v8.cam-slide-in-left-settle` |
| `zoomDown` | `v4.layout-zoom-settle-in` scale, grid:0.2,0.4,0.3,1.0, 26 f | `v4.layout-zoom-settle-in` |
| `punchIn` | `v8.cam-punch-in-cut-settle` y, bezier:v7.icon-tile-scale-down-in, 21 f | `v8.cam-punch-in-cut-settle` |
| `ghostCarry` | - | `v8.ui-ghost-card-band` |

### SteppedZoom · camera

A zoom made of quick discrete steps between near-holds, or of stepped, differently centred crops each held to the next picture; the measured curve is the envelope the steps follow.

API: `{children: React.ReactNode; variant?: string} (moves the whole layer it wraps)`

Params: `steps` (count) number of steps; `toScale` (factor) scale reached

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `pullBack` (default) | `v1.cam-stepped-zoom-out` scale, grid:0.0,0.6,0.9,1.1, 69 f | `v1.cam-stepped-zoom-out` |
| `punchStutter` | `v6.trans-punch-in-stutter` scale, bezier:v7.trans-punch-in-whip-zoom.i2, 10 f | `v6.trans-punch-in-stutter` |

## three (7 primitives, 27 variants)

### PerspectiveSwing · 3d

A flat line or card turns in perspective: it morphs into a keystone taper right after landing, swings flat from a tilt while growing, or a mirrored pair turns its top edges apart and back.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `angle` (deg) turn of the top edge

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `taper` (default) | `v5.3d-perspective-swing` taper, grid:0.7,0.0,0.1,0.8, 17 f | `v5.3d-perspective-swing` |
| `swingIn` | `v5.text-type-swing-in` rotate, grid:0.0,1.0,0.1,1.0, 10 f | `v5.text-type-swing-in` |
| `mirrorPair` | `v5.card-mirror-tilt` rotate, grid:0.8,0.0,0.7,1.1, 23 f | `v5.card-mirror-tilt` |

### CardSpin3D · 3d

A card turns in 3D: a half turn about its vertical axis braking to a frontal rest, a yaw then recede, a push back to rest size, or a light-up while a sheen crosses it.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `angle` (deg) yaw reached; `fromScale` (factor) scale before the push back

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `halfTurn` (default) | `v5.3d-card-spin-y` rotate, grid:0.2,0.4,0.3,1.0, 18 f | `v5.3d-card-spin-y` |
| `yawRecede` | `v8.3d-card-turn-recede` rotate, grid:0.9,0.2,0.4,1.0, 53 f | `v8.3d-card-turn-recede` |
| `pushBack` | - | `v5.3d-card-recede` |
| `lightUp` | `v5.3d-card-light-up` opacity, springZ0.80, 17 f | `v5.3d-card-light-up` |

### LayerStack · 3d

A stack of parallel layers in 3D: it separates along a diagonal, fans out, collapses back, one layer sinks on its own, the rear cards fold into the front one, or new cards land on its front on a fixed interval.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `interval` (frames) frames between cards landing

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `explode` (default) | `v6.3d-layer-explode` spread, bezier:v6.3d-layer-explode, 20 f | `v6.3d-layer-explode` |
| `fanOut` | `v8.3d-stack-fan-out` x, grid:0.2,0.8,0.6,1.0, 39 f | `v8.3d-stack-fan-out` |
| `collapse` | `v6.3d-stack-collapse` spread, grid:0.8,0.0,1.0,0.6, 12 f | `v6.3d-stack-collapse` |
| `layerSink` | `v6.3d-layer-sink` y, grid:0.5,0.4,0.7,1.1, 35 f | `v6.3d-layer-sink` |
| `fold` | - | `v8.card-stack-collapse` |
| `slamOn` | - | `v8.card-deck-flip-stack` |

### Camera3D · 3d

The camera moves through a 3D scene: orbits, dollies with parallax, swings into perspective and pushes in, pushes until a layer flattens to the screen, shrinks a flat page into a stack, or flies down a one-point tunnel.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `toScale` (factor) scale reached

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `swingPush` (default) | `v5.cam-swing-3d-push` scale, bezier:v5.cam-swing-3d-push, 45 f | `v5.cam-swing-3d-push` |
| `orbitPush` | `v6.cam-orbit-push` x, grid:0.7,0.0,0.2,1.1, 23 f | `v6.cam-orbit-push` |
| `dollyReframe` | `v6.cam-dolly-reframe` x, grid:0.7,0.0,0.1,0.8, 30 f | `v6.cam-dolly-reframe` |
| `dollyParallax` | `v6.cam-dolly-back-parallax` x, grid:0.7,0.0,0.2,1.1, 18 f | `v6.cam-dolly-back-parallax` |
| `pullWide` | `v6.cam-pull-back-wide` scale, grid:0.7,0.0,0.2,1.1, 17 f | `v6.cam-pull-back-wide` |
| `orbitDrift` | - | `v5.cam-orbit-drift` |
| `pushFlatten` | `v8.trans-stack-push-flatten` x, grid:0.7,0.0,0.2,1.1, 31 f | `v8.trans-stack-push-flatten` |
| `shrinkIntoStack` | `v8.trans-zoom-out-morph` scale, grid:0.3,0.4,0.2,1.1, 20 f | `v8.trans-zoom-out-morph` |
| `tunnelDolly` | `v8.3d-tunnel-flythrough` scale, grid:0.2,0.8,0.6,1.0, 27 f | `v8.3d-tunnel-flythrough` |

### GlobeRise · 3d

The dome of a globe tiled with footage rises from the bottom edge on a strong ease-out, then spins about its vertical axis at a constant rate.

API: `{footage?: string[]; tone?: Tone; variant?: string}`

Params: `rise` (%H) rise from the bottom edge

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `riseSpin` (default) | `v6.3d-globe-rise` y, grid:0.2,0.8,0.2,1.0, 25 f | `v6.3d-globe-rise` |

### DepthFlyer · 3d

Small folded 3D shapes fly into depth toward a vanishing point, shrinking and decelerating, each pulling a particle trail; or one dives out through the bottom edge.

API: `{tone?: Tone; variant?: string}`

Params: `count` (count) flyers

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `converge` (default) | `v5.3d-origami-converge` x, grid:0.2,0.4,0.3,1.0, 27 f | `v5.3d-origami-converge` |
| `dive` | - | `v5.3d-origami-dive` |

### OrbitRig · 3d

A rig of rings orbits a centre as one rigid unit: halftone-dot circles spin about a tilted axis, passing in front of and behind the content, or a faint wireframe of orbit ellipses tumbles behind it.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `degPerFrame` (deg/frame) spin rate

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `rigidSpin` (default) | - | `v5.shape-halftone-orbit-rings` |
| `tumble` | - | `v5.bg-orbit-wireframe-tumble` |

## ui-controls (4 primitives, 26 variants)

### PressBounce · ui

A pressed button, chip or row squashes about its centre, holds, and springs back (or stays pressed); state changes land on the deepest picture.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `pressScale` (factor) scale at the bottom of the press; `hold` (frames) frames held pressed

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `quick` (default) | `v1.ui-button-press` scale, grid:0.2,0.4,0.3,1.0, 4 f | `v1.ui-button-press` |
| `deep` | `v4.ui-button-press` scale, grid:0.3,0.4,0.2,1.1, 4 f | `v4.ui-button-press` |
| `held` | `v5.ui-button-press` scale, grid:0.7,0.0,0.1,0.8, 13 f | `v5.ui-button-press` |
| `springBack` | `v5.ui-chip-press` scale, grid:0.4,0.0,0.4,1.2, 8 f | `v5.ui-chip-press` |
| `pressSwap` | `v5.ui-select-swap` scale, grid:0.5,0.4,0.7,1.1, 7 f | `v5.ui-select-swap` |
| `glowRelease` | - | `v7.ui-button-press` |
| `longHold` | - | `v8.ui-button-press` |
| `dropPress` | - | `v7.ui-folder-drop-bounce` |

### SeedGrow · ui

A box or pill is born as a seed (a dot, a dash, a thin line or a blurred speck) and grows to its size along one axis and then the other, on an explosive ease-out or with an overshoot; it can stretch with a typed label and collapse back to a line.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `overshoot` (factor) size past rest at the peak; `anchor` (left|centre|right) fixed edge while it grows

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `seedPop` (default) | `v7.ui-label-pop-in` width, grid:0.9,0.0,0.2,1.0, 23 f | `v7.ui-label-pop-in` |
| `widenOvershoot` | `v7.ui-label-widen-overshoot` width, grid:0.1,0.8,0.2,1.2, 25 f | `v7.ui-label-widen-overshoot` |
| `cornerFollow` | - | `v7.ui-corner-handles` |
| `speckStretch` | `v7.ui-row-stretch-in` width, grid:0.5,1.0,0.2,1.1, 30 f | `v7.ui-row-stretch-in` |
| `edgeStretch` | `v8.ui-card-stretch-in-blur` width, grid:0.2,0.8,0.2,1.0, 23 f | `v8.ui-card-stretch-in-blur` |
| `dotToPill` | `v7.shape-dot-to-pill` height, grid:0.0,0.6,0.9,1.1, 22 f | `v7.shape-dot-to-pill` |
| `lineToPill` | `v7.shape-line-to-pill` width, grid:0.2,0.8,0.2,1.0, 23 f | `v7.shape-line-to-pill` |
| `pillToLine` | `v7.shape-pill-to-line-out` width, grid:0.3,0.4,0.1,1.0, 24 f | `v7.shape-pill-to-line-out` |
| `growType` | `v8.ui-status-pill-grow-type` width, grid:0.2,0.4,0.3,1.0, 20 f | `v8.ui-status-pill-grow-type` |
| `chainIn` | `v8.ui-callout-pop-in` scale, grid:0.2,0.4,0.3,1.0, 18 f | `v8.ui-callout-pop-in` |
| `chainOut` | `v8.ui-callout-collapse-out` scale, grid:0.9,0.2,0.4,1.0, 20 f | `v8.ui-callout-collapse-out` |

### Dropdown · ui

A menu opens from its anchor: it unfolds or scales up with motion blur while the camera re-frames to it, and closes by squashing back into its anchor.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `fromScale` (factor) menu scale when it starts to open

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `unfold` (default) | `v5.ui-dropdown-reveal` y, grid:0.7,0.0,0.1,0.8, 20 f | `v5.ui-dropdown-reveal` |
| `scaleIn` | `v7.ui-dropdown-scale-in` scale, grid:0.2,0.8,0.6,1.0, 33 f | `v7.ui-dropdown-scale-in` |

### Counter · ui

A number changes in place: it counts with an accelerating rate, ticks as a real-time timer, steps on events, swaps readings once per picture, or a dial knob fast-forwards around its ring while its digits count.

API: `{from: number; to: number; tone?: Tone; variant?: string}`

Params: `angle` (deg) knob travel

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `accelerating` (default) | `v1.counter-accelerating-count` value, grid:0.2,0.0,0.9,0.6, 92 f | `v1.counter-accelerating-count` |
| `realTime` | - | `v3.counter-elapsed-timer` |
| `stepOnArrival` | - | `v4.counter-step` |
| `perPictureSwap` | - | `v7.counter-ui-readout-step` |
| `fastForward` | `v6.counter-dial-fastforward` rotate, grid:0.9,0.0,0.2,1.0, 38 f | `v6.counter-dial-fastforward` |

## ui-feed (6 primitives, 39 variants)

### ItemRiseIn · ui

List or feed items appear one at a time below the earlier ones: each fades in while rising a few pixels on an ease-out, or pops in at full value one per picture, in reading order.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `rise` (px1080) rise of each item; `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `riseFade` (default) | `v2.ui-list-item-rise-fade` opacity, grid:0.2,0.4,0.3,1.0, 5 f | `v2.ui-list-item-rise-fade` |
| `makeRoomRise` | `v4.ui-chat-item-rise-fade-in` opacity, grid:0.2,0.8,0.6,1.0, 12 f | `v4.ui-chat-item-rise-fade-in` |
| `fadeInPlace` | `v3.ui-row-fade-in` opacity, grid:0.2,0.4,0.3,1.0, 8 f | `v3.ui-row-fade-in` |
| `quickFade` | - | `v1.ui-chat-bubble-in` |
| `popStagger` | - | `v7.ui-list-stagger-in` |
| `fadeAcross` | `v7.ui-card-stagger-fade` opacity, grid:0.3,0.4,0.2,1.1, 13 f | `v7.ui-card-stagger-fade` |
| `lateFade` | - | `v8.ui-reply-meta-fade-in` |
| `blurSlide` | `v8.ui-thumb-slide-in-blur` y, grid:0.3,0.4,0.1,1.0, 10 f | `v8.ui-thumb-slide-in-blur` |

### StepScroll · ui

A list moves up by one item's height as a new item arrives: in a single frame, or as an eased step over a slow base drift.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `baseDrift` (%H per frame) slow drift between steps

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `eased` (default) | `v8.ui-list-step-scroll` y, grid:0.2,0.8,0.2,1.0, 21 f | `v8.ui-list-step-scroll` |
| `thread` | `v8.ui-thread-step-scroll` y, grid:0.6,0.0,0.2,1.0, 35 f | `v8.ui-thread-step-scroll` |
| `jump` | - | `v3.ui-chat-step-scroll` |
| `jumpBottom` | - | `v4.ui-chat-list-step-scroll` |

### PageScroll · ui

Page content scrolls inside a still frame on a smooth ease-in-out, on a momentum curve with a long deceleration, or arrives mid-scroll and decelerates to rest.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `travel` (%H) scroll distance

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `easeInOut` (default) | `v2.ui-page-scroll` y, grid:0.7,0.0,0.2,1.1, 16 f | `v2.ui-page-scroll` |
| `momentum` | `v7.ui-page-scroll-momentum` y, grid:0.6,0.0,0.2,1.0, 83 f | `v7.ui-page-scroll-momentum` |
| `decelerate` | `v7.ui-scroll-settle` y, grid:0.2,0.4,0.3,1.0, 41 f | `v7.ui-scroll-settle` |
| `slowBack` | - | `v6.ui-code-scroll` |

### Marquee · ui

A row scrolls sideways at a constant speed: it arrives fast and brakes into its cruise, ramps its speed between holds, or stops dead after a number of slots.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `speed` (%W per frame) cruise speed

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `constant` (default) | - | `v8.layout-marquee-scroll` |
| `brakeIn` | `v8.layout-marquee-whip-in` x, bezier:v7.icon-tile-scale-down-in, 44 f | `v8.layout-marquee-whip-in` |
| `deadStop` | `v3.ui-logo-marquee` x, grid:0.5,0.4,0.7,1.1, 217 f | `v3.ui-logo-marquee` |
| `speedRamp` | `v6.card-carousel-speed-ramp` x, grid:0.7,0.0,0.2,1.1, 60 f | `v6.card-carousel-speed-ramp` |

### BusyIndicator · ui

A working indicator loops while something is pending: a glyph or dot spinner steps through its frames, an arc spins at a constant rate, an icon pulses its tone, a placeholder flashes on and off, or a mark makes one full turn and stops.

API: `{tone?: Tone; variant?: string}`

Params: `stepFrames` (frames) frames per spinner step; `degPerFrame` (deg/frame) rotation rate

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `glyphCycle` (default) | - | `v4.ui-spinner-glyph-cycle` |
| `dotCycle` | - | `v3.icon-dot-spinner` |
| `cycleWithTimer` | - | `v1.ui-status-timer` |
| `constantSpin` | - | `v7.ui-spinner-rotate` |
| `turning` | - | `v8.icon-activity-spinner` |
| `tonePulse` | - | `v2.ui-status-avatar-pulse` |
| `onOff` | - | `v7.ui-gap-placeholder-blink` |
| `fullTurn` | `v7.logo-spin-while-typing` rotate, grid:0.5,0.4,0.7,1.1, 89 f | `v7.logo-spin-while-typing` |

### FloatingPill · ui

A floating status pill or toast with its icon: it enters (drops along a curve, rises through the bottom edge with an overshoot, whips up), drifts against the layer under it, and leaves (smears out, fades and slides, lifts and drops away).

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `overshoot` (%H) travel past rest

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `dropIn` (default) | `v8.ui-status-pill-drop-in` progress, bezier:v7.icon-tile-scale-down-in, 17 f | `v8.ui-status-pill-drop-in` |
| `riseLevel` | - | `v8.ui-status-pill-rise-level` |
| `whipUp` | `v8.ui-status-pill-whip-in-up` y, grid:0.9,1.2,0.1,0.8, 8 f | `v8.ui-status-pill-whip-in-up` |
| `counterDrift` | - | `v8.ui-status-pill-drift` |
| `trackFootage` | - | `v8.ui-overlay-follow-footage` |
| `smearOut` | - | `v8.fx-overlay-vertical-smear-out` |
| `edgeRise` | `v6.ui-pill-rise` y, grid:0.0,1.0,0.1,1.0, 8 f | `v6.ui-pill-rise` |
| `overshootRise` | `v8.ui-prompt-pill-rise-in` y, grid:0.1,0.8,0.2,1.2, 18 f | `v8.ui-prompt-pill-rise-in` |
| `liftDrop` | `v8.ui-pill-anticipate-drop-out` y, grid:0.7,0.0,0.2,1.1, 9 f | `v8.ui-pill-anticipate-drop-out` |
| `toastIn` | - | `v8.ui-toast-fade-in` |
| `toastOut` | `v8.ui-toast-fade-slide-out` opacity, grid:0.5,0.4,0.7,1.1, 16 f | `v8.ui-toast-fade-slide-out` |

## cards (4 primitives, 28 variants)

### SlideSettle · layout

An element shifts a short distance into place while it fades in or sharpens, on a long ease-out; more follow on a stagger.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `fromX` (%W) horizontal offset at the start; `fromY` (%H) vertical offset at the start; `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `fadeSlide` (default) | `v1.card-slide-fade-in` x, grid:0.2,0.8,0.2,1.0, 13 f | `v1.card-slide-fade-in` |
| `longThrow` | `v8.layout-header-slide-left` x, grid:0.2,0.8,0.1,0.8, 30 f | `v8.layout-header-slide-left` |
| `onePicture` | - | `v5.ui-chip-slide-in` |
| `deblurRise` | `v8.ui-card-rise-deblur-in` y, grid:0.2,0.8,0.2,1.0, 26 f | `v8.ui-card-rise-deblur-in` |
| `fadeRise` | `v8.card-rise-fade-in` opacity, grid:0.5,0.4,0.7,1.1, 20 f | `v8.card-rise-fade-in` |
| `fanOut` | `v8.card-column-fan-out` y, grid:0.2,0.4,0.3,1.0, 14 f | `v8.card-column-fan-out` |
| `dropSettle` | `v8.ui-sidebar-drop-in` y, bezier:v7.icon-tile-scale-down-in, 21 f | `v8.ui-sidebar-drop-in` |
| `riseBuild` | `v8.ui-composer-build` y, grid:0.1,0.8,0.2,1.2, 56 f | `v8.ui-composer-build` |

### EdgeEnter · layout

An element enters from beyond a frame edge with directional motion blur and lands on a hard ease-out, sometimes with a small overshoot.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `overshoot` (%H) travel past rest

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `hardLand` (default) | `v5.card-rise-drop-in` y, grid:0.2,0.8,0.1,0.8, 10 f | `v5.card-rise-drop-in` |
| `smearRise` | `v7.card-rise-in` y, grid:0.2,0.8,0.2,1.0, 22 f | `v7.card-rise-in` |
| `dropDecelerate` | `v7.ui-window-drop-in` y, bezier:v7.icon-tile-scale-down-in, 30 f | `v7.ui-window-drop-in` |
| `blurSlide` | `v6.ui-dial-slide-in` x, grid:0.0,1.0,0.1,1.0, 15 f | `v6.ui-dial-slide-in` |
| `trailSlide` | - | `v6.shape-arrow-slide-in` |
| `streakDrop` | `v7.shape-arrow-drop-in` y, grid:0.2,0.8,0.2,1.0, 22 f | `v7.shape-arrow-drop-in` |

### ScaleFade · layout

A group fades in while growing slightly about its centre (and rising) on an ease-out, or fades out while shrinking or zooming slightly on an ease-in.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `fromScale` (factor) scale at the start of an entrance; `toScale` (factor) scale at the end of an exit; `rise` (%H) vertical travel; `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `growIn` (default) | `v3.ui-panel-grow-fade-in` opacity, grid:0.3,0.4,0.1,1.0, 12 f | `v3.ui-panel-grow-fade-in` |
| `centreGrowIn` | `v1.ui-prompt-pop-in` opacity, grid:0.2,0.8,0.6,1.0, 12 f | `v1.ui-prompt-pop-in` |
| `riseGrowIn` | `v4.card-rise-scale-fade-in` opacity, grid:0.2,0.8,0.6,1.0, 14 f | `v4.card-rise-scale-fade-in` |
| `staggerIn` | `v4.layout-team-stagger-fade` opacity, grid:0.2,0.8,0.6,1.0, 16 f | `v4.layout-team-stagger-fade` |
| `shrinkOut` | `v3.ui-panel-shrink-fade-out` opacity, grid:0.8,0.0,0.7,1.1, 9 f | `v3.ui-panel-shrink-fade-out` |
| `shrinkCut` | `v1.card-shrink-fade-out` opacity, grid:0.7,0.0,0.9,0.6, 9 f | `v1.card-shrink-fade-out` |
| `riseZoomOut` | `v1.layout-send-off-exit` y, grid:0.8,0.0,0.7,1.1, 10 f | `v1.layout-send-off-exit` |
| `zoomOut` | `v4.layout-zoom-fade-out` opacity, grid:0.8,0.0,0.7,1.1, 10 f | `v4.layout-zoom-fade-out` |
| `shrinkEach` | `v4.layout-shrink-fade-out` opacity, grid:0.7,0.0,0.9,0.6, 11 f | `v4.layout-shrink-fade-out` |

### OversizeSettle · layout

An element enters oversized (often blurred and cut by the frame edge) and shrinks to rest about its anchor on a fast-start ease-out.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `fromScale` (factor) scale on the first frame

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `settle` (default) | `v6.text-scale-down-settle` scale, grid:0.2,0.8,0.2,1.0, 25 f | `v6.text-scale-down-settle` |
| `hugeShrink` | `v6.text-word-shrink-in` scale, bezier:v5.logo-chrome-smear-in.i4, 10 f | `v6.text-word-shrink-in` |
| `blurShrink` | `v7.icon-tile-scale-down-in` scale, bezier:v7.icon-tile-scale-down-in, 28 f | `v7.icon-tile-scale-down-in` |
| `quickSettle` | - | `v7.ui-button-oversize-settle` |
| `riseSettle` | `v5.card-scale-settle` scale, grid:0.2,0.8,0.1,0.8, 18 f | `v5.card-scale-settle` |

## layout (4 primitives, 20 variants)

### MakeRoom · layout

A settled block moves, shrinks or re-centres to make room for what arrives next: it rises to the top band, slides and shrinks aside, re-centres as content is inserted, or opens a gap inside a line.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `travelX` (%W) horizontal travel; `travelY` (%H) vertical travel; `toScale` (factor) scale reached

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `riseTop` (default) | `v6.layout-rise-make-room` y, grid:0.6,0.0,0.2,1.0, 17 f | `v6.layout-rise-make-room` |
| `riseShort` | `v7.layout-rise-make-room` y, grid:0.7,0.0,0.1,0.8, 17 f | `v7.layout-rise-make-room` |
| `shrinkAside` | `v6.layout-slide-make-room` x, bezier:v7.cursor-drag-file-in.i2, 25 f | `v6.layout-slide-make-room` |
| `openGap` | `v7.layout-slide-make-room` x, bezier:v7.cursor-drag-file-in.i2, 10 f | `v7.layout-slide-make-room` |
| `reflow` | `v6.layout-reflow-slide` x, grid:0.7,0.0,0.2,1.1, 12 f | `v6.layout-reflow-slide` |
| `liftShrink` | `v5.text-lift-to-header` scale, grid:0.7,0.0,0.2,1.1, 17 f | `v5.text-lift-to-header` |
| `recenter` | `v8.layout-lockup-recenter` x, grid:0.6,0.0,0.2,1.0, 21 f | `v8.layout-lockup-recenter` |
| `centreSlide` | `v5.ui-box-slide` x, grid:0.5,0.0,0.1,1.0, 25 f | `v5.ui-box-slide` |
| `groupSnap` | `v5.ui-group-reframe` y, grid:0.9,1.2,0.1,0.8, 13 f | `v5.ui-group-reframe` |

### SplitApart · layout

Parts of a block move apart: lines slide to opposite sides, a line splits up and down, split lines whip out in their directions, grid spacing opens, settled lines kick apart and lock again, or one element becomes a mirrored pair.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `separation` (%W) final separation

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `splitShift` (default) | `v6.layout-line-split-shift` x, bezier:v7.cam-push-in-blur.i3, 20 f | `v6.layout-line-split-shift` |
| `splitMorph` | `v6.trans-split-morph` y, grid:0.7,0.0,0.2,1.1, 12 f | `v6.trans-split-morph` |
| `whipOut` | `v6.layout-split-whip-out` x, bezier:v7.trans-punch-in-whip-zoom.i2, 7 f | `v6.layout-split-whip-out` |
| `gridSpread` | `v6.grid-spread-out` x, grid:0.2,0.8,0.2,1.0, 23 f | `v6.grid-spread-out` |
| `kickApart` | `v5.text-line-counter-shift` x, grid:0.2,0.8,0.2,1.0, 7 f | `v5.text-line-counter-shift` |
| `mirrorPair` | `v8.particle-mascot-split` x, grid:0.2,0.8,0.2,1.0, 17 f | `v8.particle-mascot-split` |

### LockupSlide · layout

A mark slides aside on a symmetric ease-in-out (optionally shrinking) to make room for the wordmark, which appears in its place as the slide ends.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `travelX` (%W) slide distance; `toScale` (factor) mark scale at the end

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `medium` (default) | `v1.logo-lockup-slide` x, grid:0.7,0.0,0.2,1.1, 20 f | `v1.logo-lockup-slide` |
| `shrinkWide` | `v2.logo-lockup-slide` x, grid:0.7,0.0,0.2,1.1, 10 f | `v2.logo-lockup-slide` |
| `wide` | `v3.logo-lockup-slide` x, grid:0.7,0.0,0.2,1.1, 21 f | `v3.logo-lockup-slide` |
| `short` | `v4.logo-lockup-slide` x, grid:0.7,0.0,0.2,1.1, 28 f | `v4.logo-lockup-slide` |

### CaptionDrift · layout

Caption lines stand offset like stairs and the whole block slides at a constant velocity for its whole life, away from the direction its lines step.

API: `{text: string; tone?: Tone; variant?: string}`

Params: `velocityX` (%W per frame) drift speed; `velocityY` (%H per frame) drift speed

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `stairDrift` (default) | - | `v5.text-caption-drift`, `v5.layout-caption-staircase` |

## icons (5 primitives, 40 variants)

### ScalePop · ui

An element scales up from small about its own centre while it fades in, on a strong ease-out or on a spring that overshoots and settles; a tilt or spin can straighten with it.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `fromScale` (factor) scale on the first frame; `peakScale` (factor) overshoot peak; `fromAngle` (deg) starting tilt

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `strongOut` (default) | `v2.logo-mark-pop-in` scale, grid:0.2,0.8,0.6,1.0, 16 f | `v2.logo-mark-pop-in` |
| `fadeGrow` | `v1.logo-mark-pop-in` opacity, bezier:v5.logo-chrome-smear-in.i4, 9 f | `v1.logo-mark-pop-in` |
| `spinTilt` | `v2.logo-spin-scale-in` scale, grid:0.2,0.8,0.2,1.0, 24 f | `v2.logo-spin-scale-in` |
| `longTail` | `v7.icon-voice-badge-pop` scale, bezier:v7.icon-tile-scale-down-in, 37 f | `v7.icon-voice-badge-pop` |
| `sliverGrow` | `v7.icon-tile-pop-in` scale, bezier:v7.cam-push-in-blur.i3, 15 f | `v7.icon-tile-pop-in` |
| `rideIn` | `v8.icon-mascot-pop-slide` scale, grid:0.3,0.4,0.1,1.0, 24 f | `v8.icon-mascot-pop-slide` |
| `discGrow` | `v8.icon-avatar-grow-in` scale, grid:0.2,0.8,0.2,1.0, 19 f | `v8.icon-avatar-grow-in` |
| `glowGrow` | - | `v7.icon-glow-in` |
| `cellByCell` | - | `v8.icon-grid-cell-pop` |
| `threeStep` | `v5.ui-chip-pop` scale, grid:0.3,0.4,0.2,1.1, 7 f | `v5.ui-chip-pop` |
| `glowSettle` | `v7.ui-folder-pop-in` scale, bezier:v7.icon-tile-scale-down-in, 15 f | `v7.ui-folder-pop-in` |
| `twoPicture` | - | `v5.ui-button-pop` |
| `overshootPeak` | `v3.icon-node-pop-in` scale, grid:0.3,1.4,0.3,1.2, 11 f | `v3.icon-node-pop-in` |
| `springDip` | `v8.icon-mascot-pop-in` scale, bezier:v8.icon-mascot-pop-in, 20 f | `v8.icon-mascot-pop-in` |
| `blurOvershoot` | `v6.ui-node-pop-in` scale, grid:0.1,0.8,0.2,1.2, 25 f | `v6.ui-node-pop-in` |
| `spinSpring` | `v7.icon-glyph-spin-pop` rotate, grid:0.3,1.4,0.3,1.2, 37 f | `v7.icon-glyph-spin-pop` |

### SpawnField · shape

Many elements appear by a spawn pattern, each with the same small pop: one by one in reading order, as opposite pairs around a ring, on a radial front, at random spots, at the edges of a growing lattice, or in radial bursts.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `fromScale` (factor) pop start scale; `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `radialFront` (default) | `v2.grid-hex-radial-pop` opacity, grid:0.2,0.8,0.2,1.0, 7 f | `v2.grid-hex-radial-pop` |
| `readingOrder` | `v1.icon-stagger-pop-in` opacity, grid:0.2,0.8,0.6,1.0, 10 f | `v1.icon-stagger-pop-in` |
| `gridOrder` | `v2.icon-stagger-pop-in` opacity, grid:0.3,0.4,0.1,1.0, 11 f | `v2.icon-stagger-pop-in` |
| `ringPairs` | `v2.icon-ring-pop-in` scale, grid:0.2,0.8,0.2,1.0, 8 f | `v2.icon-ring-pop-in` |
| `randomScatter` | `v2.particle-hex-scatter-pop` scale, grid:0.2,0.8,0.6,1.0, 7 f | `v2.particle-hex-scatter-pop` |
| `latticeGrow` | `v1.grid-hex-network-grow` opacity, grid:0.2,0.8,0.6,1.0, 8 f | `v1.grid-hex-network-grow` |
| `burstRing` | `v8.particle-mascot-burst-ring` radius, bezier:v8.particle-mascot-burst-ring, 28 f | `v8.particle-mascot-burst-ring` |

### AmbientLoop · shape

Continuous cyclic motion on held elements: a sine float with its own phase per element, a scale pulse that takes turns, a squash pulse, level bars following the audio, or elements riding an ellipse at a constant angular speed.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `amplitude` (%H) float amplitude; `period` (frames) loop period; `degPerFrame` (deg/frame) orbit rate

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `sineFloat` (default) | `v1.icon-idle-float` y, grid:0.5,0.4,0.7,1.1, 65 f | `v1.icon-idle-float` |
| `pulseTurns` | `v4.icon-pulse` scale, grid:0.2,0.4,0.3,1.0, 7 f | `v4.icon-pulse` |
| `squashPulse` | - | `v8.icon-mascot-idle-bounce` |
| `audioLevel` | - | `v7.icon-voice-meter` |
| `ellipseOrbit` | - | `v2.icon-ring-orbit` |

### IconFlyIn · shape

An icon enters along a path and lands: it darts in from beyond an edge, drops into a card with a damped bounce, decelerates along an arc, or a chain follows its leader along an arc and dives into the target.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `arcIn` (default) | `v8.icon-mascot-fly-in-arc` progress, grid:0.2,0.8,0.2,1.0, 44 f | `v8.icon-mascot-fly-in-arc` |
| `dart` | - | `v8.icon-mascot-dart-in` |
| `dropBounce` | - | `v8.icon-mascot-drop-into-card` |
| `curvedStagger` | `v5.logo-sphere-fly-in` y, grid:0.2,0.8,0.2,1.0, 25 f | `v5.logo-sphere-fly-in` |
| `chainArc` | `v7.particle-mascot-chain-arc` progress, springZ0.80, 47 f | `v7.particle-mascot-chain-arc` |

### MarkBars · shape

The two bars inside a mark move as one: they squash shut and reopen, slide together to a new position with a squash mid-move, open from closed dashes after a hold, slide, hold and slide back, or swap glyphs in one frame.

API: `{tone?: Tone; variant?: string}`

Params: `closedScale` (factor) bar height when shut; `hold` (frames) frames held shut or closed

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `slideSquash` (default) | `v2.logo-eye-glance` x, grid:0.7,0.0,0.2,1.1, 8 f | `v2.logo-eye-glance` |
| `squashShut` | `v1.logo-blink` scaleY, grid:0.2,0.8,0.6,1.0, 10 f | `v1.logo-blink` |
| `squashPair` | - | `v2.logo-eye-blink` |
| `openFromDash` | `v3.logo-eyes-open` height, grid:0.2,0.4,0.3,1.0, 11 f | `v3.logo-eyes-open` |
| `openToPills` | `v4.logo-eye-open` height, grid:0.3,0.4,0.1,1.0, 10 f | `v4.logo-eye-open` |
| `slideHoldReturn` | `v8.icon-mascot-eye-glance` x, grid:0.7,0.0,0.2,1.1, 19 f | `v8.icon-mascot-eye-glance` |
| `glyphSwap` | - | `v8.icon-mascot-eye-swap` |

## shapes (3 primitives, 27 variants)

### PacketHop · shape

Small dots travel between nodes along connectors: hop centre to centre on an ease-in-out whose length hardly depends on distance, relay node to node, dispatch once to a receiver, or ping-pong linearly on a shared period.

API: `{tone?: Tone; variant?: string}`

Params: `period` (frames) ping-pong period

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `easedHop` (default) | `v4.particle-edge-packets` x, grid:0.7,0.0,0.2,1.1, 18 f | `v4.particle-edge-packets` |
| `straightCarry` | `v1.particle-packet-hop` x, grid:0.3,0.0,0.8,1.2, 12 f | `v1.particle-packet-hop` |
| `relay` | `v3.particle-packet-relay` x, springZ0.80, 15 f | `v3.particle-packet-relay` |
| `dispatch` | `v3.particle-packet-dispatch` progress, grid:0.7,0.0,0.2,1.1, 11 f | `v3.particle-packet-dispatch` |
| `dwellHop` | - | `v1.particle-edge-packets` |
| `pingPong` | - | `v2.particle-packet-pingpong` |

### LineDraw · shape

A line or stroke draws on along its path: connectors grow edge to edge, a bracket draws out with rounded turns, edge ticks grow in, wireframe edges draw from back to front, an outline closes around a pill, a path draws on while its stroke thickens, or outline copies are revealed one after another.

API: `{tone?: Tone; variant?: string}`

Params: `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `edgeToEdge` (default) | `v3.shape-connector-draw-on` progress, grid:0.5,0.4,0.7,1.1, 9 f | `v3.shape-connector-draw-on` |
| `roundedTurns` | - | `v5.shape-connector-draw` |
| `growInward` | - | `v6.shape-edge-lines-grow` |
| `backToFront` | `v6.shape-wireframe-edges` progress, grid:0.7,0.0,0.2,1.1, 17 f | `v6.shape-wireframe-edges` |
| `rightToLeft` | - | `v8.shape-divider-draw-on` |
| `closeLoop` | - | `v8.ui-pill-outline-draw` |
| `trimThicken` | - | `v6.logo-stroke-draw-on` |
| `trimSteps` | - | `v7.icon-stroke-draw-on` |
| `echoReveal` | `v6.shape-echo-outlines` x, bezier:v7.cam-push-in-blur.i3, 27 f | `v6.shape-echo-outlines` |

### Backdrop · fx

The background field and its ambient changes: soft blobs breathe, fade in or clear, a dot grid drifts, halftone glows swell and travel, ribbons rise or drift, a diagonal split rides the camera, a dotted beam bridges two elements, or a feathered zone clears the field behind text.

API: `{children: React.ReactNode; tone?: Tone; variant?: string}`

Params: `period` (frames) breathing or glow period

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `breathe` (default) | - | `v6.bg-soft-field` |
| `clear` | - | `v6.bg-clear-fade` |
| `blobFadeIn` | - | `v6.bg-blob-fade-in` |
| `dotGridDrift` | - | `v8.bg-dot-grid-drift` |
| `diagonalSplit` | - | `v7.bg-diagonal-split` |
| `travellingGlow` | - | `v5.bg-halftone-ribbon-glow` |
| `cornerFadeUp` | - | `v5.bg-halftone-glow` |
| `ribbonRise` | - | `v5.bg-ribbon-rise-in` |
| `ribbonDrift` | - | `v5.bg-ribbon-drift` |
| `beamGrow` | - | `v5.shape-halftone-beam` |
| `clearZone` | - | `v1.layout-text-knockout` |
| `glowZone` | - | `v3.bg-headline-knockout` |

## cursor (4 primitives, 22 variants)

### CursorPath · ui

A pointer travels on its own: it flies in from beyond an edge and decelerates onto a target, glides between targets (thrown fast and eased out, or in-out), winds up and swoops, or accelerates off the frame.

API: `{tone?: Tone; variant?: string}`

Params: `tilt` (deg) pointer tilt in flight

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `flyUp` (default) | `v7.cursor-fly-in` y, grid:0.2,0.4,0.3,1.0, 23 f | `v7.cursor-fly-in` |
| `diagonalIn` | `v5.cursor-fly-in` progress, bezier:v7.icon-tile-scale-down-in, 15 f | `v5.cursor-fly-in` |
| `dive` | `v5.cursor-3d-dive-click` x, grid:0.3,0.4,0.1,1.0, 15 f | `v5.cursor-3d-dive-click` |
| `throw` | `v7.cursor-glide` progress, grid:0.5,0.0,0.1,1.0, 25 f | `v7.cursor-glide` |
| `glideClick` | `v5.cursor-glide-click` y, grid:0.9,0.0,0.2,1.0, 20 f | `v5.cursor-glide-click` |
| `windUp` | `v5.cursor-swoop` x, grid:0.3,0.4,0.1,1.0, 20 f | `v5.cursor-swoop` |
| `constant` | - | `v8.cursor-glide` |
| `flyOut` | - | `v7.cursor-fly-out` |

### CursorState · ui

The pointer changes form or marks a click: it glows up and swaps for a 3D pointer that turns frontal, sharpens and dims to rest, swaps in one picture hidden in a fast move, or leaves a small expanding ring.

API: `{tone?: Tone; variant?: string}`

Params: `ringGrow` (px1080) ring growth

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `glowMorph` (default) | `v7.cursor-glow-morph-3d` opacity, grid:0.3,0.0,0.8,1.2, 43 f | `v7.cursor-glow-morph-3d` |
| `hiddenSwap` | - | `v7.cursor-swap-in-blur` |
| `pressRipple` | - | `v8.cursor-tap-ripple` |

### DragDrop · ui

Items are dragged and dropped: a file is carried along a path and shrinks into its target, outline copies travel as one grid, a selected block is dragged out accelerating, a dropped strip docks and splits into clips, or clips butt together and gaps open.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `carryIn` (default) | `v7.cursor-drag-file-in` y, grid:0.2,0.8,0.6,1.0, 28 f | `v7.cursor-drag-file-in` |
| `ghostTrail` | `v7.ui-ghost-drag-to-timeline` x, grid:0.6,0.0,0.2,1.0, 22 f | `v7.ui-ghost-drag-to-timeline` |
| `dragOut` | `v7.ui-drag-group-out` x, grid:0.7,0.0,0.9,0.6, 30 f | `v7.ui-drag-group-out` |
| `stripDock` | `v7.ui-clip-strip-slide-in` x, grid:0.2,0.8,0.6,1.0, 19 f | `v7.ui-clip-strip-slide-in` |
| `rippleEdit` | - | `v7.ui-clip-ripple-edit` |

### SelectionHighlight · ui

A selection or hover state moves onto an element: a highlight pill fades in and widens, a card lifts with an outline and shadow, tiles light row by row, a slot holds while rows pass through it, the selection jumps to a new chip, or a selector frame hops between items.

API: `{items: React.ReactNode[]; tone?: Tone; variant?: string}`

Params: `liftScale` (factor) scale of the lifted element

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `fadeWiden` (default) | - | `v7.ui-hover-highlight` |
| `lift` | `v7.ui-hover-lift` scale, grid:0.4,0.0,0.4,1.2, 20 f | `v7.ui-hover-lift` |
| `rowSweep` | - | `v7.ui-tile-select-sweep` |
| `holdSlot` | - | `v8.ui-sticky-highlight-slot` |
| `jump` | - | `v8.ui-chip-select-swap` |
| `hop` | `v5.ui-selector-frame-hop` x, bezier:v7.cursor-drag-file-in.i2, 23 f | `v5.ui-selector-frame-hop` |

## footage-frames (3 primitives, 19 variants)

### FootageCard · footage

A card carrying footage moves as one unit: it zooms from a small card to fill the frame, flies in on a diagonal and snaps into place, shrinks to become a node, grows from a speck in depth, or zooms in from scattered specks into a row.

API: `{footage?: string; tone?: Tone; variant?: string} (a FootageSlot inside)`

Params: `toScale` (factor) scale reached; `stagger` (frames) frames between successive units

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `zoomToFull` (default) | `v8.footage-card-zoom-to-full` scale, grid:0.2,0.8,0.6,1.0, 26 f | `v8.footage-card-zoom-to-full` |
| `zoomFill` | `v8.trans-card-zoom-fill` scale, grid:0.6,0.0,0.2,1.0, 21 f | `v8.trans-card-zoom-fill` |
| `zoomToCentre` | `v8.trans-card-zoom-to-center` scale, grid:0.9,0.0,0.2,1.0, 48 f | `v8.trans-card-zoom-to-center` |
| `diagonalSnap` | `v5.footage-card-fly-in` x, bezier:v7.icon-tile-scale-down-in, 17 f | `v5.footage-card-fly-in` |
| `shrinkToNode` | `v5.trans-morph-tree` scale, grid:0.9,0.2,0.1,1.2, 18 f | `v5.trans-morph-tree` |
| `depthGrow` | `v5.card-depth-flyin` scale, grid:0.0,0.6,0.9,1.1, 10 f | `v5.card-depth-flyin` |
| `scatterZoom` | - | `v6.card-scatter-zoom-in` |

### FootageFrame · footage

Footage carried by a fixed window or mask: the footage cuts inside it while the layout holds (single cuts or a quick burst), a curved-screen mask whose edges can wobble as it whips out, footage fading in from the card fill, or a scrim that dims the footage under text.

API: `{footage?: string; tone?: Tone; variant?: string} (a FootageSlot inside)`

Params: `dimTo` (factor) footage luma under the scrim

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `innerCuts` (default) | - | `v7.footage-viewer-playback` |
| `cutBurst` | - | `v7.footage-viewer-cut-burst` |
| `singleCut` | - | `v5.footage-window-swap` |
| `curvedHold` | - | `v5.footage-curved-panel` |
| `wobbleExit` | - | `v5.fx-liquid-edge-wobble` |
| `contentFade` | `v8.footage-card-content-fade-in` opacity, grid:0.5,0.4,0.7,1.1, 18 f | `v8.footage-card-content-fade-in` |
| `dimIn` | `v5.fx-footage-dim` opacity, grid:0.4,0.0,0.4,1.2, 16 f | `v5.fx-footage-dim` |
| `heldDim` | - | `v7.text-static-headline-dim-footage` |

### MaskReveal · footage

Footage (or an edited version of it) is revealed inside a card by a moving mask: a glowing dot-matrix ring expands from a point, a light scan band sweeps across, a seam sweeps open with the content riding its edge, or a strip opens from a thin line.

API: `{footage?: string; tone?: Tone; variant?: string} (a FootageSlot inside)`

Params: `bandWidth` (%W) width of the scan band

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `dotRing` (default) | `v7.mask-dot-ring-reveal` progress, grid:0.5,0.4,0.7,1.1, 38 f | `v7.mask-dot-ring-reveal` |
| `scanBand` | `v7.mask-scan-band-reveal` progress, grid:0.7,0.0,0.2,1.1, 15 f | `v7.mask-scan-band-reveal` |
| `seamOpen` | `v5.card-seam-reveal` width, grid:0.7,0.0,0.2,1.1, 22 f | `v5.card-seam-reveal` |
| `stripOpen` | - | `v5.footage-strip-open` |

## footage (1 primitives, 1 variants)

### FootageSlot · footage

The footage carrier: fills the card, window or mask around it with the user footage, or with a gray plate when none is given. Motion belongs to the frame that holds it.

API: `{footage?: string; fit?: 'cover' | 'contain'}`

Params: `fit` (cover|contain) how the footage fills the slot

| variant | curve (property, ease, frames) | techniques |
|---|---|---|
| `plate` (default) | - | - |

