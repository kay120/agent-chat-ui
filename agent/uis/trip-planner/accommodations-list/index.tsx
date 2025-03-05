import "./index.css";
import React, { useEffect } from "react";
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
import { faker } from "@faker-js/faker";
import { format } from "date-fns";

const IMAGE_URLS = [
  "https://a0.muscache.com/im/pictures/c88d4356-9e33-4277-83fd-3053e5695333.jpg?im_w=1200&im_format=avif",
  "https://a0.muscache.com/im/pictures/miso/Hosting-999231834211657440/original/fa140513-cc51-48a6-83c9-ef4e11e69bc2.jpeg?im_w=1200&im_format=avif",
  "https://a0.muscache.com/im/pictures/miso/Hosting-5264493/original/10d2c21f-84c2-46c5-b20b-b51d1c2c971a.jpeg?im_w=1200&im_format=avif",
  "https://a0.muscache.com/im/pictures/d0e3bb05-a96a-45cf-af92-980269168096.jpg?im_w=720&im_format=avif",
  "https://a0.muscache.com/im/pictures/miso/Hosting-50597302/original/eb1bb383-4b70-45ae-b3ce-596f83436e6f.jpeg?im_w=720&im_format=avif",
  "https://a0.muscache.com/im/pictures/miso/Hosting-900891950206269231/original/7cc71402-9430-48b4-b4f1-e8cac69fd7d3.jpeg?im_w=720&im_format=avif",
  "https://a0.muscache.com/im/pictures/460efdcd-1286-431d-b4e5-e316d6427707.jpg?im_w=720&im_format=avif",
  "https://a0.muscache.com/im/pictures/prohost-api/Hosting-51234810/original/5231025a-4c39-4a96-ac9c-b088fceb5531.jpeg?im_w=720&im_format=avif",
  "https://a0.muscache.com/im/pictures/miso/Hosting-14886949/original/a9d72542-cd1f-418d-b070-a73035f94fe4.jpeg?im_w=720&im_format=avif",
  "https://a0.muscache.com/im/pictures/2011683a-c045-4b5a-97a8-37bca4b98079.jpg?im_w=720&im_format=avif",
  "https://a0.muscache.com/im/pictures/11bcbeec-749c-4897-8593-1ec6f6dc04ad.jpg?im_w=720&im_format=avif",
  "https://a0.muscache.com/im/pictures/prohost-api/Hosting-18327626/original/fba2e4e8-9d68-47a8-838e-dab5353e5209.jpeg?im_w=720&im_format=avif",
];

export type Accommodation = {
  id: string;
  name: string;
  price: number;
  rating: number;
  city: string;
  image: string;
};

function getAccommodations(city: string): Accommodation[] {
  // Shuffle the image URLs array and take the first 6
  const shuffledImages = [...IMAGE_URLS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  return Array.from({ length: 6 }, (_, index) => ({
    id: faker.string.uuid(),
    name: faker.location.streetAddress(),
    price: faker.number.int({ min: 100, max: 1000 }),
    rating: Number(
      faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 2 }).toFixed(2),
    ),
    city: city,
    image: shuffledImages[index],
  }));
}

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
        <p className="text-sm">{accommodation.city}</p>
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
            <p className="text-gray-600">{accommodation.city}</p>
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
}: {
  tripDetails: TripDetails;
}) {
  const [places, setPlaces] = React.useState<Accommodation[]>([]);

  useEffect(() => {
    const accommodations = getAccommodations(tripDetails.location);
    setPlaces(accommodations);
    setSelectedAccommodation(accommodations[0]);
  }, []);

  const [selectedAccommodation, setSelectedAccommodation] = React.useState<
    Accommodation | undefined
  >(places[0]);

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
          {places.map((accommodation) => (
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
