/**
 * Pure scroll-depth math for the route tracker. No DOM access, no imports
 * beyond types — `AnalyticsRouteTracker.tsx` is the only place that reads
 * `window`/`document` and feeds the results in here.
 */

// ---------------------------------------------------------------------------
// SCROLL_MILESTONES
// ---------------------------------------------------------------------------

export const SCROLL_MILESTONES = [25, 50, 75, 90] as const;

export type ScrollMilestone = (typeof SCROLL_MILESTONES)[number];

// ---------------------------------------------------------------------------
// getScrollPercent
// ---------------------------------------------------------------------------

export interface GetScrollPercentInput {
  scrollY: number;
  viewportHeight: number;
  documentHeight: number;
}

/**
 * How far through the page the user has scrolled, as a 0..100 percentage.
 *
 * Guards the divide-by-zero case: when the document is not taller than the
 * viewport there is nothing to scroll through, so this returns `100` rather
 * than `0`/`NaN` — a short page should report its milestones immediately
 * instead of never crossing them. The result is always clamped to `0..100`
 * to absorb overscroll/bounce (`scrollY` briefly negative or past the max on
 * some browsers).
 */
export function getScrollPercent({
  scrollY,
  viewportHeight,
  documentHeight,
}: GetScrollPercentInput): number {
  const scrollableHeight = documentHeight - viewportHeight;
  if (scrollableHeight <= 0) return 100;

  const percent = (scrollY / scrollableHeight) * 100;
  return Math.max(0, Math.min(100, percent));
}

// ---------------------------------------------------------------------------
// nextMilestones
// ---------------------------------------------------------------------------

/**
 * The subset of `SCROLL_MILESTONES` that `percent` has now reached but
 * `alreadySent` does not yet contain, in ascending order. Callers own
 * `alreadySent` (typically a per-route-visit `Set`) — this function never
 * mutates it.
 */
export function nextMilestones(
  percent: number,
  alreadySent: ReadonlySet<ScrollMilestone>
): ScrollMilestone[] {
  return SCROLL_MILESTONES.filter(
    (milestone) => percent >= milestone && !alreadySent.has(milestone)
  );
}
