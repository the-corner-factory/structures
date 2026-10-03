import { Link } from "@tanstack/react-router";
import {
  ChevronRightIcon,
  CircleDotIcon,
  FolderTreeIcon,
  GitBranchIcon,
  KanbanIcon,
  PenLineIcon,
  BotIcon,
  TagsIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { TOPICS, type Topic } from "#/lib/structures.ts";

const TOPIC_ICONS: Record<Topic["name"], LucideIcon> = {
  Folders: FolderTreeIcon,
  Labels: TagsIcon,
  Status: KanbanIcon,
  Issues: CircleDotIcon,
  Naming: PenLineIcon,
  Branches: GitBranchIcon,
  Agentic: BotIcon,
};

export function HomeTopics() {
  return (
    <section className="library-chooser topics-page">
      <div className="chooser-intro">
        <p className="eyebrow">Community knowledge, made navigable</p>
        <h1>Project organization, explained</h1>
        <p>
          Browse opinionated standards for folders, issues, and boards — every entry documented in
          Markdown. Load one Gist in the navigation to apply your project’s standards across the
          website.
        </p>
      </div>

      <div className="topic-grid">
        {TOPICS.map((topic) => {
          const Icon = TOPIC_ICONS[topic.name];
          return "to" in topic ? (
            <Link key={topic.name} to={topic.to} className="topic-card">
              <span className="topic-icon">
                <Icon aria-hidden="true" />
              </span>
              <span className="topic-name">{topic.name}</span>
              <p>{topic.description}</p>
              <ChevronRightIcon aria-hidden="true" />
            </Link>
          ) : (
            <button key={topic.name} type="button" className="topic-card" disabled>
              <span className="topic-icon">
                <Icon aria-hidden="true" />
              </span>
              <span className="topic-name">{topic.name}</span>
              <p>{topic.description}</p>
              <small>Coming soon</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
