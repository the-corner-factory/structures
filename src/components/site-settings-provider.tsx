import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { createContext, use, type ReactNode } from "react";

import { fetchSiteSettings, type SiteSettings } from "#/lib/site-settings.ts";
import { useHydrated } from "#/lib/use-hydrated.ts";

interface SiteSettingsState {
  url?: string;
  settings?: SiteSettings;
  isPending: boolean;
  error: Error | null;
  refetch: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsState>({
  isPending: false,
  error: null,
  refetch: () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { settings: url } = useSearch({ strict: false });
  const hydrated = useHydrated();
  const query = useQuery({
    queryKey: ["site-settings", url],
    queryFn: ({ signal }) => fetchSiteSettings(url!, signal),
    enabled: hydrated && Boolean(url),
    retry: false,
  });

  return (
    <SiteSettingsContext
      value={{
        url,
        settings: url ? query.data : undefined,
        isPending: Boolean(url) && query.isPending,
        error: url ? query.error : null,
        refetch: () => void query.refetch(),
      }}
    >
      {children}
    </SiteSettingsContext>
  );
}

export function useSiteSettings() {
  return use(SiteSettingsContext);
}

export function SiteSettingsBoundary({ children }: { children: ReactNode }) {
  const { isPending, error, refetch } = useSiteSettings();
  if (isPending) {
    return (
      <div className="document-loading" role="status">
        Loading website settings…
      </div>
    );
  }
  if (error) {
    return (
      <section className="document-error" role="alert">
        <h1>Could not load website settings</h1>
        <p>{error.message}</p>
        <button type="button" className="primary-button" onClick={refetch}>
          Try again
        </button>
        <p>Check the URL above or reset to the built-in standards.</p>
      </section>
    );
  }
  return children;
}
