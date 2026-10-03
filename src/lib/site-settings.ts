import type { ManifestConfig } from "material-icon-theme";
import { z } from "zod";

import {
  flattenStructures,
  nodeId,
  parseStructures,
  type StructureNode,
} from "../components/structures/structure-data";
import { AGENTIC_TEMPLATES } from "./agentic";
import { parseBranchFlow, type BranchFlow } from "./branches";
import type { FolderSettings } from "./structures";

export interface SiteStructureNode extends StructureNode {
  description?: string;
  example?: string;
  children?: SiteStructureNode[];
}

export type WebsiteStructureNode = SiteStructureNode;

export interface SiteStructureSettings extends FolderSettings {
  structures: SiteStructureNode[];
  documentation?: Record<string, string>;
}

export interface IssueExample {
  number: number;
  title: string;
  open: boolean;
  author: string;
  openedDaysAgo: number;
  comments: number;
  labels: string[];
  status?: string;
}

export interface IssueSettings extends SiteStructureSettings {
  examples?: IssueExample[];
}

export interface NamingSettings {
  title?: string;
  intro?: string;
  types?: Array<{ prefix: string; description: string; example: string; tone?: string }>;
  example?: { title: string; description: string };
  rules?: Array<{ title: string; description: string }>;
}

export interface AgenticOverride {
  name?: string;
  kind?: string;
  description?: string;
  distinction?: string;
  source?: string;
  sourceLabel?: string;
  readme?: string;
}

export interface SiteSettings {
  version: 1;
  logo?: { url: string; darkUrl?: string; alt?: string };
  folders?: SiteStructureSettings;
  issues?: IssueSettings;
  naming?: NamingSettings;
  branches?: BranchFlow;
  agentic?: Record<string, AgenticOverride>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const nonempty = z.string().refine((value) => Boolean(value.trim()), "Must not be empty.");

const httpUrlSchema = z.string().transform((value, context) => {
  try {
    normalizeSettingsUrl(value);
    return new URL(value.trim()).href;
  } catch {
    context.addIssue({
      code: "custom",
      message: "Must be an HTTP(S) URL without embedded credentials.",
    });
    return z.NEVER;
  }
});

const structuresSchema = z.unknown().transform((value, context): SiteStructureNode[] => {
  try {
    const structures = parseStructures(value);
    function validateContent(nodes: StructureNode[], path: Array<string | number>) {
      nodes.forEach((node, index) => {
        const entry = node as SiteStructureNode;
        for (const field of ["description", "example"] as const) {
          if (entry[field] !== undefined && typeof entry[field] !== "string") {
            context.addIssue({
              code: "custom",
              path: [...path, index, field],
              message: "Must be a string.",
            });
          }
        }
        if (entry.children) validateContent(entry.children, [...path, index, "children"]);
      });
    }
    validateContent(structures, []);
    return structures;
  } catch (error) {
    context.addIssue({ code: "custom", message: (error as Error).message });
    return z.NEVER;
  }
});

const structureSchema = z.object({
  libraryName: nonempty,
  manifestConfig: z.custom<ManifestConfig>(isRecord, "Must be an object.").optional(),
  structures: structuresSchema,
  documentation: z.record(z.string(), z.string()).optional(),
});

function normalizeDocumentation(settings: SiteStructureSettings, context: z.RefinementCtx) {
  if (!settings.documentation) return settings;
  const ids = new Set(
    flattenStructures(settings.structures).map((node) => nodeId(node).toLowerCase()),
  );
  const documentation: Record<string, string> = {};
  for (const [id, markdown] of Object.entries(settings.documentation)) {
    const key = id.toLowerCase();
    if (!ids.has(key)) {
      context.addIssue({
        code: "custom",
        path: ["documentation", id],
        message: `Unknown structure ID: ${id}.`,
      });
    } else if (Object.hasOwn(documentation, key)) {
      context.addIssue({
        code: "custom",
        path: ["documentation", id],
        message: `Duplicate documentation ID: ${id}.`,
      });
    } else {
      Object.defineProperty(documentation, key, { value: markdown, enumerable: true });
    }
  }
  return { ...settings, documentation };
}

const issueSchema = structureSchema
  .extend({
    examples: z
      .array(
        z.object({
          number: z.number().int().positive(),
          title: nonempty,
          open: z.boolean(),
          author: nonempty,
          openedDaysAgo: z.number().int().nonnegative(),
          comments: z.number().int().nonnegative(),
          labels: z.array(nonempty),
          status: nonempty.optional(),
        }),
      )
      .optional(),
  })
  .transform((settings, context): IssueSettings => {
    const groups = settings.structures;
    const labels = new Map(
      groups
        .filter((node) => ["types", "labels"].includes(node.name.trim().toLowerCase()))
        .flatMap((node) => flattenStructures(node.children ?? []))
        .filter((node) => !node.children?.length)
        .map((node) => [nodeId(node).toLowerCase(), nodeId(node)]),
    );
    const statuses = new Map(
      (groups.find((node) => node.name.trim().toLowerCase() === "kanban")?.children ?? []).map(
        (node) => [nodeId(node).toLowerCase(), nodeId(node)],
      ),
    );
    const numbers = new Set<number>();
    const examples = settings.examples?.map((example, index) => {
      if (numbers.has(example.number)) {
        context.addIssue({
          code: "custom",
          path: ["examples", index, "number"],
          message: `Duplicate issue number: ${example.number}.`,
        });
      }
      numbers.add(example.number);
      function resolve(id: string, choices: Map<string, string>, path: Array<string | number>) {
        const canonical = choices.get(id.toLowerCase());
        if (!canonical) {
          context.addIssue({ code: "custom", path, message: `Unknown issue reference: ${id}.` });
        }
        return canonical ?? id;
      }
      const resolvedLabels = example.labels.map((id, labelIndex) =>
        resolve(id, labels, ["examples", index, "labels", labelIndex]),
      );
      if (new Set(resolvedLabels).size !== resolvedLabels.length) {
        context.addIssue({
          code: "custom",
          path: ["examples", index, "labels"],
          message: "An issue cannot repeat a label.",
        });
      }
      return {
        ...example,
        labels: resolvedLabels,
        ...(example.status === undefined
          ? {}
          : { status: resolve(example.status, statuses, ["examples", index, "status"]) }),
      };
    });
    return {
      ...normalizeDocumentation(settings, context),
      ...(examples === undefined ? {} : { examples }),
    };
  });

const siteSchema = z.object({
  version: z.literal(1),
  logo: z
    .object({ url: httpUrlSchema, darkUrl: httpUrlSchema.optional(), alt: nonempty.optional() })
    .optional(),
  folders: structureSchema.transform(normalizeDocumentation).optional(),
  issues: issueSchema.optional(),
  naming: z
    .object({
      title: z.string().optional(),
      intro: z.string().optional(),
      types: z
        .array(
          z.object({
            prefix: nonempty,
            description: z.string(),
            example: z.string(),
            tone: z.string().optional(),
          }),
        )
        .optional(),
      example: z.object({ title: z.string(), description: z.string() }).optional(),
      rules: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
    })
    .optional(),
  branches: z
    .unknown()
    .transform((value, context) => {
      try {
        return parseBranchFlow(value);
      } catch (error) {
        context.addIssue({ code: "custom", message: (error as Error).message });
        return z.NEVER;
      }
    })
    .optional(),
  agentic: z
    .record(
      z.string().refine((id) => AGENTIC_TEMPLATES.some((template) => template.id === id), {
        message: "Unknown Agentic template ID.",
      }),
      z.object({
        name: z.string().optional(),
        kind: z.string().optional(),
        description: z.string().optional(),
        distinction: z.string().optional(),
        source: httpUrlSchema.optional(),
        sourceLabel: z.string().optional(),
        readme: z.string().optional(),
      }),
    )
    .optional(),
});

/** Validate the whole profile before any section is made available to the website. */
export function parseSiteSettings(value: unknown): SiteSettings {
  const result = siteSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      result.error.issues
        .map((issue) => `${issue.path.join(".") || "settings"}: ${issue.message}`)
        .join(" "),
    );
  }
  return result.data;
}

