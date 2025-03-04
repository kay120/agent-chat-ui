import "./index.css";
import { TripDetails } from "../../../trip-planner/types";
import { useState } from "react";

export default function BookAccommodation({
  tripDetails,
  accommodationName,
}: {
  tripDetails: TripDetails;
  accommodationName: string;
}) {
  // Placeholder data - ideally would come from props
  const [accommodation] = useState({
    name: accommodationName,
    type: "Hotel",
    price: "$150/night",
    rating: 4.8,
    totalPrice:
      "$" +
      150 *
        Math.ceil(
          (new Date(tripDetails.endDate).getTime() -
            new Date(tripDetails.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
    image: "https://placehold.co/300x200?text=Accommodation",
    roomTypes: ["Standard", "Deluxe", "Suite"],
    checkInTime: "3:00 PM",
    checkOutTime: "11:00 AM",
  });

  const [selectedRoom, setSelectedRoom] = useState("Standard");
  const [bookingStep, setBookingStep] = useState<
    "details" | "payment" | "confirmed"
  >("details");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialRequests: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStep("payment");
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStep("confirmed");
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 px-4 py-3">
        <h3 className="text-white font-medium">Book {accommodation.name}</h3>
        <p className="text-blue-100 text-xs">
          {new Date(tripDetails.startDate).toLocaleDateString()} -{" "}
          {new Date(tripDetails.endDate).toLocaleDateString()} ·{" "}
          {tripDetails.numberOfGuests} guests
        </p>
      </div>

      <div className="p-4">
        {bookingStep === "details" && (
          <>
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                <img
                  src={accommodation.image}
                  alt={accommodation.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {accommodation.name}
                </h4>
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
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-500">
                    {accommodation.type}
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    {accommodation.price}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-b py-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Check-in</span>
                <span className="font-medium">
                  {new Date(tripDetails.startDate).toLocaleDateString()} (
                  {accommodation.checkInTime})
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Check-out</span>
                <span className="font-medium">
                  {new Date(tripDetails.endDate).toLocaleDateString()} (
                  {accommodation.checkOutTime})
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Guests</span>
                <span className="font-medium">
                  {tripDetails.numberOfGuests}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {accommodation.roomTypes.map((room) => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => setSelectedRoom(room)}
                    className={`text-sm py-2 px-3 rounded-md border transition-colors ${
                      selectedRoom === room
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {room}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="border-t pt-3 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600 text-sm">Total Price:</span>
                  <span className="font-semibold text-lg">
                    {accommodation.totalPrice}
                  </span>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Continue to Payment
                </button>
              </div>
            </form>
          </>
        )}

        {bookingStep === "payment" && (
          <form onSubmit={handlePayment} className="space-y-3">
            <h4 className="font-medium text-lg text-gray-900 mb-3">
              Payment Details
            </h4>

            <div>
              <label
                htmlFor="cardName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name on Card
              </label>
              <input
                type="text"
                id="cardName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="cardNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                placeholder="XXXX XXXX XXXX XXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="expiry"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Expiry Date
                </label>
                <input
                  type="text"
                  id="expiry"
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="cvc"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  CVC
                </label>
                <input
                  type="text"
                  id="cvc"
                  placeholder="XXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
            </div>

            <div className="border-t pt-3 mt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600 text-sm">Total Amount:</span>
                <span className="font-semibold text-lg">
                  {accommodation.totalPrice}
                </span>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Complete Booking
              </button>
              <button
                type="button"
                onClick={() => setBookingStep("details")}
                className="w-full mt-2 bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {bookingStep === "confirmed" && (
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
              Booking Confirmed!
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Your booking at {accommodation.name} has been confirmed. You'll
                receive a confirmation email shortly at {formData.email}.
              </p>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
              <h4 className="font-medium text-sm text-gray-700">
                Booking Summary
              </h4>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                <li className="flex justify-between">
                  <span>Check-in:</span>
                  <span className="font-medium">
                    {new Date(tripDetails.startDate).toLocaleDateString()}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Check-out:</span>
                  <span className="font-medium">
                    {new Date(tripDetails.endDate).toLocaleDateString()}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Room type:</span>
                  <span className="font-medium">{selectedRoom}</span>
                </li>
                <li className="flex justify-between">
                  <span>Guests:</span>
                  <span className="font-medium">
                    {tripDetails.numberOfGuests}
                  </span>
                </li>
                <li className="flex justify-between pt-1 mt-1 border-t">
                  <span>Total paid:</span>
                  <span className="font-medium">
                    {accommodation.totalPrice}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
