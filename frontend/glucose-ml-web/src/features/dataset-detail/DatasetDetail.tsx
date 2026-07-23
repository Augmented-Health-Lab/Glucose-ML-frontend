// src/features/dataset-detail/DatasetDetail.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  DatasetDetail as DatasetDetailType,
  DiabetesType,
  GlucoseRangeKey,
  PublicationReferencesByDataset,
  RangeKey,
  StackedBarGroup,
  TirByDataset,
  TirByType,
} from "../../types/dataset";
import AppShell from "../../components/app-shell/AppShell";

import DatasetHeader from "./DatasetHeader";
import PopulationSection from "./PopulationSection";
import DataSourcesSection from "./DataSourcesSection";
import CGMDataSection from "./CGMDataSection";
import DemographicsSection from "./DemographicsSection";
import AuthorshipSection from "./AuthorshipSection";
import { resolveDatasetAccess } from "../../utils/access";
import { fetchJson } from "../../utils/fetch-json";
import { findPublicationReferences } from "./publication-reference-data";
import { trackContentLoadError } from "../../analytics";

import "./dataset-detail.css";

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

type HomeAccessInfo = {
  title: string;
  access: string;
};


const RANGE_TO_CHART_KEY: Record<RangeKey, GlucoseRangeKey> = {
  very_low: "VeryLow",
  low: "Low",
  target: "Target",
  high: "High",
  very_high: "VeryHigh",
};

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
): StackedBarGroup[] {
  const preferredGroupOrder = ["T1D", "T2D", "PreD", "ND"];
  const groupRank = (g: string) => {
    const idx = preferredGroupOrder.indexOf(g);
    return idx === -1 ? 999 : idx;
  };

  const bars = Object.entries(tirByType).map<StackedBarGroup>(([rawGroup, vals]) => {
    const group = normalizeDiabetesTypeLabel(rawGroup);

    const raw = {
      very_low: clamp0(vals.very_low),
      low: clamp0(vals.low),
      target: clamp0(vals.target),
      high: clamp0(vals.high),
      very_high: clamp0(vals.very_high),
    };

    const totalFromCounts = totalsByType?.[group];
    const total =
      typeof totalFromCounts === "number" &&
      Number.isFinite(totalFromCounts) &&
      totalFromCounts > 0
        ? totalFromCounts
        : 100;

    return {
      group: group as StackedBarGroup["group"],
      total,
      segments: (Object.entries(raw) as Array<[RangeKey, number]>).map(
        ([key, value]) => ({
          key: RANGE_TO_CHART_KEY[key],
          value,
        })
      ),
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
  "Total days of glucose": number | string;
  "Glucose samples": number;
  "average days per participant": number | string | null;
  data_source?: Record<string, string>;
  populationGroups?: { type: string; count: number | null }[];
  "Link to dataset"?: string;
  "Link to Git"?: string;
  "Links to paper"?: string;
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

function DetailLayout({
  dataset,
  onBack,
}: {
  dataset: DatasetDetailType;
  onBack: () => void;
}) {
  return (
    <AppShell>
      <div className="dataset-detail-page">
        <div className="dataset-detail-page__panel">
          <div className="dataset-detail-page__stack">
            <DatasetHeader dataset={dataset} onBack={onBack} />
            <div className="dataset-detail-page__content">
              <div className="dataset-detail-page__left">
                <PopulationSection
                  total={dataset.participantsTotal}
                  groups={dataset.populationGroups}
                />
                <DemographicsSection demographics={dataset.demographics} />
                <DataSourcesSection sources={dataset.dataSources} />
              </div>

              <div className="dataset-detail-page__right">
                <CGMDataSection dataset={dataset} datasetName={dataset.title} />
                <AuthorshipSection references={dataset.publicationReferences} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

function parseParticipants(metadata: string): number | null {
  const m = metadata.match(/(\d+)\s+participants/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

const DETAIL_SOURCE_ORDER: Record<string, number> = {
  I: 0,
  G: 1,
  M: 2,
  W: 3,
  A: 3,
};

const DETAIL_SOURCE_LABELS: Record<string, string> = {
  G: "CGM",
  I: "Insulin",
  M: "Manual Logs",
  W: "Wearable Tracker",
  A: "Wearable Tracker",
};

function mapSourceLetter(letter: string, dataSourceDetail?: string) {
  const L = letter.toUpperCase();
  const fullName = DETAIL_SOURCE_LABELS[L];
  if (!fullName) return null;
  const icon = L === "A" ? "W" : L;

  return {
    icon,
    name: fullName,
    detail: dataSourceDetail || "",
  };
}

const nameMapping: Record<string, string> = {
  CGMacros: "CGMacros Dexcom",
  CGMacros_Dexcom: "CGMacros Dexcom",
  CGMacros_Libre: "CGMacros Libre",
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

function findCardInfo(cards: CardInfo[], title: string): CardInfo | null {
  const mappedName = nameMapping[title] || title;
  const exactMatch = cards.find((card) => card.title === mappedName || card.title === title);
  if (exactMatch) return exactMatch;

  const normalizedTitle = normalizeName(mappedName);
  return (
    cards.find((card) => normalizeName(card.title) === normalizedTitle) ?? null
  );
}

function findHomeAccessInfo(rows: HomeAccessInfo[], title: string): HomeAccessInfo | null {
  const mappedName = nameMapping[title] || title;
  const exactMatch = rows.find((row) => row.title === mappedName || row.title === title);
  if (exactMatch) return exactMatch;

  const normalizedTitle = normalizeName(mappedName);
  return rows.find((row) => normalizeName(row.title) === normalizedTitle) ?? null;
}

function handleNR(value: number | string | null | undefined): string {
  const text = String(value ?? "").trim();
  if (!text || text === "NR" || text === "Nah") return "";
  return text;
}

function handleNaN(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function optionalLink(value: string | null | undefined): string | undefined {
  const link = String(value ?? "").trim();
  return link || undefined;
}

function buildDetailFromStatic(
  card: CardInfo,
  table1Data?: Table1DetailData | null,
  accessInfo?: HomeAccessInfo | null,
  histogramData?: HistogramDataItem["data"] | null,
  barsFromTir?: DatasetDetailType["timeInRanges"] | null,
  publicationReferences: DatasetDetailType["publicationReferences"] = [],
  displayTitle = card.title
): DatasetDetailType {
  const participantsTotal = table1Data?.total ?? parseParticipants(card.metadata) ?? 0;

  const types = Array.isArray(card.types) ? card.types : [];
  const groups = types.length ? types : ["All"];

  const populationGroups = table1Data?.populationGroups?.length
    ? table1Data.populationGroups.map((g) => ({
        type: normalizeDiabetesTypeLabel(g.type) as DiabetesType,
        label: g.type,
        count: g.count ?? 0,
      }))
    : groups.map((t) => ({
        type: normalizeDiabetesTypeLabel(t) as DiabetesType,
        label: t,
        count: 0,
      }));


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

  const datasetLink = optionalLink(table1Data?.["Link to dataset"]);
  const downloadLink = optionalLink(table1Data?.["Link to Git"]);
  const paperLink = optionalLink(table1Data?.["Links to paper"]);


  let dataSources: { icon: string; name: string; detail: string }[] = [];
  if (table1Data?.data_source) {
    dataSources = Object.entries(table1Data.data_source)
      .map(([letter, detail]) =>
        mapSourceLetter(
          letter,
          letter.toUpperCase() === "G" ? cgmDevice : String(detail)
        )
      )
      .filter((source): source is { icon: string; name: string; detail: string } => Boolean(source));
    dataSources.sort((a, b) => (DETAIL_SOURCE_ORDER[a.icon] ?? 999) - (DETAIL_SOURCE_ORDER[b.icon] ?? 999));
  } else {
    dataSources = (card.sources ?? [])
      .map((letter) =>
        mapSourceLetter(letter, cgmDevice && letter.toUpperCase() === "G" ? cgmDevice : undefined)
      )
      .filter((source): source is { icon: string; name: string; detail: string } => Boolean(source));
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
      : groups.map<StackedBarGroup>((g) => ({
          group: normalizeDiabetesTypeLabel(g) as StackedBarGroup["group"],
          total: 100,
          segments: [
            { key: "VeryLow", value: 0 },
            { key: "Low", value: 0 },
            { key: "Target", value: 0 },
            { key: "High", value: 0 },
            { key: "VeryHigh", value: 0 },
          ],
        }));

  return {
    id: card.title.toLowerCase().replace(/\s+/g, "-"),
    title: displayTitle,
    metadata: card.metadata,
    access: resolveDatasetAccess(accessInfo, card.metadata),
    duration,
    dateRange: "",
    fullDescription: card.description && card.description !== "Description TBD" ? card.description : "",
    actions: {
      downloadLabel: "Download dataset",
      paperLabel: "Link to dataset source",
    },
    datasetLink,
    downloadLink,
    paperLink,
    publicationReferences,

    participantsTotal,
    populationGroups,

    population: {
      total: participantsTotal,
      diabetesTypes: groups.map((t) => ({
        type: normalizeDiabetesTypeLabel(t) as DiabetesType,
        count: 0,
      })),
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
    },

    glucoseRanges: [],

    timeInRanges,

    histogramData: histogramData || undefined,
  };
}

// visual_bar_info.json is intentionally not used (file is not provided).

export default function DatasetDetail({ dataset, onBack }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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
        const cardsA = await fetchJson<CardInfo[]>("static_data/dataset_card_info.json", ac.signal);

        let homeAccessData: HomeAccessInfo[] | null = null;
        try {
          homeAccessData = await fetchJson<HomeAccessInfo[]>("static_data/homepage_data.json", ac.signal);
        } catch {
          homeAccessData = null;
        }

        // Load Table1 detail data
        let table1Data: Table1DetailData[] | null = null;
        try {
          table1Data = await fetchJson<Table1DetailData[]>("static_data/table1_detail_data.json", ac.signal);
        } catch {
          table1Data = null;
        }


        let matchedHistogramData: HistogramDataItem["data"] | null = null;
        try {
          const histogramDataAll = await fetchJson<HistogramDataItem[]>(
            "static_data/all-projects-histogram_data_fixed.json",
            ac.signal
          );
          const matched = histogramDataAll.find((item) => normalizeName(item.name) === normalizeName(id) || item.name === id);
          matchedHistogramData = matched?.data || null;
        } catch {
          matchedHistogramData = null;
        }


        const tirByDataset = await fetchJson<TirByDataset>("static_data/time_in_ranges_by_type.json", ac.signal).catch(
          () => null
        );

        const publicationReferencesByDataset =
          await fetchJson<PublicationReferencesByDataset>(
            "static_data/publication_references.json",
            ac.signal
          ).catch((error) => {
            if (
              ac.signal.aborted ||
              (typeof error === "object" &&
                error !== null &&
                "name" in error &&
                error.name === "AbortError")
            ) {
              throw error;
            }
            return {};
          });

        // We no longer use visual_bar_info.json (not provided).
        // Cards come solely from dataset_card_info.json.
        const card = findCardInfo(cardsA, id);
        if (!card) throw new Error(`Dataset not found in static card lists: ${id}`);

        const matchedTable1Data = table1Data ? findTable1Data(table1Data, card.title) : null;
        const matchedAccessInfo = homeAccessData ? findHomeAccessInfo(homeAccessData, card.title) : null;


        const datasetKeyCandidates = [
          card.title,
          matchedTable1Data?.name,
          id,
          nameMapping[card.title],
          nameMapping[id],
        ].filter(Boolean) as string[];

        const publicationReferences = findPublicationReferences(
          publicationReferencesByDataset,
          datasetKeyCandidates
        );

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
          matchedTable1Data,
          matchedAccessInfo,
          matchedHistogramData,
          barsFromTir,
          publicationReferences,
          id === "CGMacros" ? "CGMacros" : card.title
        );

        setLoad({ status: "success", data: detail, error: null });
      } catch (err) {
        if (ac.signal.aborted) return;
        trackContentLoadError({ screen: "dataset_detail", error: err });
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
      <DetailLayout
        dataset={dataset}
        onBack={handleBack}
      />
    );
  }

  if (load.status === "loading") {
    return (
      <AppShell>
        <div className="dataset-detail-page">
          <main className="dataset-detail-page__status glm-body">
            Loading dataset...
          </main>
        </div>
      </AppShell>
    );
  }

  if (load.status === "error") {
    return (
      <AppShell>
        <div className="dataset-detail-page">
          <main className="dataset-detail-page__status glm-body">
            <p>
              Could not load dataset details for <b>{id}</b>.
            </p>
            <p>{load.error.message}</p>
            <button
              type="button"
              className="glm-button glm-button-secondary"
              onClick={handleBack}
            >
              Back
            </button>
          </main>
        </div>
      </AppShell>
    );
  }

  const resolvedDataset = load.data;

  return (
    <DetailLayout
      dataset={resolvedDataset}
      onBack={handleBack}
    />
  );
}