export function normalizeSettingsUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter a GitHub Gist link or an HTTP(S) settings JSON URL.");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Use an HTTP(S) settings URL without embedded credentials.");
  }
  url.hash = "";
  return url.href;
}

/** Runs in the browser: Gist pages resolve their settings.json file through GitHub's API. */
export async function fetchSiteSettings(
  source: string,
  signal?: AbortSignal,
): Promise<SiteSettings> {
  signal?.throwIfAborted();
  let url = new URL(normalizeSettingsUrl(source));
  async function fetchJson(
    location: string,
    description: string,
    accept = "application/json",
  ): Promise<unknown> {
    const response = await fetch(location, {
      signal,
      cache: "no-cache",
      credentials: "omit",
      headers: { Accept: accept },
    });
    if (!response.ok) throw new Error(`Unable to load ${description} (${response.status}).`);
    try {
      return await response.json();
    } catch (error) {
      signal?.throwIfAborted();
      if (error instanceof SyntaxError) throw new Error(`${description} is not valid JSON.`);
      throw error;
    }
  }
  if (url.hostname === "gist.github.com") {
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments.length === 1 ? segments[0] : segments[1];
    const revision = segments.length === 3 ? segments[2] : undefined;
    if (
      !id ||
      !/^[a-f\d]+$/i.test(id) ||
      segments.length > 3 ||
      (revision !== undefined && !/^[a-f\d]+$/i.test(revision))
    ) {
      throw new Error("Use a GitHub Gist page link, such as https://gist.github.com/user/gist-id.");
    }
    const gist = await fetchJson(
      `https://api.github.com/gists/${id}${revision ? `/${revision}` : ""}`,
      "this GitHub Gist",
      "application/vnd.github+json",
    );
    signal?.throwIfAborted();
    const file = isRecord(gist) && isRecord(gist.files) ? gist.files["settings.json"] : undefined;
    if (!isRecord(file) || typeof file.raw_url !== "string") {
      throw new Error("This GitHub Gist must contain a file named settings.json.");
    }
    url = new URL(normalizeSettingsUrl(file.raw_url));
  }
  const payload = await fetchJson(url.href, "website settings");
  signal?.throwIfAborted();
  return parseSiteSettings(payload);
}
