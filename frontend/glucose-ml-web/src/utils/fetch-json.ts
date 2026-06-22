export function baseUrlJoin(relativePath: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
  return `${normalizedBase}${normalizedPath}`;
}

export async function fetchJson<T>(relativePath: string, signal?: AbortSignal): Promise<T> {
  const url = baseUrlJoin(relativePath);
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status} ${response.statusText})`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text.replace(/^\uFEFF/, "").trim()) as T;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON from ${url}: ${message}`);
  }
}
