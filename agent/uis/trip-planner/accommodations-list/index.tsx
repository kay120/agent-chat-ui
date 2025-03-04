import { TripDetails } from "../../../trip-planner/types";

export default function AccommodationsList({
  tripDetails,
}: {
  tripDetails: TripDetails;
}) {
  return <div>Accommodations list for {JSON.stringify(tripDetails)}</div>;
}
