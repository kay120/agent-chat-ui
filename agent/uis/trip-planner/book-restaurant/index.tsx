import { TripDetails } from "../../../trip-planner/types";
import { useState } from "react";

export default function BookRestaurant({
  tripDetails,
  restaurantName,
}: {
  tripDetails: TripDetails;
  restaurantName: string;
}) {
  // Placeholder data - ideally would come from props
  const [restaurant] = useState({
    name: restaurantName,
    cuisine: "Contemporary",
    priceRange: "$$",
    rating: 4.7,
    image: "https://placehold.co/300x200?text=Restaurant",
    openingHours: "5:00 PM - 10:00 PM",
    address: "123 Main St, " + tripDetails.location,
    availableTimes: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"],
  });

  const [reservationStep, setReservationStep] = useState<
    "selection" | "details" | "confirmed"
  >("selection");
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(tripDetails.startDate),
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [guests, setGuests] = useState(Math.min(tripDetails.numberOfGuests, 8));
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialRequests: "",
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setSelectedDate(date);
  };

  const handleGuestsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGuests(Number(e.target.value));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTimeSelection = (time: string) => {
    setSelectedTime(time);
  };

  const handleContinue = () => {
    if (selectedTime) {
      setReservationStep("details");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReservationStep("confirmed");
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-orange-600 px-4 py-3">
        <h3 className="text-white font-medium">Reserve at {restaurant.name}</h3>
        <p className="text-orange-100 text-xs">
          {restaurant.cuisine} • {restaurant.priceRange} • {restaurant.rating}★
        </p>
      </div>

      <div className="p-4">
        {reservationStep === "selection" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{restaurant.name}</h4>
                <p className="text-sm text-gray-500">{restaurant.address}</p>
                <p className="text-sm text-gray-500">
                  {restaurant.openingHours}
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date
              </label>
              <input
                type="date"
                id="date"
                min={formatDate(new Date(tripDetails.startDate))}
                max={formatDate(new Date(tripDetails.endDate))}
                value={formatDate(selectedDate)}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="guests"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Guests
              </label>
              <select
                id="guests"
                value={guests}
                onChange={handleGuestsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm"
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "person" : "people"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Times
              </label>
              <div className="grid grid-cols-3 gap-2">
                {restaurant.availableTimes.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeSelection(time)}
                    className={`text-sm py-2 px-3 rounded-md border transition-colors ${
                      selectedTime === time
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={!selectedTime}
              className={`w-full py-2 rounded-md text-white font-medium ${
                selectedTime
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        )}

        {reservationStep === "details" && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="border-b pb-3 mb-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date & Time</span>
                <span className="font-medium">
                  {selectedDate.toLocaleDateString()} at {selectedTime}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Party Size</span>
                <span className="font-medium">
                  {guests} {guests === 1 ? "person" : "people"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReservationStep("selection")}
                className="text-orange-600 text-xs hover:underline mt-2"
              >
                Change
              </button>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="specialRequests"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Special Requests
              </label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm"
                placeholder="Allergies, special occasions, seating preferences..."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Confirm Reservation
              </button>
            </div>
          </form>
        )}

        {reservationStep === "confirmed" && (
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Reservation Confirmed!
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Your table at {restaurant.name} has been reserved. You'll
                receive a confirmation email shortly at {formData.email}.
              </p>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
              <h4 className="font-medium text-sm text-gray-700">
                Reservation Details
              </h4>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                <li className="flex justify-between">
                  <span>Restaurant:</span>
                  <span className="font-medium">{restaurant.name}</span>
                </li>
                <li className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium">
                    {selectedDate.toLocaleDateString()}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                </li>
                <li className="flex justify-between">
                  <span>Party Size:</span>
                  <span className="font-medium">
                    {guests} {guests === 1 ? "person" : "people"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Reservation Name:</span>
                  <span className="font-medium">{formData.name}</span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                Need to cancel or modify? Please call the restaurant directly at
                (123) 456-7890.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
