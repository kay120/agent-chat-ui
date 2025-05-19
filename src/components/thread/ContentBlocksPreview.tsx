import React from "react";
import type { Base64ContentBlock } from "@langchain/core/messages";
import { MultimodalPreview } from "../ui/MultimodalPreview";

interface ContentBlocksPreviewProps {
  blocks: Base64ContentBlock[];
  onRemove: (idx: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ContentBlocksPreview: React.FC<ContentBlocksPreviewProps> = ({
  blocks,
  onRemove,
  size = "md",
  className = "",
}) => {
  if (!blocks.length) return null;
  return (
    <div className={`flex flex-wrap gap-2 p-3.5 pb-0 ${className}`}>
      {blocks.map((block, idx) => (
        <MultimodalPreview
          key={idx}
          block={block}
          removable
          onRemove={() => onRemove(idx)}
          size={size}
        />
      ))}
    </div>
  );
};
