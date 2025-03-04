import { Button } from "@/components/ui/button";
import { useThreads } from "@/hooks/useThreads";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect, useState } from "react";
import { getContentString } from "../utils";
import { useQueryParam, StringParam, BooleanParam } from "use-query-params";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function ThreadList({
  threads,
  onThreadClick,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
}) {
  const [threadId, setThreadId] = useQueryParam("threadId", StringParam);

  return (
    <div className="h-full overflow-y-scroll flex flex-col gap-2 items-start justify-start [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {threads.map((t) => {
        let itemText = t.thread_id;
        if (
          typeof t.values === "object" &&
          t.values &&
          "messages" in t.values &&
          Array.isArray(t.values.messages) &&
          t.values.messages?.length > 0
        ) {
          const firstMessage = t.values.messages[0];
          itemText = getContentString(firstMessage.content);
        }
        return (
          <div key={t.thread_id} className="w-full">
            <Button
              variant="ghost"
              className="truncate text-left items-start justify-start w-[264px]"
              onClick={(e) => {
                e.preventDefault();
                onThreadClick?.(t.thread_id);
                if (t.thread_id === threadId) return;
                setThreadId(t.thread_id);
              }}
            >
              {itemText}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export default function ThreadHistory() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryParam(
    "chatHistoryOpen",
    BooleanParam,
  );

  const { getThreads } = useThreads();

  useEffect(() => {
    getThreads().then(setThreads).catch(console.error);
  }, []);

  return (
    <>
      <div className="hidden lg:flex flex-col border-r-[1px] border-slate-300 items-start justify-start gap-6 h-screen w-[300px] shrink-0 px-2 py-4 shadow-inner-right">
        <h1 className="text-2xl font-medium pl-4">Thread History</h1>
        <ThreadList threads={threads} />
      </div>
      <Sheet open={!!chatHistoryOpen} onOpenChange={setChatHistoryOpen}>
        <SheetContent side="left" className="lg:hidden flex">
          <SheetHeader>
            <SheetTitle>Thread History</SheetTitle>
          </SheetHeader>
          <ThreadList
            threads={threads}
            onThreadClick={() => setChatHistoryOpen((o) => !o)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
