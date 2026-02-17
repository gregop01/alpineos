# Deploy AlpineOS to Vercel

## Prerequisites

- [Vercel account](https://vercel.com/signup) (free tier works)
- Git repository (GitHub, GitLab, or Bitbucket)
- Your Supabase project and Mapbox token ready

## Step 1: Push to Git

If you haven't already, initialize and push your code:

```bash
cd alpineos
git init
git add .
git commit -m "Initial commit"
# Create a repo on GitHub/GitLab/Bitbucket, then:
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

## Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel will auto-detect Next.js—no extra config needed
4. **Root Directory:** If alpineos is in a subfolder, set it to `alpineos`

## Step 3: Environment Variables

In the Vercel project → **Settings → Environment Variables**, add:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | ✅ | [Get from Mapbox](https://account.mapbox.com/) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | For `/api/scrape` and `/api/scrape-gtc` (backend-only, never exposed) |
| `GEMINI_API_KEY` | Optional | For location chat/summary features |

Add these for Production, Preview, and Development so they apply to all deployments.

## Step 4: Deploy

Click **Deploy**. Vercel will build and deploy your app.

## Notes

- **Scrape API timeouts:** `/api/scrape` and `/api/scrape-gtc` allow up to 60–90 seconds. On the **Hobby** plan, serverless functions are capped at 10 seconds. For full scrape support, upgrade to **Pro** or run scrapes locally/in a cron job.
- **Preview deployments:** Every branch/PR gets its own preview URL.
- **Supabase CORS:** Add your Vercel domain (e.g. `*.vercel.app` and your production domain) to Supabase Auth → URL Configuration if you use auth.
