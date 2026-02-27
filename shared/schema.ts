import { z } from "zod";

// Staff member schema
export const staffMemberSchema = z.object({
  id: z.string().optional(), // Telegram ID, stored in DB as primary key; required when creating via API
  endpoint: z.string(),
  // Localized name, currently supports ru/en. For backward compatibility
  // we keep it as a generic record on the frontend and will migrate values
  // to simple "ru" / "en" keys when moving to SQL.
  name: z.record(z.string()),
  nicknames: z.array(z.string()),
  age: z.number(),
  country: z.string(),
  languages: z.array(z.string()),
  post: z.string(),
  description: z.record(z.string()),
  contacts: z.object({
    email: z.string().optional(),
    telegram_channel: z.string().optional(),
    github: z.string().optional(),
    // X (formerly Twitter)
    x: z.string().optional(),
    // Varepsilon ID (auth project)
    vare: z.string().optional(),
  }),
  projects: z.array(z.string()),
  // Kept only for existing JSON-based storage; will be removed when
  // everything is moved to a unified design + SQL.
  colors: z
    .object({
      color1: z.string(),
      color2: z.string(),
      color_main: z.string(),
    })
    .optional(),
});

export type StaffMember = z.infer<typeof staffMemberSchema>;

// Project schema
export const projectSchema = z.object({
  endpoint: z.string(),
  name: z.string(),
  tags: z.array(z.string()),
  description: z.record(z.string()),
  developers: z.array(z.string()),
});

export type Project = z.infer<typeof projectSchema>;

// Article / news schema (for /api/news)
export const articleSchema = z.object({
  // 8-character unique identifier used as endpoint/slug
  id: z.string().length(8),
  // Localized title / summary / content; we will use "ru" and "en" keys
  // going forward, but keep this generic for now so frontend can evolve
  // independently from the storage layer.
  title: z.record(z.string()),
  summary: z.record(z.string()),
  content: z.record(z.string()),
  bannerUrl: z.string().optional(),
  publishedAt: z.string(), // ISO string
  tags: z.array(z.string()),
  author: z
    .object({
      endpoint: z.string(),
      avatarUrl: z.string().optional(),
    })
    .optional(),
});

export type Article = z.infer<typeof articleSchema>;

// Endpoints config schema (legacy JSON-based configs)
export const endpointsConfigSchema = z.object({
  endpoints: z.array(z.string()),
});

export type EndpointsConfig = z.infer<typeof endpointsConfigSchema>;

// Projects config schema (legacy JSON-based configs)
export const projectsConfigSchema = z.object({
  project_endpoints: z.array(z.string()),
  colors: z.object({
    color1: z.string(),
    color2: z.string(),
    color_main: z.string(),
  }),
});

export type ProjectsConfig = z.infer<typeof projectsConfigSchema>;

// Environment config
export interface AppConfig {
  subdomens: boolean;
  debug: boolean;
  companyStartDate?: string;
  companyEndDate?: string;
}
