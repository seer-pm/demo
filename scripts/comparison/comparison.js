const origins = { current: "http://localhost:3001", proposed: "http://localhost:3000" };
const params = new URLSearchParams(location.search);
const safe = path => typeof path === "string" && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
let route = safe(params.get("path")) ? params.get("path") : "/";
let active = params.get("view") === "current" ? "current" : "proposed";
const paths = { current: route, proposed: route };
const frames = Object.fromEntries(Object.keys(origins).map(view => [view, document.getElementById(`${view}-frame`)]));
const buttons = Object.fromEntries(Object.keys(origins).map(view => [view, document.getElementById(view)]));
function update() {
  for (const view of Object.keys(origins)) {
    frames[view].hidden = view !== active;
    buttons[view].setAttribute("aria-pressed", String(view === active));
  }
  document.getElementById("open").href = origins[active] + route;
  document.getElementById("status").textContent = active === "current" ? "Current · baseline 60423441" : "Proposed · redesign branch";
  history.replaceState(null, "", `?view=${active}&path=${encodeURIComponent(route)}`);
}
for (const view of Object.keys(origins)) {
  frames[view].src = origins[view] + route;
  buttons[view].addEventListener("click", () => {
    if (paths[view] !== route) {
      frames[view].src = origins[view] + route;
      paths[view] = route;
    }
    active = view;
    update();
  });
}
window.addEventListener("message", event => {
  const view = Object.keys(origins).find(view => event.origin === origins[view] && event.source === frames[view].contentWindow);
  if (!view || event.data?.type !== "seer:route" || !safe(event.data.path)) return;
  paths[view] = event.data.path;
  if (view === active) { route = event.data.path; update(); }
});
document.getElementById("retry").onclick = () => { frames[active].src = origins[active] + route; };
window.addEventListener("keydown", event => { if (event.key === "Escape") buttons[active].focus(); });
update();
