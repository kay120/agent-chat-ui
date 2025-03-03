import { v4 as uuidv4 } from "uuid";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useState, FormEvent } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";

// const dummyMessages = [
//   { type: "human", content: "Hi! What can you do?" },
//   {
//     type: "ai",
//     content: `Hello! I can assist you with a variety of tasks, including:

// 1. **Answering Questions**: I can provide information on a wide range of topics, from science and history to technology and culture.
// 2. **Writing Assistance**: I can help you draft emails, essays, reports, and creative writing pieces.
// 3. **Learning Support**: I can explain concepts, help with homework, and provide study tips.
// 4. **Language Help**: I can assist with translations, grammar, and vocabulary in multiple languages.
// 5. **Recommendations**: I can suggest books, movies, recipes, and more based on your interests.
// 6. **General Advice**: I can offer tips on various subjects, including productivity, wellness, and personal development.

// If you have something specific in mind, feel free to ask!`,
//   },
// ];

export function Thread() {
  const [input, setInput] = useState("");
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const stream = useStreamContext();
  // const messages = [...dummyMessages, ...stream.messages];
  const messages = stream.messages;
  const isLoading = stream.isLoading;
  const prevMessageLength = useRef(0);

  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
      prevMessageLength.current = messages.length;
    }
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: input,
    };

    stream.submit(
      {
        messages: [
          ...ensureToolCallsHaveResponses(stream.messages),
          newHumanMessage,
        ],
      },
      {
        streamMode: ["values"],
      },
    );

    setInput("");
  };

  const chatStarted = isLoading || messages.length > 0;
  const renderMessages = messages.filter(
    (m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX),
  );

  return (
    <div
      className={cn(
        "flex flex-col w-full h-full",
        chatStarted ? "relative" : "",
      )}
    >
      <div className={cn("flex-1 px-4", chatStarted ? "pb-28" : "mt-64")}>
        <h1
          className={cn(
            "text-2xl font-medium mb-12 text-center",
            chatStarted && "hidden",
          )}
        >
          Chat
        </h1>

        <div
          className={cn(
            "flex flex-col gap-4 max-w-4xl w-full mx-auto mt-12 overflow-y-auto",
            !chatStarted && "hidden",
          )}
        >
          {renderMessages.map((message, index) =>
            message.type === "human" ? (
              <HumanMessage
                key={"id" in message ? message.id : `${message.type}-${index}`}
                message={message as Message}
                isLoading={isLoading}
              />
            ) : (
              <AssistantMessage
                key={"id" in message ? message.id : `${message.type}-${index}`}
                message={message as Message}
                isLoading={isLoading}
              />
            ),
          )}
          {isLoading && !firstTokenReceived && <AssistantMessageLoading />}
        </div>
      </div>

      <div
        className={cn(
          "bg-white rounded-2xl border-[1px] border-gray-200 shadow-md p-3 mx-auto w-full max-w-5xl",
          chatStarted ? "fixed bottom-6 left-0 right-0" : "",
        )}
      >
        <form
          onSubmit={handleSubmit}
          className="flex w-full gap-2 max-w-5xl mx-auto"
        >
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="p-5 border-[0px] shadow-none ring-0 outline-none focus:outline-none focus:ring-0"
          />
          <Button
            type="submit"
            className="p-5"
            disabled={isLoading || !input.trim()}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
