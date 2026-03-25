# Environment Setup Checklist

Fill in these values before deploying or running the app with Supabase and MongoDB Atlas.

## Required Values

### `VITE_SUPABASE_URL`

Enter your Supabase project URL.

Example:

```env
VITE_SUPABASE_URL=https://hpuwyyagsrcuzqvlpdnb.supabase.co
```

Where to get it:

- Supabase Dashboard
- `Project Settings -> API -> Project URL`

### `VITE_SUPABASE_ANON_KEY`

Enter your Supabase public anon key.

Example:

```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdXd5eWFnc3JjdXpxdmxwZG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODU5NTMsImV4cCI6MjA4OTg2MTk1M30.cVD4OYQUvjDgYMCih1hsBgeYffdyoSvoMaHVy7Ds6fU
```

Where to get it:

- Supabase Dashboard
- `Project Settings -> API -> Project API keys -> anon public`

### `MONGODB_URI`

Enter your MongoDB Atlas connection string.

Example:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db>?retryWrites=true&w=majority
```

Where to get it:

- MongoDB Atlas
- `Database -> Connect -> Drivers`

Important:

- Replace `<password>` or `<db_password>` placeholders with the real database user password before saving.
- If your password contains special characters like `@`, `#`, `/`, or `:`, URL-encode it before placing it in the URI.

### `MONGODB_DB_NAME`

Enter the MongoDB database name the app should use.

Example:

```env
MONGODB_DB_NAME=srishly
```

### `VITE_APP_NAME`

Enter the product name shown in the UI.

Example:

```env
VITE_APP_NAME=Srishly
```

### `VITE_SUPPORT_EMAIL`

Enter the support or contact email shown in the app.

Example:

```env
VITE_SUPPORT_EMAIL=team.srishly@gmail.com
```

### `VITE_API_BASE_URL`

Leave this empty on Vercel so the frontend uses same-origin `/api`.

Example for Vercel:

```env
VITE_API_BASE_URL=
```

Example for custom backend host:

```env
VITE_API_BASE_URL=https://your-domain.vercel.app/api
```

## Copy-Paste Template

```env
VITE_SUPABASE_URL=https://hpuwyyagsrcuzqvlpdnb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdXd5eWFnc3JjdXpxdmxwZG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODU5NTMsImV4cCI6MjA4OTg2MTk1M30.cVD4OYQUvjDgYMCih1hsBgeYffdyoSvoMaHVy7Ds6fU
MONGODB_URI=
MONGODB_DB_NAME=srishly
VITE_APP_NAME=Srishly
VITE_SUPPORT_EMAIL=
VITE_API_BASE_URL=
```

## Production Runtime Checklist (Vercel)

Use this checklist if `GET /api/health` or `GET /api/parcels` returns `500`.

1. In Vercel project settings, add these variables to the Production environment:
	- `MONGODB_URI`
	- `MONGODB_DB_NAME`
2. Redeploy after saving variables. Existing deployments do not automatically pick up newly added env values.
3. In MongoDB Atlas, ensure network access allows Vercel to connect (temporary `0.0.0.0/0` for verification, then tighten).
4. Verify health endpoint:

```bash
curl -i https://your-vercel-domain.vercel.app/api/health
```

Expected: HTTP `200` with JSON where `ok: true`.

If header includes `X-Vercel-Error: FUNCTION_INVOCATION_FAILED`, check Vercel Runtime Logs and fix the serverless function error before retesting.

5. Verify data endpoint:

```bash
curl -i https://your-vercel-domain.vercel.app/api/parcels
```

Expected: HTTP `200` with a JSON array.
