# Build report (step 7)

What each group's builder could not build from the measurements, and why. Everything listed here is
left out of the spec rather than guessed (BUILD.md); MOTION_SPEC.md section 9 has the analysis-side open
questions.

## ui-feed (6 primitives, 39 variants, 20 curves)

- Motion blur on blurred moves (blurSlide, popStagger, whipUp, overshootRise, liftDrop, the thread flick):
  no blur amount is measured, only "blur along the path".
- turning: the 8-spoke spinner does not rotate; its rate is UNCERTAIN (aliased by the capture cadence).
- constantSpin: the arc shrinking 134 -> 112 degrees during the fade-out is not built.
- tonePulse: one 42 f pulse is measured; pulses repeat back to back because the gap is not measured.
- dotCycle: v3 only names "dot-cluster frames"; it borrows v4's measured 10-pattern turn (patterns 1-4
  measured, 5-10 continue the rule).
- quickFade: the reply's 3 f word pops are a text reveal (WordPop), not built inside the feed item.
- makeRoomRise / jumpBottom: the 2-frame first step (-16.6 then -34.1 px) is not built.
- eased StepScroll: the last double-row flick (84 px/f, blurred, not fitted) is not built.
- slowBack: 25 f in the middle and the stop are hidden by blur; outFirm over 127 f is fitted to the
  measured speeds.
- speedRamp: the landing glide and the speed-up into the punch-in are not built.
- riseLevel: the rise through the bottom edge (f1176-f1192) has no positions; motion starts at f1192.
- overshootRise: the 2.4 px settle wobble is not built; the measured token overshoots 1.4 % H against the
  measured 2.0 % H peak.
- smearOut: the mark's thinning and the label's smear into bars have no px values.
- trackFootage: x follows +0.8 % W as measured, though the rows flag it UNCERTAIN.

## icons (5 primitives, 40 variants, 30 curves)

- Not measured, left out: the glow of glowGrow and glowSettle, the dot blur of blurOvershoot, motion blur
  in dart, arcIn and burstRing; sliverGrow's sliver shape (two readings disagree: 8x25 vs 6x10 px);
  chainArc's pose stepping on twos; the layout move rideIn rides on; the inner/outer track alternation of
  ellipseOrbit; burstRing's inner radius for new elements.
- Left out because they read as faces: squashPulse's eye swaps; glyphSwap swaps bar, dash, ring and dot
  instead of the reference glyphs.
- Closest-shape ease tokens where no curve was fitted: glowGrow, cellByCell (4 f, the middle of 3-5 f),
  spinSpring's scale, squashPulse, dropBounce's swing, curvedStagger's drift, chainArc's sink.
- Borrowed from a sibling in the same shot: ringPairs' ellipse, slideHoldReturn and glyphSwap bar size
  (v1 mark), openToPills' bar gap (one bar width).
- chainArc: followers keep the measured 160 px spacing; the reference suggests they bunch above the target,
  but no positions are given.
- Compare sheets of variants that hold before their curve (squashShut 7 f, openFromDash and openToPills 5 f,
  curvedStagger 5 f, slideHoldReturn 28 f) run early by the hold; their curve panels match.

## light-fx (6 primitives, 30 variants, 14 curves)

- Not measured, left out: the iris's soft edge; the halo glow around the inverting ring; ringBloom's cross
  glare and focus pull; bevel and glow on the split stars; depth-field sparkle halos and the rise with the
  tilt; bloomCover's spill past the panel border; fillGlow's top-bar glow; layerFlash's UI glow; the second
  set of streaks in anamorphic; the halftone texture growth and its stepping on twos; blur on the smear
  squares; the blurred bar at the start of pairConverge.
- Choices: invertRipple brings the incoming scene in under the second ring (the reference never swaps
  pictures); opacityDip assumes a white background (background luma not measured); focusShift darkens the
  new line linearly over the measured 45 f (its own timing is not measured).
- Ease tokens with measured durations but no measured shape: haloPeak, starSplit's wash, echoZoom's twist,
  shardSpray, parkSweep's dim, fillGlow's fall, anamorphic's rise, smearSweep's rise.
