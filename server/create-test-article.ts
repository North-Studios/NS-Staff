import path from "path";
import { apiPost, apiUploadFile, API_BASE } from "./api-helper";

const TEST_PNG = path.join(process.cwd(), "data", "TEST.png");

async function main() {
  const endpoint = "ovcharenski";

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
    ru: [
      "# Привет из тестовой статьи",
      "",
      "Это **markdown**‑контент с ссылками, кодом и списками.",
      "",
      "[Markdown Live Preview](https://markdownlivepreview.com/)",
      "",
      "```ts",
      "console.log('hello from test article');",
      "```",
      "",
      "- Проверка отображения заголовка",
      "- Проверка отображения списков",
      "- Проверка баннера (загружен через API)",
    ].join("\n"),
    en: [
      "# Hello from test article",
      "",
      "This is **markdown** content with links, code blocks and lists.",
      "",
      "[Markdown Live Preview](https://markdownlivepreview.com/)",
      "",
      "```ts",
      "console.log('hello from test article');",
      "```",
      "",
      "- Check heading rendering",
      "- Check list rendering",
      "- Check banner (uploaded via API)",
    ].join("\n"),
  };

  const avatarUrl = `/api/staff/${endpoint}/photo/1`;

  const body = {
    title,
    summary,
    content,
    bannerUrl,
    tags: ["test", "demo"],
    author: {
      endpoint,
      avatarUrl,
    },
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
  console.log(`  Author endpoint: ${endpoint}`);
  console.log(`  Author avatarUrl: ${avatarUrl}`);
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
