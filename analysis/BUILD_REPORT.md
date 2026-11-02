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

## camera-zoom (3 primitives, 25 variants, 21 curves)

- Pivots: measured where the rows give them; worked out from measured start and end positions for
  blurSettle (6.3, 71.8 %), reframe (-51.1, 100.0 %) and speedRamp's y (50.5 % H); frame centre where not
  measured: linearDrift and flatten (both axes), snap and speedRamp (x), whipReveal, twoPulses and
  centreTail (y).
- easeBack has no scale: only the card's right edge is measured (98.3 -> 75.4 % W), no scale or pivot, so it
  moves sideways only; the reference visibly shrinks the card.
- closeUpOut: the opacity dip is named and visible but its depth and timing are not measured.
- flatten: the 5.4 -> 0 degree tilt has no axis or direction measured; whipReveal's yaw is not built.
- linearDrift: v5's direction-changing drift has no single rate; it uses v6's -0.042 % per frame over 63 f.
- reframe starts at x1.15; the push-in before it in S11 is a separate move, not chained.
- Ease tokens chosen where no curve is stored: twoPulses' second pulse (outSoft, rmse 0.034 to the stored
  fit), whipReveal's scale (inOutWhip, rmse 0.054, starts about 2 f late), centreTail's tail (outFirm,
  matched to the hand-off speed).

## ui-controls (4 primitives, 26 variants, 19 curves)

- Ease tokens fitted to the rows' values where no curve exists (rmse in the spec comments): press and
  release of glowRelease, longHold and dropPress; seedPop's height; widenOvershoot's content scale and
  second-line height; edgeStretch's fade; dotToPill's stretch; chainOut's squash; springBack's label
  brightening; unfold's open and close. Motion blur uses each video's measured shutter (v7 1.25 f, v8 1.41 f).
- Left out: glowRelease's glow size; held's S11 echo trail and S20 spring-back (other moments); dropPress's
  chip shrink and folder swap have windows but no ease (linear, hard swap); v7's posing on twos (would
  change the measured progress); speckStretch's height; dotToPill's width before the circle finishes and
  its 6 f trail; pillToLine's irregular per-letter steps (2.4 f average used); unfold's blur and its
  close's fade (v5 has no measured shutter); fastForward's knob smear (v6 has no shutter); perPictureSwap's
  S17 readings.
- cornerFollow's handle fly-out and exit have two poses each (linear); chainOut's swell uses outFirm (two
  points); scaleIn's blur is weaker than the reference's smear, as the measured v7 shutter gives.

## transition-morph (5 primitives, 28 variants, 27 curves)

- No blur amount measured: oversizeLanding's radial zoom blur, the growing motion blur of dissolve, spin
  and clusterSnap, tunnelExit's halo, crossfadeSlide's vertical blur (radialStreaks' streaks are measured
  and built).
- spin: the barrel bend is not quantified; the cursor's x3.42 depth plane cannot apply to a flat incoming
  scene, so the whole scene uses the background's x2.58.
- radialStreaks: the title's fill fading to an outline is text-specific, not built.
- oversizeLanding: the near-linear 1.0 -> 0.97 landing tail is dropped so the incoming scene ends at size.
- dissolve: the incoming tunnel's own forward motion is not measured.
- meltImplode: wave displacement and glow have no amplitude; its 5 f rotation is UNCERTAIN (linear).
- sphereWrap: globe shading not measured; the curl's pace is linear with scale corrected to hold the
  measured silhouette curve.
- blobMerge: spheres two and three arrive before f1462 without a card-relative path (starts with all three
  in); the merge into one blob is linear.
- ringFold: corner cells (2-3 f) and edge cells (about 10 f) are one 9 f fold with inOutWhip.
- Duration-only, linear: tunnelExit's wash (early ease-out), risingZoom's cell fade and 7 f crossfade,
  dropThrough's per-picture pops.

## shapes (3 primitives, 27 variants, 7 curves)

