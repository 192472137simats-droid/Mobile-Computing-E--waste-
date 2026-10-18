# Railway deployment

The earlier VESTIGE demo was deployed at <https://web-production-5f08d.up.railway.app/>. Its Railway project was named `vestige` and contained a `web` service and a `Postgres` service. That deployment belongs to the earlier Railway account. The current SAI TEJA account is a separate target and has no project or deployment yet.

The root [`Dockerfile`](../../Dockerfile) builds React with `VITE_API_BASE_URL=/api`, copies the result into the Spring Boot JAR, and runs one web container. The [`railway.toml`](../../railway.toml) readiness check is `/api/health/readiness`. React routes are forwarded to `index.html` by `SpaController`.

The web service uses `SPRING_PROFILES_ACTIVE=prod,railway`. Its `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` reference the Railway `Postgres` service variables. `JWT_SECRET` and the bootstrap admin password are stored only in Railway variables. The initial admin credentials are also saved locally in the ignored `.env.railway.local` file for the person operating this workspace. Do not commit that file.

The earlier demo used Hibernate `ddl-auto=update`. The current `prod,railway` configuration uses Flyway migrations and Hibernate `ddl-auto=validate` for a **new, empty** PostgreSQL database. Do not point the new baseline at the earlier populated demo database without a reviewed migration plan. The Supabase SQL migrations remain a separate deployment path and are not applied to Railway PostgreSQL.

Verification on 8 October 2026: Railway reported a successful deployment; `/api/health/readiness` returned database `UP`; the landing page and nested React route returned HTML; browser JavaScript and CSS loaded after the public domain was added to `CORS_ALLOWED_ORIGINS`; the initial admin account signed in through `/api/auth/login`.

After a new project, Postgres service, web service, and environment variables have been configured in the intended Railway account, deploy code from this workspace with `railway up --service web --detach` from the repository root, then check `railway deployment list --service web --json`. Do not reuse the earlier project's database for the new Flyway baseline. Avoid printing `railway variable list --json` because it contains raw secrets.
