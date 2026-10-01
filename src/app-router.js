const routes = {
  start: { document: "index.html", scripts: [], styles: [] },
  students: {
    document: "schuelerbearbeiten.html",
    scripts: ["schuelerbearbeiten.js", "createSchuelerPopup.js"],
    styles: ["schuelerbearbeiten.css"],
  },
  competence: {
    document: "fachliche-kompetenz.html",
    scripts: ["createSchuelerPopup.js", "fachliche-kompetenz.js", "fachliche-kompetenz-db.js"],
    styles: ["style_fk.css"],
  },
  research: {
    document: "fachwissenschaftliches-arbeiten.html",
    scripts: ["fachwissenschaftliches-arbeiten.js", "createSchuelerPopup.js"],
    styles: ["style_fwa.css"],
  },
  activities: {
    document: "zusaetzlich.html",
    scripts: ["createSchuelerPopup.js", "zusaetzlich.js"],
    styles: ["style_zs.css"],
  },
  export: { document: "export.html", scripts: ["export.js"], styles: ["style_ex.css"] },
  settings: { document: "settings.html", scripts: ["settings.js"], styles: ["style_set.css"] },
  contributors: { document: "contributors.html", scripts: [], styles: [] },
};

const routeByDocument = Object.fromEntries(
  Object.entries(routes).map(([route, config]) => [config.document, route]),
);
const views = new Map();
const loadedScripts = new Set();
const loadedStyles = new Set();
let latestNavigationId = 0;
const main = document.getElementById("main");
const header = document.getElementById("header");
const initialRoute = (() => {
  const hashRoute = window.location.hash.slice(1).replace(/^\//, "");
  if (routes[hashRoute]) return hashRoute;
  return routeByDocument[window.location.pathname.split("/").pop()] ?? "start";
})();
const initialView = {
  header: Array.from(header.children).map((child) => child.cloneNode(true)),
  content: document.getElementById("content"),
};
normalizeView(initialView.content);

function routeFromLocation() {
  const route = window.location.hash.slice(1).replace(/^\//, "");
  if (routes[route]) return route;
  const documentName = window.location.pathname.split("/").pop();
  return routeByDocument[documentName] ?? "start";
}

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
  view.querySelectorAll("[onclick]").forEach((element) => {
    const match = element.getAttribute("onclick")?.match(/window\.location\.href\s*=\s*['\"]([^'\"]+)/);
    const route = match ? routeFromHref(match[1]) : null;
    if (route) {
      element.dataset.route = route;
      element.removeAttribute("onclick");
    }
  });
}

async function loadView(route) {
  if (route === initialRoute && !views.has(route)) {
    views.set(route, initialView);
  }
  if (views.has(route)) return views.get(route);

  const response = await fetch(routes[route].document);
  if (!response.ok) throw new Error(`Could not load ${routes[route].document}`);
  const documentText = await response.text();
  const parsed = new DOMParser().parseFromString(documentText, "text/html");
  const content = parsed.querySelector("#content");
  const sourceHeader = parsed.querySelector("#header");
  if (!content || !sourceHeader) throw new Error(`Invalid SPA view: ${route}`);

  normalizeView(content);
  const view = {
    header: Array.from(sourceHeader.children).map((child) => child.cloneNode(true)),
    content,
  };
  views.set(route, view);
  return view;
}

async function loadAssets(route) {
  const config = routes[route];
  for (const style of config.styles) {
    if (loadedStyles.has(style)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = style;
    link.dataset.spaStyle = style;
    document.head.appendChild(link);
    loadedStyles.add(style);
  }
  for (const script of config.scripts) {
    if (loadedScripts.has(script)) continue;
    await import(`./${script}`);
    loadedScripts.add(script);
  }
}

export async function navigate(route, { replace = false } = {}) {
  if (!routes[route]) return;
  const navigationId = ++latestNavigationId;
  const nextLocation = `#/${route}`;
  if (window.location.hash !== nextLocation) {
    history[replace ? "replaceState" : "pushState"]({}, "", nextLocation);
  }

  const view = await loadView(route);
  if (navigationId !== latestNavigationId) return;
  header.replaceChildren(...view.header.map((child) => child.cloneNode(true)));
  main.replaceChildren(view.content);
  document.title = "MINT-EC-Zertifikat";
  document.querySelectorAll("#navLinks a").forEach((link) => {
    const target = routeFromHref(link.getAttribute("href"));
    if (target) link.dataset.route = target;
  });
  await loadAssets(route);
  if (navigationId !== latestNavigationId) return;
  window.dispatchEvent(new CustomEvent("app-route-changed", { detail: { route } }));
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-route], a[href]");
  if (!target) return;
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    target.hasAttribute("download") ||
    (target.target && target.target !== "_self")
  ) return;
  const route = target.dataset.route ?? routeFromHref(target.getAttribute("href"));
  if (!route) return;
  event.preventDefault();
  navigate(route).catch((error) => console.error("SPA navigation failed:", error));
});

window.addEventListener("app-navigate", (event) => {
  navigate(event.detail).catch((error) => console.error("SPA navigation failed:", error));
});

window.addEventListener("hashchange", () => {
  navigate(routeFromLocation(), { replace: true }).catch((error) => console.error("SPA navigation failed:", error));
});

window.addEventListener("popstate", () => {
  navigate(routeFromLocation(), { replace: true }).catch((error) => console.error("SPA navigation failed:", error));
});

await navigate(routeFromLocation(), { replace: true });
await import("./index_script.js");
