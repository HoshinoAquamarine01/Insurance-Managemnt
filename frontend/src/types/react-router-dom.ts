import * as React from "react";

export type To = string | { pathname?: string; search?: string; hash?: string };

export interface LinkProps {
  to: To;
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

export const Link: React.ComponentType<LinkProps> = undefined as any;

export const BrowserRouter: React.ComponentType<React.PropsWithChildren> =
  undefined as any;

export const Routes: React.ComponentType<React.PropsWithChildren> =
  undefined as any;

export const Route: React.ComponentType<{
  path?: string;
  element?: React.ReactNode;
  children?: React.ReactNode;
}> = undefined as any;

export const Navigate: React.ComponentType<{
  to: To;
  replace?: boolean;
}> = undefined as any;

export const Outlet: React.ComponentType<Record<string, unknown>> =
  undefined as any;

export function useNavigate(): (
  to: To,
  options?: { replace?: boolean; state?: unknown },
) => void {
  return undefined as any;
}

export function useLocation(): {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
  key: string;
} {
  return undefined as any;
}

export function useSearchParams(): [
  URLSearchParams,
  (
    next: URLSearchParams | string | Record<string, string>,
    options?: { replace?: boolean },
  ) => void,
] {
  return undefined as any;
}

export function useParams<
  T extends Record<string, string | undefined> = Record<
    string,
    string | undefined
  >,
>(): T {
  return undefined as any;
}
