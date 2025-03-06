import "./index.css";
import {
  useStreamContext,
  type UIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import type { Message } from "@langchain/langgraph-sdk";
import { useState, useMemo } from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Price } from "../../../types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const chartConfig = {
  price: {
    label: "Price",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

type DisplayRange = "1d" | "5d" | "1m";

function DisplayRangeSelector({
  displayRange,
  setDisplayRange,
}: {
  displayRange: DisplayRange;
  setDisplayRange: (range: DisplayRange) => void;
}) {
  const sharedClass =
    " bg-transparent text-gray-500 hover:bg-gray-50 transition-colors ease-in-out duration-200 p-2 cursor-pointer";
  const selectedClass = `text-black bg-gray-100 hover:bg-gray-50`;
  return (
    <div className="flex flex-row items-center justify-start gap-2">
      <Button
        className={cn(sharedClass, displayRange === "1d" && selectedClass)}
        variant={displayRange === "1d" ? "default" : "ghost"}
        onClick={() => setDisplayRange("1d")}
      >
        1D
      </Button>
      <p className="text-gray-300">|</p>
      <Button
        className={cn(sharedClass, displayRange === "5d" && selectedClass)}
        variant={displayRange === "5d" ? "default" : "ghost"}
        onClick={() => setDisplayRange("5d")}
      >
        5D
      </Button>
      <p className="text-gray-300">|</p>
      <Button
        className={cn(sharedClass, displayRange === "1m" && selectedClass)}
        variant={displayRange === "1m" ? "default" : "ghost"}
        onClick={() => setDisplayRange("1m")}
      >
        1M
      </Button>
    </div>
  );
}

function getPropsForDisplayRange(displayRange: DisplayRange, prices: Price[]) {
  // Start by filtering prices by display range. use the `time` field on `price` which is a string date. compare it to the current date
  const actualPrices: Price[] = [];
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  const fiveDays = 5 * oneDay;
  const oneMonth = 30 * oneDay;

  switch (displayRange) {
    case "1d":
      console.log("Calculating for 1d", prices.length);
      console.log(prices[prices.length - 1]);
      actualPrices.push(
        ...prices.filter(
          (p) => new Date(p.time).getTime() >= now.getTime() - oneDay,
        ),
      );
      break;
    case "5d":
      console.log("Calculating for 5d", prices.length);
      actualPrices.push(
        ...prices.filter(
          (p) => new Date(p.time).getTime() >= now.getTime() - fiveDays,
        ),
      );
      break;
    case "1m":
      console.log("Calculating for 1m", prices.length);
      actualPrices.push(
        ...prices.filter(
          (p) => new Date(p.time).getTime() >= now.getTime() - oneMonth,
        ),
      );
      break;
  }
  return actualPrices;
}
// TODO: UPDATE TO SUPPORT ONE DAY AND THIRTY DAY PRICES AS DIFFERENT PROPS
export default function StockPrice(props: {
  ticker: string;
  oneDayPrices: Price[];
  thirtyDayPrices: Price[];
}) {
  const { ticker } = props;
  console.log(props.prices[0], props.prices[props.prices.length - 1]);
  const [displayRange, setDisplayRange] = useState<DisplayRange>("1d");
  const thread = useStreamContext<
    { messages: Message[]; ui: UIMessage[] },
    { MetaType: { ui: UIMessage | undefined } }
  >();

  const {
    currentPrice,
    openPrice,
    dollarChange,
    percentChange,
    highPrice,
    lowPrice,
    chartData,
    change,
  } = useMemo(() => {
    const prices = getPropsForDisplayRange(displayRange, props.prices);
    console.log("prices", prices.length);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];

    const currentPrice = lastPrice?.close;
    const openPrice = firstPrice?.open;
    const dollarChange = currentPrice - openPrice;
    const percentChange = ((currentPrice - openPrice) / openPrice) * 100;

    const highPrice = prices.reduce(
      (acc, p) => Math.max(acc, p.high),
      -Infinity,
    );
    const lowPrice = prices.reduce((acc, p) => Math.min(acc, p.low), Infinity);

    const chartData = prices.map((p) => ({
      time: p.time,
      price: p.close,
    }));

    const change: "up" | "down" = dollarChange > 0 ? "up" : "down";
    return {
      currentPrice,
      openPrice,
      dollarChange,
      percentChange,
      highPrice,
      lowPrice,
      chartData,
      change,
    };
  }, [props.prices, displayRange]);

  return (
    <div className="w-full max-w-4xl rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col gap-4 p-3">
      <div className="flex items-center justify-start gap-4 mb-2 text-lg font-medium text-gray-700">
        <p>{ticker}</p>
        <p>${currentPrice}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className={change === "up" ? "text-green-500" : "text-red-500"}>
          ${dollarChange.toFixed(2)} (${percentChange.toFixed(2)}%)
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex flex-col gap-2">
          <p>Open</p>
          <p>High</p>
          <p>Low</p>
        </div>
        <div className="flex flex-col gap-2">
          <p>${openPrice}</p>
          <p>${highPrice}</p>
          <p>${lowPrice}</p>
        </div>
      </div>
      <DisplayRangeSelector
        displayRange={displayRange}
        setDisplayRange={setDisplayRange}
      />
      <ChartContainer config={chartConfig}>
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 0,
            right: 0,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => format(value, "h:mm a")}
          />
          <YAxis
            domain={[lowPrice - 2, highPrice + 2]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value.toFixed(2)}`}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel={false}
                labelFormatter={(value) => format(value, "h:mm a")}
              />
            }
          />
          <Line dataKey="price" type="natural" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
