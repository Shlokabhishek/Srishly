# Srishly Logistics Network

Srishly is a production-oriented React + Vite single-page application for peer-to-peer parcel delivery. The app focuses on secure request creation, route discovery, traveler verification, and a sender/traveler dashboard that stays responsive on mobile and desktop.

## Tech Stack

- React 19: component-driven UI and concurrent-friendly rendering.
- TypeScript: stricter types for safer refactors and better runtime resilience.
- React Router: SPA routing with lazy loaded pages.
- Tailwind CSS v4: design tokens and responsive styling.
- Motion: lightweight page and component transitions.
- Vitest + Testing Library: unit and UI behavior tests.
- Netlify configuration: SPA rewrites plus secure response headers for deployment.

## Why This Structure

- `src/components`: shared layout, feedback, and UI primitives to reduce duplication.
- `src/pages`: route-level screens, lazy loaded for smaller initial bundles.
- `src/data`: trusted seed data for mock production flows.
- `src/lib`: formatting, validation, storage, and low-level utilities.
- `src/context`: app-wide sender/traveler mode state with persistence.
- `src/hooks`: reusable browser hooks such as document metadata and persisted state.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

The app starts on `http://localhost:3000`.

### Type Check

```bash
npm run typecheck
```

### Test

```bash
npm run test:run
```

### Production Build

```bash
npm run build
```

## Environment Variables

The current app does not require any secrets on the client. Keep sensitive credentials off the frontend. Use environment variables only for non-secret build metadata until a backend is introduced.

See [.env.example](./.env.example).

## Deployment

The project is ready for Netlify:

- `netlify.toml` defines the build command, publish directory, SPA rewrites, and security headers.
- `public/_redirects` ensures deep links resolve to `index.html`.

You can deploy with:

```bash
npm run build
```

Publish the generated `dist/` folder.

## Security Notes

- No hardcoded secrets or client-exposed API keys.
- Input validation and sanitization run before data is persisted.
- CSP and other hardening headers are configured in `netlify.toml`.
- React escaping is preserved throughout; no `dangerouslySetInnerHTML` is used.

## Project Features

- Multi-step parcel request flow with validation and submission feedback.
- Route discovery for travelers and senders.
- Sender/traveler dashboard with persisted local mock data.
- Trust center and verification review workflow.
- Loading, empty, and error states across core flows.
- Responsive navigation and accessible form labeling.
