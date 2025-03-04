import { useState } from "react";

export default function PortfolioView() {
  // Placeholder portfolio data - ideally would come from props
  const [portfolio] = useState({
    totalValue: 156842.75,
    cashBalance: 12467.32,
    performance: {
      daily: 1.24,
      weekly: -0.52,
      monthly: 3.87,
      yearly: 14.28,
    },
    holdings: [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        shares: 45,
        price: 187.32,
        value: 8429.4,
        change: 1.2,
        allocation: 5.8,
        avgCost: 162.5,
      },
      {
        symbol: "MSFT",
        name: "Microsoft Corporation",
        shares: 30,
        price: 403.78,
        value: 12113.4,
        change: 0.5,
        allocation: 8.4,
        avgCost: 340.25,
      },
      {
        symbol: "AMZN",
        name: "Amazon.com Inc.",
        shares: 25,
        price: 178.75,
        value: 4468.75,
        change: -0.8,
        allocation: 3.1,
        avgCost: 145.3,
      },
      {
        symbol: "GOOGL",
        name: "Alphabet Inc.",
        shares: 20,
        price: 164.85,
        value: 3297.0,
        change: 2.1,
        allocation: 2.3,
        avgCost: 125.75,
      },
      {
        symbol: "NVDA",
        name: "NVIDIA Corporation",
        shares: 35,
        price: 875.28,
        value: 30634.8,
        change: 3.4,
        allocation: 21.3,
        avgCost: 520.4,
      },
      {
        symbol: "TSLA",
        name: "Tesla, Inc.",
        shares: 40,
        price: 175.9,
        value: 7036.0,
        change: -1.2,
        allocation: 4.9,
        avgCost: 190.75,
      },
    ],
  });

  const [activeTab, setActiveTab] = useState<"holdings" | "performance">(
    "holdings",
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "allocation",
    direction: "desc",
  });
  const [selectedHolding, setSelectedHolding] = useState<string | null>(null);

  const sortedHoldings = [...portfolio.holdings].sort((a, b) => {
    if (
      a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]
    ) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (
      a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]
    ) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
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

  // Faux chart data for selected holding
  const generateChartData = (symbol: string) => {
    const data = [];
    const basePrice =
      portfolio.holdings.find((h) => h.symbol === symbol)?.price || 100;

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - 30 + i);

      const randomFactor = (Math.sin(i / 5) + Math.random() - 0.5) * 0.05;
      const price = basePrice * (1 + randomFactor * (i / 3));

      data.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        price: parseFloat(price.toFixed(2)),
      });
    }

    return data;
  };

  // Calculate total value and percent change for display
  const totalValue = portfolio.totalValue;
  const totalChange = portfolio.holdings.reduce(
    (acc, curr) => acc + (curr.price - curr.avgCost) * curr.shares,
    0,
  );
  const totalPercentChange =
    (totalChange / (portfolio.totalValue - totalChange)) * 100;

  const selectedStock = selectedHolding
    ? portfolio.holdings.find((h) => h.symbol === selectedHolding)
    : null;
  const chartData = selectedHolding ? generateChartData(selectedHolding) : [];

  return (
    <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold text-xl tracking-tight flex items-center">
            <svg
              className="w-6 h-6 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
            </svg>
            Portfolio Summary
          </h2>
          <div className="bg-indigo-800/50 text-white px-3 py-1 rounded-md text-sm backdrop-blur-sm border border-indigo-400/30 flex items-center">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              ></path>
            </svg>
            Updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-b from-indigo-50 to-white">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between">
              <p className="text-gray-500 text-sm font-medium">Total Value</p>
              <svg
                className="w-5 h-5 text-indigo-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(portfolio.totalValue)}
            </p>
            <p
              className={`text-xs mt-1 flex items-center ${totalPercentChange >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {totalPercentChange >= 0 ? (
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              )}
              {formatPercent(totalPercentChange)} All Time
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between">
              <p className="text-gray-500 text-sm font-medium">Cash Balance</p>
              <svg
                className="w-5 h-5 text-indigo-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(portfolio.cashBalance)}
            </p>
            <p className="text-xs mt-1 text-gray-500">
              {((portfolio.cashBalance / portfolio.totalValue) * 100).toFixed(
                1,
              )}
              % of portfolio
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between">
              <p className="text-gray-500 text-sm font-medium">Daily Change</p>
              <svg
                className="w-5 h-5 text-indigo-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <p
              className={`text-2xl font-bold mt-1 ${portfolio.performance.daily >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatPercent(portfolio.performance.daily)}
            </p>
            <p
              className={`text-xs mt-1 ${portfolio.performance.daily >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(
                (portfolio.totalValue * portfolio.performance.daily) / 100,
              )}
            </p>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-4">
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setActiveTab("holdings");
                setSelectedHolding(null);
              }}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === "holdings"
                  ? "text-indigo-600 border-b-2 border-indigo-600 font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Holdings
            </button>
            <button
              onClick={() => {
                setActiveTab("performance");
                setSelectedHolding(null);
              }}
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                activeTab === "performance"
                  ? "text-indigo-600 border-b-2 border-indigo-600 font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Performance
            </button>
          </div>
        </div>

        {activeTab === "holdings" && !selectedHolding && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => requestSort("symbol")}
                    className="group px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <span>Symbol</span>
                      <span className="ml-1 text-gray-400 group-hover:text-gray-700">
                        {sortConfig.key === "symbol"
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th
                    onClick={() => requestSort("shares")}
                    className="group px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-end">
                      <span>Shares</span>
                      <span className="ml-1 text-gray-400 group-hover:text-gray-700">
                        {sortConfig.key === "shares"
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort("price")}
                    className="group px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-end">
                      <span>Price</span>
                      <span className="ml-1 text-gray-400 group-hover:text-gray-700">
                        {sortConfig.key === "price"
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort("change")}
                    className="group px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-end">
                      <span>Change</span>
                      <span className="ml-1 text-gray-400 group-hover:text-gray-700">
                        {sortConfig.key === "change"
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort("value")}
                    className="group px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-end">
                      <span>Value</span>
                      <span className="ml-1 text-gray-400 group-hover:text-gray-700">
                        {sortConfig.key === "value"
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort("allocation")}
                    className="group px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-end">
                      <span>Allocation</span>
                      <span className="ml-1 text-gray-400 group-hover:text-gray-700">
                        {sortConfig.key === "allocation"
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedHoldings.map((holding) => (
                  <tr
                    key={holding.symbol}
                    className="hover:bg-indigo-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedHolding(holding.symbol)}
                  >
                    <td className="px-4 py-4 text-sm font-medium text-indigo-600">
                      {holding.symbol}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {holding.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      {holding.shares.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      {formatCurrency(holding.price)}
                    </td>
                    <td
                      className={`px-4 py-4 text-sm text-right font-medium flex items-center justify-end ${holding.change >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {holding.change >= 0 ? (
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      )}
                      {formatPercent(holding.change)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(holding.value)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end">
                        <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden mr-2">
                          <div
                            className={`h-2 ${holding.change >= 0 ? "bg-green-500" : "bg-red-500"}`}
                            style={{
                              width: `${Math.min(100, holding.allocation * 3)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">
                          {holding.allocation.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "holdings" && selectedHolding && selectedStock && (
          <div className="rounded-lg border border-gray-200 shadow-sm bg-white">
            <div className="p-4 flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedStock.symbol}
                  </h3>
                  <span className="ml-2 text-gray-600">
                    {selectedStock.name}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedStock.price)}
                  </span>
                  <span
                    className={`ml-2 text-sm font-medium ${selectedStock.change >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {selectedStock.change >= 0 ? "▲" : "▼"}{" "}
                    {formatPercent(selectedStock.change)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedHolding(null)}
                className="bg-gray-100 hover:bg-gray-200 p-1 rounded-md"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
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

            <div className="border-t border-gray-200 p-4">
              <div className="h-40 bg-white">
                <div className="flex items-end h-full space-x-1">
                  {chartData.map((point, index) => {
                    const maxPrice = Math.max(...chartData.map((d) => d.price));
                    const minPrice = Math.min(...chartData.map((d) => d.price));
                    const range = maxPrice - minPrice;
                    const heightPercent =
                      range === 0
                        ? 50
                        : ((point.price - minPrice) / range) * 80 + 10;

                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center flex-1"
                      >
                        <div
                          className={`w-full rounded-sm ${point.price >= chartData[Math.max(0, index - 1)].price ? "bg-green-500" : "bg-red-500"}`}
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                        {index % 5 === 0 && (
                          <span className="text-xs text-gray-500 mt-1">
                            {point.date}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Shares Owned</p>
                  <p className="text-sm font-medium">
                    {selectedStock.shares.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Market Value</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(selectedStock.value)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg. Cost</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(selectedStock.avgCost)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cost Basis</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(
                      selectedStock.avgCost * selectedStock.shares,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gain/Loss</p>
                  <p
                    className={`text-sm font-medium ${selectedStock.price - selectedStock.avgCost >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(
                      (selectedStock.price - selectedStock.avgCost) *
                        selectedStock.shares,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Allocation</p>
                  <p className="text-sm font-medium">
                    {selectedStock.allocation.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 flex space-x-2">
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                Buy More
              </button>
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm">
                Sell
              </button>
              <button className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-indigo-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
                </svg>
                Performance Overview
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-sm font-medium">Daily</p>
                  <p
                    className={`text-lg font-bold flex items-center ${portfolio.performance.daily >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {portfolio.performance.daily >= 0 ? (
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    )}
                    {formatPercent(portfolio.performance.daily)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-sm font-medium">Weekly</p>
                  <p
                    className={`text-lg font-bold flex items-center ${portfolio.performance.weekly >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {portfolio.performance.weekly >= 0 ? (
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    )}
                    {formatPercent(portfolio.performance.weekly)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-sm font-medium">Monthly</p>
                  <p
                    className={`text-lg font-bold flex items-center ${portfolio.performance.monthly >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {portfolio.performance.monthly >= 0 ? (
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    )}
                    {formatPercent(portfolio.performance.monthly)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-sm font-medium">Yearly</p>
                  <p
                    className={`text-lg font-bold flex items-center ${portfolio.performance.yearly >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {portfolio.performance.yearly >= 0 ? (
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    )}
                    {formatPercent(portfolio.performance.yearly)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-indigo-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                </svg>
                Portfolio Allocation
              </h3>
              <div className="space-y-3">
                {sortedHoldings.map((holding) => (
                  <div
                    key={holding.symbol}
                    className="flex items-center group hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="w-24 text-sm font-medium text-indigo-600 flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-2 ${holding.change >= 0 ? "bg-green-500" : "bg-red-500"}`}
                      ></div>
                      {holding.symbol}
                    </div>
                    <div className="flex-grow">
                      <div className="bg-gray-200 h-4 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-4 bg-gradient-to-r from-indigo-500 to-indigo-600"
                          style={{ width: `${holding.allocation}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-sm font-medium text-gray-900 text-right ml-3">
                      {holding.allocation.toFixed(1)}%
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button className="p-1 text-gray-400 hover:text-indigo-600">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Portfolio Diversification
                </h4>
                <div className="flex h-4 rounded-full overflow-hidden">
                  {[
                    "Technology",
                    "Consumer Cyclical",
                    "Communication Services",
                    "Financial",
                    "Other",
                  ].map((sector, index) => {
                    const widths = [42, 23, 18, 10, 7]; // example percentages
                    const colors = [
                      "bg-indigo-600",
                      "bg-blue-500",
                      "bg-green-500",
                      "bg-yellow-500",
                      "bg-red-500",
                    ];
                    return (
                      <div
                        key={sector}
                        className={`${colors[index]} h-full`}
                        style={{ width: `${widths[index]}%` }}
                        title={`${sector}: ${widths[index]}%`}
                      ></div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap mt-2 text-xs">
                  {[
                    "Technology",
                    "Consumer Cyclical",
                    "Communication Services",
                    "Financial",
                    "Other",
                  ].map((sector, index) => {
                    const widths = [42, 23, 18, 10, 7]; // example percentages
                    const colors = [
                      "text-indigo-600",
                      "text-blue-500",
                      "text-green-500",
                      "text-yellow-500",
                      "text-red-500",
                    ];
                    return (
                      <div key={sector} className="mr-3 flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full ${colors[index].replace("text", "bg")} mr-1`}
                        ></div>
                        <span className={`${colors[index]} font-medium`}>
                          {sector} {widths[index]}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Export Data
              </button>
              <button className="px-4 py-2 bg-indigo-600 border border-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-700 shadow-sm flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                View Full Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
