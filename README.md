# ShebaConnect (সেবাকানেক্ট)

> Local service booking marketplace connecting customers with individual technicians and professional service companies in Bangladesh (Dhaka launch).

---

## Key Highlights

- **Market**: Bangladesh (Initial launch area: Dhaka)
- **Languages**: Bangla (বাংলা) and English (EN)
- **Budget**: Strictly ৳0 / $0 — 100% Free & Open Source Stack
- **Payment Method**: Cash after service only (No payment gateway fees or licenses required)
- **Architecture**: React + Vite + TypeScript (Frontend) & Node.js + Express + TypeScript + MongoDB (Backend)

---

## User Roles

1. **CUSTOMER**: Discover services, request quotations, book, chat, pay cash after service, review.
2. **INDIVIDUAL_PROVIDER**: List services, set coverage areas, submit quotations, fulfill bookings, report cash payment, track commission balance.
3. **COMPANY_OWNER**: Register company, verify business, manage staff & technicians, assign jobs, track revenue & commissions.
4. **COMPANY_STAFF**: Operational company support.
5. **TECHNICIAN**: View assigned jobs, update real-time progress (on the way, in progress, completed).
6. **ADMIN**: Full marketplace governance, category management, provider verification, cash payment & commission reconciliation, dispute resolution, audit logs.
7. **SUPPORT_AGENT**: Limited admin access for customer & dispute assistance.

---

## Zero-Cost Architecture & Hosting

| Component | Technology | Free Tier Provider |
| :--- | :--- | :--- |
| **Frontend** | React 19 / 18, Vite, TypeScript, Tailwind CSS, TanStack Query | Cloudflare Pages (Free) |
| **Backend API** | Node.js, Express, TypeScript, Socket.IO, Argon2id, Zod, Pino | Render Free Web Service |
| **Database** | MongoDB + Mongoose | MongoDB Atlas Free M0 (512MB) |
| **Source Control** | Git & GitHub | GitHub Free |
| **Location Discovery** | Predefined Dhaka Area Hierarchy (Ward/Thana) | Local Embedded Dataset ($0) |
| **Notifications** | Real-time WebSockets & In-App Notification Center | Self-Hosted Socket.IO ($0) |

Full zero-cost compliance breakdown is documented in [`docs/ZERO_COST_SERVICES.md`](./docs/ZERO_COST_SERVICES.md).

---

## Project Structure

```text
shebaconnect/
├── docs/
│   └── ZERO_COST_SERVICES.md    # Strict zero-cost tracking and limitations
├── frontend/                    # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
└── backend/                     # Node.js + Express + TypeScript + MongoDB
    ├── src/
    │   ├── config/
    │   ├── constants/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   ├── services/
    │   ├── sockets/
    │   ├── types/
    │   ├── utils/
    │   ├── validators/
    │   ├── app.ts
    │   └── server.ts
    ├── tests/
    ├── package.json
    └── tsconfig.json
```

---

## Local Development Setup

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- MongoDB (local or Atlas M0 connection string)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/Ayatulpathan/ShebaConnect.git
cd ShebaConnect

# Install & Run Backend
cd backend
npm install
npm run dev

# Install & Run Frontend
cd ../frontend
npm install
npm run dev
```

---

## License
MIT — Free & Open Source for community empowerment in Bangladesh.
