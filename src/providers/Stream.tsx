import React, { createContext, useContext, ReactNode } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import type {
  UIMessage,
  RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui/types";
import { useQueryParam, StringParam } from "use-query-params";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";

const useTypedStream = useStream<
  { messages: Message[]; ui: UIMessage[] },
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
    };
    CustomUpdateType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

const StreamSession = ({
  children,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  apiUrl: string;
  assistantId: string;
}) => {
  const [threadId, setThreadId] = useQueryParam("threadId", StringParam);
  const streamValue = useTypedStream({
    apiUrl,
    assistantId,
    threadId: threadId ?? null,
    onThreadId: setThreadId,
  });

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [apiUrl, setApiUrl] = useQueryParam("apiUrl", StringParam);
  const [assistantId, setAssistantId] = useQueryParam(
    "assistantId",
    StringParam,
  );

  if (!apiUrl || !assistantId) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen p-4">
        <div className="animate-in fade-in-0 zoom-in-95 flex flex-col border bg-background shadow-lg rounded-lg max-w-2xl">
          <div className="flex flex-col gap-2 mt-14 p-6 border-b">
            <div className="flex items-start flex-col gap-2">
              <LangGraphLogoSVG className="h-7" />
              <h1 className="text-xl font-semibold tracking-tight">
                LangGraph Chat
              </h1>
            </div>
            <p className="text-muted-foreground">
              Welcome to LangGraph Chat! Before you get started, you need to
              enter the URL of the deployment and the assistant / graph ID.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();

              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const apiUrl = formData.get("apiUrl") as string;
              const assistantId = formData.get("assistantId") as string;

              setApiUrl(apiUrl);
              setAssistantId(assistantId);
              console.log({ apiUrl, assistantId });

              form.reset();
            }}
            className="flex flex-col gap-6 p-6 bg-muted/50"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="apiUrl">Deployment URL</Label>
              <p className="text-muted-foreground text-sm">
                This is the URL of your LangGraph deployment. Can be a local, or
                production deployment.
              </p>
              <Input
                id="apiUrl"
                name="apiUrl"
                className="bg-background"
                defaultValue={apiUrl ?? "http://localhost:2024"}
                onChange={(e) => setApiUrl(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="assistantId">Assistant / Graph ID</Label>
              <p className="text-muted-foreground text-sm">
                This is the ID of the graph (can be the graph name), or
                assistant to fetch threads from, and invoke when actions are
                taken.
              </p>
              <Input
                id="assistantId"
                name="assistantId"
                className="bg-background"
                defaultValue={assistantId ?? "agent"}
                onChange={(e) => setAssistantId(e.target.value)}
              />
            </div>

            <div className="flex justify-end mt-2">
              <Button type="submit" size="lg">
                Continue
                <ArrowRight className="size-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <StreamSession apiUrl={apiUrl} assistantId={assistantId}>
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
