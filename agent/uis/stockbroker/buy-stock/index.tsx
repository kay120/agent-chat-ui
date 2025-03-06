import "./index.css";
import { v4 as uuidv4 } from "uuid";
import { Snapshot } from "../../../types";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { UIMessage, useStreamContext } from "@langchain/langgraph-sdk/react-ui";
import { Message } from "@langchain/langgraph-sdk";
import { getToolResponse } from "agent/uis/utils/get-tool-response";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";

function Purchased({
  ticker,
  quantity,
  price,
}: {
  ticker: string;
  quantity: number;
  price: number;
}) {
  return (
    <div className="w-full md:w-lg rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col gap-4 p-3">
      <h1 className="text-xl font-medium mb-2">Purchase Executed - {ticker}</h1>
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div className="flex flex-col gap-2">
          <p>Number of Shares</p>
          <p>Market Price</p>
          <p>Total Cost</p>
        </div>
        <div className="flex flex-col gap-2 items-end justify-end">
          <p>{quantity}</p>
          <p>${price}</p>
          <p>${(quantity * price).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export default function BuyStock(props: {
  toolCallId: string;
  snapshot: Snapshot;
  quantity: number;
}) {
  const { snapshot, toolCallId } = props;
  const [quantity, setQuantity] = useState(props.quantity);
  const [finalPurchase, setFinalPurchase] = useState<{
    ticker: string;
    quantity: number;
    price: number;
  }>();

  const thread = useStreamContext<
    { messages: Message[]; ui: UIMessage[] },
    { MetaType: { ui: UIMessage | undefined } }
  >();

  useEffect(() => {
    if (typeof window === "undefined" || finalPurchase) return;
    const toolResponse = getToolResponse(toolCallId, thread);
    if (toolResponse) {
      try {
        const parsedContent: {
          purchaseDetails: {
            ticker: string;
            quantity: number;
            price: number;
          };
        } = JSON.parse(toolResponse.content as string);
        setFinalPurchase(parsedContent.purchaseDetails);
      } catch {
        console.error("Failed to parse tool response content.");
      }
    }
  }, []);

  function handleBuyStock() {
    const orderDetails = {
      message: "Successfully purchased stock",
      purchaseDetails: {
        ticker: snapshot.ticker,
        quantity: quantity,
        price: snapshot.price,
      },
    };

    thread.submit({
      messages: [
        {
          type: "tool",
          tool_call_id: toolCallId,
          id: `${DO_NOT_RENDER_ID_PREFIX}${uuidv4()}`,
          name: "buy-stock",
          content: JSON.stringify(orderDetails),
        },
        {
          type: "human",
          content: `Purchased ${quantity} shares of ${snapshot.ticker} at ${snapshot.price} per share`,
        },
      ],
    });

    setFinalPurchase(orderDetails.purchaseDetails);
  }

  if (finalPurchase) {
    return <Purchased {...finalPurchase} />;
  }

  return (
    <div className="w-full md:w-lg rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col gap-4 p-3">
      <h1 className="text-xl font-medium mb-2">Buy {snapshot.ticker}</h1>
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div className="flex flex-col gap-2">
          <p>Number of Shares</p>
          <p>Market Price</p>
          <p>Total Cost</p>
        </div>
        <div className="flex flex-col gap-2 items-end justify-end">
          <Input
            type="number"
            className="max-w-[100px] border-0 border-b focus:border-b-2 rounded-none shadow-none focus:ring-0"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min={1}
          />
          <p>${snapshot.price}</p>
          <p>${(quantity * snapshot.price).toFixed(2)}</p>
        </div>
      </div>
      <Button
        className="w-full bg-green-600 hover:bg-green-700 transition-colors ease-in-out duration-200 cursor-pointer text-white"
        onClick={handleBuyStock}
      >
        Buy
      </Button>
    </div>
  );
}
