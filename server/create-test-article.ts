import path from "path";
import { readFileSync } from "fs";
import { apiPost, apiUploadFile, API_BASE } from "./api-helper";

const DATA_TEST = path.join(process.cwd(), "data", "test");
const TEST_PNG = path.join(DATA_TEST, "TEST.png");
const RU_MD = path.join(DATA_TEST, "RU.md");
const EN_MD = path.join(DATA_TEST, "EN.md");

async function main() {
  const endpoint = "test-developer";

  // Upload TEST.png via API for the banner
  const uploadResult = await apiUploadFile<{ url: string }>("/api/upload/image", TEST_PNG);
  if (uploadResult.error) {
    console.error("Failed to upload banner image:", uploadResult.error);
    process.exit(1);
  }
  const bannerUrl = uploadResult.data!.url;

  const title = {
    ru: "Тестовая статья",
    en: "Test article",
  };

  const summary = {
    ru: "Краткое описание тестовой статьи для проверки верстки и контента.",
    en: "Short test article used to verify layout and content rendering.",
  };

  const content = {
    ru: readFileSync(RU_MD, "utf-8"),
    en: readFileSync(EN_MD, "utf-8"),
  };

  const body = {
    title,
    summary,
    content,
    bannerUrl,
    tags: ["test", "demo"],
    author: endpoint,
  };

  const result = await apiPost<{ id: string }>("/api/news", body);

  if (result.error) {
    console.error("Failed to create test article:", result.error);
    process.exit(1);
  }

  const id = result.data?.id ?? "unknown";

  console.log("Created test article:");
  console.log(`  id: ${id}`);
  console.log(`  GET ${API_BASE}/api/news/${id}`);
  console.log(`  Author: ${endpoint}`);
  console.log(`  Author photo: /api/staff/${endpoint}/photo/1`);
  console.log(`  Banner URL: ${bannerUrl}`);
  console.log("");
  console.log("Открой в браузере:");
  console.log(`  ${API_BASE}/news/${id}`);
  console.log("и проверь, что аватар статьи грузится с 1.png автора.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
