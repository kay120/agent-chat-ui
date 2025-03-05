import "./index.css";
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripDetails } from "../../../trip-planner/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { format } from "date-fns";
import { Accommodation } from "agent/types";
import { capitalizeSentence } from "../../../utils/capitalize";

const StarSVG = ({ fill = "white" }: { fill?: string }) => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.73158 0.80127L6.26121 3.40923L9.23158 4.04798L7.20658 6.29854L7.51273 9.30127L4.73158 8.08423L1.95043 9.30127L2.25658 6.29854L0.23158 4.04798L3.20195 3.40923L4.73158 0.80127Z"
      fill={fill}
    />
  </svg>
);

function AccommodationCard({
  accommodation,
}: {
  accommodation: Accommodation;
}) {
  return (
    <div
      className="relative w-[161px] h-[256px] rounded-2xl shadow-md overflow-hidden"
      style={{
        backgroundImage: `url(${accommodation.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 p-3 text-white bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-sm font-semibold">{accommodation.name}</p>
        <div className="flex items-center gap-1 text-xs">
          <p className="flex items-center justify-center">
            <StarSVG />
            {accommodation.rating}
          </p>
          <p>·</p>
          <p>{accommodation.price}</p>
        </div>
        <p className="text-sm">{capitalizeSentence(accommodation.city)}</p>
      </div>
    </div>
  );
}

function SelectedAccommodation({
  accommodation,
  onHide,
  tripDetails,
}: {
  accommodation: Accommodation;
  onHide: () => void;
  tripDetails: TripDetails;
}) {
  const startDate = new Date(tripDetails.startDate);
  const endDate = new Date(tripDetails.endDate);
  const totalTripDurationDays = Math.max(
    startDate.getDate() - endDate.getDate(),
    1,
  );
  const totalPrice = totalTripDurationDays * accommodation.price;

  return (
    <div className="w-full flex gap-6 rounded-2xl overflow-hidden bg-white shadow-lg">
      <div className="w-2/3 h-[400px]">
        <img
          src={accommodation.image}
          alt={accommodation.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="w-1/3 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4 gap-3">
          <h3 className="text-xl font-semibold">{accommodation.name}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onHide}
            className="cursor-pointer hover:bg-gray-50 transition-colors ease-in-out duration-200 text-gray-500 w-5 h-5"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1">
              <StarSVG fill="black" />
              {accommodation.rating}
            </span>
            <p className="text-gray-600">{capitalizeSentence(accommodation.city)}</p>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Check-in</span>
              <span>{format(startDate, "MMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span>Check-out</span>
              <span>{format(endDate, "MMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span>Guests</span>
              <span>{tripDetails.numberOfGuests}</span>
            </div>
            <div className="flex justify-between font-semibold text-black">
              <span>Total Price</span>
              <span>${totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => console.log("Booked")}
          variant="secondary"
          className="w-full bg-gray-800 text-white hover:bg-gray-900 cursor-pointer transition-colors ease-in-out duration-200"
        >
          Book
        </Button>
      </div>
    </div>
  );
}

export default function AccommodationsList({
  tripDetails,
  accommodations,
}: {
  tripDetails: TripDetails;
  accommodations: Accommodation[];
}) {
  const [selectedAccommodation, setSelectedAccommodation] = React.useState<
    Accommodation | undefined
  >();

  if (selectedAccommodation) {
    return (
      <SelectedAccommodation
        tripDetails={tripDetails}
        onHide={() => setSelectedAccommodation(undefined)}
        accommodation={selectedAccommodation}
      />
    );
  }

  return (
    <div className="space-y-8">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full sm:max-w-sm md:max-w-2xl lg:max-w-3xl"
      >
        <CarouselContent>
          {accommodations.map((accommodation) => (
            <CarouselItem
              key={accommodation.id}
              className="basis-1/2 md:basis-1/4"
              onClick={() => setSelectedAccommodation(accommodation)}
            >
              <AccommodationCard accommodation={accommodation} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
