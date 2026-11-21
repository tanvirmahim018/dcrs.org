import crypto from "node:crypto";

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

/** Run one Redis command through the Upstash REST API. */
export async function r(...cmd) {
  if (!URL_ || !TOKEN) throw new Error("Database is not connected. Add the Upstash Redis integration to this Vercel project.");
  const res = await fetch(URL_, { method: "POST", headers: { Authorization: "Bearer " + TOKEN }, body: JSON.stringify(cmd) });
  const j = await res.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET is missing. Add an environment variable of 16+ random characters.");
  return s;
};
const mac = (b) => crypto.createHmac("sha256", secret()).update(b).digest("base64url");

export const sign = (p) => { const b = Buffer.from(JSON.stringify(p)).toString("base64url"); return b + "." + mac(b); };
export const verify = (t) => {
  try {
    const [b, m] = t.split(".");
    const e = mac(b);
    if (m.length !== e.length || !crypto.timingSafeEqual(Buffer.from(m), Buffer.from(e))) return null;
    const p = JSON.parse(Buffer.from(b, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
};
export const setCookie = (res, v, age) =>
  res.setHeader("Set-Cookie", `dcrs_s=${v}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${age}`);
const cookieOf = (req) => ((req.headers.cookie || "").split(/;\s*/).map((s) => s.split("=")).find((a) => a[0] === "dcrs_s") || [])[1];

export const hashPw = (p, salt = crypto.randomBytes(16).toString("hex")) => ({ salt, hash: crypto.scryptSync(p, salt, 64).toString("hex") });
export const checkPw = (p, u) => {
  const h = crypto.scryptSync(p, u.salt, 64), k = Buffer.from(u.hash, "hex");
  return k.length === h.length && crypto.timingSafeEqual(h, k);
};
export const safeEq = (a = "", b = "") => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

export const getUser = async (name) => { const v = await r("HGET", "dcrs:users", name); return v ? JSON.parse(v) : null; };
export const body = (req) => (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {});

/** Returns the signed-in, approved user, or sends an error and returns null. */
export async function guard(req, res, ownerOnly = false) {
  if (req.method !== "GET" && req.headers["x-dcrs"] !== "1") { res.status(403).json({ error: "Bad request." }); return null; }
  const p = verify(cookieOf(req) || "");
  const u = p && (await getUser(p.u));
  if (!u || u.status !== "approved") { res.status(401).json({ error: "Please sign in." }); return null; }
  if (ownerOnly && u.role !== "owner") { res.status(403).json({ error: "Only the main admin can do this." }); return null; }
  return { ...u, u: p.u };
}

export const okContent = (c) =>
  c && typeof c === "object" && c.hero && c.site && Array.isArray(c.slides) && Array.isArray(c.sections) && Array.isArray(c.mem) && JSON.stringify(c).length < 400000;

export const fail = (res, e) => res.status(e.status || 500).json({ error: e.message || "Server error" });
