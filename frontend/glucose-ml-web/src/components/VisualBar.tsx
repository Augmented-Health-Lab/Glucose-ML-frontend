// acknowledge chatgpt use

import { useMemo } from "react";

type RangeKey = "very_low" | "low" | "target" | "high" | "very_high";
type VisualBarInfo = Record<string, Partial<Record<RangeKey, number>>>;

const ORDER: RangeKey[] = ["very_low", "low", "target", "high", "very_high"];

const LABEL: Record<RangeKey, string> = {
  very_low: "Very low (<54)",
  low: "Low [54–70)",
  target: "Target [70–180)",
  high: "High [180–250)",
  very_high: "Very high (>250)",
};

// #F276AD #EFA1C8 #91EFDE #CAB0EE #B489F0
const COLOR: Record<RangeKey, string> = {
  very_low: "#F276AD",
  low: "#EFA1C8",
  target: "#91EFDE",
  high: "#CAB0EE",
  very_high: "#B489F0",
};

function clamp0(x: number) {
  return Number.isFinite(x) && x > 0 ? x : 0;
}

function fmt1(x: number) {
  return `${x.toFixed(1)}%`;
}

export default function VisualBar({
  name,
}: {
  name: string;
  height?: number;
  width?: number;
}) {
  // visual_bar_info.json is not provided in this project anymore.
  // Keep the component as a no-op placeholder so callers won't crash.
  const data: VisualBarInfo | null = null;

  const row = useMemo(() => {
    if (!data) return null;
    const obj = data[name] as Partial<Record<RangeKey, number>> | undefined;
    if (!obj) return null;

    const vals = {
      very_low: clamp0(obj.very_low ?? 0),
      low: clamp0(obj.low ?? 0),
      target: clamp0(obj.target ?? 0),
      high: clamp0(obj.high ?? 0),
      very_high: clamp0(obj.very_high ?? 0),
    };

    const sum =
      vals.very_low + vals.low + vals.target + vals.high + vals.very_high;
    if (sum <= 0) return null;

    // normalize to 100
    const scale = 100 / sum;

    return {
      very_low: vals.very_low * scale,
      low: vals.low * scale,
      target: vals.target * scale,
      high: vals.high * scale,
      very_high: vals.very_high * scale,
    };
  }, [data, name]);

  if (!row) return <span style={{ opacity: 0.7 }}>No visual bar</span>;

  return (
    <div className="visual-bar" aria-label={`Visual bar for ${name}`}>
      {/* column: rendering from top to bottom, needs to be reversed (top=very_high ... bottom=very_low) */}
      {[...ORDER].reverse().map((k) => {
        const hPct = (row as any)[k] as number;
        if (hPct <= 0) return null;

        return (
          <div
            key={k}
            title={`${LABEL[k]}: ${fmt1(hPct)}`}
            style={{
              height: `${hPct}%`,
              width: "100%",
              background: COLOR[k],
            }}
          />
        );
      })}
    </div>
  );
}
