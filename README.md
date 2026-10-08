# CIVICFLOW — Full-stack civic application intelligence

CIVICFLOW now has a real Node API, Supabase/PostgreSQL schema, workflow events, officer actions, automatic SLA/delay computation, and a zero-config demo fallback.

## 1. Run immediately (demo mode)

```bash
npm install
npm run dev
```

Open http://localhost:5173

Demo mode is fully functional without credentials. It persists changes for the running server process and exposes the same API contract as production.

## 2. Enable PostgreSQL/Supabase persistence

1. Create a Supabase project.
2. Open the SQL Editor and run `supabase/schema.sql`.
3. Create an officer account in Supabase Auth.
4. In Supabase Table Editor/SQL, promote the officer profile after creating the Auth user:

```sql
update public.profiles set role='GOVT. OFFICER', display_name='Hriday Biswas' where id='<AUTH_USER_UUID>';
```

5. Copy `.env.example` to `.env` and fill:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

6. Restart `npm run dev`.

The Node API uses the service-role key only on the server; never expose it to Vite/client code.

## Architecture

- `client/` — Vite + React cinematic UI
- `server/` — Express API and workflow engine
- `supabase/schema.sql` — PostgreSQL schema + RLS policies
- `/api/applications/:id` — live application tracking
- `/api/applications/:id/advance` — officer workflow transition
- `/api/analytics` — status counts, bottlenecks, attention queue
- Delay detection is calculated server-side from stage entry time vs SLA.

## Demo application

`APP-10482` starts at Municipal Verification and is automatically classified as delayed because the stage has exceeded its 48-hour SLA.

## Production notes

For a hackathon deployment, deploy the Vite client and Node API behind the same domain, set the three Supabase environment variables, and create officer accounts through Supabase Auth. The service-role key must remain server-only.
