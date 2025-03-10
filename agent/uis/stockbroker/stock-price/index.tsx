import "./index.css";
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

function getPropsForDisplayRange(
  displayRange: DisplayRange,
  oneDayPrices: Price[],
  thirtyDayPrices: Price[],
) {
  const now = new Date();
  const fiveDays = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds

  switch (displayRange) {
    case "1d":
      return oneDayPrices;
    case "5d":
      return thirtyDayPrices.filter(
        (p) => new Date(p.time).getTime() >= now.getTime() - fiveDays,
      );
    case "1m":
      return thirtyDayPrices;
    default:
      return [];
  }
}
export default function StockPrice(props: {
  ticker: string;
  oneDayPrices: Price[];
  thirtyDayPrices: Price[];
}) {
  const { ticker } = props;
  const { oneDayPrices, thirtyDayPrices } = props;
  const [displayRange, setDisplayRange] = useState<DisplayRange>("1d");

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
    const prices = getPropsForDisplayRange(
      displayRange,
      oneDayPrices,
      thirtyDayPrices,
    );

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
  }, [oneDayPrices, thirtyDayPrices, displayRange]);

  const formatDateByDisplayRange = (value: string, isTooltip?: boolean) => {
    if (displayRange === "1d") {
      return format(value, "h:mm a");
    }
    if (isTooltip) {
      return format(value, "LLL do h:mm a");
    }
    return format(value, "LLL do");
  };

  return (
    <div className="w-full max-w-3xl rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col gap-4 p-3">
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
            tickFormatter={(v) => formatDateByDisplayRange(v)}
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
            wrapperStyle={{ backgroundColor: "white" }}
            content={
              <ChartTooltipContent
                hideLabel={false}
                labelFormatter={(v) => formatDateByDisplayRange(v, true)}
              />
            }
          />
          <Line dataKey="price" type="natural" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
