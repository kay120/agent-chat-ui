import "./index.css";
import { TripDetails } from "../../../trip-planner/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { faker } from "@faker-js/faker";

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
  price: string;
  rating: number;
  city: string;
  image: string;
};

function getAccommodations(city: string): Accommodation[] {
  return Array.from({ length: 6 }, () => ({
    id: faker.string.uuid(),
    name: faker.location.streetAddress(),
    price: `$${faker.number.int({ min: 100, max: 1000 })}`,
    rating: Number(
      faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 2 }).toFixed(2),
    ),
    city: city,
    image: IMAGE_URLS[Math.floor(Math.random() * IMAGE_URLS.length)],
  }));
}

const StarSVG = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.73158 0.80127L6.26121 3.40923L9.23158 4.04798L7.20658 6.29854L7.51273 9.30127L4.73158 8.08423L1.95043 9.30127L2.25658 6.29854L0.23158 4.04798L3.20195 3.40923L4.73158 0.80127Z"
      fill="white"
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

export default function AccommodationsList({
  tripDetails,
}: {
  tripDetails: TripDetails;
}) {
  const places = getAccommodations(tripDetails.location);
  return (
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
          >
            <AccommodationCard accommodation={accommodation} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
