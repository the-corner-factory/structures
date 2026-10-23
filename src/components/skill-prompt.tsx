import { ArrowUpRightIcon, CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import { copyText } from "#/lib/clipboard.ts";

export const FOLDER_SKILL_REQUESTS = ["init folder structure", "fix folder structure"];

export function SkillPrompt({ request }: { request: string | string[] }) {
  const requests = Array.isArray(request) ? request : [request];
  const commands = requests.map((item) => `/structures ${item}`);
  const [copiedCommand, setCopiedCommand] = useState("");
  const [failedCommand, setFailedCommand] = useState("");
  const copied = commands.includes(copiedCommand);
  const failed = commands.includes(failedCommand);

  const copyCommand = async (command: string) => {
    setCopiedCommand("");
    setFailedCommand("");
    try {
      await copyText(command);
      setCopiedCommand(command);
    } catch {
      setFailedCommand(command);
    }
  };

  return (
    <aside className="skill-prompt" aria-label="Use Structures in your project">
      <div className="skill-prompt-heading">
        <strong>Use Structures in your project</strong>
        <a
          href="https://github.com/the-corner-inc/structures/blob/main/docs/codex-plugin.md#packaging-and-installation"
          target="_blank"
          rel="noreferrer"
        >
          Install skill <ArrowUpRightIcon aria-hidden="true" />
        </a>
      </div>
      <div className="skill-prompt-commands">
        {requests.map((item, index) => (
          <div className="skill-prompt-command" key={item}>
            <code>
              <span>/structures</span> {item}
            </code>
            <button
              type="button"
              onClick={() => copyCommand(commands[index])}
              aria-label={`Copy ${commands[index]}`}
            >
              {copiedCommand === commands[index] ? (
                <CheckIcon aria-hidden="true" />
              ) : (
                <CopyIcon aria-hidden="true" />
              )}
              {copiedCommand === commands[index] ? "Copied" : "Copy"}
            </button>
          </div>
        ))}
      </div>
      <p className="skill-prompt-hint">Paste into your agent chat after installing the skill.</p>
      <p role="status" aria-atomic="true" className={failed ? "skill-prompt-error" : "sr-only"}>
        {failed
          ? `Could not copy. Select “${failedCommand}” above and copy it manually.`
          : copied
            ? "Command copied."
            : ""}
      </p>
    </aside>
  );
}
