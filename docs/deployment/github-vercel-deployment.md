# GitHub and Vercel Deployment

## Project

- GitHub repository: `https://github.com/muthusenuar7-ai/power-bi-theme-builder`
- Local path: `F:\DatacenseProjects\datacense-pbi-theme-studio`
- Framework: Next.js
- Production branch: `main`

## Local Build

```powershell
npm.cmd install
npm.cmd run build
```

## Vercel Recommended Settings

- Framework Preset: Next.js
- Root Directory: `./`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leave blank/default for Next.js
- Production Branch: `main`

No `vercel.json` is required for the current app.

## Environment Variables

The current app does not require environment variables.

If future integrations require environment variables:

1. Add placeholder names only to `.env.example`.
2. Add real values only in local `.env.local` or in the Vercel dashboard.
3. Never commit `.env`, `.env.local`, `.env.production`, `.vercel`, tokens, or credentials.

## Safe Deployment Checklist

Before pushing:

```powershell
npm.cmd run build
git status --short
git remote -v
git branch --show-current
```

Confirm:

- Build passes.
- Branch is `main`.
- Remote origin points to `https://github.com/muthusenuar7-ai/power-bi-theme-builder.git`.
- No `.env`, `.env.local`, `.vercel`, `.next`, `node_modules`, logs, or local cache files are staged.

## Publish Future Changes

```powershell
git add .
git status --short
git commit -m "Describe the change"
git push
```

Vercel will redeploy automatically after pushes to `main` once the GitHub repository is connected.

## Vercel Dashboard Deployment

1. Open Vercel.
2. Choose Add New Project.
3. Import `muthusenuar7-ai/power-bi-theme-builder` from GitHub.
4. Confirm the settings listed above.
5. Add environment variables only if future features require them.
6. Click Deploy.

## Optional Vercel CLI

Use this only after authenticating locally:

```powershell
npm.cmd install -g vercel
vercel login
vercel
vercel --prod
```

The dashboard GitHub integration is preferred for this project because production deploys then follow normal Git pushes.

## Troubleshooting

### Port Already In Use

Use another dev port:

```powershell
npm.cmd run dev -- --port 3001
```

### Build Failed

Run:

```powershell
npm.cmd run build
```

Fix TypeScript or Next.js errors locally before pushing.

### Missing Environment Variables

Check Vercel Project Settings > Environment Variables. Keep real values out of Git and update `.env.example` with placeholder names only.

### Vercel Import Failed

Confirm Vercel has access to the GitHub account or organization and that the repository exists at:

`https://github.com/muthusenuar7-ai/power-bi-theme-builder`

### Git Authentication Failed

Sign in through Git Credential Manager, GitHub Desktop, or the browser flow. Do not paste passwords or tokens into chat or commit them into files.
