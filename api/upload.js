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
    // Older Blob stores give a read/write token; newer ones give a store ID and use Vercel's built-in identity.
    const env = Object.entries(process.env);
    const token = process.env.PHOTOS_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || (env.find(([k, v]) => k.endsWith("_READ_WRITE_TOKEN") && v) || [])[1];
    const storeId = process.env.BLOB_STORE_ID || (env.find(([k, v]) => /BLOB/.test(k) && k.endsWith("_STORE_ID") && v) || [])[1];
    if (!token && !storeId) return res.status(500).json({ error: "Photo storage is not connected. In Vercel open this project's Storage tab, connect a Blob store, then redeploy." });
    const blob = await put("dcrs/" + name, req, { access: "public", addRandomSuffix: true, contentType: type, ...(token ? { token } : { storeId }) });
    res.status(200).json({ url: blob.url });
  } catch (e) { fail(res, e); }
}
export const config = { api: { bodyParser: false } };
