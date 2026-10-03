import { useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { useSiteSettings } from "#/components/site-settings-provider.tsx";
import { normalizeSettingsUrl } from "#/lib/site-settings.ts";

export function SiteSettingsControl() {
  const { url, isPending, error, refetch } = useSiteSettings();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useSearch({ strict: false });
  const [draft, setDraft] = useState({ url, value: url ?? "" });
  const [inputError, setInputError] = useState("");
  const value = draft.url === url ? draft.value : (url ?? "");

  const apply = (settings: string | undefined) => {
    setInputError("");
    setDraft({ url: settings, value: settings ?? "" });
    const explorer =
      /^\/(folders|issues)\/[^/]+/.test(pathname) &&
      !["/issues/labels", "/issues/priorities"].includes(pathname);
    const to = explorer ? (pathname.startsWith("/folders") ? "/folders" : "/issues") : ".";
    void navigate({
      to,
      search: (previous) => ({ ...previous, settings, source: undefined }),
      hash: explorer ? "" : true,
      resetScroll: false,
      hashScrollIntoView: false,
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const next = normalizeSettingsUrl(value);
      if (next === url) refetch();
      else apply(next);
      setInputError("");
    } catch (cause) {
      setInputError(cause instanceof Error ? cause.message : "Enter a valid settings URL.");
    }
  };

  return (
    <form className="site-settings-control" onSubmit={submit} aria-label="Website settings">
      <div className="source-control">
        <label className="sr-only" htmlFor="website-settings-url">
          Website settings URL
        </label>
        <input
          id="website-settings-url"
          type="url"
          value={value}
          placeholder="Gist or settings.json URL"
          aria-invalid={Boolean(inputError) || undefined}
          aria-describedby="website-settings-feedback"
          onChange={(event) => {
            setDraft({ url, value: event.target.value });
            setInputError("");
          }}
        />
        <button type="submit" disabled={!value.trim() || (isPending && value.trim() === url)}>
          {isPending ? "Loading…" : "Load"}
        </button>
        <button
          type="button"
          className="settings-reset"
          disabled={!url && !search.source && !value}
          onClick={() => apply(undefined)}
        >
          Reset
        </button>
      </div>
      <span id="website-settings-feedback" className="site-settings-feedback" aria-live="polite">
        {inputError || (error ? "Settings could not be loaded." : "")}
      </span>
    </form>
  );
}
