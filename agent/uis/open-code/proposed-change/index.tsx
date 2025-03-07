import { Button } from "@/components/ui/button";
import "./index.css";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface ProposedChangeProps {
  toolCallId: string;
  change: string;
  planItem: string;
}

export default function ProposedChange(props: ProposedChangeProps) {
  const handleReject = () => {};
  const handleAccept = () => {};

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl p-4 border-[1px] rounded-xl border-slate-200">
      <p className="text-lg font-medium">Proposed Change</p>
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
        <Button variant="destructive" onClick={handleReject}>
          Reject
        </Button>
        <Button onClick={handleAccept}>Accept</Button>
      </div>
    </div>
  );
}
