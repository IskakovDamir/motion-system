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
