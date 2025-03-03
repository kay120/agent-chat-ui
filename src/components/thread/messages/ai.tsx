import { useStreamContext } from "@/providers/Stream";
import { Message } from "@langchain/langgraph-sdk";
import { getContentString } from "../utils";
import { BranchSwitcher, CommandBar } from "./shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MarkdownText } from "../markdown-text";

export function AssistantMessage({
  message,
  isLoading,
}: {
  message: Message;
  isLoading: boolean;
}) {
  const thread = useStreamContext();
  const meta = thread.getMessagesMetadata(message);
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;

  const contentString = getContentString(message.content);

  const handleRegenerate = () => {
    thread.submit(undefined, { checkpoint: parentCheckpoint });
  };

  return (
    <div className="flex items-start mr-auto gap-2 group">
      <Avatar>
        <AvatarFallback>A</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <div className="rounded-2xl bg-muted px-4 py-2">
          <MarkdownText>{contentString}</MarkdownText>
        </div>
        <div className="flex gap-2 items-center mr-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <BranchSwitcher
            branch={meta?.branch}
            branchOptions={meta?.branchOptions}
            onSelect={(branch) => thread.setBranch(branch)}
            isLoading={isLoading}
          />
          <CommandBar
            content={contentString}
            isLoading={isLoading}
            isAiMessage={true}
            handleRegenerate={handleRegenerate}
          />
        </div>
      </div>
    </div>
  );
}

export function AssistantMessageLoading() {
  return (
    <div className="flex items-start mr-auto gap-2">
      <Avatar>
        <AvatarFallback>A</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-2 h-8">
        <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_0.5s_infinite]"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_1s_infinite]"></div>
      </div>
    </div>
  );
}
