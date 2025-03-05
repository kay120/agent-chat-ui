import { faker } from "@faker-js/faker";
import { Accommodation } from "../../types";
import { TripDetails } from "../types";

export function getAccommodationsListProps(tripDetails: TripDetails) {
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
    "https://a0.muscache.com/im/pictures/miso/Hosting-813949239894880001/original/b2abe806-b60f-4c0b-b4e6-46808024e5b6.jpeg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/prohost-api/Hosting-894877242638354447/original/29e50d48-1733-4c5b-9068-da4443dd7757.jpeg?im_w=720&im_format=avif",,
    "https://a0.muscache.com/im/pictures/hosting/Hosting-1079897686805296552/original/b24bd803-52f2-4ca7-9389-f73c9d9b3c64.jpeg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/miso/Hosting-43730011/original/29f90186-4f83-408a-89ce-a82e520b4e36.png?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/300ae0e1-fc7e-4a05-93a4-26809311ef19.jpg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/0c7b03c9-8907-437f-8874-628e89e00679.jpg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/prohost-api/Hosting-1040593515802997386/original/0c910b31-03d3-450f-8dc3-2d7f7902b93e.jpeg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/d336587a-a4bf-44c9-b4a6-68b71c359be0.jpg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/prohost-api/Hosting-50345540/original/f8e911bb-8021-4edd-aca4-913d6f41fc6f.jpeg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/prohost-api/Hosting-46122096/original/1bd27f94-cf00-4864-8ad9-bc1cd6c5e10d.jpeg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/574424e1-4935-45f5-a5f0-e960b16a3fcc.jpg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/181d4be2-6cb2-4306-94bf-89aa45c5de66.jpg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/miso/Hosting-50545526/original/af14ce0b-481e-41be-88d1-b84758f578e5.jpeg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/10d8309a-8ae6-492b-b1d5-20a543242c68.jpg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/miso/Hosting-813727499556203528/original/12c1b750-4bea-40d9-9a10-66804df0530a.jpeg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/83e4c0a0-65ce-4c5d-967e-d378ed1bfe15.jpg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/852f2d4d-6786-47b5-a3ca-ff7f21bcac2d.jpg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/92534e36-d67a-4346-b3cf-7371b1985aca.jpg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/ecbfed18-29d0-4f86-b6aa-4325b076dfb3.jpg?im_w=720&im_format=avif",
    "https://a0.muscache.com/im/pictures/prohost-api/Hosting-52443635/original/05f084c6-60d0-4945-81ff-d23dfb89c3ca.jpeg?im_w=720&im_format=avif",
  ];
  
  const getAccommodations = (city: string): Accommodation[] => {
    // Shuffle the image URLs array and take the first 6
    const shuffledImages = [...IMAGE_URLS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 6)
      .filter((i): i is string => typeof i === "string")
  
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
  };

  return {
    tripDetails,
    accommodations: getAccommodations(tripDetails.location),
  }
}