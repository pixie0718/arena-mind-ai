const cache = new Map<string, Promise<string>>();

/** Strips any <script> tag as defense-in-depth before the markup is ever injected via dangerouslySetInnerHTML. */
function stripScripts(svgText: string): string {
  return svgText.replace(/<script[\s\S]*?<\/script>/gi, "");
}

/**
 * Fetches raw SVG markup as text (not as an <img src>, which can't expose
 * inner DOM nodes for per-section interactivity) and caches per URL for
 * the life of the page.
 */
export function fetchSvgMarkup(svgUrl: string): Promise<string> {
  const cached = cache.get(svgUrl);
  if (cached) return cached;

  const promise = fetch(svgUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`Could not load map artwork at "${svgUrl}".`);
      return res.text();
    })
    .then(stripScripts);

  promise.catch(() => cache.delete(svgUrl));
  cache.set(svgUrl, promise);
  return promise;
}
