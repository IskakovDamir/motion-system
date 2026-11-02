// Drawing sizes the measurements do not give. The timelines measure where these light elements go,
// how fast and how bright, but not every element's own size or line weight; these are the drawing
// defaults the components fall back to (each component takes them as optional props, so an edit can
// set its own). None of them is a measured number, and each is listed in the build report.

export const DRAW = {
	/** sparkle at the head of a flare streak: tip-to-tip width, % of frame width */
	sparkleWidth: 2.4,
	/** thickness of a flare streak, px at 1080p */
	streakPx: 3,
	/** a moving streak trails its head by where the head was this many frames earlier */
	trailFrames: 1,
	/** anamorphic streak: thickness, px at 1080p, and the core of its point flare: radius, px at 1080p */
	flareBandPx: 8,
	flareCorePx: 90,
	/** square tiles in a parked pixel-sweep cluster */
	clusterCount: 10,
	/** outline weight of glowing tiles and echo rings, px at 1080p */
	linePx: 3,
	/** corner radius of an echo ring, as a share of its size */
	ringCorner: 0.22,
	/** soft shockwave ring: half thickness, px at 1080p, and its peak opacity */
	shockPx: 26,
	shockAlpha: 0.55,
	/** angular shard: size before it grows, px at 1080p */
	shardPx: 110,
	/** each square of the converging pixel pair, px at 1080p */
	pairPx: 22,
	/** glow radius of a halo whose extent is not measured, px at 1080p (the one measured halo,
	 * v7.fx-clip-glow-pulse, reaches 12 px of a 918-high picture = 14 px) */
	haloPx: 14,
} as const;
