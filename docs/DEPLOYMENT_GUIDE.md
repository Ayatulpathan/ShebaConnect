# ShebaConnect — Live Deployment Guide (Strictly ৳0 / $0 Zero-Cost)

This guide provides the exact instructions to take **ShebaConnect (সেবাকানেক্ট)** live on the internet using genuinely free service tiers. **No credit cards, no paid trials, and no hidden fees are required.**

---

## 1. Architecture Overview for Production

```
                                  +----------------------------+
                                  |      Cloudflare Pages      |
                                  |  (React + Vite SPA Hosting)|
                                  |    https://*.pages.dev     |
                                  +--------------+-------------+
                                                 |
                                     HTTPS API   |   WSS Sockets
                                                 v
                                  +----------------------------+
                                  |      Render Web Service    |
                                  |  (Node.js + Express API)   |
                                  |   https://*.onrender.com   |
                                  +--------------+-------------+
                                                 |
                                     Mongoose    |   TLS Connection
                                                 v
                                  +----------------------------+
                                  |      MongoDB Atlas M0      |
                                  |   (Free 512MB Sandbox)     |
                                  +----------------------------+
```

---

## Step 1: Set Up MongoDB Atlas (Free M0 Sandbox — ৳0)

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and create a free account (Google or Email signup). **No credit card is required.**
2. When prompted for a deployment type, select **M0 (Free Forever)** sandbox.
3. Choose a cloud provider and region closest to Bangladesh (e.g. **AWS / Singapore `ap-southeast-1`** or **Google Cloud / Mumbai**).
4. Click **Create Deployment**.
5. **Security & Access Configuration:**
   - **Database User:** Create a username (e.g., `sheba_admin`) and a secure password.
   - **Network Access (IP Access List):** Click **Network Access** > **Add IP Address** > select **Allow Access from Anywhere (`0.0.0.0/0`)** so Render's cloud servers can connect.
6. **Get Connection String:**
   - Click **Database** > **Connect** > **Drivers** (Node.js).
   - Copy the SRV connection string:
     ```
     mongodb+srv://sheba_admin:<password>@cluster0.xxxxx.mongodb.net/shebaconnect?retryWrites=true&w=majority&appName=Cluster0
     ```

---

## Step 2: Deploy Backend to Render (Free Web Service — ৳0)

Render hosts Node.js Express APIs for free (with 750 free compute hours/month and automated HTTPS).

### Option A: 1-Click Render Blueprint (Recommended)
Because [`render.yaml`](../render.yaml) is already included in this repository:
1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in with your GitHub account.
2. Click **New +** > **Blueprint**.
3. Select your repository: **`Ayatulpathan/ShebaConnect`**.
4. Render will automatically detect `render.yaml`.
5. Enter your `MONGODB_URI` from Step 1.
6. Click **Apply**.
7. Render will build and deploy the backend at a URL like:
   `https://shebaconnect-backend.onrender.com`

### Option B: Manual Web Service Setup
If creating the web service manually:
1. In Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository **`Ayatulpathan/ShebaConnect`**.
3. Configure the service settings:
   - **Name:** `shebaconnect-backend`
   - **Region:** `Singapore` (Fastest for Dhaka)
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` (0.1 CPU, 512 MB RAM)
4. Add the following **Environment Variables**:
   | Variable | Recommended Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production security & logging |
   | `PORT` | `10000` | Render standard port |
   | `MONGODB_URI` | `mongodb+srv://...` | Your Atlas M0 connection string |
   | `CLIENT_URL` | `https://shebaconnect.pages.dev` | Your Cloudflare Pages URL |
   | `JWT_ACCESS_SECRET` | *(Random 32-char string)* | e.g. `sheba_access_secret_secure_99182` |
   | `JWT_REFRESH_SECRET` | *(Random 32-char string)* | e.g. `sheba_refresh_secret_secure_99182` |
5. Click **Deploy Web Service**.
6. Once deployed, verify health check at:
   `https://shebaconnect-backend.onrender.com/health` (should return `{"status":"ok"}`).

---

## Step 3: Deploy Frontend to Cloudflare Pages (Free Forever — ৳0)

Cloudflare Pages provides unlimited bandwidth, fast global CDN, and automatic Git builds for single-page applications.

1. Go to [https://dash.cloudflare.com](https://dash.cloudflare.com) and log in or create a free account.
2. In the sidebar, navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Authorize GitHub and select the repository **`Ayatulpathan/ShebaConnect`**.
4. Configure Build Settings:
   - **Project Name:** `shebaconnect`
   - **Production Branch:** `main`
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Build Output Directory:** `dist`
5. **Environment Variables:**
   Under **Environment variables (advanced)**, add:
   | Variable | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://shebaconnect-backend.onrender.com/api/v1` |
   | `VITE_SOCKET_URL` | `https://shebaconnect-backend.onrender.com` |
6. Click **Save and Deploy**.
7. Cloudflare Pages will build the frontend and provide your live production URL (e.g., `https://shebaconnect.pages.dev`).
8. The included [`frontend/public/_redirects`](../frontend/public/_redirects) file ensures that browser refreshes on routes like `/browse` or `/categories` route correctly to `index.html`.

---

## Step 4: Synchronize Cross-Origin URL (Post-Deploy Final Step)

1. Copy your live frontend domain from Cloudflare Pages (e.g. `https://shebaconnect.pages.dev`).
2. Go back to your Render Dashboard > **shebaconnect-backend** > **Environment**.
3. Set `CLIENT_URL` = `https://shebaconnect.pages.dev`.
4. Click **Save Changes** (Render will automatically redeploy the backend in ~30 seconds).

---

## 5. Verification Checklist

- [ ] Visit `https://shebaconnect.pages.dev` in a web browser.
- [ ] Verify homepage loads in English and Bangla.
- [ ] Test User Registration (Customer & Provider).
- [ ] Test Service Search in Dhaka zones (e.g. Mirpur, Dhanmondi).
- [ ] Submit a test booking and verify real-time notification bell update.
- [ ] Log in as Admin (`admin@shebaconnect.com`) and open **Admin Governance** to view platform KPIs.
- [ ] Verify $0.00 spent across all cloud providers.
