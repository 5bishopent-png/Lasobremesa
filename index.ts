import { generateText } from "ai";

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      "Missing AI_GATEWAY_API_KEY. Add it to .env.local before running this example.",
    );
  }

  const { text } = await generateText({
    model: "moonshotai/kimi-k3",
    prompt:
      "Invent a new holiday. Give it a memorable name, explain what it celebrates, and describe its traditions, foods, activities, and how people prepare for it.",
  });

  console.log(text);
}

main().catch((error) => {
  console.error("AI Gateway example failed:", error);
  process.exitCode = 1;
});
