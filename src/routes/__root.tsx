import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  retainSearchParams,
} from "@tanstack/react-router";

import { AppShell } from "#/components/app-shell.tsx";
import { SiteSettingsProvider } from "#/components/site-settings-provider.tsx";
import { ThemeProvider } from "#/components/theme-provider.tsx";
import { validateSiteSearch } from "#/lib/router-search.ts";
import { pageHead } from "#/lib/seo.ts";

import appCss from "#/styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  validateSearch: validateSiteSearch,
  search: { middlewares: [retainSearchParams(["settings"])] },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      ...pageHead(
        "Project Organization Standards",
        "Explore documented standards for project folders, issue labels, priorities, Git workflows, and AI agents. Browse examples or load your own structure.",
      ).meta,
    ],
    links: [
      { rel: "icon", type: "image/x-icon", sizes: "48x48", href: "/favicon.ico?v=corner" },
      { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96x96.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <SiteSettingsProvider>
            <AppShell>{children}</AppShell>
          </SiteSettingsProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
