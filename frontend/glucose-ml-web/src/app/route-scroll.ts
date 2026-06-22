const HOME_PATH = "/";

export function getRouteScrollTop(
  pathname: string,
  homeScrollTop: number
): number {
  return pathname === HOME_PATH ? homeScrollTop : 0;
}

export function rememberHomeScrollTop(
  pathname: string,
  scrollTop: number,
  homeScrollTop: number
): number {
  return pathname === HOME_PATH ? scrollTop : homeScrollTop;
}
