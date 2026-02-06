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
  dataset?: DatasetDetailType;
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


type RangeKey = "very_low" | "low" | "target" | "high" | "very_high";
type TirByType = Record<string, Partial<Record<RangeKey, number>>>;
type TirByDataset = Record<string, TirByType>;

const DIABETES_LABEL_TO_CODE: Record<string, string> = {
  "type 1 diabetes": "T1D",
  "type i diabetes": "T1D",
  t1d: "T1D",

  "type 2 diabetes": "T2D",
  "type ii diabetes": "T2D",
  t2d: "T2D",

  prediabetes: "PreD",
  pred: "PreD",

  "no diabetes": "ND",
  "non-diabetic": "ND",
  nondiabetic: "ND",
  nd: "ND",
};

function normalizeDiabetesTypeLabel(raw: string): string {
  const key = String(raw ?? "").trim().toLowerCase();
  return DIABETES_LABEL_TO_CODE[key] || raw;
}

function clamp0(x: unknown): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * IMPORTANT:
 * - segments are % within a type (sum to 100)
 * - total controls bar HEIGHT in GlucoseRangeChart (so pass participant counts per type here if you want Figma-like different heights)
 */
function toStackedBars(
  tirByType: TirByType,
  totalsByType?: Record<string, number>
): { group: string; total: number; segments: { key: any; value: number }[] }[] {
  const orderKeys: RangeKey[] = ["very_low", "low", "target", "high", "very_high"];

  const preferredGroupOrder = ["ND", "PreD", "T2D", "T1D"]; 
  const groupRank = (g: string) => {
    const idx = preferredGroupOrder.indexOf(g);
    return idx === -1 ? 999 : idx;
  };

  const bars = Object.entries(tirByType).map(([rawGroup, vals]) => {
    const group = normalizeDiabetesTypeLabel(rawGroup);

    const raw = {
      very_low: clamp0(vals.very_low),
      low: clamp0(vals.low),
      target: clamp0(vals.target),
      high: clamp0(vals.high),
      very_high: clamp0(vals.very_high),
    };

    const normalized = {
      VeryLow: raw.very_low,
      Low: raw.low,
      Target: raw.target,
      High: raw.high,
      VeryHigh: raw.very_high,
    };

    const totalFromCounts = totalsByType?.[group];
    const total = Number.isFinite(totalFromCounts as any) && (totalFromCounts as number) > 0 ? (totalFromCounts as number) : 100;

    return {
      group,
      total,
      segments: [
        { key: "VeryLow", value: normalized.VeryLow },
        { key: "Low", value: normalized.Low },
        { key: "Target", value: normalized.Target },
        { key: "High", value: normalized.High },
        { key: "VeryHigh", value: normalized.VeryHigh },
      ],
    };
  });

  bars.sort((a, b) => {
    const ra = groupRank(a.group);
    const rb = groupRank(b.group);
    if (ra !== rb) return ra - rb;
    return a.group.localeCompare(b.group);
  });

  return bars;
}

type Table1DetailData = {
  name: string;
  "year release": string;
  total: number;
  male: number | null;
  female: number | null;
  "age range": string;
  Ethinicities: string;
  "CGM Device": string;
  "Total days of glucose": string;
  "Glucose samples": number;
  "average days per participant": number | null;
  data_source?: Record<string, string>;
  populationGroups?: { type: string; count: number | null }[];
  "Link to dataset"?: string;
};

