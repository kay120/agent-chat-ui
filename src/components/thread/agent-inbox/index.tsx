import { StateView } from "./components/state-view";
import { ThreadActionsView } from "./components/thread-actions-view";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { HumanInterrupt } from "@langchain/langgraph/prebuilt";
import { useStreamContext } from "@/providers/Stream";

interface ThreadViewProps {
  interrupt: HumanInterrupt;
}

export function ThreadView({ interrupt }: ThreadViewProps) {
  const thread = useStreamContext();
  const [showDescription, setShowDescription] = useState(true);
  const [showState, setShowState] = useState(false);
  const showSidePanel = showDescription || showState;

  const handleShowSidePanel = (
    showState: boolean,
    showDescription: boolean,
  ) => {
    if (showState && showDescription) {
      console.error("Cannot show both state and description");
      return;
    }
    if (showState) {
      setShowDescription(false);
      setShowState(true);
    } else if (showDescription) {
      setShowState(false);
      setShowDescription(true);
    } else {
      setShowState(false);
      setShowDescription(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-[750px] border-[1px] border-slate-200 rounded-2xl pb-4">
      <div
        className={cn(
          "flex overflow-y-auto",
          showSidePanel ? "lg:min-w-1/2 w-full" : "w-full",
        )}
      >
        <ThreadActionsView
          interrupt={interrupt}
          handleShowSidePanel={handleShowSidePanel}
          showState={showState}
          showDescription={showDescription}
        />
      </div>
      <div
        className={cn(
          showSidePanel ? "flex" : "hidden",
          "overflow-y-auto lg:max-w-1/2 w-full",
        )}
      >
        <StateView
          handleShowSidePanel={handleShowSidePanel}
          description={interrupt.description}
          values={thread.values}
          view={showState ? "state" : "description"}
        />
      </div>
    </div>
  );
}
