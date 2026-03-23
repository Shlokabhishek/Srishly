# Srishly Logistics Network

Srishly is a Vite + React application for peer-to-peer parcel logistics. The app now supports Vercel deployment with MongoDB Atlas-backed serverless APIs for parcels, trips, dashboard state, and verification queues.

## Stack

- React 19 + TypeScript
- Vite for the frontend build
- React Router for SPA routing
- Tailwind CSS v4 for styling
- Motion for UI transitions
- Vercel serverless functions in `api/`
- MongoDB Atlas for persistent storage
- Vitest + Testing Library for tests

## Project Structure

- `src/`: frontend application
- `api/`: Vercel serverless API routes and MongoDB access
- `src/services/mockApi.ts`: client data layer that uses `/api/*` in production and falls back only during local frontend-only development
- `vercel.json`: Vercel SPA rewrite and output configuration

## Environment Variables

Create a local `.env` or configure these in Vercel:

```bash
VITE_APP_NAME=Srishly
VITE_SUPPORT_EMAIL=team.srishly@gmail.com
VITE_API_BASE_URL=
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db>?retryWrites=true&w=majority
MONGODB_DB_NAME=srishly
```

Notes:

- Leave `VITE_API_BASE_URL` empty on Vercel so the frontend uses same-origin `/api`.
- Never expose `MONGODB_URI` to the client. It is only used by the serverless functions.

## MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster.
2. Create a database user with read/write access.
3. Add your Vercel deployment IP access rule, or temporarily allow access from anywhere for testing.
4. Copy the connection string into `MONGODB_URI`.
5. Set `MONGODB_DB_NAME=srishly` or your preferred database name.

The API auto-seeds demo data into empty collections:

- `parcels`
- `trips`
- `verificationCases`

## Local Development

### Frontend only

```bash
npm install
npm run dev
```

This mode can fall back to mock/local browser storage if the API is unavailable.

### Full Vercel + Atlas stack

Use Vercel’s local runtime so the `api/` folder runs correctly:

```bash
npm install
npx vercel dev
```

## Scripts

```bash
npm run build
npm run typecheck
npm run test:run
```

## Vercel Deployment

1. Import the project into Vercel.
2. Set the project root to `srishly/srishly1` if needed.
3. Add the environment variables from the section above.
4. Deploy.

The app is configured so:

- Vercel serves the Vite build output from `dist/`
- `/api/*` routes hit serverless functions
- all non-API routes rewrite to `index.html` for SPA routing

## API Endpoints

- `GET /api/parcels`
- `POST /api/parcels`
- `PATCH /api/parcels`
- `GET /api/trips`
- `GET /api/verification-cases`
- `PATCH /api/verification-cases`
- `GET /api/dashboard`

## Verification

Run:

```bash
npm run build
npm run test:run
```

## Security Notes

- MongoDB secrets stay server-side in Vercel env vars.
- Request validation runs before parcel creation and delivery completion.
- Frontend rendering remains safe with React escaping.
- Atlas access is centralized through reusable serverless data helpers in `api/_lib/`.
