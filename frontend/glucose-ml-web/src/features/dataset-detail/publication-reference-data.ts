import type {
  PublicationReference,
  PublicationReferencesByDataset,
} from "../../types/dataset";

function normalizeDatasetName(name: string): string {
  return name.replace(/[\s_-]+/g, "").toLowerCase();
}

export function findPublicationReferences(
  referencesByDataset: PublicationReferencesByDataset,
  candidates: string[]
): PublicationReference[] {
  const entries = Object.entries(referencesByDataset);

  for (const candidate of candidates) {
    const exactMatch = referencesByDataset[candidate];
    if (exactMatch) return exactMatch;

    const normalizedCandidate = normalizeDatasetName(candidate);
    const normalizedMatch = entries.find(
      ([datasetName]) =>
        normalizeDatasetName(datasetName) === normalizedCandidate
    );
    if (normalizedMatch) return normalizedMatch[1];
  }

  return [];
}
