import { r, sign, setCookie, hashPw, checkPw, safeEq, getUser, body, verify, fail } from "../lib/util.js";

const NAME = /^[a-z0-9_]{3,24}$/;

async function limited(req) {
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "local";
  const k = "dcrs:rl:" + ip;
  const n = await r("INCR", k);
  if (n === 1) await r("EXPIRE", k, 900);
  return n > 20;
}
const session = (res, u) => setCookie(res, sign({ u, exp: Date.now() + 7 * 864e5 }), 7 * 86400);

export default async function handler(req, res) {
  try {
    const q = req.query || {};
    if (req.method === "GET" && q.action === "status") {
      const owner = await r("GET", "dcrs:owner");
      return res.status(200).json({ needsOwner: !owner, setupReady: !!process.env.SETUP_CODE });
    }
    if (req.method === "GET" && q.action === "me") {
      const cookie = ((req.headers.cookie || "").split(/;\s*/).map((s) => s.split("=")).find((a) => a[0] === "dcrs_s") || [])[1];
      const p = verify(cookie || ""), u = p && (await getUser(p.u));
      if (!u || u.status !== "approved") return res.status(401).json({ error: "Not signed in." });
      return res.status(200).json({ user: { u: p.u, role: u.role } });
    }
    if (req.method !== "POST" || req.headers["x-dcrs"] !== "1") return res.status(400).json({ error: "Bad request." });
    const b = body(req), u = String(b.u || "").trim().toLowerCase(), p = String(b.p || "");

    if (b.action === "logout") { setCookie(res, "", 0); return res.status(200).json({ ok: true }); }

    if (b.action === "login") {
      if (await limited(req)) return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
      const user = await getUser(u);
      if (!user || !checkPw(p, user)) return res.status(401).json({ error: "Username or password is incorrect." });
      if (user.status === "pending") return res.status(403).json({ error: "Your account is waiting for approval by the main admin." });
      if (user.status !== "approved") return res.status(403).json({ error: "This account request was declined." });
      session(res, u);
      return res.status(200).json({ user: { u, role: user.role } });
    }

    if (b.action === "register") {
      if (await limited(req)) return res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
      if (!NAME.test(u)) return res.status(400).json({ error: "Username: 3–24 letters, numbers or underscores." });
      if (p.length < 8) return res.status(400).json({ error: "Password needs 8+ characters." });
      if (await getUser(u)) return res.status(409).json({ error: "That username is taken." });
      const needsOwner = !(await r("GET", "dcrs:owner"));
      let role = "admin", status = "pending";
      if (needsOwner) {
        if (!process.env.SETUP_CODE) return res.status(400).json({ error: "SETUP_CODE is not set on the server. Add it in Vercel, then redeploy." });
        if (!safeEq(String(b.code || ""), process.env.SETUP_CODE)) return res.status(403).json({ error: "The setup code is not correct." });
        if ((await r("SET", "dcrs:owner", u, "NX")) === "OK") { role = "owner"; status = "approved"; }
      }
      await r("HSET", "dcrs:users", u, JSON.stringify({ u, ...hashPw(p), role, status, created: Date.now() }));
      if (role === "owner") session(res, u);
      return res.status(200).json({ role, status });
    }
    res.status(400).json({ error: "Unknown action." });
  } catch (e) { fail(res, e); }
}
