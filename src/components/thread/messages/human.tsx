import { useStreamContext } from "@/providers/Stream";
import { Message } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { getContentImageUrls, getContentString } from "../utils";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { BranchSwitcher, CommandBar } from "./shared";

function EditableContent({
  value,
  setValue,
  onSubmit,
}: {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className="focus-visible:ring-0"
    />
  );
}

export function HumanMessage({
  message,
  isLoading,
}: {
  message: Message;
  isLoading: boolean;
}) {
  const thread = useStreamContext();
  const meta = thread.getMessagesMetadata(message);
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const contentString = getContentString(message.content);
  const contentImageUrls = getContentImageUrls(message.content);

  const handleSubmitEdit = () => {
    setIsEditing(false);

    const newMessage: Message = { type: "human", content: value };
    thread.submit(
      { messages: [newMessage] },
      {
        checkpoint: parentCheckpoint,
        streamMode: ["values"],
        optimisticValues: (prev) => {
          const values = meta?.firstSeenState?.values;
          if (!values) return prev;

          return {
            ...values,
            messages: [...(values.messages ?? []), newMessage],
          };
        },
      },
    );
  };

  return (
    <div
      className={cn(
        "group ml-auto flex items-center gap-2",
        isEditing && "w-full max-w-xl",
      )}
    >
      <div className={cn("flex flex-col gap-2", isEditing && "w-full")}>
        {isEditing ? (
          <EditableContent
            value={value}
            setValue={setValue}
            onSubmit={handleSubmitEdit}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {/* Render images and files if no text */}
            {Array.isArray(message.content) && message.content.length > 0 && (
              <div className="flex flex-col gap-2 items-end">
                {message.content.map((block, idx) => {
                  // Type guard for image block
                  const isImageBlock =
                    typeof block === "object" &&
                    block !== null &&
                    "type" in block &&
                    (block as any).type === "image" &&
                    "source_type" in block &&
                    (block as any).source_type === "base64" &&
                    "mime_type" in block &&
                    "data" in block;
                  if (isImageBlock) {
                    const imgBlock = block as {
                      type: string;
                      source_type: string;
                      mime_type: string;
                      data: string;
                      metadata?: { name?: string };
                    };
                    const url = `data:${imgBlock.mime_type};base64,${imgBlock.data}`;
                    return (
                      <img
                        key={idx}
                        src={url}
                        alt={imgBlock.metadata?.name || "uploaded image"}
                        className="bg-muted h-16 w-16 rounded-md object-cover"
                      />
                    );
                  }
                  // Type guard for file block (PDF)
                  const isPdfBlock =
                    typeof block === "object" &&
                    block !== null &&
                    "type" in block &&
                    (block as any).type === "file" &&
                    "mime_type" in block &&
                    (block as any).mime_type === "application/pdf";
                  if (isPdfBlock) {
                    const pdfBlock = block as {
                      metadata?: { filename?: string; name?: string };
                    };
                    return (
                      <div
                        key={idx}
                        className="bg-muted ml-auto w-fit rounded-3xl px-4 py-2 text-right whitespace-pre-wrap"
                      >
                        {pdfBlock.metadata?.filename || pdfBlock.metadata?.name || "PDF file"}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
            {/* Render text if present, otherwise fallback to file/image name */}
            {contentString && contentString !== "Other" && contentString !== "Multimodal message" ? (
              <p className="bg-muted ml-auto w-fit rounded-3xl px-4 py-2 text-right whitespace-pre-wrap">
                {contentString}
              </p>
            ) : null}
          </div>
        )}

        <div
          className={cn(
            "ml-auto flex items-center gap-2 transition-opacity",
            "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
            isEditing && "opacity-100",
          )}
        >
          <BranchSwitcher
            branch={meta?.branch}
            branchOptions={meta?.branchOptions}
            onSelect={(branch) => thread.setBranch(branch)}
            isLoading={isLoading}
          />
          <CommandBar
            isLoading={isLoading}
            content={contentString}
            isEditing={isEditing}
            setIsEditing={(c) => {
              if (c) {
                setValue(contentString);
              }
              setIsEditing(c);
            }}
            handleSubmitEdit={handleSubmitEdit}
            isHumanMessage={true}
          />
        </div>
      </div>
    </div>
  );
}
