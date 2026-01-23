// src/components/dataset_detail/DatasetDetail.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { DatasetDetail as DatasetDetailType } from "../MockData";

import DatasetHeader from "./DatasetHeader";
import PopulationSection from "./PopulationSection";
import DataSourcesSection from "./DataSourcesSection";
import CGMDataSection from "./CGMDataSection";
import LegendModal from "./LegendModal";
import DemographicsSection from "./DemographicsSection";

import "./DatasetDetail.css";

type Props = {
  dataset?: DatasetDetailType; // allow passing real data later
  onBack?: () => void | Promise<void>;
};

type CardInfo = {
  title: string;
  metadata: string;
  description: string;
  types: string[];
  sources: string[];
};

type TirMap = Record<
  string,
  {
    target?: number;
    high?: number;
    very_high?: number;
    low?: number;
    very_low?: number;
  }
>;

type LoadState =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: DatasetDetailType; error: null }
  | { status: "error"; data: null; error: Error };

function baseUrlJoin(relativePath: string) {
  const base = (import.meta as any).env?.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedRel = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
  return `${normalizedBase}${normalizedRel}`;
}

async function fetchJsonStrict<T>(relativePath: string, signal: AbortSignal): Promise<T> {
  const url = baseUrlJoin(relativePath);
  const res = await fetch(url, { signal });

  const text = await res.text();
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);

  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.slice(0, 80).replace(/\s+/g, " ");
    throw new Error(`Expected JSON from ${url}, got: "${preview}..."`);
  }
}

