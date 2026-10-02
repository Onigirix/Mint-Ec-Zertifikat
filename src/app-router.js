const routes = {
  start: { document: "index.html", scripts: [], styles: [] },
  students: { document: "schuelerbearbeiten.html", scripts: ["schuelerbearbeiten.js", "createSchuelerPopup.js"], styles: ["schuelerbearbeiten.css"] },
  competence: { document: "fachliche-kompetenz.html", scripts: ["createSchuelerPopup.js", "fachliche-kompetenz.js", "fachliche-kompetenz-db.js"], styles: ["style_fk.css"] },
  research: { document: "fachwissenschaftliches-arbeiten.html", scripts: ["fachwissenschaftliches-arbeiten.js", "createSchuelerPopup.js"], styles: ["style_fwa.css"] },
  activities: { document: "zusaetzlich.html", scripts: ["createSchuelerPopup.js", "zusaetzlich.js"], styles: ["style_zs.css"] },
  export: { document: "export.html", scripts: ["export.js"], styles: ["style_ex.css"] },
  settings: { document: "settings.html", scripts: ["settings.js"], styles: ["style_set.css"] },
  contributors: { document: "contributors.html", scripts: [], styles: [] },
};

const pageNavigation = {
  competence: { previous: ["students", "Previous page"], next: ["research", "Next page"] },
  research: { previous: ["competence", "Previous page"], next: ["activities", "Next page"] },
  activities: { previous: ["research", "Previous page"], next: ["export", "Next page"] },
};

const routeByDocument = Object.fromEntries(Object.entries(routes).map(([route, config]) => [config.document, route]));
const views = new Map();
const loadedScripts = new Set();
const loadedStyles = new Set();
const styleLoads = new Map();
let latestNavigationId = 0;
const main = document.getElementById("main");
const header = document.getElementById("header");

function routeFromLocation() {
  const hashRoute = window.location.hash.slice(1).replace(/^\//, "");
  if (routes[hashRoute]) return hashRoute;
  const documentName = window.location.pathname.split("/").pop();
  return routeByDocument[documentName] ?? "start";
}

const initialRoute = routeFromLocation();
const initialView = { header: Array.from(header.children).map(child => child.cloneNode(true)), content: document.getElementById("content") };

function routeFromHref(href) {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    return routeByDocument[url.pathname.split("/").pop()] ?? null;
  } catch {
    return null;
  }
}

function normalizeView(view) {
  view.querySelectorAll("[onclick]").forEach(element => {
    const match = element.getAttribute("onclick")?.match(/window\.location\.href\s*=\s*['\"]([^'\"]+)/);
    const route = match ? routeFromHref(match[1]) : null;
    if (route) {
      element.dataset.route = route;
      element.removeAttribute("onclick");
    }
  });
}

function renderPageNavigation(route) {
  document.querySelectorAll("body > [data-page-nav]").forEach(button => button.remove());
  const navigation = pageNavigation[route];
  if (!navigation) return;

  for (const [direction, [destination, label]] of Object.entries(navigation)) {
    const button = document.createElement("button");
    const isPrevious = direction === "previous";
    button.type = "button";
    button.className = "blauerButton";
    button.dataset.pageNav = direction;
    button.setAttribute("aria-label", label);
    button.title = label;
    const icon = document.createElement("span");
    icon.className = "material-symbols-rounded";
    icon.textContent = isPrevious ? "arrow_back" : "arrow_forward";
    button.append(icon);
    Object.assign(button.style, {
      position: "fixed",
      top: "auto",
      bottom: "16px",
      left: isPrevious ? "16px" : "auto",
      right: isPrevious ? "auto" : "16px",
      zIndex: "900",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "44px",
      minHeight: "44px",
    });
    button.addEventListener("click", () => navigate(destination));
    document.body.append(button);
  }
}

normalizeView(initialView.content);

async function loadView(route) {
  if (route === initialRoute && !views.has(route)) views.set(route, initialView);
  if (views.has(route)) return views.get(route);
  const response = await fetch(routes[route].document);
  if (!response.ok) throw new Error(`Could not load ${routes[route].document}`);
  const parsed = new DOMParser().parseFromString(await response.text(), "text/html");
  const content = parsed.querySelector("#content");
  const sourceHeader = parsed.querySelector("#header");
  if (!content || !sourceHeader) throw new Error(`Invalid SPA view: ${route}`);
  normalizeView(content);
  const view = { header: Array.from(sourceHeader.children).map(child => child.cloneNode(true)), content };
  views.set(route, view);
  return view;
}

function waitForStylesheet(link, style) {
  if (link.sheet) return Promise.resolve();

  if (!styleLoads.has(style)) {
    styleLoads.set(style, new Promise((resolve, reject) => {
      link.addEventListener("load", () => resolve(), { once: true });
      link.addEventListener("error", () => reject(new Error(`Could not load ${style}`)), { once: true });
    }));
  }

  return styleLoads.get(style);
}

async function loadAssets(route, navigationId) {
  const config = routes[route];
  for (const style of config.styles) {
    let link = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(item => new URL(item.href, location.href).pathname.split("/").pop() === style);
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = style;
      document.head.appendChild(link);
    }
    link.dataset.spaStyle = style;
    if (loadedStyles.has(style)) continue;
    await waitForStylesheet(link, style);
    loadedStyles.add(style);
  }
  for (const script of config.scripts) {
    if (loadedScripts.has(script)) continue;
    await import(`./${script}`);
    loadedScripts.add(script);
  }
  if (navigationId !== latestNavigationId) return;
}

export async function navigate(route, { replace = false } = {}) {
  if (!routes[route]) return;
  const navigationId = ++latestNavigationId;
  const nextLocation = `#/${route}`;
  if (location.hash !== nextLocation) history[replace ? "replaceState" : "pushState"]({}, "", nextLocation);
  const view = await loadView(route);
  if (navigationId !== latestNavigationId) return;
  header.replaceChildren(...view.header.map(child => child.cloneNode(true)));
  main.replaceChildren(view.content);
  document.body.className = `app-root page-${route}`;
  document.title = "MINT-EC-Zertifikat";
  document.querySelectorAll("#navLinks a").forEach(link => {
    const target = routeFromHref(link.getAttribute("href"));
    if (target) link.dataset.route = target;
  });
  renderPageNavigation(route);
  try {
    await loadAssets(route, navigationId);
  } catch (error) {
    if (navigationId === latestNavigationId) throw error;
    return;
  }
  if (navigationId !== latestNavigationId) return;
  renderPageNavigation(route);
  window.dispatchEvent(new CustomEvent("app-route-changed", { detail: { route } }));
}

document.addEventListener("click", event => {
  const target = event.target.closest("[data-route], a[href]");
  if (!target || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || target.hasAttribute("download") || (target.target && target.target !== "_self")) return;
  const route = target.dataset.route ?? routeFromHref(target.getAttribute("href"));
  if (!route) return;
  event.preventDefault();
  navigate(route).catch(error => console.error("SPA navigation failed:", error));
});
window.addEventListener("app-navigate", event => navigate(event.detail).catch(error => console.error("SPA navigation failed:", error)));
window.addEventListener("hashchange", () => navigate(routeFromLocation(), { replace: true }).catch(error => console.error("SPA navigation failed:", error)));
window.addEventListener("popstate", () => navigate(routeFromLocation(), { replace: true }).catch(error => console.error("SPA navigation failed:", error)));

await navigate(initialRoute, { replace: true });
await import("./index_script.js");
