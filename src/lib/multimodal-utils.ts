import type { Base64ContentBlock } from "@langchain/core/messages";

// Returns a Promise of a typed multimodal block for images
export async function fileToImageBlock(
  file: File,
): Promise<Base64ContentBlock> {
  const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!supportedTypes.includes(file.type)) {
    throw new Error(
      `Unsupported image type: ${file.type}. Supported types are: ${supportedTypes.join(", ")}`,
    );
  }
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
