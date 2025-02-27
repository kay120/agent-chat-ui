import StockPrice from "./stock-price";
import PortfolioView from "./portfolio-view";

const ComponentMap = {
  "stock-price": StockPrice,
  "portfolio-view": PortfolioView,
} as const;
export default ComponentMap;
