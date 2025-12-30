# ⚙️ Valorant Stat Visualizer — Quick Setup

## 🚀 1. Clone the repository

```bash
git clone https://github.com/<your-username>/valorant-stat-visualizer.git
cd valorant-stat-visualizer
```

---

## 📦 2. Install dependencies

```bash
npm install
```

---

## ⚙️ 3. Set up environment variables

Create a `.env` file in the project root with:

```
DATABASE_URL="postgresql://postgres:<password>@<project>.pooler.supabase.com:6543/postgres?sslmode=require"
```

Download your Supabase SSL certificate and place it here:

```
PATH\valorant-stat-visualizer\supabase-ca.crt
```

---

## 🔐 4. Set SSL environment variable (Windows PowerShell)

```powershell
$env:NODE_EXTRA_CA_CERTS = "PATH\valorant-stat-visualizer\supabase-ca.crt"
```

---

## 🧱 5. Generate and apply database migrations

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## 📊 6. Import CSV data into the database

Example — weekly dataset:

```bash
npm run import-valorant -- ./data/valorant_week42.csv --type=week --start=2025-10-13 --end=2025-10-20 --label=2025-W42
```

Example — seasonal dataset:

```bash
npm run import-valorant -- ./data/valorant_s10.csv --type=season --start=2025-09-01 --end=2025-12-01 --season=S10 --label=S10
```

---

## 🧩 7. Run the app locally

```bash
npm run dev
```

---

✅ **That’s it!**  
Your database is migrated, data imported, and the SvelteKit app is ready to run.

Run API:
curl -X POST http://localhost:5173/api/import-sheets
