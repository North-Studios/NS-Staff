import type { Article, Project, StaffMember } from "@shared/schema";
import { storage as sqliteStorage } from "./storage";

const MAX_DESCRIPTION_LENGTH = 300;

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripMarkdown(input: string): string {
  return input
    // Images: ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    // Links: [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Inline code, bold, italics, strikethrough markers
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    // Headings / blockquotes / list markers at line start
    .replace(/^\s{0,3}(#{1,6}\s+|>\s+|[-*+]\s+|\d+\.\s+)/gm, "");
}

function sanitizeForMeta(value: string, maxLength = MAX_DESCRIPTION_LENGTH): string {
  const stripped = stripMarkdown(value);
  // Collapse all whitespace (including newlines) into single spaces.
  const collapsed = stripped.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLength) return escapeHtmlAttribute(collapsed);
  return escapeHtmlAttribute(collapsed.slice(0, maxLength - 1).trimEnd() + "…");
}

export function generateMetaTags(options: {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: string;
  siteName?: string;
}) {
  const { title, description, image, url, type = "website", siteName = "NS Staff Portfolio" } = options;

  const safeTitle = sanitizeForMeta(title, 150);
  const safeDescription = sanitizeForMeta(description);
  const safeUrl = escapeHtmlAttribute(url);
  const safeType = escapeHtmlAttribute(type);
  const safeSiteName = escapeHtmlAttribute(siteName);

  const tags = [
    `<title>NS Staff Portfolio</title>`,
    `<meta property="og:site_name" content="${safeSiteName}" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDescription}" />`,
    `<meta property="og:url" content="${safeUrl}" />`,
    `<meta property="og:type" content="${safeType}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDescription}" />`,
  ];

  if (image) {
    const safeImage = escapeHtmlAttribute(image);
    tags.push(`<meta property="og:image" content="${safeImage}" />`);
    tags.push(`<meta name="twitter:image" content="${safeImage}" />`);
  }

  return tags.join("\n    ");
}

export function injectMetaTags(html: string, metaTags: string) {
  // Try to find the title tag to replace it, or just inject before </head>
  const titleMatch = html.match(/<title>.*?<\/title>/);
  let result = html;
  
  if (titleMatch) {
    result = result.replace(titleMatch[0], ""); // Remove existing title tag
  }
  
  return result.replace("</head>", `    ${metaTags}\n  </head>`);
}

function getLocalizedValue(record: Record<string, string>, lang: string = "en"): string {
  return record[lang] || record["en"] || Object.values(record)[0] || "";
}

export async function getNewsMetadata(id: string, baseUrl: string) {
  try {
    const article = await sqliteStorage.getNewsById(id);
    if (!article) return null;

    const title = getLocalizedValue(article.title);
    const description = getLocalizedValue(article.summary) || getLocalizedValue(article.content).slice(0, 200) + "...";
    const image = article.bannerUrl ? (article.bannerUrl.startsWith("http") ? article.bannerUrl : `${baseUrl}${article.bannerUrl}`) : undefined;
    const url = `${baseUrl}/news/${id}`;

    return generateMetaTags({
      title,
      description,
      image,
      url,
      type: "article",
    });
  } catch (error) {
    console.error("Error generating news metadata:", error);
    return null;
  }
}

export async function getDeveloperMetadata(endpoint: string, baseUrl: string) {
  try {
    const staff = await sqliteStorage.getStaffByEndpoint(endpoint);
    if (!staff) return null;

    const name = getLocalizedValue(staff.name);
    const nicknames = staff.nicknames.map(n => `@${n}`).join(" ");
    const title = `${name}${nicknames ? ` (${nicknames})` : ""} | ${staff.post}`;
    const description = getLocalizedValue(staff.description);
    const image = `${baseUrl}/api/staff/${endpoint}/photo/1`;
    const url = `${baseUrl}/developers/${endpoint}`;

    return generateMetaTags({
      title,
      description,
      image,
      url,
      type: "profile",
    });
  } catch (error) {
    console.error("Error generating developer metadata:", error);
    return null;
  }
}

export async function getProjectMetadata(endpoint: string, baseUrl: string) {
  try {
    const project = await sqliteStorage.getProjectByEndpoint(endpoint);
    if (!project) return null;

    const title = project.name;
    const description = getLocalizedValue(project.description);
    const image = `${baseUrl}/api/projects/${endpoint}/picture`;
    const url = `${baseUrl}/projects/${endpoint}`;

    return generateMetaTags({
      title,
      description,
      image,
      url,
      type: "website",
    });
  } catch (error) {
    console.error("Error generating project metadata:", error);
    return null;
  }
}
