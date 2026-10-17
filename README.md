# 🔭 Astro Portfolio

A self-hosted astrophotography portfolio website powered by [Immich](https://immich.app/) and [Next.js](https://nextjs.org/). It pulls photos from an Immich album and displays them in a beautiful, responsive gallery — complete with EXIF metadata, camera details, and full-resolution downloads.

> **No database required.** Your Immich instance _is_ the CMS. Just add photos to your portfolio album and they appear on the site automatically.

---

## ✨ Features

- **Dynamic Gallery** — Responsive masonry grid pulled from an Immich album
- **Photo Detail Pages** — Full EXIF metadata display (camera, lens, exposure, ISO, sensor temp, etc.)
- **Human-Readable URLs** — `/photo/rosette-nebula` instead of `/photo/c3629bd3-6919-...`
- **No UUID Leakage** — Immich asset IDs are never exposed to the browser
- **Failover** — If Immich is down, the site switches to a backup Immich, then an auto-saved local snapshot, then your own fallback photos
- **Security Hardened** — CSP headers, HSTS, rate limiting, input validation
- **Retry Logic** — Automatic retry with exponential backoff for transient Immich errors
- **Server-Side Caching** — Configurable cache durations to reduce Immich API load
- **Docker Ready** — Multi-stage Dockerfile with standalone output (~150MB image)
- **Cloudflare Tunnel Compatible** — No reverse proxy needed

---

## 📋 Prerequisites

Before you start, make sure you have:

1. **An Immich instance** — running and accessible (either on the same machine or via a URL)
2. **An Immich API key** — create one in Immich → User Settings → API Keys
3. **A portfolio album in Immich** — create an album and add the photos you want to showcase
4. **Docker & Docker Compose** — installed on the machine where you'll deploy

---

## 🚀 Deploy with Docker Compose

### Step 1: Clone the repository

```bash
git clone https://github.com/AlexMoisiadis/astro-portfolio.git
cd astro-portfolio
```

### Step 2: Configure environment variables

```bash
cp .env.example .env
```

Open `.env` in your editor and fill in your values:

```env
# The public URL where this site will be accessible
NEXT_PUBLIC_BASE_URL=https://astro.yourdomain.com

# Your Immich connection (see "Connecting to Immich" section below)
IMMICH_BASE_URL=https://photos.yourdomain.com
IMMICH_API_KEY=your-api-key-here

# The album to display (provide ID, name, or both)
IMMICH_PORTFOLIO_ALBUM_ID=your-album-uuid
IMMICH_PORTFOLIO_ALBUM_NAME=Portfolio

# Keep caching enabled for production
DISABLE_CACHE=false
```

### Step 3: Build and run

```bash
docker compose up -d --build
```

That's it! The site is now running on **port 3000**. Point your Cloudflare Tunnel (or browser) to `http://localhost:3000`.

### Updating

To pull the latest changes and rebuild:

```bash
git pull
docker compose up -d --build
```

### Stopping

```bash
docker compose down
```

---

## 🔌 Connecting to Immich

### Option A: Immich on the same machine

If Immich runs on the same Docker host (e.g., on port 2082), use Docker's special hostname:

```env
IMMICH_BASE_URL=http://host.docker.internal:2082
```

You'll also need to uncomment this line in `docker-compose.yml`:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

### Option B: Immich on a different machine / public URL

Simply use the URL:

```env
IMMICH_BASE_URL=https://photos.yourdomain.com
```

No extra Docker configuration needed.

---

## ☁️ Using Cloudflare Tunnels

1. Install `cloudflared` on the machine running this portfolio
2. Create a tunnel: `cloudflared tunnel create astro-portfolio`
3. Route your domain: `cloudflared tunnel route dns astro-portfolio astro.yourdomain.com`
4. Run the tunnel: `cloudflared tunnel --url http://localhost:3000 run astro-portfolio`

The site will be accessible at `https://astro.yourdomain.com` with Cloudflare handling HTTPS.

---

## 🛠️ Local Development

For local development without Docker:

```bash
# Install dependencies
npm install

# Create a local env file
cp .env.example .env.local
# Edit .env.local with your values (set NEXT_PUBLIC_BASE_URL=http://localhost:3000)

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The page auto-updates as you edit files.

---

## 📁 Project Structure

```
├── app/
│   ├── page.tsx                          # Home page (gallery)
│   ├── photo/[id]/page.tsx               # Photo detail page
│   ├── about/page.tsx                    # About page
│   └── api/
│       ├── portfolio/route.ts            # Returns all gallery items with slugs (no asset ids)
│       ├── image/by-slug/[slug]/[type]/  # Slug-based image proxy (thumbnail/preview/original)
│       └── image/[id]/*/                 # UUID-based image proxy (internal/legacy)
├── components/                           # React components (Gallery, TechPanel, etc.)
├── lib/
│   ├── photo-source.ts                   # Picks the photo source (Immich → backup → snapshot → fallback folder)
│   ├── immich.ts                         # Immich API helpers with retry logic
│   ├── fetch-with-retry.ts              # Generic fetch with exponential backoff
│   ├── constants.ts                      # Cache duration constants
│   └── strings.ts                        # Title formatting & slug generation
├── middleware.ts                          # Security headers & rate limiting
├── fallback-photos/                      # Your last-resort photos (contents not committed)
├── Dockerfile                            # Multi-stage production build
├── docker-compose.yml                    # Docker Compose configuration
└── .env.example                          # Environment variable template
```

---

## 🔒 Security Features

This project includes several security measures for public self-hosting:

| Feature | Description |
|---------|-------------|
| **Security Headers** | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| **Rate Limiting** | 60 req/min for API routes, 200 req/min for pages (per IP) |
| **UUID Obfuscation** | Immich asset IDs never appear in browser URLs or network requests |
| **Input Validation** | All image proxy routes validate UUID format before forwarding to Immich |
| **Error Sanitization** | Upstream Immich errors return generic messages, never internal details |
| **No `X-Powered-By`** | Server doesn't reveal it runs Next.js |
| **Non-Root Container** | Docker image runs as unprivileged `nextjs` user |

---

## 🏗️ Architecture

For a visual explanation of how slug-based URLs and image proxying works, open:

```
docs/slug-architecture-diagram.html
```

This interactive diagram shows the full request flow from browser → Next.js → Immich, and explains how UUIDs are kept hidden from the client.

---

## ⚙️ Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_BASE_URL` | Yes | Public URL of the site | `https://astro.yourdomain.com` |
| `IMMICH_BASE_URL` | Yes | Immich server URL | `https://photos.yourdomain.com` or `http://host.docker.internal:2082` |
| `IMMICH_API_KEY` | Yes | Immich API key | `your-api-key-here` |
| `IMMICH_PORTFOLIO_ALBUM_ID` | No* | UUID of the portfolio album | `140bc00a-f4e7-...` |
| `IMMICH_PORTFOLIO_ALBUM_NAME` | No* | Name of the portfolio album | `Portfolio` |
| `DISABLE_CACHE` | No | Set `true` to disable server caching | `false` |
| `IMMICH_BACKUP_BASE_URL` | No | Backup Immich server, tried when the primary is down | `https://photos-backup.yourdomain.com` |
| `IMMICH_BACKUP_API_KEY` | No | API key for the backup (defaults to the primary's) | |
| `IMMICH_BACKUP_PORTFOLIO_ALBUM_ID` / `_NAME` | No | Album on the backup (name defaults to the primary's) | `Portfolio` |
| `SNAPSHOT_DIR` | No | Where the automatic snapshot is saved | `./.portfolio-snapshot` |
| `FALLBACK_PHOTOS_DIR` | No | Folder of your own JPG/PNG/WEBP files | `./fallback-photos` |

\* Provide at least one of `IMMICH_PORTFOLIO_ALBUM_ID` or `IMMICH_PORTFOLIO_ALBUM_NAME`.

---

## 🛟 Failover

The site keeps working when Immich is down. Sources are tried in this order:

1. **Primary Immich**
2. **Backup Immich** (optional): set `IMMICH_BACKUP_*` before planned maintenance
3. **Local snapshot**: saved automatically (listing, EXIF, thumbnails, previews) whenever Immich answers. Originals are not saved, so "Download Original" serves the preview in this mode
4. **Fallback folder**: put JPG/PNG/WEBP files in `fallback-photos/`. Used only if there is no snapshot yet; shows titles only

With Docker Compose, the snapshot lives in the `portfolio-snapshot` volume and `./fallback-photos` is mounted read-only. The log line `[photo-source] serving from: <source>` shows which one is live. A failed server is skipped for 60 seconds. To test locally, set `DISABLE_CACHE=true`, otherwise Next's fetch cache serves a stale Immich listing.

---

## 📝 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React Server Components)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Photo Backend:** [Immich](https://immich.app/)
- **Language:** TypeScript
- **Deployment:** Docker + Docker Compose

---

## 📄 License

MIT © [Alex Moisiadis](https://github.com/AlexMoisiadis)
