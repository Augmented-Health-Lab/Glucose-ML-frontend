export type DatasetAccess = "Open" | "Controlled";
export type AccessLabelSurface = "card" | "detail";

type AccessSource = {
  access?: string | null;
} | null | undefined;

const ACCESS_ICON_MAP: Record<DatasetAccess, string> = {
  Open: "/figma-assets/icon-public.png",
  Controlled: "/figma-assets/icon-key-controlled.png",
};

export function normalizeDatasetAccess(value: string | null | undefined): DatasetAccess | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "open" || normalized === "public" || normalized === "public access") {
    return "Open";
  }
  if (normalized === "controlled" || normalized === "controlled access") {
    return "Controlled";
  }
  return null;
}

export function resolveDatasetAccess(
  source: AccessSource,
  fallback?: string | null
): DatasetAccess {
  return (
    normalizeDatasetAccess(source?.access) ??
    normalizeDatasetAccess(fallback) ??
    "Controlled"
  );
}

export function formatAccessLabel(
  access: string | null | undefined,
  surface: AccessLabelSurface
): string {
  const resolved = normalizeDatasetAccess(access) ?? "Controlled";
  const suffix = surface === "detail" ? "Access" : "access";
  return `${resolved} ${suffix}`;
}

export function getAccessIcon(access: string | null | undefined): string {
  return ACCESS_ICON_MAP[normalizeDatasetAccess(access) ?? "Controlled"];
}
