# Railway deployment

The live VESTIGE demo is at <https://web-production-5f08d.up.railway.app/>. The Railway project is named `vestige` and contains a `web` service and a `Postgres` service. The account used for Railway is `n.jaswanthbala@gmail.com`.

The root [`Dockerfile`](../../Dockerfile) builds React with `VITE_API_BASE_URL=/api`, copies the result into the Spring Boot JAR, and runs one web container. The [`railway.toml`](../../railway.toml) readiness check is `/api/health/readiness`. React routes are forwarded to `index.html` by `SpaController`.

The web service uses `SPRING_PROFILES_ACTIVE=prod,railway`. Its `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` reference the Railway `Postgres` service variables. `JWT_SECRET` and the bootstrap admin password are stored only in Railway variables. The initial admin credentials are also saved locally in the ignored `.env.railway.local` file for the person operating this workspace. Do not commit that file.

The `railway` profile uses Hibernate `ddl-auto=update` for this fresh demo database. The Supabase SQL migrations are a separate deployment path and were not applied to Railway PostgreSQL. A long lived production deployment should adopt managed migrations before future schema changes.

Verification on 8 October 2026: Railway reported a successful deployment; `/api/health/readiness` returned database `UP`; the landing page and nested React route returned HTML; browser JavaScript and CSS loaded after the public domain was added to `CORS_ALLOWED_ORIGINS`; the initial admin account signed in through `/api/auth/login`.

To redeploy code from this workspace, run `railway up --service web --detach` from the repository root, then check `railway deployment list --service web --json`. The Railway CLI must be signed in with the account above. Avoid printing `railway variable list --json` because it contains raw secrets.
