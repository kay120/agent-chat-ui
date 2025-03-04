import { TripDetails } from "../../../trip-planner/types";
import { useState } from "react";

export default function AccommodationsList({
  tripDetails,
}: {
  tripDetails: TripDetails;
}) {
  console.log("tripDetails", tripDetails);
  // Placeholder data - ideally would come from props
  const [accommodations] = useState([
    {
      id: "1",
      name: "Grand Hotel",
      type: "Hotel",
      price: "$150/night",
      rating: 4.8,
      amenities: ["WiFi", "Pool", "Breakfast"],
      image: "https://placehold.co/300x200?text=Hotel",
      available: true,
    },
    {
      id: "2",
      name: "Cozy Apartment",
      type: "Apartment",
      price: "$120/night",
      rating: 4.5,
      amenities: ["WiFi", "Kitchen", "Washing Machine"],
      image: "https://placehold.co/300x200?text=Apartment",
      available: true,
    },
    {
      id: "3",
      name: "Beachside Villa",
      type: "Villa",
      price: "$300/night",
      rating: 4.9,
      amenities: ["WiFi", "Private Pool", "Ocean View"],
      image: "https://placehold.co/300x200?text=Villa",
      available: false,
    },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedAccommodation = accommodations.find(
    (acc) => acc.id === selectedId,
  );

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 px-4 py-3">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-medium">
            Accommodations in {tripDetails.location}
          </h3>
          {selectedId && (
            <button
              onClick={() => setSelectedId(null)}
              className="text-white text-sm bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded"
            >
              Back to list
            </button>
          )}
        </div>
        <p className="text-blue-100 text-xs">
          {new Date(tripDetails.startDate).toLocaleDateString()} -{" "}
          {new Date(tripDetails.endDate).toLocaleDateString()} ·{" "}
          {tripDetails.numberOfGuests} guests
        </p>
      </div>

      <div className="p-4">
        {!selectedId ? (
          <div className="space-y-3">
            {accommodations.map((accommodation) => (
              <div
                key={accommodation.id}
                onClick={() => setSelectedId(accommodation.id)}
                className={`flex border rounded-lg p-3 cursor-pointer transition-all ${
                  accommodation.available
                    ? "hover:border-blue-300 hover:shadow-md"
                    : "opacity-60"
                }`}
              >
                <div className="w-20 h-20 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
                  <img
                    src={accommodation.image}
                    alt={accommodation.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-medium text-gray-900">
                      {accommodation.name}
                    </h4>
                    <span className="text-sm font-semibold text-blue-600">
                      {accommodation.price}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{accommodation.type}</p>
                  <div className="flex items-center mt-1">
                    <svg
                      className="w-4 h-4 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    <span className="text-xs text-gray-500 ml-1">
                      {accommodation.rating}
                    </span>
                  </div>
                  {!accommodation.available && (
                    <span className="text-xs text-red-500 font-medium">
                      Unavailable for your dates
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {selectedAccommodation && (
              <>
                <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={selectedAccommodation.image}
                    alt={selectedAccommodation.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-lg text-gray-900">
                      {selectedAccommodation.name}
                    </h3>
                    <span className="font-semibold text-blue-600">
                      {selectedAccommodation.price}
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
                    <span className="text-sm text-gray-500 ml-1">
                      {selectedAccommodation.rating}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Perfect accommodation in {tripDetails.location} for your{" "}
                    {tripDetails.numberOfGuests} guests.
                  </p>
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Amenities:
                    </h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAccommodation.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className={`w-full mt-4 py-2 rounded-md text-white font-medium ${
                      selectedAccommodation.available
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!selectedAccommodation.available}
                  >
                    {selectedAccommodation.available
                      ? "Book Now"
                      : "Unavailable"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
