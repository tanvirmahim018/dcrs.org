# DCRS website — Vercel edition

Public site at `/`, admin panel at `/admin`. Content is stored in Upstash Redis, photos in Vercel Blob,
passwords are hashed (scrypt) and sessions use a signed HttpOnly cookie.

## Deploy (about 10 minutes)

1. Put this folder in a GitHub repository (or run `npx vercel` inside it).
2. In Vercel, import the repository. No build settings are needed.
3. Project > **Storage**:
   - Add **Upstash Redis** (Marketplace). It adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
   - Add a **Blob** store (public access). It adds `BLOB_READ_WRITE_TOKEN` automatically.
4. Project > **Settings > Environment Variables**, add:
   - `AUTH_SECRET`: 32+ random characters (for example, run `openssl rand -hex 32`).
   - `SETUP_CODE`: a private code only you know. It is needed once, to create the main admin.
5. **Redeploy** so the variables take effect.
6. Open `https://YOUR-SITE.vercel.app/admin` > **Create account**. Because no main admin exists yet, the form asks
   for the setup code. That first account becomes the main admin.

## How the admin works

- **Create account / Sign in** are two tabs. Every account after the first is *pending* until the main admin approves it.
- The main admin sees a 🔔 notice on the dashboard when requests arrive, and manages them in the **Approvals** tab.
- Admins edit hero text, slider photos, sections and the committee. The right side shows a live preview.
- Edits save automatically as a shared **draft**. Visitors see nothing until someone presses **Apply & publish**.
- **Discard changes** returns the draft to the live version.

## Local development

```
npm i -g vercel
vercel link
vercel env pull .env.local
vercel dev
```

## Files

```
public/index.html, site.js, style.css   public website (reads /api/content)
public/admin/                           admin panel
public/img/                             logo and the three starter photos
api/auth.js      register, sign in, sign out, session check
api/content.js   published content (public)
api/draft.js     shared draft (admins)
api/publish.js   draft -> live (admins)
api/users.js     approve / decline / remove accounts (main admin)
api/upload.js    photo upload to Vercel Blob (admins)
lib/             Redis client, sessions, password hashing, default content
```

## Notes

- Never commit real secrets. Keep `AUTH_SECRET` and `SETUP_CODE` only in Vercel.
- Login attempts are rate limited (20 per 15 minutes per IP).
- If the database is not connected yet, the public site still shows the default content.
- Pages are drawn in the browser. To improve Google results later, the site can be moved to a server-rendered setup.
