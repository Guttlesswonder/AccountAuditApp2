# Strategic Account Audit (v1.1)

Frontend-only React + TypeScript + Vite + Tailwind app for internal account briefing and structured audits.

## Local setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deployment (GitHub -> Vercel)

1. Push this repo to GitHub.
2. In Vercel, create a new project and import the GitHub repository.
3. Use standard Vite settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy.

## Data storage model in v1.1

- Main structured account data is stored locally in the current browser via `localStorage` through a storage provider abstraction.
- Optional Terms PDF attachments are stored locally in this browser via IndexedDB.
- Terms file metadata is persisted on the account record for display/export.
- No backend, authentication, CRM APIs, or SharePoint APIs are included.

## Migration intent

The code intentionally isolates types, scoring, checklist config, opportunity/risk derivation, export logic, and storage provider boundaries so persistence can later migrate to a shared SharePoint-friendly model without rewriting domain logic/UI.
