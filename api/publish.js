import { r, guard, okContent, fail } from "../lib/util.js";

// Admin: make the saved draft the live website.
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
    const u = await guard(req, res);
    if (!u) return;
    const d = await r("GET", "dcrs:draft");
    const c = d && JSON.parse(d);
    if (!okContent(c)) return res.status(400).json({ error: "There is no valid draft to publish." });
    await r("SET", "dcrs:content", d);
    await r("SET", "dcrs:published_by", JSON.stringify({ u: u.u, at: Date.now() }));
    res.status(200).json({ ok: true });
  } catch (e) { fail(res, e); }
}
