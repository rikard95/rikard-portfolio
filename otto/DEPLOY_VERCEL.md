Vercel deployment steps

1) Install Vercel CLI (optional but convenient)

```bash
npm i -g vercel
```

2) Log in and link the project

```bash
vercel login
cd path/to/otto
vercel
# follow prompts to link/create a project
```

3) Add the `GITHUB_TOKEN` secret (do NOT paste token in public places)

Via CLI (recommended):

```bash
# choose the environment (production, preview, development)
vercel env add GITHUB_TOKEN production
vercel env add GITHUB_TOKEN preview
```

Or add it in the Vercel dashboard: Project → Settings → Environment Variables → Add `GITHUB_TOKEN`.

4) Deploy to production

```bash
vercel --prod
```

Notes
- The serverless handler in `api/github-repos.js` reads `process.env.GITHUB_TOKEN`.
- After deployment, the frontend will request `/api/github-repos` and the serverless function will use the token server-side (giving 5000 rate-limit).
- To test locally with serverless functions, use `vercel dev` (it will read your local `.env` file if you set it).