- tileRing and parkSweep take their 20-40 px tile size from the pixel-sweep row; the burst tiles look
  larger in the reference. Unmeasured drawing sizes are defaults in light-fx/draw.ts, overridable by props.
- haloPeak is close to invisible: the measured lift is only +20.7 luma.
- Compare sheets of delayed variants run late by the measured delay (slowBloom 22 f, twoStage 28 f,
  starSplit 5 f, streakSweep 3 f).

## camera-move (4 primitives, 32 variants, 29 curves)

- Motion blur: only v8 measures a smear length (v8.cam-scroll-exit-up: 24 px at 17 px/f, shutter 1.41).
  That one shutter drives the speed blur of every variant whose rows note blur or whose reference frames
  show it (v5-v8). Delete `shutter` from a variant to drop it.
- Scale or zoom centres not measured, frame centre used: reframeOut (y), hoverUp (x), punchBreak, blurLow,
  oversizeLanding (y; x -16.5 % W derived from scale and right-edge travel), punchIn (prop `focus`).
- tiltTwoPhase: the leaving headline's squash to x0.74 is a per-element 3D effect with no angle measured.
- whipReframe: where the hidden jump lands is not measured (the new framing starts where the old one is);
  the ease-in has only two end points (inAccelerate).
- pushIntoCut: the bulge warp of the box outline is not built; the centre's drift in the last 7 f dropped.
- blurLow: the x0.94 start scale is UNCERTAIN in the row; kept with the row's ease over 11 f.
- ghostCarry: the faded footage sliver inside the band has no measured fade, left out.
- SteppedZoom pullBack: frames hold between steps; the slow drift between them is not drawn.

## text-motion (6 primitives, 37 variants, 32 curves)

- Blur size not measured, left out: BlurIn inPlace, letterSweep, focusRoll (only a sharpness index),
  defocusLines' defocus, and motion blur in overshoot, typeAlong, edgeSpring, glyphConverge, allEdges and
  dropBounce. Motion blur is drawn only where a streak length and a speed were both measured
  (oppositeEdges, converge, whipIn, springUp).
- WarpFlyIn: liquid's warp amplitude is UNCERTAIN in the timeline (only the fly-in and rise are built);
  rubbery's uneven per-letter squeeze is left out (the overall x2.04 -> 1 stretch is built); blobMorph's
  in-between letter shapes are not drawn, its lens height is set to the cap height; chromeSmear's chrome
  texture, bevel and sparkles (paths measured, sizes not) and the serif line's own 0.92 -> 0.88 contraction
  are left out; there is no serif family, so that line uses display 400.
- Left out: oppositeEdges' glow halo, trackingSettle's white flash on the newest letter, typeRise's
  outline draw-on, the perspective tapers of the v5 headlines (flat cap height used), cascade's leftward
  slide (easing not measured).
- Ease tokens fitted to the rows' samples where no curve exists (named in the spec comments); glyphConverge
  (timings only) uses outFirm; quickFade is linear over 4 f from two samples.
- Staggers are means of measured values: wordRise 20 f (10-30 f, voice-led), cascade 9 f, defocusLines 9 f,
  whipIn 5 f, typeRise 0.65 f per character.

## three (7 primitives, 27 variants, 20 curves)

- Three.js (@remotion/three) for shapes made in code (folded flyers, rings, tunnel walls); CSS 3D and
  projective transforms for layers that carry React content and for the globe, whose tiles stay
  FootageSlots.
- Borrowed: the only measured focal length (v8 card turn, 2618 px = 161.4 % W) is the perspective for v5
  and v6 too; the v8 screen-layer yaw (UNCERTAIN in the rows) takes that card's 26.5 degrees.
- Derived: OrbitRig ring normals and phase fitted to the measured plane angles and ellipse ratios; fanOut's
  halo blur and darkness solved from its two measured points; the tunnel's dolly speed from the 2.3 % W/f
  edge flow and its vanishing point from the one tracked item.