type HistogramDataItem = {
  name: string;
  data: Array<{
    bin_start: number;
    bin_end: number;
    x: number;
    y: number;
    label: string;
  }>;
};

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

  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);

  const text = await res.text();
  try {
    const cleanedText = text.trim().replace(/^\uFEFF/, "");
    return JSON.parse(cleanedText) as T;
  } catch (e) {
    throw new Error(`Failed to parse JSON from ${url}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function parseParticipants(metadata: string): number | null {
  const m = metadata.match(/(\d+)\s+participants/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

type DataSourceMap = Record<string, string>;

async function loadDataSourceMap(signal: AbortSignal): Promise<DataSourceMap | null> {
  try {
    return await fetchJsonStrict<DataSourceMap>("static_data/data_source_map.json", signal);
  } catch {
    return null;
  }
}

function mapSourceLetter(letter: string, dataSourceMap: DataSourceMap | null, dataSourceDetail?: string) {
  const L = letter.toUpperCase();

  const fallback: Record<string, string> = {
    G: "Glucose",
    I: "Insulin",
    A: "Activity",
    S: "Self report",
    Q: "Questionnaire",
    M: "Meals",
    W: "Wearables",
    C: "Characteristics",
  };

  const fullName = dataSourceMap?.[L] || fallback[L] || "Source";

  return {
    icon: L,
    name: fullName,
    detail: dataSourceDetail || "",
  };
}

const nameMapping: Record<string, string> = {
  Park2025: "Park 2025",
  "T1DM-UOM": "T1D-UOM",
};

function normalizeName(name: string): string {
  return String(name ?? "")
    .replace(/[\s_-]+/g, "")
    .toLowerCase()
    .trim();
}

function findTable1Data(table1Data: Table1DetailData[], title: string): Table1DetailData | null {
  const mappedName = nameMapping[title] || title;

  const exactMatches = table1Data.filter((item) => item.name === mappedName);
  if (exactMatches.length > 0) return exactMatches.find((x) => x.data_source) || exactMatches[0];

  const normalizedTitle = normalizeName(mappedName);
  const normalizedMatches = table1Data.filter((item) => normalizeName(item.name) === normalizedTitle);
  if (normalizedMatches.length > 0) return normalizedMatches.find((x) => x.data_source) || normalizedMatches[0];

  const caseMatches = table1Data.filter((item) => item.name.toLowerCase() === mappedName.toLowerCase());
  if (caseMatches.length > 0) return caseMatches.find((x) => x.data_source) || caseMatches[0];

  return null;
}

function handleNR(value: string | null | undefined): string {
  if (!value || value === "NR" || value === "Nah") return "";
  return String(value);
}

function handleNaN(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  return value;
}

function buildDetailFromStatic(
  card: CardInfo,
  legacyTir?: TirMap[string],
  table1Data?: Table1DetailData | null,
  dataSourceMap?: DataSourceMap | null,
  histogramData?: HistogramDataItem["data"] | null,
  barsFromTir?: DatasetDetailType["timeInRanges"] | null
): DatasetDetailType {
  const participantsTotal = table1Data?.total ?? parseParticipants(card.metadata) ?? 0;

  const types = Array.isArray(card.types) ? card.types : [];
  const groups = types.length ? types : ["All"];

  const populationGroups = (table1Data?.populationGroups?.length
    ? table1Data.populationGroups.map((g) => ({
        type: g.type,
        label: g.type,
        count: g.count ?? 0,
      }))
    : groups.map((t) => ({
        type: t,
        label: t,
        count: 0,
      }))) as any;

  
  const legacySegments = [
    { key: "VeryLow", value: legacyTir?.very_low ?? 0 },
    { key: "Low", value: legacyTir?.low ?? 0 },
    { key: "Target", value: legacyTir?.target ?? 0 },
    { key: "High", value: legacyTir?.high ?? 0 },
    { key: "VeryHigh", value: legacyTir?.very_high ?? 0 },
  ];

 
  let genderStr = "";
  if (table1Data) {
    const male = handleNaN(table1Data.male);
    const female = handleNaN(table1Data.female);
    if (male > 0 || female > 0) {
      const parts: string[] = [];
      if (female > 0) parts.push(`${Math.round(female)} female`);
      if (male > 0) parts.push(`${Math.round(male)} male`);
      genderStr = parts.join(", ");
    }
  }

  const demographics = {
    gender: genderStr || "",
    ethnicities: table1Data ? handleNR(table1Data.Ethinicities) : "",
    ageRange: table1Data ? handleNR(table1Data["age range"]) : "",
  };

  const cgmDevice = table1Data ? handleNR(table1Data["CGM Device"]) : "";
  const totalDaysStr = table1Data ? handleNR(table1Data["Total days of glucose"]) : "";
  const glucoseSamples = table1Data ? handleNaN(table1Data["Glucose samples"]) : 0;
  const avgDays = table1Data ? handleNaN(table1Data["average days per participant"]) : 0;

  const yearRelease = table1Data ? handleNR(table1Data["year release"]) : "";
  const duration = yearRelease ? `Year released: ${yearRelease}` : "";

  const datasetLink = table1Data?.["Link to dataset"] || undefined;

  
  let dataSources: { icon: string; name: string; detail: string }[] = [];
  if (table1Data?.data_source) {
    dataSources = Object.entries(table1Data.data_source).map(([letter, detail]) =>
      mapSourceLetter(letter, dataSourceMap || null, String(detail))
    );
    dataSources.sort((a, b) => a.icon.localeCompare(b.icon));
  } else {
    dataSources = (card.sources ?? []).map((letter) =>
      mapSourceLetter(letter, dataSourceMap || null, cgmDevice && letter.toUpperCase() === "G" ? cgmDevice : undefined)
    );
  }


  let totalDays = 0;
  if (totalDaysStr) {
    const rangeMatch = totalDaysStr.match(/(\d+)\s*[–-]\s*(\d+)/);
    if (rangeMatch) {
      totalDays = Math.max(parseFloat(rangeMatch[1]) || 0, parseFloat(rangeMatch[2]) || 0);
    } else {
      const num = parseFloat(totalDaysStr);
      if (!Number.isNaN(num)) totalDays = num;
    }
  }


  const timeInRanges =
    barsFromTir && barsFromTir.length
      ? barsFromTir
      : groups.map((g) => ({
          group: g,
          total: 100,
          segments: legacySegments,
        }));

  return {
    id: card.title.toLowerCase().replace(/\s+/g, "-"),
    title: card.title,
    metadata: card.metadata,
    duration,
    dateRange: "",
    fullDescription: card.description && card.description !== "Description TBD" ? card.description : "",
    actions: {
      downloadLabel: "Download dataset",
      paperLabel: "Link to dataset source",
    },
    datasetLink,

    participantsTotal,
    populationGroups,

    population: {
      total: participantsTotal,
      diabetesTypes: groups.map((t) => ({ type: t as any, count: 0 })),
      gender: demographics.gender,
      ethnicities: demographics.ethnicities,
      ageRange: demographics.ageRange,
    },

    demographics,

    dataSources,

    cgmData: {
      device: cgmDevice || "",
      totalDays,
      totalSamples: glucoseSamples,
      avgDaysPerParticipant: avgDays,
    },

    cgmSummary: {
      device: cgmDevice || "",
      totalDays,
      glucoseSamples,
      avgDaysPerParticipant: avgDays,
      totalDaysRange: totalDaysStr || (totalDays > 0 ? String(totalDays) : undefined),
    } as any,

    glucoseRanges: [],

    timeInRanges,

    histogramData: histogramData || undefined,
  } as DatasetDetailType;
}

// visual_bar_info.json is intentionally not used (file is not provided).

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
        const cardsA = await fetchJsonStrict<CardInfo[]>("static_data/dataset_card_info.json", ac.signal);

        // Load Table1 detail data
        let table1Data: Table1DetailData[] | null = null;
        try {
          table1Data = await fetchJsonStrict<Table1DetailData[]>("static_data/table1_detail_data.json", ac.signal);
        } catch {
          
        }

        const dataSourceMap = await loadDataSourceMap(ac.signal);

        
        let matchedHistogramData: HistogramDataItem["data"] | null = null;
        try {
          const histogramDataAll = await fetchJsonStrict<HistogramDataItem[]>(
            "static_data/all-projects-histogram_data_fixed.json",
            ac.signal
          );
          const matched = histogramDataAll.find((item) => normalizeName(item.name) === normalizeName(id) || item.name === id);
          matchedHistogramData = matched?.data || null;
        } catch {
          
        }

        
        const tirByDataset = await fetchJsonStrict<TirByDataset>("static_data/time_in_ranges_by_type.json", ac.signal).catch(
          () => null
        );

        // We no longer use visual_bar_info.json (not provided).
        // Cards come solely from dataset_card_info.json.
        const merged = new Map<string, CardInfo>();
        for (const c of cardsA) merged.set(c.title, c);

        const card = merged.get(id);
        if (!card) throw new Error(`Dataset not found in static card lists: ${id}`);

        const matchedTable1Data = table1Data ? findTable1Data(table1Data, card.title) : null;

        
        const datasetKeyCandidates = [
          card.title,
          matchedTable1Data?.name,
          id,
          nameMapping[card.title],
          nameMapping[id],
        ].filter(Boolean) as string[];

        let tirForDataset: TirByType | null = null;
        for (const k of datasetKeyCandidates) {
          if (tirByDataset?.[k]) {
            tirForDataset = tirByDataset[k];
            break;
          }
          if (tirByDataset) {
            const foundKey = Object.keys(tirByDataset).find((key) => normalizeName(key) === normalizeName(k));
            if (foundKey) {
              tirForDataset = tirByDataset[foundKey];
              break;
            }
          }
        }

        
        const totalsByType: Record<string, number> = {};
        if (matchedTable1Data?.populationGroups?.length) {
          for (const g of matchedTable1Data.populationGroups) {
            const code = normalizeDiabetesTypeLabel(g.type);
            const n = Number(g.count);
            if (Number.isFinite(n) && n > 0) totalsByType[code] = n;
          }
        }

        const barsFromTir = tirForDataset ? toStackedBars(tirForDataset, totalsByType) : null;


        const detail = buildDetailFromStatic(
          card,
          undefined,
          matchedTable1Data,
          dataSourceMap,
          matchedHistogramData,
          barsFromTir
        );

        setLoad({ status: "success", data: detail, error: null });

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
      <DatasetHeader
        dataset={resolvedDataset}
        onBack={handleBack}
        onLegendInfo={() => setLegendOpen(true)}
      />

      <main className="detail-main">
        <div className="detail-grid">
          <div className="detail-left">
            <PopulationSection
              total={resolvedDataset.participantsTotal}
              groups={resolvedDataset.populationGroups}
            />
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