function parseParticipants(metadata: string): number | null {
  const m = metadata.match(/(\d+)\s+participants/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function mapSourceLetter(letter: string): { icon: string; name: string; detail: string } {
  const L = letter.toUpperCase();
  const nameByLetter: Record<string, string> = {
    G: "CGM",
    I: "Insulin",
    A: "Activity",
    S: "Self report",
    Q: "Questionnaire",
    M: "Meals",
  };

  return {
    icon: L,
    name: nameByLetter[L] ?? "Source",
    detail: "TBD",
  };
}

function buildDetailFromStatic(card: CardInfo, tir?: TirMap[string]): DatasetDetailType {
  const participantsTotal = parseParticipants(card.metadata) ?? 0;

  const types = Array.isArray(card.types) ? card.types : [];
  const groups = types.length ? types : ["All"];

  const segments = [
    { key: "VeryLow", value: tir?.very_low ?? 0 },
    { key: "Low", value: tir?.low ?? 0 },
    { key: "Target", value: tir?.target ?? 0 },
    { key: "High", value: tir?.high ?? 0 },
    { key: "VeryHigh", value: tir?.very_high ?? 0 },
  ];

  return {
    title: card.title,
    duration: "TBD",
    dateRange: "",
    fullDescription: card.description || "Description TBD",

    participantsTotal,
    populationGroups: groups.map((t) => ({
      type: t,
      label: t,
      count: 0,
    })) as any,

    demographics: { gender: "TBD", ethnicities: "TBD", ageRange: "TBD" },

    dataSources: (card.sources ?? []).map(mapSourceLetter),

    cgmSummary: { device: "TBD", totalDays: 0, glucoseSamples: 0, avgDaysPerParticipant: 0 },

    timeInRanges: groups.map((g) => ({
      group: g,
      total: 100,
      segments,
    })),
  } as DatasetDetailType;
}

function isCardInfoArray(x: unknown): x is CardInfo[] {
  return Array.isArray(x);
}

function isTirMap(x: unknown): x is TirMap {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

export default function DatasetDetail({ dataset, onBack }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [legendOpen, setLegendOpen] = useState(false);
  const [load, setLoad] = useState<LoadState>({ status: "loading", data: null, error: null });

  useEffect(() => {
    if (dataset) return;

    if (!id) {
      setLoad({ status: "error", data: null, error: new Error("Missing dataset id in URL") });
      return;
    }

    const ac = new AbortController();
    setLoad({ status: "loading", data: null, error: null });

    (async () => {
      try {
        // Always load the main card list
        const cardsA = await fetchJsonStrict<CardInfo[]>("static_data/dataset_card_info.json", ac.signal);

        // visual_bar_info.json could be either:
        // - an ARRAY of cards (like your teammate list)
        // - an OBJECT map of TIR percentages (like the big map you pasted earlier)
        const vb = await fetchJsonStrict<unknown>("static_data/visual_bar_info.json", ac.signal);

        const extraCards = isCardInfoArray(vb) ? vb : [];
        const tirMap: TirMap | null = isTirMap(vb) ? (vb as TirMap) : null;

        // Merge cards from both lists
        const merged = new Map<string, CardInfo>();
        for (const c of [...cardsA, ...extraCards]) merged.set(c.title, c);

        const card = merged.get(id);
        if (!card) throw new Error(`Dataset not found in static card lists: ${id}`);

        const tirForThis = tirMap?.[card.title]; // may be undefined (ok)

        const detail = buildDetailFromStatic(card, tirForThis);
        setLoad({ status: "success", data: detail, error: null });
      } catch (err) {
        if (ac.signal.aborted) return;
        setLoad({
          status: "error",
          data: null,
          error: err instanceof Error ? err : new Error("Unknown error"),
        });
      }
    })();

    return () => ac.abort();
  }, [dataset, id]);

  const handleBack = async () => {
    if (onBack) {
      await onBack();
      return;
    }
    navigate(-1);
  };

  // If dataset prop exists, render immediately
  if (dataset) {
    return (
      <div className="detail-page">
        <DatasetHeader dataset={dataset} onBack={handleBack} onLegendInfo={() => setLegendOpen(true)} />

        <main className="detail-main">
          <div className="detail-grid">
            <div className="detail-left">
              <PopulationSection total={dataset.participantsTotal} groups={dataset.populationGroups} />
              <DemographicsSection demographics={dataset.demographics} />
              <DataSourcesSection sources={dataset.dataSources} />
            </div>

            <div className="detail-right">
              <CGMDataSection dataset={dataset} />
            </div>
          </div>
        </main>

        <LegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
      </div>
    );
  }

  if (load.status === "loading") {
    return (
      <div className="detail-page">
        <main className="detail-main">
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 22px", color: "var(--secondary-grey)" }}>
            Loading dataset…
          </div>
        </main>
      </div>
    );
  }

  if (load.status === "error") {
    return (
      <div className="detail-page">
        <main className="detail-main">
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 22px", color: "var(--secondary-grey)" }}>
            <div style={{ marginBottom: 12 }}>
              Couldn’t load dataset details for <b>{id}</b>.
            </div>
            <div style={{ marginBottom: 16 }}>{load.error.message}</div>
            <button
              type="button"
              onClick={handleBack}
              style={{
                border: "1px solid var(--secondary-light-grey)",
                background: "var(--white-background)",
                borderRadius: 12,
                padding: "10px 14px",
                cursor: "pointer",
                color: "var(--secondary-grey)",
                fontWeight: 600,
              }}
            >
              Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  const resolvedDataset = load.data;

  return (
    <div className="detail-page">
      <DatasetHeader dataset={resolvedDataset} onBack={handleBack} onLegendInfo={() => setLegendOpen(true)} />

      <main className="detail-main">
        <div className="detail-grid">
          <div className="detail-left">
            <PopulationSection total={resolvedDataset.participantsTotal} groups={resolvedDataset.populationGroups} />
            <DemographicsSection demographics={resolvedDataset.demographics} />
            <DataSourcesSection sources={resolvedDataset.dataSources} />
          </div>

          <div className="detail-right">
            <CGMDataSection dataset={resolvedDataset} />
          </div>
        </div>
      </main>

      <LegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
    </div>
  );
}
