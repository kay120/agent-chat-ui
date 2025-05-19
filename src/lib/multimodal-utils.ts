import type { Base64ContentBlock } from "@langchain/core/messages";
import { convertToOpenAIImageBlock } from "@langchain/core/messages";

// Returns a Promise of a typed multimodal block for images
export async function fileToImageBlock(
  file: File,
): Promise<Base64ContentBlock> {
  const data = await fileToBase64(file);
  return {
    type: "image",
    source_type: "base64",
    mime_type: file.type,
    data,
    metadata: { name: file.name },
  };
}

// Returns a Promise of a typed multimodal block for PDFs
export async function fileToPDFBlock(file: File): Promise<Base64ContentBlock> {
  const data = await fileToBase64(file);
  return {
    type: "file",
    source_type: "base64",
    mime_type: "application/pdf",
    data,
    metadata: { filename: file.name },
  };
}

// in lib/multimodal-utils.ts
export function toOpenAIPDFBlock(
  block: Base64ContentBlock,
): Base64ContentBlock {
  return {
    type: "file",
    source_type: "base64",
    data: block.data,
    mime_type: block.mime_type ?? "application/pdf",
    metadata: { filename: block.metadata?.filename ?? "file.pdf" },
  };
}

// Helper to convert File to base64 string
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Utility to convert base64 image blocks to OpenAI image_url format
export function toOpenAIImageBlock(block: Base64ContentBlock | any) {
  if (block.type === "image" && block.source_type === "base64") {
    return convertToOpenAIImageBlock(block);
  }
  return block;
}

const cleanBase64 = (base64String: string): string => {
  return base64String.replace(/^data:.*?;base64,/, "");
};
