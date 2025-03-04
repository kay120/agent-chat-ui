import { TripDetails } from "../../../trip-planner/types";

export default function RestaurantsList({
  tripDetails,
}: {
  tripDetails: TripDetails;
}) {
  return <div>Restaurants list for {JSON.stringify(tripDetails)}</div>;
}
