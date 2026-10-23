export async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Older browsers can expose the API while denying it outside a secure context.
    }
  }

  const previousFocus = document.activeElement;
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.setAttribute("aria-hidden", "true");
  input.tabIndex = -1;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  try {
    input.select();
    if (!document.execCommand("copy")) throw new Error("The browser denied clipboard access.");
  } finally {
    input.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
  }
}
