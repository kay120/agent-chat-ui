import type { Message } from "@langchain/langgraph-sdk";

export function getContentString(content: Message["content"]): string {
  if (typeof content === "string") return content;
  const texts = content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text);
  return texts.join(" ");
}

export function getContentImageUrls(content: Message["content"]): string[] {
  if (typeof content === "string") return [];
  return content
    .filter((c) => c.type === "image_url")
    .map((c) => {
      if (typeof c.image_url === "string") return c.image_url;
      return c.image_url.url;
    });
}
