# ShebaConnect — Zero-Cost Services Registry (`docs/ZERO_COST_SERVICES.md`)

**Strict Project Rule:** Zero budget (৳0 / $0). No credit cards, no paid trials, no automatic upgrades, no usage-based billing traps.

---

## 1. Verified Zero-Cost External Services

| Service Name | Purpose | Free-Plan Status | Usage Limits | Account Requirements | Potential Charges / Billing Risks | Fallback Option |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MongoDB Atlas (M0)** | Database | 100% Free Forever tier (M0 Sandbox) | 512 MB storage, shared RAM/CPU, 100 concurrent connections, Mongoose connection pooling must be capped (e.g. `maxPoolSize: 10`) | Email signup. No credit card required. | None if kept on M0. Automatic scale-up must be disabled. | Local MongoDB Community Edition or Docker MongoDB for local development. |
| **Cloudflare Pages** | Frontend Hosting (React + Vite SPA) | Genuinely Free Tier | Unlimited bandwidth, 500 build runs/month, 100 custom domains, global CDN, free SSL | Cloudflare free account (email verification). No credit card required for standard Pages. | None. Pure static build hosting has no overage fees on free tier. | Render Static Site, Vercel Free, GitHub Pages, or local preview server. |
| **Render Web Service** | Backend API (Node.js + Express + Socket.IO) | Free Tier (pilot) | 750 free compute hours/mo, 512 MB RAM, 0.1 vCPU, spins down after 15 min idle (50s cold start), ephemeral filesystem (wiped on restart) | Free Render account (email/GitHub). No credit card required. | None if kept on free tier. Will refuse to run if monthly 750 hours exhausted. | Run locally via Node.js/Docker during development; Fly.io free tier or Railway trial alternatives (if strictly no CC), or self-hosted VPS if user chooses. |
| **GitHub** | Source Control & CI | Free Tier | Unlimited public/private repositories, 2,000 GitHub Actions build minutes/month for private repos (unlimited for public) | Free GitHub account. No credit card required. | None on standard usage. Do not configure paid GitHub Marketplace actions or LFS beyond quota. | Local Git repository. |
| **In-App WebSockets (Socket.IO)** | Real-Time Notifications & Chat | Self-Hosted Open Source (part of Express backend) | Bound to server memory & connections (within Render 512MB RAM & 100 connections) | None. Built-in OSS library. | $0.00. | Fallback to HTTP polling if WebSocket connection drops; offline notifications persisted in MongoDB. |
| **Dhaka Area Predefined Hierarchy** | Location & Area Discovery | Embedded JSON Data | Unlimited (local static data) | None. Self-contained in codebase. | $0.00. No map or geocoding APIs called. | Static dropdowns for City (Dhaka), Zones (North/South), Thanas (e.g., Mirpur, Dhanmondi, Gulshan), and Wards. |

---

## 2. Blocked & Prohibited Services (Violation of Zero-Cost Mandate)

| Prohibited Category | Disallowed Services | Why It Is Blocked | Zero-Cost Approved Replacement |
| :--- | :--- | :--- | :--- |
| **Payment Gateways** | SSLCOMMERZ, bKash Merchant API, Nagad Merchant API, Stripe, PayPal | Require trade licenses, merchant setup fees, monthly maintenance, or per-transaction percentages | **Cash After Service Only**. Providers report cash received; customers confirm; platform manages internal commission ledger. |
| **Paid Map APIs** | Google Maps Platform, Mapbox, LocationIQ | Require credit card on file, per-request billing, unexpected quota spike costs | **Dhaka Predefined Location Registry** (local JSON dataset of 50+ Dhaka areas/thanas/neighborhoods). Zero external network requests. |
| **Paid SMS & Email Gateways** | Twilio, Infobip, AWS SES, SendGrid paid, Banglalink/Grameenphone SMS | Require credit cards, prepaid credits, per-SMS charges (e.g., ৳0.30 - ৳0.50/SMS) | **In-App Notification Center & WebSockets** + MongoDB persistence. Users view notifications directly in their dashboard. |
| **Paid AI APIs** | OpenAI, Claude API, paid Gemini tokens | Ongoing per-token billing risk | Pure algorithmic search, indexing, and rule-based quotation/matching logic. |
| **Cloud Object Storage (Conditional)** | Cloudflare R2, AWS S3, Google Cloud Storage | Cloudflare R2 requires payment method / CC setup even to access the free tier in most regions | **Initial pilot**: Keep remote uploads disabled or use local static project assets/avatars. File uploads strictly guarded by local storage adapter until a verified zero-CC S3-compatible service is confirmed. |

---

## 3. Operational Safeguards to Preserve Zero-Cost

1. **MongoDB Connection Limits**: Set Mongoose `maxPoolSize: 10` and `serverSelectionTimeoutMS: 5000` to prevent exhausting Atlas 100-connection limit.
2. **Database Sizing Safeguards**: Index selectively, enforce maximum document payload sizes (Zod validation: max 50KB for text payloads), and avoid storing binary data in MongoDB.
3. **Render Spin-Down Compliance**: Never implement synthetic keep-alive pingers or artificial bots to keep Render awake. Handle cold starts gracefully in frontend Axios interceptors with loading spinners/toasts.
4. **Local Development First**: Full local runtime with local MongoDB (`localhost:27017` or Atlas free connection string) and Node.js backend (`localhost:5000`) ensuring zero operational cost during testing.
