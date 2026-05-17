import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { StaffMember, Project, Article } from "@shared/schema";
import { db } from "./db";

// Определяем __dirname в ES-модуле
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Путь к папке data (для фото и загруженных файлов)
// В dev-режиме: server/../data (корень проекта/data)
// В production: dist/server/../data (dist/data)
const DATA_DIR = path.join(__dirname, "..", "data");

export type StaffQueryOptions = { includeBirthDate?: boolean };

export interface IStorage {
  getAllStaff(options?: StaffQueryOptions): Promise<StaffMember[]>;
  getStaffByEndpoint(endpoint: string, options?: StaffQueryOptions): Promise<StaffMember | undefined>;
  getAllProjects(): Promise<Project[]>;
  getProjectByEndpoint(endpoint: string): Promise<Project | undefined>;
  getStaffPhotoPath(endpoint: string, photoNum: number): string;
  getProjectPicturePath(endpoint: string): Promise<string | undefined>;
  getNewsById(id: string): Promise<Article | undefined>;
}

class SqliteStorage implements IStorage {
  async getAllStaff(options?: StaffQueryOptions): Promise<StaffMember[]> {
    const rows = db
      .prepare(
        `SELECT id, endpoint, name_json, nicknames_json, birth_date, country, languages_json,
                post, description_json, contacts_json
         FROM developers
         ORDER BY endpoint ASC`,
      )
      .all() as any[];

    return rows.map((row) => this.rowToStaff(row, options));
  }

  async getStaffByEndpoint(
    endpoint: string,
    options?: StaffQueryOptions,
  ): Promise<StaffMember | undefined> {
    const row = db
      .prepare(
        `SELECT id, endpoint, name_json, nicknames_json, birth_date, country, languages_json,
                post, description_json, contacts_json
         FROM developers
         WHERE endpoint = ?`,
      )
      .get(endpoint) as any | undefined;

    if (!row) return undefined;
    return this.rowToStaff(row, options);
  }

  async getAllProjects(): Promise<Project[]> {
    const rows = db
      .prepare(
        `SELECT endpoint, name, description_json, tags_json, developers_json
         FROM projects
         ORDER BY endpoint ASC`,
      )
      .all() as any[];

    return rows.map(this.rowToProject);
  }

  async getProjectByEndpoint(endpoint: string): Promise<Project | undefined> {
    const row = db
      .prepare(
        `SELECT endpoint, name, description_json, tags_json, developers_json
         FROM projects
         WHERE endpoint = ?`,
      )
      .get(endpoint) as any | undefined;

    if (!row) return undefined;
    return this.rowToProject(row);
  }

  getStaffPhotoPath(endpoint: string, photoNum: number): string {
    return path.join(DATA_DIR, "staff", endpoint, `${photoNum}.png`);
  }

  async getProjectPicturePath(endpoint: string): Promise<string | undefined> {
    const basePath = path.join(DATA_DIR, "projects", "pictures", endpoint);

    // Try different extensions
    const extensions = [".jpg", ".png", ".jpeg", ".webp"];
    for (const ext of extensions) {
      const fullPath = basePath + ext;
      try {
        await fs.access(fullPath);
        return fullPath;
      } catch {
        continue;
      }
    }

    return undefined;
  }

  async getNewsById(id: string): Promise<Article | undefined> {
    const row = db.prepare(`SELECT * FROM news WHERE id = ?`).get(id) as any | undefined;
    if (!row) return undefined;
    return this.rowToArticle(row);
  }

  private rowToArticle(row: any): Article {
    return {
      id: row.id,
      title: safeParseJsonRecord(row.title_json),
      summary: safeParseJsonRecord(row.summary_json),
      content: safeParseJsonRecord(row.content_json),
      bannerUrl: row.banner_url ?? undefined,
      publishedAt: row.published_at,
      tags: safeParseJsonArray(row.tags_json),
      author: row.author_endpoint ?? undefined,
    };
  }

  private rowToStaff(row: any, options?: StaffQueryOptions): StaffMember {
    const endpoint = row.endpoint;
    const projects = this.getProjectsForDeveloper(endpoint);
    const birthDate = row.birth_date ?? undefined;
    const age = birthDate ? getAgeFromBirthDate(birthDate) : null;
    const member: StaffMember = {
      id: row.id,
      endpoint,
      name: safeParseJsonRecord(row.name_json),
      nicknames: safeParseJsonArray(row.nicknames_json),
      age: age ?? undefined,
      country: row.country ?? "",
      languages: safeParseJsonArray(row.languages_json),
      post: row.post ?? "",
      description: safeParseJsonRecord(row.description_json),
      contacts: safeParseJsonObject(row.contacts_json),
      projects,
      colors: undefined as any, // legacy field not used with unified design
    };
    if (options?.includeBirthDate && birthDate) {
      member.birthDate = birthDate;
    }
    return member;
  }

  private getProjectsForDeveloper(developerEndpoint: string): string[] {
    const rows = db
      .prepare(
        `SELECT endpoint, developers_json FROM projects`,
      )
      .all() as { endpoint: string; developers_json: string }[];
    return rows
      .filter((r) => safeParseJsonArray(r.developers_json).includes(developerEndpoint))
      .map((r) => r.endpoint);
  }

  private rowToProject(row: any): Project {
    return {
      endpoint: row.endpoint,
      name: row.name,
      tags: safeParseJsonArray(row.tags_json),
      description: safeParseJsonRecord(row.description_json),
      developers: safeParseJsonArray(row.developers_json),
    };
  }
}

function getAgeFromBirthDate(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
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

function safeParseJsonObject(value: any): any {
  if (!value) return {};
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export const storage = new SqliteStorage();
