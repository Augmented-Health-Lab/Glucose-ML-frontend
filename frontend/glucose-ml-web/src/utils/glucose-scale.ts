import type { GlucoseDistributionCounts } from "../types/dataset";

export type { GlucoseDistributionCounts };

export type DistributionBoundaryTick = {
  value: 55 | 70 | 180 | 250;
  label: string;
  leftPct: number;
  priority: number;
};

export type LaidOutDistributionBoundaryTick = DistributionBoundaryTick & {
  labelOffsetPx: number;
};

const LABEL_GAP_PX = 4;

export function getDistributionBoundaryTicks(
  distribution: GlucoseDistributionCounts
): DistributionBoundaryTick[] {
  if (distribution.total <= 0) {
    return [];
  }

  const boundaries = [
    {
      value: 55,
      cumulative: distribution.very_low,
      priority: 2,
    },
    {
      value: 70,
      cumulative: distribution.very_low + distribution.low,
      priority: 3,
    },
    {
      value: 180,
      cumulative:
        distribution.very_low + distribution.low + distribution.target,
      priority: 4,
    },
    {
      value: 250,
      cumulative:
        distribution.very_low +
        distribution.low +
        distribution.target +
        distribution.high,
      priority: 1,
    },
  ] as const;

  return boundaries.map(({ value, cumulative, priority }) => ({
    value,
    label: String(value),
    leftPct: (cumulative / distribution.total) * 100,
    priority,
  }));
}

export function layoutDistributionBoundaryTicks(
  ticks: DistributionBoundaryTick[],
  chartWidth: number,
  measureLabel: (label: string) => number
): LaidOutDistributionBoundaryTick[] {
  if (chartWidth <= 0 || ticks.length === 0) {
    return [];
  }

  const selected: DistributionBoundaryTick[] = [];
  const prioritized = [...ticks].sort(
    (left, right) => right.priority - left.priority
  );

  for (const candidate of prioritized) {
    const tentative = layoutSelectedTicks(
      [...selected, candidate],
      chartWidth,
      measureLabel
    );
    if (!hasLabelCollision(tentative)) {
      selected.push(candidate);
    }
  }

  return layoutSelectedTicks(selected, chartWidth, measureLabel).map(
    ({ value, label, leftPct, priority, labelOffsetPx }) => ({
      value,
      label,
      leftPct,
      priority,
      labelOffsetPx,
    })
  );
}

function layoutSelectedTicks(
  ticks: DistributionBoundaryTick[],
  chartWidth: number,
  measureLabel: (label: string) => number
) {
  const sorted = [...ticks].sort((left, right) => left.leftPct - right.leftPct);
  const rightmost = sorted.at(-1);

  return sorted.map((tick) => {
    const label =
      tick === rightmost ? `${tick.label} mg/dL` : tick.label;
    const labelWidth = measureLabel(label);
    const tickCenter = (tick.leftPct / 100) * chartWidth;
    const maxLeft = Math.max(chartWidth - labelWidth, 0);
    const labelLeft = Math.min(
      Math.max(tickCenter - labelWidth / 2, 0),
      maxLeft
    );
    const labelOffsetPx = roundToTwo(
      labelLeft + labelWidth / 2 - tickCenter
    );

    return {
      ...tick,
      label,
      labelOffsetPx,
      left: labelLeft,
      right: labelLeft + labelWidth,
    };
  });
}

function hasLabelCollision(
  ticks: Array<LaidOutDistributionBoundaryTick & { left: number; right: number }>
) {
  return ticks.some((tick, index) => {
    const next = ticks[index + 1];
    return next ? next.left < tick.right + LABEL_GAP_PX : false;
  });
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}