- Not measured, left out: every blur (swingIn, halfTurn, Camera3D depth-of-field and zoom blur,
  shrinkIntoStack, pushFlatten); swingPush's tilt, orbitPush's orbit angle, the v6 camera elevation,
  dollyReframe's dashboard growth; lightUp's sheen; the globe's meridians and halftone; the tunnel's wall
  texture; DepthFlyer's trails and the crossing cranes.
- Values without a fit, not built: explode's push-in before the turn, slamOn's zoom 609 -> 668 -> 485 px and
  4/5/3 f jitter, layerSink's 2-picture panel slide, pushFlatten's fading shadow; pushBack's dip to 0.9875
  (the token has no overshoot); mirrorPair's 0.65 degree dip and hold drift.
- Weak sources: the near flyer takes the top flyer's scale (its template was lost); dollyParallax's nearer
  layers take the second layer's values; collapse's re-fan is 25 degrees, the middle of 22-28.

## cards (4 primitives, 28 variants, 25 curves)

- Corner radius and stroke: no row of the 28 techniques measures them; cards don't impose them.
- No blur amount measured, no blur: longThrow (a "12 % wider" pill without px), dropSettle's first-picture
  header blur, settle's blurred first pictures, hugeShrink's zoom blur, blurShrink's blur at the cut.
- Shutter borrowed within the camera-blur decision: smearRise and streakDrop use v7.ui-window-drop-in's
  1.25 f from the same video; blurSlide (v6) uses it across videos. hardLand (1.32 f) and dropDecelerate
  measure their own.
- trailSlide: count and spacing of the chevron ghosts not measured; built as a smear over the measured
  first 5 f. streakDrop: the arrow's grey-to-black change has no values.
- riseSettle: the rise while shrinking has no amount or anchor (shrinks about its centre); the 8 and 12 f
  card stagger and card 3's drop need several children and are not built.
- riseBuild: the plus-disc fade (248 -> 239) and the glyph steps are not built.
- Left out: dropDecelerate's 0.73 -> 1 opacity (a by-product of the blur fit), onePicture's faint first
  picture, shrinkCut's sub-pixel precursor, quickSettle's x1.25-1.30 hold before f376.
- Approximations: fadeRise's rise shares the fade's curve; growIn staggers 2 f (S03), not S06's 1-3 f;
  shrinkCut's measured curve has no pause at 87 %, so the reference's last picture (opacity 0.13) differs.

## text-reveal (6 primitives, 29 variants, 9 curves)

- Typewriter: steadyCaret's caret size not measured (the font's own bar glyph); jittered's per-gap list not
  measured (seeded jitter inside the measured 2-5 f around the 2.32 f mean, 8 f pause at 21 f);
  letterFade runs the first letter's curve for every letter (later letters arrive fainter than the
  reference), S20/S27 speed ramps and the 21 f stall not built; fadeTrail's period holding mid grey not
  built; stretchFade's 14 f stretch uses outFirm (not fitted), its 0.19 first level derived from luma
  215 vs 207 against an estimated rest of about 250; acceleratingDots' capsule clipping and exit
  un-typing not built (pill not measured); leadingEdge's pan blur and later zoom-out not built.
- WordPop: lineSteps' cap 1.35 % H is the middle of the uncertain 1.2-1.5; overprinted lines, rapid's row
  highlight, ghostSnap's pill fade-in and first-token blur not built.
- Scramble: placeholder glyph shapes, their hold time and the order are not measured (seeded order).
- LetterPopBuild: echo trail, slide blur and stem streaks not built; slide and split distances are the
  reference's pixels in cap units; the dot drop applies to i only; tighten's loose start spacing not
  quantified.
- SoftFrontReveal: arrival blur, line cascades and the trailing ellipsis not built; featherFront's ramp is
  linear (not fitted); fadeSlide's slide uses the .i2 instance's 2.48 % W; feathers of 2.3 and 2.9 line
  widths are derived from half-ink times.
- ShimmerSweep: darkBand and once borrow the looping band's 5.2 % W; looping assumes a symmetric pass;
  slantedBand's .i2 card instance and .i3 growth out of the pill are not built.
