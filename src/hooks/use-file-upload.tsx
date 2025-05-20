import { useState, useRef, useEffect, ChangeEvent } from "react";
import { toast } from "sonner";
import type { Base64ContentBlock } from "@langchain/core/messages";
import { fileToContentBlock } from "@/lib/multimodal-utils";

export const SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

interface UseFileUploadOptions {
  initialBlocks?: Base64ContentBlock[];
}

export function useFileUpload({
  initialBlocks = [],
}: UseFileUploadOptions = {}) {
  const [contentBlocks, setContentBlocks] =
    useState<Base64ContentBlock[]>(initialBlocks);
  const dropRef = useRef<HTMLDivElement>(null);

  const isDuplicate = (file: File, blocks: Base64ContentBlock[]) => {
    if (file.type === "application/pdf") {
      return blocks.some(
        (b) =>
          b.type === "file" &&
          b.mime_type === "application/pdf" &&
          b.metadata?.filename === file.name,
      );
    }
    if (SUPPORTED_FILE_TYPES.includes(file.type)) {
      return blocks.some(
        (b) =>
          b.type === "image" &&
          b.metadata?.name === file.name &&
          b.mime_type === file.type,
      );
    }
    return false;
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) =>
      SUPPORTED_FILE_TYPES.includes(file.type),
    );
    const invalidFiles = fileArray.filter(
      (file) => !SUPPORTED_FILE_TYPES.includes(file.type),
    );
    const duplicateFiles = validFiles.filter((file) =>
      isDuplicate(file, contentBlocks),
    );
    const uniqueFiles = validFiles.filter(
      (file) => !isDuplicate(file, contentBlocks),
    );

    if (invalidFiles.length > 0) {
      toast.error(
        "You have uploaded invalid file type. Please upload a JPEG, PNG, GIF, WEBP image or a PDF.",
      );
    }
    if (duplicateFiles.length > 0) {
      toast.error(
        `Duplicate file(s) detected: ${duplicateFiles.map((f) => f.name).join(", ")}. Each file can only be uploaded once per message.`,
      );
    }

    const newBlocks = uniqueFiles.length
      ? await Promise.all(uniqueFiles.map(fileToContentBlock))
      : [];
    setContentBlocks((prev) => [...prev, ...newBlocks]);
    e.target.value = "";
  };

  // Drag and drop handlers
  useEffect(() => {
    if (!dropRef.current) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!e.dataTransfer) return;

      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter((file) =>
        SUPPORTED_FILE_TYPES.includes(file.type),
      );
      const invalidFiles = files.filter(
        (file) => !SUPPORTED_FILE_TYPES.includes(file.type),
      );
      const duplicateFiles = validFiles.filter((file) =>
        isDuplicate(file, contentBlocks),
      );
      const uniqueFiles = validFiles.filter(
        (file) => !isDuplicate(file, contentBlocks),
      );

      if (invalidFiles.length > 0) {
        toast.error(
          "You have uploaded invalid file type. Please upload a JPEG, PNG, GIF, WEBP image or a PDF.",
        );
      }
      if (duplicateFiles.length > 0) {
        toast.error(
          `Duplicate file(s) detected: ${duplicateFiles.map((f) => f.name).join(", ")}. Each file can only be uploaded once per message.`,
        );
      }

      const newBlocks = uniqueFiles.length
        ? await Promise.all(uniqueFiles.map(fileToContentBlock))
        : [];
      setContentBlocks((prev) => [...prev, ...newBlocks]);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const element = dropRef.current;
    element.addEventListener("dragover", handleDragOver);
    element.addEventListener("drop", handleDrop);
    element.addEventListener("dragenter", handleDragEnter);
    element.addEventListener("dragleave", handleDragLeave);

    return () => {
      element.removeEventListener("dragover", handleDragOver);
      element.removeEventListener("drop", handleDrop);
      element.removeEventListener("dragenter", handleDragEnter);
      element.removeEventListener("dragleave", handleDragLeave);
    };
  }, [contentBlocks]);

  const removeBlock = (idx: number) => {
    setContentBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetBlocks = () => setContentBlocks([]);

  return {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks,
  };
}
