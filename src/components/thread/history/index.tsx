import { Button } from "@/components/ui/button";
import { useThreads } from "@/providers/Thread";
import { Thread } from "@langchain/langgraph-sdk";
import { useEffect, useState } from "react";

import { getContentString } from "../utils";
import { useQueryState, parseAsBoolean } from "nuqs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PanelRightOpen, PanelRightClose, Trash2 } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ThreadList({
  threads,
  onThreadClick,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
}) {
  const [threadId, setThreadId] = useQueryState("threadId");
  const { deleteThread } = useThreads();
  const [deletingThreads, setDeletingThreads] = useState<Set<string>>(new Set());

  const handleThreadClick = async (selectedThreadId: string) => {
    if (selectedThreadId === threadId) return;

    // 切换到选中的线程
    setThreadId(selectedThreadId);
    onThreadClick?.(selectedThreadId);
    console.log('🔄 切换到线程:', selectedThreadId);
  };

  const handleDeleteThread = async (threadIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发线程切换

    if (deletingThreads.has(threadIdToDelete)) return;

    setDeletingThreads(prev => new Set(prev).add(threadIdToDelete));

    try {
      const success = await deleteThread(threadIdToDelete);
      if (success) {
        toast.success("删除成功", {
          description: "历史对话已删除",
        });

        // 如果删除的是当前线程，切换到新建对话
        if (threadIdToDelete === threadId) {
          setThreadId(null);
        }
      } else {
        toast.error("删除失败", {
          description: "无法删除历史对话",
        });
      }
    } catch (error) {
      toast.error("删除失败", {
        description: "发生错误，请重试",
      });
    } finally {
      setDeletingThreads(prev => {
        const newSet = new Set(prev);
        newSet.delete(threadIdToDelete);
        return newSet;
      });
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-2 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
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

        const isCurrentThread = t.thread_id === threadId;
        const isDeleting = deletingThreads.has(t.thread_id);

        return (
          <div
            key={t.thread_id}
            className="w-full px-1"
          >
            <div className={cn(
              "group relative flex items-center rounded-md hover:bg-gray-100",
              isCurrentThread && "bg-blue-50 border border-blue-200"
            )}>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 items-start justify-start text-left font-normal h-auto py-2 px-3",
                  isCurrentThread && "bg-transparent hover:bg-blue-100"
                )}
                onClick={() => handleThreadClick(t.thread_id)}
                disabled={isDeleting}
              >
                <p className="truncate text-ellipsis text-sm leading-relaxed">
                  {itemText}
                </p>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => handleDeleteThread(t.thread_id, e)}
                disabled={isDeleting}
                title="删除对话"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ThreadHistoryLoading() {
  return (
    <div className="flex h-full w-full flex-col items-start justify-start gap-2 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {Array.from({ length: 30 }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i}`}
          className="h-10 w-[280px]"
        />
      ))}
    </div>
  );
}

export default function ThreadHistory() {
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );

  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading } =
    useThreads();

  const handleThreadClick = (threadId: string) => {
    console.log('📋 历史记录点击:', threadId);
    // 关闭移动端的历史记录面板
    if (!isLargeScreen) {
      setChatHistoryOpen(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  }, []);

  return (
    <>
      <div className="shadow-inner-right hidden h-screen w-[300px] shrink-0 flex-col items-start justify-start gap-6 border-r-[1px] border-slate-300 lg:flex">
        <div className="flex w-full items-center justify-between px-4 pt-1.5">
          <Button
            className="hover:bg-gray-100"
            variant="ghost"
            onClick={() => setChatHistoryOpen((p) => !p)}
          >
            {chatHistoryOpen ? (
              <PanelRightOpen className="size-5" />
            ) : (
              <PanelRightClose className="size-5" />
            )}
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">
            对话历史
          </h1>
        </div>
        {threadsLoading ? (
          <ThreadHistoryLoading />
        ) : (
          <ThreadList threads={threads} onThreadClick={handleThreadClick} />
        )}
      </div>
      <div className="lg:hidden">
        <Sheet
          open={!!chatHistoryOpen && !isLargeScreen}
          onOpenChange={(open) => {
            if (isLargeScreen) return;
            setChatHistoryOpen(open);
          }}
        >
          <SheetContent
            side="left"
            className="flex lg:hidden"
          >
            <SheetHeader>
              <SheetTitle>对话历史</SheetTitle>
            </SheetHeader>
            <ThreadList
              threads={threads}
              onThreadClick={handleThreadClick}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
