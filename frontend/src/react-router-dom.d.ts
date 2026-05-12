declare module "react-router-dom" {
  import * as React from "react";

  export type To =
    | string
    | { pathname?: string; search?: string; hash?: string };

  export interface LinkProps {
    to: To;
    children?: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }

  export const Link: React.ComponentType<LinkProps>;
  export const BrowserRouter: React.ComponentType<React.PropsWithChildren>;
  export const Routes: React.ComponentType<React.PropsWithChildren>;
  export const Route: React.ComponentType<{
    path?: string;
    element?: React.ReactNode;
    children?: React.ReactNode;
  }>;
  export const Navigate: React.ComponentType<{
    to: To;
    replace?: boolean;
  }>;
  export const Outlet: React.ComponentType<Record<string, unknown>>;

  export function useNavigate(): (
    to: To,
    options?: { replace?: boolean; state?: unknown },
  ) => void;
  export function useLocation(): {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
    key: string;
  };
  export function useSearchParams(): [
    URLSearchParams,
    (
      next: URLSearchParams | string | Record<string, string>,
      options?: { replace?: boolean },
    ) => void,
  ];
  export function useParams<
    T extends Record<string, string | undefined> = Record<
      string,
      string | undefined
    >,
  >(): T;
}
