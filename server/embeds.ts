import type { Article, Project, StaffMember } from "@shared/schema";
import { storage as sqliteStorage } from "./storage";

export function generateMetaTags(options: {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: string;
  siteName?: string;
}) {
  const { title, description, image, url, type = "website", siteName = "NS Staff Portfolio" } = options;

  const tags = [
    `<title>NS Staff Portfolio</title>`,
    `<meta property="og:site_name" content="${siteName}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
  ];

  if (image) {
    tags.push(`<meta property="og:image" content="${image}" />`);
    tags.push(`<meta name="twitter:image" content="${image}" />`);
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
