import StockPrice from "./stockbroker/stock-price";
import PortfolioView from "./stockbroker/portfolio-view";
import AccommodationsList from "./trip-planner/accommodations-list";
import BookAccommodation from "./trip-planner/book-accommodation";
import RestaurantsList from "./trip-planner/restaurants-list";
import BookRestaurant from "./trip-planner/book-restaurant";

const ComponentMap = {
  "stock-price": StockPrice,
  portfolio: PortfolioView,
  "accommodations-list": AccommodationsList,
  "book-accommodation": BookAccommodation,
  "restaurants-list": RestaurantsList,
  "book-restaurant": BookRestaurant,
} as const;
export default ComponentMap;
