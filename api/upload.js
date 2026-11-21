import { put } from "@vercel/blob";
import { guard, fail } from "../lib/util.js";

// Admin: upload one image (sent as the raw request body) to Vercel Blob.
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
    if (!(await guard(req, res))) return;
    const type = String(req.headers["content-type"] || "");
    if (!/^image\/(jpeg|png|webp|gif)$/.test(type)) return res.status(400).json({ error: "Only JPEG, PNG, WebP or GIF images." });
    const name = String((req.query || {}).name || "photo.jpg").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 60);
    const blob = await put("dcrs/" + name, req, { access: "public", addRandomSuffix: true, contentType: type });
    res.status(200).json({ url: blob.url });
  } catch (e) { fail(res, e); }
}
export const config = { api: { bodyParser: false } };
