import { Link } from "@tanstack/react-router";
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  CheckIcon,
  FileCode2Icon,
  Heading1Icon,
  ListOrderedIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { PageTitle } from "#/components/page-title.tsx";
import { useSiteSettings } from "#/components/site-settings-provider.tsx";
import { AnchorHeading } from "#/components/structures/anchor-heading.tsx";

const PREFIXES: Array<{
  prefix: string;
  description: string;
  example: string;
  tone?: string;
}> = [
  {
    prefix: "feat",
    description: "A new feature for the user (A new feature for the consumer).",
    example: "feat: allow custom markdown docs per element",
    tone: "#0969da",
  },
  {
    prefix: "fix",
    description: "A bug fix for the user.",
    example: "fix(auth): refresh session before token expires",
    tone: "#cf222e",
  },
  {
    prefix: "docs",
    description: "Documentation-only changes.",
    example: "docs: document conventional-commit titles",
    tone: "#3199e4",
  },
  {
    prefix: "style",
    description: "Changes that do not affect the meaning of the code (formatting, whitespace, …).",
    example: "style: align card spacing on narrow screens",
    tone: "#8957e5",
  },
  {
    prefix: "refactor",
    description: "A change that neither fixes a bug nor adds a feature.",
    example: "refactor(explorer): extract sidebar props",
    tone: "#facc03",
  },
  {
    prefix: "perf",
    description: "A change that improves performance.",
    example: "perf: precompute structure hashes",
    tone: "#c87e64",
  },
  {
    prefix: "test",
    description: "Adding or correcting tests.",
    example: "test: cover markdown url decoding",
    tone: "#3fb950",
  },
  {
    prefix: "build",
    description: "Changes to the build system or external dependencies.",
    example: "build: bump react-markdown",
    tone: "#bd561d",
  },
  {
    prefix: "ci",
    description: "Changes to CI configuration files and scripts.",
    example: "ci: cache pnpm store between jobs",
    tone: "#0969da",
  },
  {
    prefix: "chore",
    description: "Other changes that do not modify source or test files.",
    example: "chore: update license headers",
    tone: "#9198a1",
  },
];

export function NamingStandard() {
  const { settings } = useSiteSettings();
  const naming = settings?.naming;
  return (
    <section className="naming-page">
      <PageTitle
        eyebrow="Git commit naming"
        title={naming?.title ?? "Conventional commits"}
        intro={
          naming?.intro ?? (
            <p>
              A lightweight convention over how to write commit, branch and issue titles. Every
              title starts with a <Code>type</Code>, an optional <Code>scope</Code>, and a short
              description.
            </p>
          )
        }
        action={
          <a
            className="naming-cta"
            href="https://www.conventionalcommits.org/en/v1.0.0/"
            target="_blank"
            rel="noreferrer"
          >
            Read the full specification <ArrowUpRightIcon aria-hidden="true" />
          </a>
        }
      />

      <div className="naming-anatomy">
        <AnatomyLabel label="type" description="the kind of change" tone="var(--file)" />
        <span className="anatomy-paren">(</span>
        <AnatomyLabel label="scope" description="optional area" tone="var(--accent)" />
        <span className="anatomy-paren">)</span>
        <span className="anatomy-sep">:</span>
        <AnatomyLabel
          label="description"
          description="short, imperative summary"
          tone="var(--danger)"
        />
      </div>

      <CommitExample example={naming?.example} />

      <AnchorHeading level={2} className="naming-section-title">
        Commit types
      </AnchorHeading>
      <div className="naming-type-grid">
        {(naming?.types ?? PREFIXES).map((entry) => (
          <TypeCard key={entry.prefix} entry={entry} />
        ))}
      </div>

      <AnchorHeading level={2} className="naming-section-title">
        Rules
      </AnchorHeading>
      {naming?.rules ? (
        naming.rules.map((rule) => (
          <SectionCard key={rule.title} icon={BookOpenIcon} title={rule.title}>
            <p>{rule.description}</p>
          </SectionCard>
        ))
      ) : (
        <>
          <SectionCard icon={Heading1Icon} title="Write an imperative, concise summary">
            <p>
              Use the imperative mood (“add”, “fix”, “remove”) as in a command. Keep the description
              on one line and under about 50 characters when you can.
            </p>
          </SectionCard>
          <SectionCard icon={ListOrderedIcon} title="Break type and scope with a colon">
            <p>
              Format every title as <Code>type(scope): description</Code>. The <Code>type</Code> and{" "}
              <Code>scope</Code> must be lowercase; the scope is optional.
            </p>
          </SectionCard>
          <SectionCard icon={BookOpenIcon} title="Connect commits to the issue">
            <p>
              Reference an issue with <Code>#123</Code> or <Code>fixes #123</Code> when applicable
              so the issue is linked to the change that implements it.
            </p>
          </SectionCard>
        </>
      )}

      <div className="naming-links-row">
        <Link to="/issues" className="naming-cta">
          <FileCode2Icon aria-hidden="true" /> See example issues
        </Link>
      </div>
    </section>
  );
}

function Code({ children }: { children: string }) {
  return <code className="naming-code">{children}</code>;
}

function AnatomyLabel({
  label,
  description,
  tone,
}: {
  label: string;
  description: string;
  tone: string;
}) {
  return (
    <span className="anatomy-token" style={{ "--tone": tone } as CSSProperties}>
      <strong>{label}</strong>
      <small>{description}</small>
    </span>
  );
}

function CommitExample({ example }: { example?: { title: string; description: string } }) {
  return (
    <div className="commit-example">
      <span className="commit-example-check">
        <CheckIcon aria-hidden="true" />
      </span>
      <div>
        <code className="commit-example-line">
          {example?.title ?? "fix(auth): refresh session before token expires"}
        </code>
        <p>
          {example?.description ??
            "Bumps the session expiry handler so tokens refresh while there is still time."}
        </p>
      </div>
    </div>
  );
}

function TypeCard({ entry }: { entry: (typeof PREFIXES)[number] }) {
  return (
    <article className="naming-type-card">
      <div className="naming-type-heading">
        <code className="naming-type-prefix" style={{ color: entry.tone ?? "var(--accent)" }}>
          {entry.prefix}
        </code>
        <span>{entry.description}</span>
      </div>
      <p className="naming-type-example">
        <code>{entry.example}</code>
      </p>
    </article>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="naming-section-card">
      <Icon aria-hidden="true" />
      <AnchorHeading level={3}>{title}</AnchorHeading>
      {children}
    </div>
  );
}
