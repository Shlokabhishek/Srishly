# Srishly Logistics Network

Srishly is a Vite + React application for peer-to-peer parcel logistics. The app supports Vercel deployment with MongoDB Atlas-backed serverless APIs for parcels, trips, dashboard state, and verification queues, plus Supabase-powered authentication for Sharda University users.

## Authentication Flow

- only `@sharda.ac.in` email addresses can register
- student ID card OCR extracts name and student ID
- registration asks for phone number after ID-assisted autofill
- Supabase Auth manages email/password sign-up, sign-in, and persistent sessions

## Stack

- React 19 + TypeScript
- Vite for the frontend build
- React Router for SPA routing
- Tailwind CSS v4 for styling
- Motion for UI transitions
- Vercel serverless functions in `api/`
- MongoDB Atlas for persistent storage
- Supabase Auth for authentication
- Vitest + Testing Library for tests

## Project Structure

- `src/`: frontend application
- `api/`: Vercel serverless API routes and MongoDB access
- `src/services/mockApi.ts`: client data layer that uses `/api/*` in production and falls back only during local frontend-only development
- `src/pages/AuthPage.tsx`: Sharda email + ID-card onboarding flow
- `src/lib/supabase.ts`: shared Supabase client
- `vercel.json`: Vercel SPA rewrite and output configuration

## Environment Variables

Create a local `.env` or configure these in Vercel:

```bash
VITE_APP_NAME=Srishly
VITE_SUPPORT_EMAIL=team.srishly@gmail.com
VITE_API_BASE_URL=
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db>?retryWrites=true&w=majority
MONGODB_DB_NAME=srishly
```

Notes:

- Leave `VITE_API_BASE_URL` empty on Vercel so the frontend uses same-origin `/api`.
- Never expose `MONGODB_URI` to the client. It is only used by the serverless functions.
- `VITE_SUPABASE_ANON_KEY` is safe for the client. Do not put your Supabase service-role key in the frontend.
- Enable email/password auth in Supabase. If email confirmation is enabled, new users must confirm their inbox before signing in.

## Supabase Setup

1. Create a Supabase project.
2. Enable Email auth in `Authentication -> Providers`.
3. Add your Vercel production URL and local dev URL to the allowed redirect URLs if needed.
4. Copy the project URL into `VITE_SUPABASE_URL`.
5. Copy the public anon key into `VITE_SUPABASE_ANON_KEY`.

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

Use Vercel's local runtime so the `api/` folder runs correctly:

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

After deployment, validate runtime immediately:

```bash
curl -i https://your-vercel-domain.vercel.app/api/health
curl -i https://your-vercel-domain.vercel.app/api/parcels
```

If either endpoint returns `500`, open Vercel Runtime Logs for the same deployment and fix the reported serverless error before retrying.
If the response header contains `X-Vercel-Error: FUNCTION_INVOCATION_FAILED`, this indicates the function crashed at runtime.

The app is configured so:

- Vercel serves the Vite build output from `dist/`
- `/api/*` routes hit serverless functions
- all non-API routes rewrite to `index.html` for SPA routing
- `GET /api/health` reports whether MongoDB is configured and reachable
- API routes use the explicit Node runtime configured in `vercel.json`

## CI Pipeline

GitHub Actions workflow: `.github/workflows/ci.yml`

On each push/PR it runs:

- `npm ci`
- `npm run typecheck`
- `npm run test:run`
- `npm run build`

This blocks regressions before deployment and keeps production builds consistent.

## API Endpoints

- `GET /api/health`
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

To verify MongoDB after deployment:

```bash
curl https://your-vercel-domain.vercel.app/api/health
```

If preview deployment domains return `401`, that is expected when Vercel deployment protection is enabled. Use the production alias/domain for public API checks.

## Security Notes

- MongoDB secrets stay server-side in Vercel env vars.
- Supabase manages session issuance and refresh on the client.
- Request validation runs before parcel creation and delivery completion.
- Registration is limited to official Sharda University email addresses.
- Frontend rendering remains safe with React escaping.
- Atlas access is centralized through reusable serverless data helpers in `api/_lib/`.
