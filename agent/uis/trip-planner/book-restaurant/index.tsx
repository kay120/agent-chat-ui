import { TripDetails } from "../../../trip-planner/types";

export default function BookRestaurant({
  tripDetails,
  restaurantName,
}: {
  tripDetails: TripDetails;
  restaurantName: string;
}) {
  return (
    <div>
      Book restaurant {restaurantName} for {JSON.stringify(tripDetails)}
    </div>
  );
}
