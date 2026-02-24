import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { promises as fs } from 'fs';
import path from 'path';
import { db, DATA_DIR } from "./db";
import type { Article, Project, StaffMember } from "@shared/schema";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname } from "path";

function getApiKeyFromRequest(req: Request): string | null {
  const header = req.header("X-API-Key");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (match) return match[1].trim();
  return header.trim();
}

function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.API_KEY;
  if (!expected) {
    return res.status(500).json({ error: "API key is not configured on the server" });
  }

  const provided = getApiKeyFromRequest(req);
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }

  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get environment config
  const envConfig = {
    subdomens: process.env.SUBDOMENS === 'true',
    debug: process.env.DEBUG === 'true',
  };

  //
  // Static assets
  //

  // Serve shared data files (e.g. /data/TEST.png used for test articles)
  const dataDir = path.join(process.cwd(), "data");
  app.use("/data", express.static(dataDir));

  // Serve supported languages and countries
  app.get('/api/supported', async (_req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'data', 'supported.json');
      const content = await fs.readFile(filePath, 'utf-8');
      res.json(JSON.parse(content));
    } catch (error) {
      res.status(404).json({ error: 'supported.json not found' });
    }
  });

  // Serve translation files
  app.get('/locales/:lang/:ns.json', async (req, res) => {
    try {
      const { lang, ns } = req.params;
      const filePath = path.join(process.cwd(), 'public', 'locales', lang, `${ns}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      res.json(JSON.parse(content));
    } catch (error) {
      res.status(404).json({ error: 'Translation file not found' });
    }
  });

  //
  // Static serving for uploaded files
  //
  const uploadsDir = path.join(DATA_DIR, "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  app.use("/uploads", express.static(uploadsDir));

  // Get staff photo
  app.get('/api/staff/:endpoint/photo/:num', async (req, res) => {
    try {
      const { endpoint, num } = req.params;
      const photoNum = parseInt(num, 10);
      
      if (isNaN(photoNum) || photoNum < 1 || photoNum > 3) {
        return res.status(400).json({ error: 'Invalid photo number' });
      }

      const photoPath = storage.getStaffPhotoPath(endpoint, photoNum);
      
      // Check if file exists
      try {
        await fs.access(photoPath);
        res.sendFile(photoPath);
      } catch {
        res.status(404).json({ error: 'Photo not found' });
      }
    } catch (error) {
      console.error('Error fetching photo:', error);
      res.status(500).json({ error: 'Failed to fetch photo' });
    }
  });

  // Upload staff photo (requires API key)
  const staffPhotoStorage = multer.diskStorage({
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    destination: async (req: Request, _file: Express.Multer.File, cb) => {
      try {
        const dir = path.join(DATA_DIR, "staff", req.params.endpoint);
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
      } catch (err: unknown) {
        cb(err as Error, "");
      }
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      const num = req.params.num;
      const ext = path.extname(file.originalname) || ".png";
      cb(null, `${num}${ext}`);
    },
  });

  app.post(
    '/api/staff/:endpoint/photo/:num',
    requireApiKey,
    multer({ storage: staffPhotoStorage, limits: { fileSize: 10 * 1024 * 1024 } }).single('file'),
    async (req: Request, res: Response) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      res.status(201).json({ url: `/api/staff/${req.params.endpoint}/photo/${req.params.num}` });
    },
  );

  //
  // Projects (legacy endpoints, kept until frontend moves to /api/projects CRUD fully)
  //

  // Get all projects
  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  // Get single project
  app.get('/api/projects/:endpoint', async (req, res) => {
    try {
      const { endpoint } = req.params;
      const project = await storage.getProjectByEndpoint(endpoint);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  });

  // Get project picture
  app.get('/api/projects/:endpoint/picture', async (req, res) => {
    try {
      const { endpoint } = req.params;
      const picturePath = await storage.getProjectPicturePath(endpoint);
      
      if (!picturePath) {
        return res.status(404).json({ error: 'Project picture not found' });
      }

      res.sendFile(picturePath);
    } catch (error) {
      console.error('Error fetching project picture:', error);
      res.status(500).json({ error: 'Failed to fetch project picture' });
    }
  });

  // Upload project picture (requires API key)
  const projectPictureStorage = multer.diskStorage({
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    destination: async (_req: Request, _file: Express.Multer.File, cb) => {
      try {
        const dir = path.join(DATA_DIR, "projects", "pictures");
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
      } catch (err: unknown) {
        cb(err as Error, "");
      }
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      const endpoint = req.params.endpoint;
      const ext = path.extname(file.originalname) || ".png";
      cb(null, `${endpoint}${ext}`);
    },
  });

  app.post(
    '/api/projects/:endpoint/picture',
    requireApiKey,
    multer({ storage: projectPictureStorage, limits: { fileSize: 10 * 1024 * 1024 } }).single('file'),
    async (req: Request, res: Response) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      res.status(201).json({ url: `/api/projects/${req.params.endpoint}/picture` });
    },
  );

  //
  // New API: developers
  //

  app.get('/api/developers', async (_req, res) => {
    try {
      const staff = await storage.getAllStaff();
      res.json(staff);
    } catch (error) {
      console.error('Error fetching developers:', error);
      res.status(500).json({ error: 'Failed to fetch developers' });
    }
  });

  app.get('/api/developers/:endpoint', async (req, res) => {
    try {
      const { endpoint } = req.params;
      const staff = await storage.getStaffByEndpoint(endpoint);
      
      if (!staff) {
        return res.status(404).json({ error: 'Developer not found' });
      }
      
      res.json(staff);
    } catch (error) {
      console.error('Error fetching developer:', error);
      res.status(500).json({ error: 'Failed to fetch developer' });
    }
  });

  app.post('/api/developers', requireApiKey, async (req, res) => {
    try {
      const body = req.body as Partial<StaffMember> & { id?: string };
      if (!body || !body.endpoint || !body.name) {
        return res.status(400).json({ error: 'endpoint and name are required' });
      }
      if (!body.id) {
        return res.status(400).json({ error: 'id (Telegram ID) is required' });
      }

      const now = new Date().toISOString();
      const id = body.id;

      db.prepare(
        `INSERT INTO developers (
          id, endpoint, name_json, nicknames_json, age, country,
          languages_json, post, description_json, contacts_json,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        body.endpoint,
        JSON.stringify(body.name),
        JSON.stringify(body.nicknames ?? []),
        body.age ?? null,
        body.country ?? null,
        JSON.stringify(body.languages ?? []),
        body.post ?? null,
        JSON.stringify(body.description ?? {}),
        JSON.stringify(body.contacts ?? {}),
        now,
        now,
      );

      const created = await storage.getStaffByEndpoint(body.endpoint);
      res.status(201).json(created);
    } catch (error: any) {
      if (error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ error: 'Developer with this endpoint already exists' });
      }
      if (error && error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        return res.status(409).json({ error: 'Developer with this id (Telegram ID) already exists' });
      }
      console.error('Error creating developer:', error);
      res.status(500).json({ error: 'Failed to create developer' });
    }
  });

  app.put('/api/developers/:endpoint', requireApiKey, async (req, res) => {
    try {
      const { endpoint } = req.params;
      const existing = await storage.getStaffByEndpoint(endpoint);
      if (!existing) {
        return res.status(404).json({ error: 'Developer not found' });
      }

      const body = req.body as Partial<StaffMember>;
      const merged: StaffMember = {
        ...existing,
        ...body,
        name: { ...existing.name, ...(body.name ?? {}) },
        description: { ...existing.description, ...(body.description ?? {}) },
        contacts: { ...existing.contacts, ...(body.contacts ?? {}) },
        nicknames: body.nicknames ?? existing.nicknames,
        languages: body.languages ?? existing.languages,
        projects: body.projects ?? existing.projects,
      };

      const now = new Date().toISOString();

      db.prepare(
        `UPDATE developers
         SET name_json = ?, nicknames_json = ?, age = ?, country = ?,
             languages_json = ?, post = ?, description_json = ?, contacts_json = ?, updated_at = ?
         WHERE endpoint = ?`,
      ).run(
        JSON.stringify(merged.name),
        JSON.stringify(merged.nicknames),
        merged.age,
        merged.country,
        JSON.stringify(merged.languages),
        merged.post,
        JSON.stringify(merged.description),
        JSON.stringify(merged.contacts),
        now,
        endpoint,
      );

      const updated = await storage.getStaffByEndpoint(endpoint);
      res.json(updated);
    } catch (error) {
      console.error('Error updating developer:', error);
      res.status(500).json({ error: 'Failed to update developer' });
    }
  });

  app.delete('/api/developers/:endpoint', requireApiKey, async (req, res) => {
    try {
      const { endpoint } = req.params;
      const existing = await storage.getStaffByEndpoint(endpoint);
      if (!existing) {
        return res.status(404).json({ error: 'Developer not found' });
      }

      db.prepare(`DELETE FROM developers WHERE endpoint = ?`).run(endpoint);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting developer:', error);
      res.status(500).json({ error: 'Failed to delete developer' });
    }
  });

  app.post('/api/projects', requireApiKey, async (req, res) => {
    try {
      const body = req.body as Partial<Project>;
      if (!body || !body.endpoint || !body.name) {
        return res.status(400).json({ error: 'endpoint and name are required' });
      }

      const now = new Date().toISOString();
      const id = body.endpoint;

      db.prepare(
        `INSERT INTO projects (
          id, endpoint, name, description_json, tags_json, developers_json,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        body.endpoint,
        body.name,
        JSON.stringify(body.description ?? {}),
        JSON.stringify(body.tags ?? []),
        JSON.stringify(body.developers ?? []),
        now,
        now,
      );

      const row = db
        .prepare(
          `SELECT endpoint, name, description_json, tags_json, developers_json
           FROM projects
           WHERE endpoint = ?`,
        )
        .get(body.endpoint) as any;

      const created: Project = {
        endpoint: row.endpoint,
        name: row.name,
        description: safeParseJsonRecord(row.description_json),
        tags: safeParseJsonArray(row.tags_json),
        developers: safeParseJsonArray(row.developers_json),
      };

      res.status(201).json(created);
    } catch (error: any) {
      if (error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ error: 'Project with this endpoint already exists' });
      }
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  app.put('/api/projects/:endpoint', requireApiKey, async (req, res) => {
    try {
      const { endpoint } = req.params;
      const row = db
        .prepare(
          `SELECT endpoint, name, description_json, tags_json, developers_json
           FROM projects
           WHERE endpoint = ?`,
        )
        .get(endpoint) as any | undefined;

      if (!row) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const existing: Project = {
        endpoint: row.endpoint,
        name: row.name,
        description: safeParseJsonRecord(row.description_json),
        tags: safeParseJsonArray(row.tags_json),
        developers: safeParseJsonArray(row.developers_json),
      };

      const body = req.body as Partial<Project>;
      const merged: Project = {
        ...existing,
        ...body,
        description: { ...existing.description, ...(body.description ?? {}) },
        tags: body.tags ?? existing.tags,
        developers: body.developers ?? existing.developers,
      };

      const now = new Date().toISOString();

      db.prepare(
        `UPDATE projects
         SET name = ?, description_json = ?, tags_json = ?, developers_json = ?, updated_at = ?
         WHERE endpoint = ?`,
      ).run(
        merged.name,
        JSON.stringify(merged.description),
        JSON.stringify(merged.tags),
        JSON.stringify(merged.developers),
        now,
        endpoint,
      );

      res.json(merged);
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  });

  app.delete('/api/projects/:endpoint', requireApiKey, async (req, res) => {
    try {
      const { endpoint } = req.params;

      const row = db
        .prepare(`SELECT 1 FROM projects WHERE endpoint = ?`)
        .get(endpoint) as any | undefined;
      if (!row) {
        return res.status(404).json({ error: 'Project not found' });
      }

      db.prepare(`DELETE FROM projects WHERE endpoint = ?`).run(endpoint);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  //
  // New API: news (articles)
  //

  app.get('/api/news', async (_req, res) => {
    try {
      const rows = db
        .prepare(
          `SELECT * FROM news ORDER BY datetime(published_at) DESC`,
        )
        .all() as any[];

      const articles: Article[] = rows.map(rowToArticle);
      res.json(articles);
    } catch (error) {
      console.error('Error fetching news:', error);
      res.status(500).json({ error: 'Failed to fetch news' });
    }
  });

  app.get('/api/news/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const row = db
        .prepare(`SELECT * FROM news WHERE id = ?`)
        .get(id) as any | undefined;

      if (!row) {
        return res.status(404).json({ error: 'Article not found' });
      }

      const article = rowToArticle(row);
      res.json(article);
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  app.post('/api/news', requireApiKey, (req, res) => {
    try {
      const body = req.body as Partial<Article>;
      if (!body || !body.title || !body.content) {
        return res.status(400).json({ error: 'title and content are required' });
      }

      // 8-char id: if provided, use it; otherwise generate from timestamp+random
      const id =
        (body as any).id && String((body as any).id).length === 8
          ? String((body as any).id)
          : generateId8();

      const now = new Date();
      const nowIso = now.toISOString();

      const publishedAt =
        body.publishedAt && !Number.isNaN(new Date(body.publishedAt).getTime())
          ? body.publishedAt
          : nowIso;

      const author = body.author;

      db.prepare(
        `INSERT INTO news (
          id, title_json, summary_json, content_json, banner_url,
          author_endpoint, author_avatar_url,
          tags_json, published_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        JSON.stringify(body.title),
        JSON.stringify(body.summary ?? {}),
        JSON.stringify(body.content),
        body.bannerUrl ?? null,
        author?.endpoint ?? null,
        author?.avatarUrl ?? null,
        JSON.stringify(body.tags ?? []),
        publishedAt,
        nowIso,
        nowIso,
      );

      const row = db.prepare(`SELECT * FROM news WHERE id = ?`).get(id) as any;
      const article = rowToArticle(row);
      res.status(201).json(article);
    } catch (error: any) {
      if (error && error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        return res.status(409).json({ error: 'Article with this id already exists' });
      }
      console.error('Error creating article:', error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  });

  app.put('/api/news/:id', requireApiKey, (req, res) => {
    try {
      const { id } = req.params;
      const existingRow = db
        .prepare(`SELECT * FROM news WHERE id = ?`)
        .get(id) as any | undefined;

      if (!existingRow) {
        return res.status(404).json({ error: 'Article not found' });
      }

      const existing = rowToArticle(existingRow);
      const body = req.body as Partial<Article>;

      const merged: Article = {
        ...existing,
        ...body,
        title: { ...existing.title, ...(body.title ?? {}) },
        summary: { ...existing.summary, ...(body.summary ?? {}) },
        content: { ...existing.content, ...(body.content ?? {}) },
        tags: body.tags ?? existing.tags,
        author: body.author ?? existing.author,
      };

      const nowIso = new Date().toISOString();

      db.prepare(
        `UPDATE news
         SET title_json = ?, summary_json = ?, content_json = ?, banner_url = ?,
             author_endpoint = ?, author_avatar_url = ?,
             tags_json = ?, published_at = ?, updated_at = ?
         WHERE id = ?`,
      ).run(
        JSON.stringify(merged.title),
        JSON.stringify(merged.summary),
        JSON.stringify(merged.content),
        merged.bannerUrl ?? null,
        merged.author?.endpoint ?? null,
        merged.author?.avatarUrl ?? null,
        JSON.stringify(merged.tags),
        merged.publishedAt,
        nowIso,
        id,
      );

      const row = db.prepare(`SELECT * FROM news WHERE id = ?`).get(id) as any;
      res.json(rowToArticle(row));
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ error: 'Failed to update article' });
    }
  });

  app.delete('/api/news/:id', requireApiKey, (req, res) => {
    try {
      const { id } = req.params;
      const existing = db
        .prepare(`SELECT 1 FROM news WHERE id = ?`)
        .get(id) as any | undefined;
      if (!existing) {
        return res.status(404).json({ error: 'Article not found' });
      }

      db.prepare(`DELETE FROM news WHERE id = ?`).run(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting article:', error);
      res.status(500).json({ error: 'Failed to delete article' });
    }
  });

  //
  // Upload image
  //
  const uploadStorage = multer.diskStorage({
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    destination: async (_req: Request, _file: Express.Multer.File, cb) => {
      try {
        const dir = path.join(DATA_DIR, "uploads");
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
      } catch (err: any) {
        cb(err, "");
      }
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname) || "";
      cb(null, `${timestamp}-${random}${ext}`);
    },
  });

  const upload = multer({
    storage: uploadStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
    },
  });

  app.post(
    '/api/upload/image',
    requireApiKey,
    upload.single('file'),
    (req: Request, res: Response) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file as Express.Multer.File;
      const relativePath = `/uploads/${file.filename}`;

      // Save metadata to uploads table
      const nowIso = new Date().toISOString();
      db.prepare(
        `INSERT INTO uploads (id, type, url, created_at)
         VALUES (?, ?, ?, ?)`,
      ).run(
        file.filename,
        'image',
        relativePath,
        nowIso,
      );

      res.status(201).json({
        url: relativePath,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      });
    },
  );

  //
  // Get environment config (requires API key)
  app.get('/api/config', requireApiKey, (req, res) => {
    res.json(envConfig);
  });

  //
  // Health check (no API key required)
  //
  app.get('/api/health', async (_req, res) => {
    try {
      // Read version from package.json
      const pkgPath = path.join(process.cwd(), "package.json");
      const pkgRaw = await fs.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgRaw) as { version?: string };

      res.json({
        status: "healthy",
        timestamp: Math.floor(Date.now() / 1000),
        version: pkg.version ?? "unknown",
      });
    } catch (error) {
      console.error("Error in /api/health:", error);
      res.status(500).json({
        status: "unhealthy",
        timestamp: Math.floor(Date.now() / 1000),
        version: "unknown",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

function safeParseJsonArray(value: any): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseJsonRecord(value: any): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function rowToArticle(row: any): Article {
  return {
    id: row.id,
    title: safeParseJsonRecord(row.title_json),
    summary: safeParseJsonRecord(row.summary_json),
    content: safeParseJsonRecord(row.content_json),
    bannerUrl: row.banner_url ?? undefined,
    publishedAt: row.published_at,
    tags: safeParseJsonArray(row.tags_json),
    author: row.author_endpoint
      ? {
          endpoint: row.author_endpoint,
          avatarUrl: row.author_avatar_url ?? undefined,
        }
      : undefined,
  };
}

function generateId8(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}
