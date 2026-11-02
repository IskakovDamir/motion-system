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
