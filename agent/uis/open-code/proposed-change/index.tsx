import "./index.css";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { UIMessage, useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { Message } from "@langchain/langgraph-sdk";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";
import { useState } from "react";

interface ProposedChangeProps {
  toolCallId: string;
  change: string;
  planItem: string;
}

export default function ProposedChange(props: ProposedChangeProps) {
  const [isAccepted, setIsAccepted] = useState(false);

  const thread = useStreamContext<
    { messages: Message[]; ui: UIMessage[] },
    { MetaType: { ui: UIMessage | undefined } }
  >();

  const handleReject = () => {
    alert("Rejected. (just kidding, you can't reject me silly!)");
  };
  const handleAccept = () => {
    const content = "User accepted the proposed change. Please continue.";
    thread.submit({
      messages: [
        {
          type: "tool",
          tool_call_id: props.toolCallId,
          id: `${DO_NOT_RENDER_ID_PREFIX}${uuidv4()}`,
          name: "buy-stock",
          content,
        },
        {
          type: "human",
          content: `Accepted change.`,
        },
      ],
    });

    setIsAccepted(true);
  };

  if (isAccepted) {
    return (
      <div className="flex flex-col gap-4 w-full max-w-xl p-4 border-[1px] rounded-xl border-green-300">
        <div className="flex flex-col items-start justify-start gap-2">
          <p className="text-lg font-medium">Accepted Change</p>
          <p className="text-sm font-mono">{props.planItem}</p>
        </div>
        <ReactMarkdown
          children={props.change}
          components={{
            code(props) {
              const { children, className, node: _node } = props;
              const match = /language-(\w+)/.exec(className || "");
              return match ? (
                <SyntaxHighlighter
                  children={String(children).replace(/\n$/, "")}
                  language={match[1]}
                  style={coldarkDark}
                />
              ) : (
                <code className={className}>{children}</code>
              );
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl p-4 border-[1px] rounded-xl border-slate-200">
      <div className="flex flex-col items-start justify-start gap-2">
        <p className="text-lg font-medium">Proposed Change</p>
        <p className="text-sm font-mono">{props.planItem}</p>
      </div>
      <ReactMarkdown
        children={props.change}
        components={{
          code(props) {
            const { children, className, node: _node } = props;
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <SyntaxHighlighter
                children={String(children).replace(/\n$/, "")}
                language={match[1]}
                style={coldarkDark}
              />
            ) : (
              <code className={className}>{children}</code>
            );
          },
        }}
      />
      <div className="flex gap-2 items-center w-full">
        <Button
          className="cursor-pointer"
          variant="destructive"
          onClick={handleReject}
        >
          Reject
        </Button>
        <Button className="cursor-pointer" onClick={handleAccept}>
          Accept
        </Button>
      </div>
    </div>
  );
}
