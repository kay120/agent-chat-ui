import { TripDetails } from "../../../trip-planner/types";

export default function BookAccommodation({
  tripDetails,
  accommodationName,
}: {
  tripDetails: TripDetails;
  accommodationName: string;
}) {
  return (
    <div>
      Book accommodation {accommodationName} for {JSON.stringify(tripDetails)}
    </div>
  );
}
