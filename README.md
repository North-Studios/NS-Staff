# 🌌 NS Staff v2.2.3

Catalog of developers, projects, and articles for the NS team – built on top of Express + SQLite backend and a modern React/Tailwind frontend.

---

## ⭐ Key Features

- **Developers** – detailed profiles with photos, contacts, skills, and linked projects.
- **Projects** – cards styled in the same visual language as staff, with tags and descriptions.
- **Articles** – news feed with markdown content, banner images, tags, and author linkage.
- **Search** – fast client-side filtering for staff, projects, and articles.
- **i18n** – RU/EN translations powered by `react-i18next`.
- **Single binary backend** – Express server, API, and Vite-built frontend served from one Node process.

---

## 🛠 Technical Architecture

### Project Structure

```text
NS-Staff/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx         # Router and app shell
│   │   ├── main.tsx        # React entry point
│   │   ├── pages/          # Pages: news, developers, projects, details
│   │   ├── components/     # UI, header, cards, polaroids, markdown
│   │   └── lib/            # i18n, query client, utils
│   └── index.html
├── server/                 # Express server and API
│   ├── index.ts            # Server bootstrap (express + vite/static)
│   ├── routes.ts           # REST API for staff, projects, news, uploads
│   ├── db.ts               # SQLite connection and schema migration
│   ├── storage.ts          # High-level data access helpers
│   ├── migrate-json.ts     # One-time migration from legacy JSON storage
│   ├── create-test-article.ts   # Utility to create demo article via API
│   ├── create-test-developer.ts # Utility to create demo developer via API
│   ├── create-test-project.ts   # Utility to create demo project via API
│   └── api-helper.ts            # Shared API client for test scripts
├── shared/
│   └── schema.ts           # Zod schemas and shared TypeScript types
├── data/                   # Data files, uploads, TEST.png banner, etc.
├── public/
│   └── locales/            # i18n translation JSONs (ru/en)
├── vite.config.ts          # Vite configuration for client
├── package.json            # Scripts and dependencies
└── README.md               # This file
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` in the project root (it is git-ignored):

```env
# API key for protected write operations (projects, developers, uploads, news)
API_KEY=your_api_key_here

# Optional flags
SUBDOMENS=false
DEBUG=false
```

You can extend this file with additional keys as your deployment requires.

### 3. Run in Development

```bash
npm run dev
```

This starts the Express server with Vite in middleware mode.  
The same port serves both API (`/api/*`) and the React SPA.

### 4. Build for Production

```bash
npm run build
```

This will:

- Build the React client into `dist/public` via Vite.
- Bundle the Express server (ESM) into `dist/index.js` via `esbuild`.
- Copy `data/**/*` into `dist/data`.

Then run:

```bash
npm start
```

---

## 📰 Content Management

### Staff & Projects

- Data is stored in SQLite; schemas are defined in `shared/schema.ts`.
- API endpoints (see `server/routes.ts`):
  - `GET /api/developers` – list all developers (staff members).
  - `GET /api/developers/:endpoint` – developer details.
  - `POST /api/developers` – create developer (requires `id` = Telegram ID, `endpoint`, `name`).
  - `PUT /api/developers/:endpoint` – update developer.
  - `DELETE /api/developers/:endpoint` – delete developer.
  - `POST /api/staff/:endpoint/photo/:num` – upload developer photo (1–3).
  - `GET /api/projects` – list projects.
  - `GET /api/projects/:endpoint` – project details.
  - `POST /api/projects` – create project.
  - `PUT /api/projects/:endpoint` – update project.
  - `DELETE /api/projects/:endpoint` – delete project.
  - `GET /api/projects/:endpoint/picture` – project hero image.
  - `POST /api/projects/:endpoint/picture` – upload project picture.
- Some write operations require `X-API-Key: <API_KEY>` header.

### News / Articles

- Articles live in the `news` table and are exposed via:
  - `GET /api/news` – list sorted by `published_at DESC`.
  - `GET /api/news/:id` – single article.
  - `POST /api/news` – create (requires API key).
  - `PUT /api/news/:id` – update (requires API key).
  - `DELETE /api/news/:id` – delete (requires API key).

#### Creating Test Data via API

These scripts create demo data through API requests (useful for verifying API and future admin site integration). **The server must be running** (e.g. `npm run dev`) before running them.

```bash
# In one terminal: start the server
npm run dev

# In another terminal: create test data
npm run dev:create-test-developer   # Creates developer "test-developer"
npm run dev:create-test-project    # Creates project "test-project" (links to test-developer)
npm run dev:create-test-article     # Creates article with TEST.png banner, author ovcharenski
```

- `dev:create-test-developer` – creates a test developer and uploads 3 photos (1–3) from `data/TEST.png` via API.
- `dev:create-test-project` – creates a test project and uploads picture from `data/TEST.png` via API (run after developer if you want the link).
- `dev:create-test-article` – creates a demo article, uploads banner from `data/TEST.png` via API.
- Ensure `data/TEST.png` exists before running these scripts.

---

## 🌐 Internationalization

- Powered by `react-i18next` with JSON-based resources in `public/locales/{lang}/common.json`.
- UI chooses language via `LanguageSwitcher` in the header.
- Titles, summaries, descriptions, and article content are stored as localized records:
  - Keys support both `"ru"/"en"` and legacy `"ru-RU"/"en-EN"` styles.
  - `getLocalizedValue` in `client/src/lib/utils.ts` resolves the correct string.

---

## 🧪 Useful Scripts

- `npm run dev` – start server + client in development.
- `npm run build` – build server and client into `dist/`.
- `npm start` – run built server in production mode.
- `npm run check` – TypeScript typecheck.
- `npm run db:migrate-json` – migrate legacy JSON data into SQLite.
- `npm run dev:create-test-article` – create a demo article via API (server must be running).
- `npm run dev:create-test-developer` – create a demo developer via API (server must be running).
- `npm run dev:create-test-project` – create a demo project via API (server must be running).

---

## 🆘 Troubleshooting

1. **Server fails with API key error**
   - Ensure `.env` contains `API_KEY`.
   - For routes that require authentication, send header `X-API-Key: Bearer <API_KEY>` or `X-API-Key: <API_KEY>`.

2. **Frontend loads but data is empty**
   - Check that SQLite DB is initialized (run migrations or JSON migration if needed).
   - Look at server logs – API responses are logged with status codes.

3. **Static images (photos, TEST.png) not loading**
   - Ensure `data/` folder exists and is available.
   - Staff photos are served via `/api/staff/:endpoint/photo/:num`.
   - Shared assets like `TEST.png` are served from `/data/TEST.png`.
