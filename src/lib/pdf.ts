"use server"
import {  MessageContentText } from "@langchain/core/messages";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
// import { Base64ContentBlock } from "@langchain/core/messages";

// switch local import with above import
interface Base64ContentBlock {
    data: string;
    metadata?: Record<string, unknown>;
    mime_type?: string;
    source_type: "base64";
    type: "image" | "audio" | "file";
}

export const extractPdfText = async (file: File): Promise<MessageContentText> => {

    const loader = new WebPDFLoader(file, { splitPages: false });
    const docs = await loader.load();
    return {
      type: "text",
      text: docs[0].pageContent,
    };
  };

