# 🌌 NS Staff v2.1.1

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
│   └── create-test-article.ts # Utility to create demo article with TEST.png banner
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
  - `GET /api/projects` – list projects.
  - `GET /api/projects/:endpoint` – project details.
  - `GET /api/projects/:endpoint/picture` – project hero image.
- Some write operations require `X-API-Key: <API_KEY>` header.

### News / Articles

- Articles live in the `news` table and are exposed via:
  - `GET /api/news` – list sorted by `published_at DESC`.
  - `GET /api/news/:id` – single article.
  - `POST /api/news` – create (requires API key).
  - `PUT /api/news/:id` – update (requires API key).
  - `DELETE /api/news/:id` – delete (requires API key).

#### Creating a Demo Article

For quick visual testing of layout and banner rendering:

```bash
npm run dev:create-test-article
```

The helper script will:

- Ensure DB schema is migrated.
- Link the article to developer `ovcharenski` (if present).
- Use `/data/TEST.png` as a banner (make sure the file exists).

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
- `npm run dev:create-test-article` – create a demo article with a banner and markdown content.

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

