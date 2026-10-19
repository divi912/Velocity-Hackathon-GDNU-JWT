export const REPO_BASE = '/Velocity-Hackathon-GDNU-SessionSight';

/**
 * Returns a repository-aware URL path for any internal route or hash.
 * Ensures links like getRouteUrl('/sessions#comparison') render as
 * '/Velocity-Hackathon-GDNU-SessionSight/sessions#comparison', never stripping the base path.
 */
export function getRouteUrl(pathWithOptionalHash: string = '/'): string {
  if (
    pathWithOptionalHash.startsWith('http://') ||
    pathWithOptionalHash.startsWith('https://') ||
    pathWithOptionalHash.startsWith('mailto:') ||
    pathWithOptionalHash.startsWith('tel:')
  ) {
    return pathWithOptionalHash;
  }

  // Pure in-page hash scroll on current page
  if (pathWithOptionalHash.startsWith('#')) {
    return pathWithOptionalHash;
  }

  const clean = pathWithOptionalHash.startsWith('/') ? pathWithOptionalHash : `/${pathWithOptionalHash}`;

  const isGhPages =
    typeof window !== 'undefined'
      ? window.location.hostname.endsWith('github.io') ||
        window.location.pathname.toLowerCase().startsWith(REPO_BASE.toLowerCase())
      : true;

  if (isGhPages) {
    return `${REPO_BASE}${clean === '/' ? '/' : clean}`;
  }

  return clean;
}
