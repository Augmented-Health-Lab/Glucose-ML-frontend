# Glucose-ML Frontend

The public web interface for exploring and comparing continuous glucose monitoring datasets cataloged by the Glucose-ML project.

Production: [www.glucose-ml-project.com](https://www.glucose-ml-project.com/)

## Repository scope

This repository contains only the deployable React frontend, its tests, required visual assets, and runtime data used by the site. Runtime data is aggregate except for one explicitly approved participant-day visualization on the Background page. It does not contain source datasets, controlled-access dataset files, or the private data-processing workspace.

The approved Background visualization contains four participant-day traces with dataset names, subject identifiers, and dates. Their inclusion does not grant access to or permission to reuse the underlying datasets. All dataset access and reuse remain governed by each dataset provider's terms, linked from the application.

## Development

```bash
cd frontend/glucose-ml-web
npm ci
node --test tests/*.test.ts
npm run lint
npm run build
npm run dev
```

The application is built with Vite, React, and TypeScript. Runtime data is served from `frontend/glucose-ml-web/public/static_data/`.

## Deployment

Vercel deploys the `main` branch using the root `vercel.json`. The build output is `frontend/glucose-ml-web/dist`, and all application routes rewrite to `index.html` for client-side routing.

## License

Project-authored code is available under the [MIT License](LICENSE). Dataset content, publications, names, and third-party assets remain subject to their respective owners' terms.
