import { useStream } from "@langchain/langgraph-sdk/react";
import type { AIMessage, Message } from "@langchain/langgraph-sdk";
import { useState, useEffect, useCallback } from "react";

export default function StockPrice(props: {
  instruction: string;
  logo: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [stockData, setStockData] = useState({
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 187.32,
    change: 1.24,
    changePercent: 0.67,
    previousClose: 186.08,
    open: 186.75,
    dayHigh: 188.45,
    dayLow: 186.2,
    volume: 54320000,
    marketCap: "2.92T",
    peRatio: 29.13,
    dividend: 0.96,
    dividendYield: 0.51,
    moving50Day: 182.46,
    moving200Day: 175.8,
    fiftyTwoWeekHigh: 201.48,
    fiftyTwoWeekLow: 143.9,
    analystRating: "Buy",
    analystCount: 32,
    priceTarget: 210.5,
  });

  const [priceHistory, setPriceHistory] = useState<
    { time: string; price: number }[]
  >([]);
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [showOrder, setShowOrder] = useState(false);
  const [activeTab, setActiveTab] = useState<"chart" | "details" | "analysis">(
    "chart",
  );
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [orderTypeOptions] = useState([
    { value: "market", label: "Market" },
    { value: "limit", label: "Limit" },
    { value: "stop", label: "Stop" },
  ]);
  const [selectedOrderTypeOption, setSelectedOrderTypeOption] =
    useState("market");
  const [limitPrice, setLimitPrice] = useState(stockData.price.toFixed(2));
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  // useStream should be able to be infered from context
  const thread = useStream<{ messages: Message[] }>({
    assistantId: "assistant_123",
    apiUrl: "http://localhost:3123",
  });

  const messagesCopy = thread.messages;

  const aiTool = messagesCopy
    .slice()
    .reverse()
    .find(
      (message): message is AIMessage =>
        message.type === "ai" && !!message.tool_calls?.length,
    );

  const toolCallId = aiTool?.tool_calls?.[0]?.id;

  // Simulated price history generation on component mount
  useEffect(() => {
    generatePriceHistory();
  }, []);

  const generatePriceHistory = () => {
    const now = new Date();
    const history = [];

    for (let i = 30; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 15 * 60000); // 15-minute intervals
      const basePrice = 187.32;
      // Make the price movement more interesting with some trends
      const trend = Math.sin(i / 5) * 1.5;
      const randomFactor = (Math.random() - 0.5) * 1.5;
      const price = basePrice + trend + randomFactor;

      history.push({
        time: time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        price: parseFloat(price.toFixed(2)),
      });
    }

    setPriceHistory(history);
  };

  // Simulate live price updates
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isLiveUpdating) {
      interval = setInterval(() => {
        setStockData((prev) => {
          // Random small price movement
          const priceChange = (Math.random() - 0.5) * 0.3;
          const newPrice = parseFloat((prev.price + priceChange).toFixed(2));

          // Update price history
          setPriceHistory((history) => {
            const now = new Date();
            const newHistory = [...history];
            if (newHistory.length > 30) {
              newHistory.shift(); // Remove oldest entry to keep array length consistent
            }
            newHistory.push({
              time: now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              price: newPrice,
            });
            return newHistory;
          });

          return {
            ...prev,
            price: newPrice,
            change: parseFloat((newPrice - prev.previousClose).toFixed(2)),
            changePercent: parseFloat(
              (
                ((newPrice - prev.previousClose) / prev.previousClose) *
                100
              ).toFixed(2),
            ),
            dayHigh: Math.max(prev.dayHigh, newPrice),
            dayLow: Math.min(prev.dayLow, newPrice),
          };
        });
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveUpdating]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= 1000) {
      setQuantity(value);
    }
  };

  const handleLimitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setLimitPrice(value);
    }
  };

  const toggleLiveUpdates = () => {
    setIsLiveUpdating((prev) => !prev);
  };

  const handleOrder = () => {
    // Submit the order through the thread
    if (toolCallId) {
      const orderDetails = {
        action: orderType,
        quantity,
        symbol: stockData.symbol,
        orderType: selectedOrderTypeOption,
        ...(selectedOrderTypeOption !== "market" && {
          limitPrice: parseFloat(limitPrice),
        }),
      };

      thread.submit({
        messages: [
          {
            type: "tool",
            tool_call_id: toolCallId,
            name: "stockbroker",
            content: JSON.stringify(orderDetails),
          },
          {
            type: "human",
            content: `${orderType === "buy" ? "Bought" : "Sold"} ${quantity} shares of ${stockData.symbol} at ${
              selectedOrderTypeOption === "market"
                ? formatCurrency(stockData.price)
                : formatCurrency(parseFloat(limitPrice))
            }`,
          },
        ],
      });

      setShowOrderSuccess(true);
      setTimeout(() => {
        setShowOrderSuccess(false);
        setShowOrder(false);
      }, 2000);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const getMinMax = () => {
    if (priceHistory.length === 0) return { min: 0, max: 0 };
    const prices = priceHistory.map((item) => item.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  };

  // Generate a simple price chart with the last price as endpoint
  const generateChartPath = useCallback(() => {
    if (priceHistory.length === 0) return "";

    const { min, max } = getMinMax();
    const range = max - min || 1;
    const width = 100; // % of container width
    const height = 100; // % of container height

    const points = priceHistory.map((point, i) => {
      const x = (i / (priceHistory.length - 1)) * width;
      const y = height - ((point.price - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  }, [priceHistory]);

  const { min, max } = getMinMax();
  const range = max - min || 1;
  const chartPath = generateChartPath();

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div
        className={`px-4 py-3 ${stockData.change >= 0 ? "bg-gradient-to-r from-green-600 to-green-500" : "bg-gradient-to-r from-red-600 to-red-500"}`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {props.logo && (
              <img
                src={props.logo}
                alt="Logo"
                className="h-6 w-6 mr-2 rounded-full bg-white p-0.5"
              />
            )}
            <h3 className="text-white font-bold">
              {stockData.symbol}{" "}
              <span className="font-normal text-white/80 text-sm">
                {stockData.name}
              </span>
            </h3>
          </div>
          <div className="flex items-center">
            <span className="text-white font-bold text-xl mr-2">
              {formatCurrency(stockData.price)}
            </span>
            <div
              className={`flex items-center px-2 py-1 rounded text-xs font-medium text-white ${stockData.change >= 0 ? "bg-green-700/50" : "bg-red-700/50"} backdrop-blur-sm border ${stockData.change >= 0 ? "border-green-400/30" : "border-red-400/30"}`}
            >
              {stockData.change >= 0 ? "▲" : "▼"}{" "}
              {formatCurrency(Math.abs(stockData.change))} (
              {formatPercent(stockData.changePercent)})
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-white/80 mt-1">
          <span className="italic">{props.instruction}</span>
          <button
            onClick={toggleLiveUpdates}
            className={`flex items-center text-xs px-2 py-0.5 rounded ${isLiveUpdating ? "bg-white/30 text-white" : "bg-white/10 text-white/70"} hover:bg-white/20 transition-colors`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full mr-1 ${isLiveUpdating ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
            ></span>
            {isLiveUpdating ? "Live" : "Static"}
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("chart")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "chart"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Chart
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "details"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "analysis"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Analysis
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === "chart" && (
          <>
            <div className="mb-4">
              <div className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="font-medium">Price Chart</span>
                  <div className="flex space-x-1">
                    <button className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                      1D
                    </button>
                    <button className="px-1.5 py-0.5 hover:bg-gray-100 rounded text-xs text-gray-600">
                      1W
                    </button>
                    <button className="px-1.5 py-0.5 hover:bg-gray-100 rounded text-xs text-gray-600">
                      1M
                    </button>
                    <button className="px-1.5 py-0.5 hover:bg-gray-100 rounded text-xs text-gray-600">
                      1Y
                    </button>
                  </div>
                </div>

                <div className="relative h-40 mt-2">
                  <div className="absolute inset-0">
                    {/* Chart grid lines */}
                    <div className="h-full flex flex-col justify-between">
                      {[0, 1, 2, 3].map((line) => (
                        <div
                          key={line}
                          className="border-t border-gray-100 w-full h-0"
                        ></div>
                      ))}
                    </div>

                    {/* SVG Line Chart */}
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      {/* Chart path */}
                      <path
                        d={chartPath}
                        stroke={stockData.change >= 0 ? "#10b981" : "#ef4444"}
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                      />

                      {/* Gradient area under the chart */}
                      <path
                        d={`${chartPath} L 100,100 L 0,100 Z`}
                        fill={
                          stockData.change >= 0
                            ? "url(#greenGradient)"
                            : "url(#redGradient)"
                        }
                        fillOpacity="0.2"
                      />

                      {/* Gradient definitions */}
                      <defs>
                        <linearGradient
                          id="greenGradient"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#10b981"
                            stopOpacity="0.8"
                          />
                          <stop
                            offset="100%"
                            stopColor="#10b981"
                            stopOpacity="0"
                          />
                        </linearGradient>
                        <linearGradient
                          id="redGradient"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#ef4444"
                            stopOpacity="0.8"
                          />
                          <stop
                            offset="100%"
                            stopColor="#ef4444"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Price labels on Y-axis */}
                    <div className="absolute right-0 inset-y-0 flex flex-col justify-between text-right pr-1 text-xs text-gray-400 pointer-events-none">
                      <span>{formatCurrency(max)}</span>
                      <span>{formatCurrency(min + range * 0.66)}</span>
                      <span>{formatCurrency(min + range * 0.33)}</span>
                      <span>{formatCurrency(min)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1"></span>
                    {priceHistory[0]?.time || "9:30 AM"}
                  </div>
                  <div className="flex items-center">
                    <span>Vol: {stockData.volume.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1"></span>
                    {priceHistory[priceHistory.length - 1]?.time || "4:00 PM"}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Stock Information */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-2.5 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Day Range</p>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-1.5 mb-1 text-xs flex rounded bg-gray-200 mt-1">
                    <div
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${stockData.change >= 0 ? "bg-green-500" : "bg-red-500"}`}
                      style={{
                        width: `${((stockData.price - stockData.dayLow) / (stockData.dayHigh - stockData.dayLow)) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{formatCurrency(stockData.dayLow)}</span>
                    <span>{formatCurrency(stockData.dayHigh)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">
                  52-Week Range
                </p>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-1.5 mb-1 text-xs flex rounded bg-gray-200 mt-1">
                    <div
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                      style={{
                        width: `${((stockData.price - stockData.fiftyTwoWeekLow) / (stockData.fiftyTwoWeekHigh - stockData.fiftyTwoWeekLow)) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{formatCurrency(stockData.fiftyTwoWeekLow)}</span>
                    <span>{formatCurrency(stockData.fiftyTwoWeekHigh)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "details" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-medium mb-1">Open</p>
                <p className="font-medium">{formatCurrency(stockData.open)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Previous Close
                </p>
                <p className="font-medium">
                  {formatCurrency(stockData.previousClose)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Market Cap
                </p>
                <p className="font-medium">{stockData.marketCap}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-medium mb-1">Volume</p>
                <p className="font-medium">
                  {stockData.volume.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-medium mb-1">
                  P/E Ratio
                </p>
                <p className="font-medium">{stockData.peRatio}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Dividend Yield
                </p>
                <p className="font-medium">{stockData.dividendYield}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-medium mb-1">
                  50-Day Avg
                </p>
                <p className="font-medium">
                  {formatCurrency(stockData.moving50Day)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 font-medium mb-1">
                  200-Day Avg
                </p>
                <p className="font-medium">
                  {formatCurrency(stockData.moving200Day)}
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <h4 className="font-medium text-indigo-900 text-sm mb-2">
                Company Overview
              </h4>
              <p className="text-xs text-indigo-700">
                {stockData.name} is a leading technology company that designs,
                manufactures, and markets consumer electronics, computer
                software, and online services. The company has a strong global
                presence and is known for its innovation in the industry.
              </p>
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">Analyst Consensus</h4>
                <div
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    stockData.analystRating === "Buy"
                      ? "bg-green-100 text-green-800"
                      : stockData.analystRating === "Hold"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {stockData.analystRating}
                </div>
              </div>

              <div className="flex mb-1">
                <div className="w-20 text-xs text-gray-500">Strong Buy</div>
                <div className="flex-grow">
                  <div className="h-4 bg-gray-200 rounded-sm overflow-hidden">
                    <div
                      className="h-4 bg-green-600"
                      style={{ width: "65%" }}
                    ></div>
                  </div>
                </div>
                <div className="w-8 text-xs text-right text-gray-600">65%</div>
              </div>
              <div className="flex mb-1">
                <div className="w-20 text-xs text-gray-500">Buy</div>
                <div className="flex-grow">
                  <div className="h-4 bg-gray-200 rounded-sm overflow-hidden">
                    <div
                      className="h-4 bg-green-500"
                      style={{ width: "20%" }}
                    ></div>
                  </div>
                </div>
                <div className="w-8 text-xs text-right text-gray-600">20%</div>
              </div>
              <div className="flex mb-1">
                <div className="w-20 text-xs text-gray-500">Hold</div>
                <div className="flex-grow">
                  <div className="h-4 bg-gray-200 rounded-sm overflow-hidden">
                    <div
                      className="h-4 bg-yellow-500"
                      style={{ width: "10%" }}
                    ></div>
                  </div>
                </div>
                <div className="w-8 text-xs text-right text-gray-600">10%</div>
              </div>
              <div className="flex mb-1">
                <div className="w-20 text-xs text-gray-500">Sell</div>
                <div className="flex-grow">
                  <div className="h-4 bg-gray-200 rounded-sm overflow-hidden">
                    <div
                      className="h-4 bg-red-500"
                      style={{ width: "5%" }}
                    ></div>
                  </div>
                </div>
                <div className="w-8 text-xs text-right text-gray-600">5%</div>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Based on {stockData.analystCount} analyst ratings
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-900">Price Target</h4>
                <span className="text-sm font-bold text-indigo-600">
                  {formatCurrency(stockData.priceTarget)}
                </span>
              </div>

              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <span className="text-green-600 font-medium">
                      +
                      {(
                        (stockData.priceTarget / stockData.price - 1) *
                        100
                      ).toFixed(2)}
                      %
                    </span>{" "}
                    Upside
                  </div>
                </div>
                <div className="overflow-hidden h-1.5 mb-1 text-xs flex rounded bg-gray-200">
                  <div
                    style={{
                      width: `${(stockData.price / stockData.priceTarget) * 100}%`,
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Current: {formatCurrency(stockData.price)}</span>
                  <span>Target: {formatCurrency(stockData.priceTarget)}</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
              <h4 className="font-medium text-indigo-900 mb-2">Recent News</h4>
              <div className="space-y-2">
                <div className="text-xs text-indigo-800">
                  <p className="font-medium">
                    {stockData.name} Reports Strong Quarterly Earnings
                  </p>
                  <p className="text-indigo-600 text-xs">2 days ago</p>
                </div>
                <div className="text-xs text-indigo-800">
                  <p className="font-medium">
                    New Product Launch Expected Next Month
                  </p>
                  <p className="text-indigo-600 text-xs">5 days ago</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Interface */}
        {!showOrder && !showOrderSuccess ? (
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => {
                setShowOrder(true);
                setOrderType("buy");
              }}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
              Buy
            </button>
            <button
              onClick={() => {
                setShowOrder(true);
                setOrderType("sell");
              }}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
              Sell
            </button>
          </div>
        ) : showOrderSuccess ? (
          <div className="mt-4 flex items-center justify-center bg-green-50 rounded-lg p-4 border border-green-200 text-green-800">
            <svg
              className="w-5 h-5 mr-2 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span className="font-medium">Order submitted successfully!</span>
          </div>
        ) : (
          <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-md p-4">
            <div className="flex justify-between items-center mb-3">
              <h4
                className={`font-bold text-lg ${orderType === "buy" ? "text-green-600" : "text-red-600"}`}
              >
                {orderType === "buy" ? "Buy" : "Sell"} {stockData.symbol}
              </h4>
              <button
                onClick={() => setShowOrder(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="mb-3">
              <div className="flex space-x-1 mb-3">
                {orderTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedOrderTypeOption(option.value)}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      selectedOrderTypeOption === option.value
                        ? `${orderType === "buy" ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"} border`
                        : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex space-x-2 mb-3">
                <div className="flex-1">
                  <label
                    htmlFor="quantity"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Quantity
                  </label>
                  <div className="flex items-center">
                    <button
                      onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                      className="border rounded-l px-2 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      max="1000"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="border-t border-b w-full px-3 py-1 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() =>
                        quantity < 1000 && setQuantity(quantity + 1)
                      }
                      className="border rounded-r px-2 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {selectedOrderTypeOption !== "market" && (
                  <div className="flex-1">
                    <label
                      htmlFor="limitPrice"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      {selectedOrderTypeOption === "limit"
                        ? "Limit Price"
                        : "Stop Price"}
                    </label>
                    <div className="flex items-center border rounded overflow-hidden">
                      <span className="bg-gray-100 px-2 py-1 text-gray-500 text-sm border-r">
                        $
                      </span>
                      <input
                        type="text"
                        id="limitPrice"
                        value={limitPrice}
                        onChange={handleLimitPriceChange}
                        className="flex-1 px-3 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {selectedOrderTypeOption !== "market" && (
                <div className="rounded-md bg-indigo-50 p-2 mb-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-indigo-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-xs text-indigo-700">
                        {selectedOrderTypeOption === "limit"
                          ? `Your ${orderType} order will execute only at ${formatCurrency(parseFloat(limitPrice))} or better.`
                          : `Your ${orderType} order will execute when the price reaches ${formatCurrency(parseFloat(limitPrice))}.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-md p-3 mb-4">
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">Market Price</span>
                  <span className="font-medium">
                    {formatCurrency(stockData.price)}
                  </span>
                </div>

                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">
                    {orderType === "buy" ? "Cost" : "Credit"} ({quantity}{" "}
                    {quantity === 1 ? "share" : "shares"})
                  </span>
                  <span>{formatCurrency(stockData.price * quantity)}</span>
                </div>

                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">Commission</span>
                  <span>$0.00</span>
                </div>

                <div className="flex justify-between text-sm py-1 border-t mt-1 pt-1">
                  <span className="font-medium">Estimated Total</span>
                  <span className="font-bold">
                    {formatCurrency(stockData.price * quantity)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowOrder(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOrder}
                disabled={!toolCallId}
                className={`flex-1 py-2 px-4 rounded-md font-medium text-white text-sm ${
                  orderType === "buy"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } ${!toolCallId ? "opacity-50 cursor-not-allowed" : ""} transition-colors`}
              >
                Review {orderType === "buy" ? "Purchase" : "Sale"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
