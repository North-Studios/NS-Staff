import path from "path";
import { apiPost, apiUploadFile, API_BASE } from "./api-helper";

const TEST_PNG = path.join(process.cwd(), "data", "TEST.png");

async function main() {
  const endpoint = "test-developer";

  const body = {
    id: "123456789", // test Telegram ID
    endpoint,
    name: {
      ru: "Тестовый Разработчик",
      en: "Test Developer",
    },
    nicknames: ["testdev"],
    age: 25,
    country: "RU",
    languages: ["Russian","English"],
    post: "Junior Developer",
    description: {
      ru: "Тестовый сотрудник для проверки API.",
      en: "Test employee for API verification.",
    },
    contacts: {
      email: "test@example.com",
      telegram_channel: "https://t.me/testdev",
      github: "https://github.com/testdev",
      x: "https://x.com/testdev",
      vare: "http://varepsilon.local/testdev",
    },
  };

  const result = await apiPost<{ endpoint: string }>("/api/developers", body);

  if (result.error) {
    if (result.status === 409) {
      console.log(`Developer "${endpoint}" already exists.`);
      console.log(`  GET ${API_BASE}/api/developers/${endpoint}`);
      // Still try to upload photo in case it was missing
    } else {
      console.error("Failed to create test developer:", result.error);
      process.exit(1);
    }
  }

  // Upload photos via API (1–3)
  for (let i = 1; i <= 3; i++) {
    const photoResult = await apiUploadFile(`/api/staff/${endpoint}/photo/${i}`, TEST_PNG);
    if (photoResult.error) {
      console.warn(`Warning: could not upload developer photo ${i}:`, photoResult.error);
    }
  }

  if (result.error && result.status === 409) return;

  console.log("Created test developer:");
  console.log(`  endpoint: ${endpoint}`);
  console.log(`  GET ${API_BASE}/api/developers/${endpoint}`);
  console.log("");
  console.log("Открой в браузере:");
  console.log(`  ${API_BASE}/developers/${endpoint}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