- PacketHop: straightCarry's return packet is UNCERTAIN (start bounded at 33-45 f); relay's 3-4 dot burst
  and the hop shrinking with the plane (camera) left out; dwellHop's "about 10-16 f" hop is 13 f with the
  house packet ease (not fitted); dot sizes not measured for dwellHop and pingPong (props); easedHop uses
  S01's 18 px dot only.
- LineDraw: stroke widths and corner radii not measured (props) for roundedTurns, backToFront, rightToLeft
  and echoReveal; roundedTurns' first phase depends on other elements and its ease is chosen
  (inOutGlideOver); closeLoop uses S01's 12 f (linear, rmse 0.035), not S26's 36 f replay; faint first
  pictures, trimThicken's light first dash, growInward's vanishing with the layout, echoReveal's bottom
  growth (no centre), outline R2 (partial reading) and field darkening are not built.
- Backdrop: blob sizes and wander phases not measured (props; blob centres are measurement-box centres);
  dot size and contrast of grids not measured except dotGridDrift's (from pixel area), whose bowed rows and
  edge speeds (UNCERTAIN) are left out; diagonalSplit, clearZone and glowZone have no rows (angle, zone and
  feather are props); travellingGlow's ribbon path, halftone and patch slide not measured; cornerFadeUp is
  linear (ease not measured), reproduces the x2 luma ratio only, and adds a bottom-left patch that the
  frames show but no row measures; ribbon paths, width and pitch are props; beamGrow's grow is linear, its
  cluster size assumed (the beam's waist) and its 27 f swing approximate.

## transition-cut (4 primitives, 25 variants, 20 curves)

- Blur from one shutter per video, from the rows' measured blur / speed pairs: v7 1.22 (median of 10
  pairs), v8 1.55 (4 v8.trans-whip-up pairs; camera-move uses 1.41 from another v8 technique), v5 and v6
  1.25 (median of all 14 pairs, their rows give no size).
- Per-element timing inside one boundary needs per-element layers and is not built: HardCut plain's
  staggered cut-out (headline one frame before the ring), DipToBackground's headline leaving 1 f ahead,
  zoomBuild's second window +3 f.
- HardCut: 5 of 17 measured cuts hold 1-6 empty frames (`emptyFrames` prop, default 0); overlayHold's
  overlay must sit above a TransitionSeries; motionMatch builds only the measured exit tail (-11.9 % H in
  5 f) and its 47.8 % H incoming offset is a lower bound.
- WhipCut: some tokens start slower than the measured first-picture speed (pushRight, riseUp blur less on
  arrival); pushLeft's outgoing half comes from T13 (.i5); blendLeft's 64.2 % W travel is summed from five
  speed readings assumed 3 f apart, its 10 f crossfade is linear; streakLeft renders the multi-exposure as
  speed blur; creepLeft's incoming text reveal, blurReframe's defocus ramp and T05 instance, punchUp's
  pivot x, diagonalZoom's 0.99 scale and recoil, the T25 and T07 instances are not built; canvasDown's
  token peaks near 19 % H/f against a measured 14 % H/f.
- PushSlide: stacked's mask inset and hand-off, dipRise's anticipation (none in its instance),
  easeInDrift's final two-picture jump (replaced by its end speed) are not built; rippleRise splits the
  incoming scene at the measured gutters.

## layout (4 primitives, 20 variants, 19 curves)

- Motions without their own curve: splitShift's line 1 (inOutWhip2 27 f, rmse 0.013) and reflow's lower
  word (inOutWhipOver 20 f, rmse 0.012) fitted to their values; splitMorph, groupSnap, openGap and
  shrinkAside reuse their technique's curve with measured delays; LockupSlide short's letters use the v4
  letter-rise-fade curves 2.1 f apart.
- Motion blur amount measured only for openGap (1.45 f of travel, capped at the measured 44 px); no blur on
  riseTop, shrinkAside, reflow, liftShrink, recenter, centreSlide, splitMorph, whipOut, kickApart.
