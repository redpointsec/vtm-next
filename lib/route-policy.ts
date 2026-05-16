export const AUTH_ROUTE_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password"];

export const PUBLIC_ROUTE_PREFIXES = [
  ...AUTH_ROUTE_PREFIXES,
  "/api/auth",
  "/api/docs",
  "/api/debug",
  "/api/health",
];

export const PUBLIC_EXACT_ROUTES = ["/dashboard", "/debug", "/docs", "/api"];

export function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function isAuthRoute(pathname: string) {
  const normalized = normalizePathname(pathname);
  return AUTH_ROUTE_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

export function isPublicRoute(pathname: string) {
  const normalized = normalizePathname(pathname);

  return (
    PUBLIC_EXACT_ROUTES.includes(normalized) ||
    PUBLIC_ROUTE_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))
  );
}
