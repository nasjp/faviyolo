const stylesheetCache = new Map<string, HTMLLinkElement>();
const loadCache = new Map<string, Promise<void>>();

function createIdentifier(cssHref: string) {
  if (typeof btoa === "function") {
    return `favigen-font-${btoa(cssHref)
      .replace(/=+/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")}`;
  }
  return `favigen-font-${encodeURIComponent(cssHref)}`;
}

function ensureFontStylesheet(cssHref: string) {
  if (typeof document === "undefined") {
    return undefined;
  }
  let link = stylesheetCache.get(cssHref);
  if (link && document.head.contains(link)) {
    return link;
  }
  const identifier = createIdentifier(cssHref);
  link =
    document.querySelector<HTMLLinkElement>(
      `link[data-favigen-font="${identifier}"]`,
    ) ??
    document.getElementById(identifier) ??
    undefined;
  if (link instanceof HTMLLinkElement) {
    stylesheetCache.set(cssHref, link);
    return link;
  }
  const nextLink = document.createElement("link");
  nextLink.rel = "stylesheet";
  nextLink.href = cssHref;
  nextLink.setAttribute("data-favigen-font", identifier);
  nextLink.id = identifier;
  document.head.appendChild(nextLink);
  stylesheetCache.set(cssHref, nextLink);
  return nextLink;
}

export type LoadFontFaceOptions = {
  cssHref: string;
  fontFamily: string;
  weight?: string;
  text?: string;
  size?: number;
};

async function loadFontOnce({
  cssHref,
  fontFamily,
  text,
  weight = "400",
  size = 64,
}: LoadFontFaceOptions) {
  const link = ensureFontStylesheet(cssHref);
  if (typeof document === "undefined") {
    return;
  }
  if (!link) {
    throw new Error(`Failed to create link element for ${cssHref}`);
  }
  if (typeof document.fonts === "undefined") {
    return;
  }

  const descriptor = `${weight} ${size}px "${fontFamily}"`;
  const fontLoadPromise = document.fonts.load(descriptor, text);

  return await new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      link.removeEventListener("error", onError);
    };

    const onError = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(new Error(`Failed to load font stylesheet: ${cssHref}`));
    };

    link.addEventListener("error", onError, { once: true });

    fontLoadPromise
      .then(() => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve();
      })
      .catch((error) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        reject(error);
      });
  });
}

export function loadFontFace(options: LoadFontFaceOptions) {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }
  const key = `${options.cssHref}|${options.fontFamily}|${options.weight ?? "400"}|${options.size ?? 64}`;
  const cached = loadCache.get(key);
  if (cached) {
    return cached;
  }
  const promise = loadFontOnce(options)
    .catch((error) => {
      loadCache.delete(key);
      throw error;
    })
    .then(() => {
      loadCache.set(key, Promise.resolve());
    });
  loadCache.set(key, promise);
  return promise;
}

export function clearFontLoadCache() {
  loadCache.clear();
}
