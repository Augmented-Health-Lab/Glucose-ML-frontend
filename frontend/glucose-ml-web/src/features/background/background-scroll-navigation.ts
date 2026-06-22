export type BackgroundSectionPosition = {
  href: string;
  offsetTop: number;
};

type ActiveAnchorInput = {
  sections: BackgroundSectionPosition[];
  scrollY: number;
  stickyHeaderHeight: number;
  viewportHeight: number;
  documentHeight: number;
  navigationHref?: string | null;
};

export const selectActiveAnchorHref = ({
  sections,
  scrollY,
  stickyHeaderHeight,
  viewportHeight,
  documentHeight,
  navigationHref,
}: ActiveAnchorInput) => {
  if (sections.length === 0) return null;

  if (
    navigationHref &&
    sections.some((section) => section.href === navigationHref)
  ) {
    return navigationHref;
  }

  if (scrollY + viewportHeight >= documentHeight - 1) {
    return sections.at(-1)?.href ?? null;
  }

  const sectionBoundary = scrollY + stickyHeaderHeight;
  let activeHref = sections[0].href;

  for (const section of sections) {
    if (section.offsetTop > sectionBoundary) break;
    activeHref = section.href;
  }

  return activeHref;
};
