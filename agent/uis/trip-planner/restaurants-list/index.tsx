import { TripDetails } from "../../../trip-planner/types";
import { useState } from "react";

export default function RestaurantsList({
  tripDetails,
}: {
  tripDetails: TripDetails;
}) {
  // Placeholder data - ideally would come from props
  const [restaurants] = useState([
    {
      id: "1",
      name: "The Local Grill",
      cuisine: "Steakhouse",
      priceRange: "$$",
      rating: 4.7,
      distance: "0.5 miles from center",
      image: "https://placehold.co/300x200?text=Restaurant1",
      openingHours: "5:00 PM - 10:00 PM",
      popular: true,
    },
    {
      id: "2",
      name: "Ocean Breeze",
      cuisine: "Seafood",
      priceRange: "$$$",
      rating: 4.9,
      distance: "0.8 miles from center",
      image: "https://placehold.co/300x200?text=Restaurant2",
      openingHours: "12:00 PM - 11:00 PM",
      popular: true,
    },
    {
      id: "3",
      name: "Pasta Paradise",
      cuisine: "Italian",
      priceRange: "$$",
      rating: 4.5,
      distance: "1.2 miles from center",
      image: "https://placehold.co/300x200?text=Restaurant3",
      openingHours: "11:30 AM - 9:30 PM",
      popular: false,
    },
    {
      id: "4",
      name: "Spice Garden",
      cuisine: "Indian",
      priceRange: "$$",
      rating: 4.6,
      distance: "0.7 miles from center",
      image: "https://placehold.co/300x200?text=Restaurant4",
      openingHours: "12:00 PM - 10:00 PM",
      popular: false,
    },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const selectedRestaurant = restaurants.find((r) => r.id === selectedId);

  const filteredRestaurants = filter
    ? restaurants.filter((r) => r.cuisine === filter)
    : restaurants;

  const cuisines = Array.from(new Set(restaurants.map((r) => r.cuisine)));

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-orange-600 px-4 py-3">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-medium">
            Restaurants in {tripDetails.location}
          </h3>
          {selectedId && (
            <button
              onClick={() => setSelectedId(null)}
              className="text-white text-sm bg-orange-700 hover:bg-orange-800 px-2 py-1 rounded"
            >
              Back to list
            </button>
          )}
        </div>
        <p className="text-orange-100 text-xs">
          For your trip {new Date(tripDetails.startDate).toLocaleDateString()} -{" "}
          {new Date(tripDetails.endDate).toLocaleDateString()}
        </p>
      </div>

      {!selectedId ? (
        <div className="p-4">
          <div className="mb-3">
            <div className="flex flex-wrap gap-1 mb-1">
              <button
                onClick={() => setFilter(null)}
                className={`px-2 py-1 text-xs rounded-full ${
                  filter === null
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {cuisines.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() => setFilter(cuisine)}
                  className={`px-2 py-1 text-xs rounded-full ${
                    filter === cuisine
                      ? "bg-orange-600 text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Showing {filteredRestaurants.length} restaurants{" "}
              {filter ? `in ${filter}` : ""}
            </p>
          </div>

          <div className="space-y-3">
            {filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={() => setSelectedId(restaurant.id)}
                className="border rounded-lg p-3 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all"
              >
                <div className="flex">
                  <div className="w-20 h-20 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {restaurant.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {restaurant.cuisine}
                        </p>
                      </div>
                      <span className="text-sm text-gray-700">
                        {restaurant.priceRange}
                      </span>
                    </div>
                    <div className="flex items-center mt-1">
                      <svg
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <span className="text-xs text-gray-500 ml-1">
                        {restaurant.rating}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {restaurant.distance}
                      </span>
                      {restaurant.popular && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-sm">
                          Popular
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4">
          {selectedRestaurant && (
            <div className="space-y-4">
              <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={selectedRestaurant.image}
                  alt={selectedRestaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg text-gray-900">
                      {selectedRestaurant.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedRestaurant.cuisine}
                    </p>
                  </div>
                  <span className="text-gray-700 font-medium">
                    {selectedRestaurant.priceRange}
                  </span>
                </div>

                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <span className="text-sm text-gray-600 ml-1">
                    {selectedRestaurant.rating} rating
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span>{selectedRestaurant.distance}</span>
                  <span>•</span>
                  <span>{selectedRestaurant.openingHours}</span>
                </div>

                <p className="text-sm text-gray-600 pt-2 border-t">
                  {selectedRestaurant.name} offers a wonderful dining experience
                  in {tripDetails.location}. Perfect for a group of{" "}
                  {tripDetails.numberOfGuests} guests. Enjoy authentic{" "}
                  {selectedRestaurant.cuisine} cuisine in a relaxed atmosphere.
                </p>

                <div className="pt-3 flex flex-col space-y-2">
                  <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                    Reserve a Table
                  </button>
                  <button className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-colors">
                    View Menu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
