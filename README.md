# 🌌 Milky Way Explorer

An interactive 3D galaxy visualiser built with **Next.js**, **Three.js**, **Supabase**, and deployed on **Vercel**. Explore 200,000+ procedurally-generated stars alongside real data from the [ESA Gaia DR3 catalog](https://www.cosmos.esa.int/web/gaia/dr3).

[![CI](https://github.com/YOUR_USERNAME/milky-way-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/milky-way-explorer/actions)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/milky-way-explorer)

---

## ✨ Features

| Feature | Detail |
|---|---|
| **3D Milky Way** | 200,000-star procedural galaxy with 4-arm logarithmic spiral structure |
| **Real star data** | Up to 3,000 bright nearby stars from Gaia DR3 via ESA's TAP service |
| **Star inspector** | Click any Gaia star → distance, temperature, proper motion, radial velocity |
| **Spectrum viewer** | Synthetic Planck blackbody + real SDSS spectra when available |
| **Star search** | Name search via SIMBAD; flies the camera to the result |
| **Bookmarks** | Save stars to Supabase; synced across sessions via GitHub OAuth |
| **GitHub Actions** | Lint + type-check + build on every push |
| **Vercel deploy** | Edge-cached API routes; SSR-safe WebGL canvas |

---

## 🛠 Tech Stack

```
Next.js 14 (App Router)   – Framework
Three.js + R3F            – 3D galaxy & WebGL shaders
Zustand                   – Client state
Supabase                  – Auth (GitHub OAuth) + PostgreSQL bookmarks
Tailwind CSS              – Styling
Framer Motion             – Panel animations
ESA Gaia TAP              – Real star astrometry
SIMBAD TAP                – Star name search
SDSS SkyServer            – Stellar spectra (optional)
Vercel                    – Hosting + edge CDN
GitHub Actions            – CI (lint / type-check / build)
```

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/milky-way-explorer.git
cd milky-way-explorer
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run the migration:
   ```sql
   -- paste contents of supabase/migrations/001_schema.sql
   ```
3. Enable **GitHub OAuth** under  
   *Authentication → Providers → GitHub*  
   – add your GitHub OAuth app credentials.  
   – set the redirect URL to `https://YOUR_DOMAIN/auth/callback`.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## ☁️ Deploy to Vercel

### Option A – One-click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/milky-way-explorer)

### Option B – CLI

```bash
npm i -g vercel
vercel --prod
```

Add environment variables in the Vercel dashboard under  
*Project → Settings → Environment Variables*:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL        ← set to your Vercel domain
```

Update your Supabase Auth redirect URL to match your Vercel domain.

---

## 📁 Project Structure

```
milky-way-explorer/
├── .github/workflows/ci.yml      # GitHub Actions: lint + build
│
├── app/
│   ├── page.tsx                  # Main page (assembles UI over galaxy)
│   ├── layout.tsx                # Root layout + metadata
│   ├── globals.css               # Tailwind + space theme
│   ├── api/
│   │   ├── gaia/route.ts         # Proxy to ESA Gaia TAP service
│   │   ├── bookmarks/route.ts    # CRUD bookmarks (Supabase, RLS)
│   │   └── spectrum/route.ts     # SDSS spectrum proxy
│   └── auth/callback/route.ts    # Supabase OAuth callback
│
├── components/
│   ├── Galaxy/
│   │   ├── index.tsx             # Canvas + camera + orbit controls
│   │   ├── GalaxyPoints.tsx      # 200k procedural star point cloud
│   │   ├── GaiaStars.tsx         # Real Gaia stars (clickable)
│   │   └── shaders.ts            # GLSL vertex + fragment shaders
│   └── UI/
│       ├── Navbar.tsx            # Top bar (auth, star count)
│       ├── SearchBar.tsx         # Debounced SIMBAD search
│       ├── StarPanel.tsx         # Right-side star detail drawer
│       ├── SpectrumChart.tsx     # SVG spectrum visualisation
│       ├── BookmarkList.tsx      # Left-side bookmarks drawer
│       └── AuthModal.tsx         # GitHub OAuth modal
│
├── lib/
│   ├── galaxy.ts                 # Procedural star generator
│   ├── gaia.ts                   # Gaia TAP + SIMBAD API clients
│   ├── coordinates.ts            # Galactic ↔ Three.js transforms
│   ├── store.ts                  # Zustand global state
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       └── server.ts             # Server Supabase client (cookies)
│
├── supabase/migrations/
│   └── 001_schema.sql            # bookmarks table + RLS policies
│
└── types/index.ts                # Shared TypeScript types
```

---

## 🔭 Data Sources

| Source | What we use | License |
|---|---|---|
| [ESA Gaia DR3](https://gea.esac.esa.int/tap-server/tap) | Positions, distances, temperatures, proper motions | CC BY 4.0 |
| [SIMBAD](https://simbad.u-strasbg.fr/simbad/tap) | Star name → RA/Dec lookup | Free for research |
| [SDSS DR18](https://skyserver.sdss.org) | Optical spectra (when available) | CC BY 4.0 |

Real star data is fetched server-side and cached at the CDN edge (1 hour TTL) to minimise load on ESA's TAP service.

---

## 🧩 How It Works

### Galaxy Generation
`lib/galaxy.ts` uses a 4-arm logarithmic spiral model:
- **Bulge** (15%): King-profile distribution, old red/orange stars
- **Disk** (20%): Exponential radial profile, mixed ages
- **Arms** (65%): Logarithmic spiral with ~30% hot blue OB stars

### Coordinate System
Gaia provides galactic longitude (ℓ) and latitude (b) from the Sun.  
`lib/coordinates.ts` converts these + parallax to galactocentric Cartesian XYZ (units: kpc), placing the Sun at (8.5, 0, 0).

### Shaders
Two custom GLSL shader pairs render stars as screen-space circular glows with additive blending, giving the characteristic nebula-like accumulation effect.

### Supabase Auth Flow
```
User clicks "Sign in" → GitHub OAuth → /auth/callback → session cookie → Zustand store
```
Bookmarks are protected by Row-Level Security (RLS); users can only read/write their own rows.

---

## 🤝 Contributing

Pull requests welcome. Please run `npm run type-check && npm run lint` before submitting.

---

## 📄 License

MIT © 2024
