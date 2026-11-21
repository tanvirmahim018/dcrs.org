import { r, guard, body, fail } from "../lib/util.js";

// Main admin only: list accounts and approve, decline or remove them.
export default async function handler(req, res) {
  try {
    if (!(await guard(req, res, true))) return;
    if (req.method === "GET") {
      const flat = (await r("HGETALL", "dcrs:users")) || [];
      const users = [];
      for (let i = 0; i < flat.length; i += 2) {
        const v = JSON.parse(flat[i + 1]);
        users.push({ id: flat[i], u: v.u, role: v.role, status: v.status, created: v.created });
      }
      users.sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1) || b.created - a.created);
      return res.status(200).json({ users });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
    const { action, id } = body(req);
    const raw = await r("HGET", "dcrs:users", String(id));
    if (!raw) return res.status(404).json({ error: "Account not found." });
    const u = JSON.parse(raw);
    if (u.role === "owner") return res.status(400).json({ error: "The main admin account cannot be changed." });
    if (action === "remove") await r("HDEL", "dcrs:users", id);
    else if (action === "approve" || action === "decline") {
      u.status = action === "approve" ? "approved" : "declined";
      await r("HSET", "dcrs:users", id, JSON.stringify(u));
    } else return res.status(400).json({ error: "Unknown action." });
    res.status(200).json({ ok: true });
  } catch (e) { fail(res, e); }
}
