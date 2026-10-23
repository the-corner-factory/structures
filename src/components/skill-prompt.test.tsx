// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vite-plus/test";

import { FOLDER_SKILL_REQUESTS, SkillPrompt } from "./skill-prompt.tsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, "execCommand");
});

it("copies the complete request and announces success without executing it", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  const { rerender } = render(<SkillPrompt request="create commit title" />);

  fireEvent.click(screen.getByRole("button", { name: "Copy /structures create commit title" }));

  await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Command copied."));
  expect(writeText).toHaveBeenCalledWith("/structures create commit title");
  expect(screen.getByRole("link", { name: "Install skill" }).getAttribute("href")).toContain(
    "docs/codex-plugin.md#packaging-and-installation",
  );

  rerender(<SkillPrompt request="help" />);
  expect(screen.getByRole("status").textContent).toBe("");
  expect(screen.getByRole("button", { name: "Copy /structures help" }).textContent).toBe("Copy");
});

it("falls back when clipboard access is denied and restores keyboard focus", async () => {
  vi.stubGlobal("navigator", {
    clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Permission denied")) },
  });
  const execCommand = vi.fn(() => {
    expect(document.querySelector("textarea")?.value).toBe("/structures fix folder structure");
    return true;
  });
  Object.defineProperty(document, "execCommand", { value: execCommand, configurable: true });
  render(<SkillPrompt request="fix folder structure" />);
  const copy = screen.getByRole("button", { name: "Copy /structures fix folder structure" });
  copy.focus();
  fireEvent.click(copy);

  await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Command copied."));
  expect(execCommand).toHaveBeenCalledWith("copy");
  expect(document.querySelector("textarea")).toBeNull();
  expect(document.activeElement).toBe(copy);
});

it("copies each folder example separately and clears feedback from the previous command", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  render(<SkillPrompt request={FOLDER_SKILL_REQUESTS} />);

  const init = screen.getByRole("button", { name: "Copy /structures init folder structure" });
  const fix = screen.getByRole("button", { name: "Copy /structures fix folder structure" });
  fireEvent.click(init);
  await waitFor(() => expect(init.textContent).toBe("Copied"));
  expect(fix.textContent).toBe("Copy");
  expect(writeText).toHaveBeenLastCalledWith("/structures init folder structure");

  writeText.mockRejectedValueOnce(new Error("Copy unavailable"));
  fireEvent.click(fix);
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toContain("“/structures fix folder structure”"),
  );
  expect(init.textContent).toBe("Copy");
  expect(screen.queryByText("Copied")).toBeNull();

  fireEvent.click(fix);
  await waitFor(() => expect(fix.textContent).toBe("Copied"));
  expect(init.textContent).toBe("Copy");
  expect(writeText).toHaveBeenLastCalledWith("/structures fix folder structure");
  expect(screen.getByRole("status").textContent).toBe("Command copied.");
});

it("offers manual copying and cleans up when both clipboard methods fail", async () => {
  vi.stubGlobal("navigator", {});
  Object.defineProperty(document, "execCommand", {
    value: vi.fn(() => {
      throw new Error("Copy is unavailable");
    }),
    configurable: true,
  });
  render(<SkillPrompt request="help" />);
  fireEvent.click(screen.getByRole("button", { name: "Copy /structures help" }));

  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("copy it manually"));
  expect(document.querySelector("textarea")).toBeNull();
  expect(screen.queryByText("Copied")).toBeNull();
});
