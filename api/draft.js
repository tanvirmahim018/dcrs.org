import { r, guard, body, okContent, fail } from "../lib/util.js";
import defaults from "../lib/defaults.js";

// Admin: read, save or discard the shared draft.
export default async function handler(req, res) {
  try {
    if (!(await guard(req, res))) return;
    if (req.method === "GET") {
      const d = await r("GET", "dcrs:draft");
      return res.status(200).json({ draft: d ? JSON.parse(d) : null });
    }
    if (req.method === "PUT") {
      const { content } = body(req);
      if (!okContent(content)) return res.status(400).json({ error: "Content is invalid or too large." });
      await r("SET", "dcrs:draft", JSON.stringify(content));
      return res.status(200).json({ ok: true });
    }
    if (req.method === "DELETE") { await r("DEL", "dcrs:draft"); return res.status(200).json({ ok: true }); }
    res.status(405).json({ error: "Method not allowed." });
  } catch (e) { fail(res, e); }
}
