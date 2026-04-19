<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Shipping rules — push to BOTH git and Vercel

GitHub → Vercel auto-sync on this project is unreliable. Every time you ship:

1. `git push origin main` (or whatever branch is being shipped).
2. Immediately after, run `vercel deploy --prod --yes` from the repo root to force a production deploy.
3. Verify the deploy landed by curling a known route on `udemi.tech` (e.g. `curl -sS -o /dev/null -w "%{http_code}\n" https://udemi.tech/`) and expecting `200`. Grep the response body for a string you know is new in this ship to confirm the content matches HEAD, not a stale build.
4. Report both SHAs + the Vercel deployment URL back to the user.

Never assume the git push alone is enough. Never skip step 3 — the production URL is the source of truth for "is it live."
