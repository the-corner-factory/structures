import { ChevronRightIcon } from "lucide-react";

import { EXPLORER_FRAMEWORKS, type ExplorerKind } from "#/lib/structures.ts";

interface LibraryChooserProps {
  kind: ExplorerKind;
  onSelect: (library: string) => void;
}

export function LibraryChooser({ kind, onSelect }: LibraryChooserProps) {
  return (
    <section className="library-chooser">
      <div className="chooser-intro">
        <p className="eyebrow">Community knowledge, made navigable</p>
        <h1>{kind === "folders" ? "Explore a project structure" : "Explore an issue workflow"}</h1>
        <p>
          Open an opinionated template, or load website settings in the navigation. Hover or select
          any item to read the reasoning behind it.
        </p>
      </div>

      <div className="framework-grid">
        {EXPLORER_FRAMEWORKS[kind].map((group) => (
          <section className="framework-group" key={group.name}>
            <h2>{group.name}</h2>
            <div>
              {group.children.map((framework) => (
                <button
                  type="button"
                  key={framework.name}
                  disabled={framework.disabled}
                  onClick={() => onSelect(framework.library)}
                >
                  <span>{framework.name}</span>
                  {framework.disabled ? <small>Coming soon</small> : <ChevronRightIcon />}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
