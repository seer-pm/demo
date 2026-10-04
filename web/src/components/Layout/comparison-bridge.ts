/** Loaded only by the opt-in review Vite plugin, never in normal app builds. */
if (typeof window !== "undefined" && window.parent !== window) {
  const reviewOrigin = "http://localhost:3002";
  const report = () =>
    window.parent.postMessage(
      { type: "seer:route", path: location.pathname + location.search + location.hash },
      reviewOrigin,
    );
  let last = "";
  const timer = window.setInterval(() => {
    const next = location.href;
    if (next !== last) {
      last = next;
      report();
    }
  }, 350);
  window.addEventListener("message", (event) => {
    if (event.origin !== reviewOrigin || event.source !== window.parent || event.data?.type !== "seer:navigate") return;
    const path = event.data.path;
    if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return;
    const target = new URL(path, location.origin);
    if (target.origin === location.origin && target.href !== location.href) location.assign(target.href);
  });
  window.addEventListener("pagehide", () => clearInterval(timer), { once: true });
  report();
}
export {};
