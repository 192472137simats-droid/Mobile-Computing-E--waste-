# VESTIGE — Production Deployment Runbook & Setup Guide

This guide provides step-by-step instructions to deploy VESTIGE to production on **Vercel** (Frontend) and **Render** (Backend), connecting to **Supabase Cloud** (Database & Auth).

---

## 1. Frontend Deployment (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/) and click **"Add New Project"**.
2. Import the GitHub repository: `https://github.com/Jaswanth300/vestige`.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Add **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://<your-render-backend-url>/api`
   - `VITE_SUPABASE_URL`: `https://qiylcwurlhyhzhachoyb.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: *(Your Supabase publishable anon key)*
5. Click **Deploy**.

---

## 2. Backend Deployment (Render Web Service)

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **"New +" ➔ "Web Service"**.
2. Connect the same repository: `https://github.com/Jaswanth300/vestige`.
3. Choose **Docker** environment or **Native Java / Maven**:
   - **Root Directory**: `backend`
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/vestige-backend-0.0.1-SNAPSHOT.jar`
   - **Health Check Path**: `/api/health/readiness`
4. Add **Environment Variables**:
   - `SPRING_PROFILES_ACTIVE`: `prod`
   - `PORT`: `8080` (or Render default)
   - `DB_URL`: `jdbc:postgresql://db.qiylcwurlhyhzhachoyb.supabase.co:5432/postgres?sslmode=require`
   - `DB_USERNAME`: `vestige_app` (or `postgres`)
   - `DB_PASSWORD`: *(Your secure Supabase database password)*
   - `SUPABASE_URL`: `https://qiylcwurlhyhzhachoyb.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: *(Your private Supabase service-role secret key)*
   - `SUPABASE_JWKS_URL`: `https://qiylcwurlhyhzhachoyb.supabase.co/auth/v1/.well-known/jwks.json`
   - `CORS_ALLOWED_ORIGINS`: `https://<your-vercel-domain>.vercel.app,https://<your-custom-domain>`
   - `RAZORPAY_KEY_ID`: *(Your Razorpay Key ID)*
   - `RAZORPAY_KEY_SECRET`: *(Your Razorpay Secret Key)*
   - `RAZORPAY_WEBHOOK_SECRET`: *(Your Razorpay Webhook Secret)*
5. Click **Create Web Service**.

---

## 3. Supabase Auth URL Configuration

1. In the [Supabase Dashboard](https://supabase.com/dashboard/project/qiylcwurlhyhzhachoyb):
2. Navigate to **Authentication ➔ URL Configuration**.
3. Set **Site URL**: `https://<your-vercel-domain>.vercel.app` (or your custom domain).
4. Add **Redirect URLs**:
   - `https://<your-vercel-domain>.vercel.app/**`
   - `https://<your-vercel-domain>.vercel.app/login/user`
   - `https://<your-vercel-domain>.vercel.app/login/vendor`
   - `https://<your-vercel-domain>.vercel.app/login/admin`

---

## 4. Post-Deployment Verification

1. Test Backend Liveness:
   ```bash
   curl -I https://<your-backend-url>/api/health
   ```
   *Expected Response*: `HTTP 200 OK`
2. Test Backend Database Readiness:
   ```bash
   curl -s https://<your-backend-url>/api/health/readiness
   ```
   *Expected Response*: `{"status":"READY","components":{"database":"UP",...}}`
3. Test Frontend Live in Browser:
   - Open `https://<your-frontend-domain>`
   - Verify Landing Page, Device Assessment, Login, and Portal Routing.
