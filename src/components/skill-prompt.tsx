import { ArrowUpRightIcon, CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import { copyText } from "#/lib/clipboard.ts";

export function SkillPrompt({ request }: { request: string }) {
  const command = `/structures ${request}`;
  const [copiedCommand, setCopiedCommand] = useState("");
  const [failedCommand, setFailedCommand] = useState("");
  const copied = copiedCommand === command;
  const failed = failedCommand === command;

  const copyCommand = async () => {
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
      <div className="skill-prompt-command">
        <code>
          <span>/structures</span> {request}
        </code>
        <button type="button" onClick={copyCommand} aria-label={`Copy ${command}`}>
          {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="skill-prompt-hint">Paste into your agent chat after installing the skill.</p>
      <p role="status" aria-atomic="true" className={failed ? "skill-prompt-error" : "sr-only"}>
        {failed
          ? "Could not copy. Select the command above and copy it manually."
          : copied
            ? "Command copied."
            : ""}
      </p>
    </aside>
  );
}