- Not measured, left out: riseShort's box growth on twos (top edge only); openGap's box widening (word 2's
  edge may move up to about 0.7 % W more than measured) and its decode order (last to first assumed);
  recenter's label-2 tightening (rides at 14.9 % W, not 17.4); splitShift's arrow slide and tone sweep;
  whipOut's final streak; gridSpread's row pitch; LockupSlide tracking outside v2 (-0.015 em).
- whipOut: the arrow uses line 2's 32.2 % W (agrees with its tip and shaft readings within about 30 %);
  words 2-3 use word 1's 15.0 % W.
- CaptionDrift: only S06 caption 3 is built; the right-side mirror, the x1.2 first line and S19's x1.33
  growth (uncertain attachment) are not.

## cursor (4 primitives, 22 variants, 13 curves)

- The pointer is a plain arrow (flat or outline), and for 3D pointers an extruded notched arrowhead.
- Pointer size measured only for v7 S11 (22.3 % H), v7 S31's 3D pointer (15.7 % H) and v5 S14 (about 6 % W);
  other demos pick their own size.
- Rotation: v7 fly-in's turn is UNCERTAIN (none built); v7 fly-out's tumble not measured (the smear is);
  v5 swoop's "40-60 deg" built as 50 with the tilt following the speed.
- v5 3D dive-click: hover and spin before the dive not fitted, the dive is a straight line (two ends).
- v7 glow-morph: outline thickening, the turn to face front, the start blur and the card's 2-picture
  brightening have no amounts. v7 swap-in-blur: the double image is drawn as softness only, derived from
  edge-gradient ratios assuming a 1 px sharp edge.
- Not measured: line widths of rings and outlines (2 px hairline), hover-lift's shadow, the highlight pill's
  end dot and widening origin, the ripple edit's clip splits (f2201-f2218), the selector frame's size at the
  hops (400 px drop-in width used; hop 1 reuses hop 2's ease).
- Straight paths where only ends are measured: flyUp, dive, glideClick, dragOut's drift. glideClick's release
  uses outFirm (8 f, not fitted); the sticky slot's list drift uses 0.3 % H/f, the middle of the range.

## footage-frames (3 primitives, 19 variants, 11 curves)

- FootageCard: zoomToFull's shrinking corner radius is UNCERTAIN (square card, edges soften with speed at
  0.75 of the edge travel, measured 0.6-0.9); zoomFill's corner squaring not measured (radius shrinks with
  progress); zoomToCentre's height not measured; diagonalSnap's rim, glow and radius not measured, its
  shutter (1.0) derived from the 120 px blur at f1832; shrinkToNode has no measured blur; depthGrow's tilt is
  the camera's and its thumbnail height and origin are not measured; scatterZoom's start positions, delays
  and blur are not measured (cards zoom in place, scale = sqrt of the measured coverage, rmse 0.048).
- FootageFrame: wobbleExit's bulge mechanism is UNCERTAIN (outline pushed with footage brightness, about
  3 / 14 px against 5.8 / 17.1 px measured), its lower-edge shape and +2.8 % zoom are not built, it reuses
  diagonalSnap's 1.0 shutter, and it rises 86.6 % H (not the 83.9 % read at the bowed edge's top, which
  would leave the corners in frame); curvedHold uses S21's bow only; dimIn's S30 instance (UNCERTAIN) is not
  built and the dim is a luma gain (overlay or grade is UNCERTAIN).
- MaskReveal: dotRing's dim footage outside the ring, dot clusters, size and glow are not measured (uniform
  soft dots per 12 px cell, card fill covers the outside), its band is taken as symmetric about its peak
  (1.66 x inner radius), the leftover fade is linear over 14 f (UNCERTAIN); scanBand's streak texture and
  sweep 3's earlier phase are not built, its width (12 % W) and glow are derived; stripOpen is square-cornered,
  its 23.3 % H height derived from 16.3 % H over the 0.70 pull-back, and it stops at the frame edge.
