import { r, fail } from "../lib/util.js";
import defaults from "../lib/defaults.js";

// Public: the published website content.
export default async function handler(req, res) {
  try {
    let c = null;
    try { const v = await r("GET", "dcrs:content"); c = v ? JSON.parse(v) : null; } catch { /* fall back to defaults */ }
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=10, stale-while-revalidate=30");
    res.status(200).json(c || defaults);
  } catch (e) { fail(res, e); }
}
