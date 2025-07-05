import axios from "axios";
import protobuf from "protobufjs";

export interface TripUpdate {
  tripId: string;
  vehicleId: string;
  delay: number | null;
  arrivalTime: string | null;
}

interface TripEntity {
  tripUpdate?: {
    trip?: { tripId?: string };
    vehicle?: { id?: string };
    stopTimeUpdate?: Array<{
      arrival?: {
        delay?: number;
        time?: number;
      };
    }>;
  };
}

interface Feed {
  entity?: TripEntity[];
}

export async function fetchTripUpdates(): Promise<TripUpdate[]> {
  try {
    const response = await axios.get(import.meta.env.VITE_GTFS_RT_TRIP_UPDATES_URL!, {
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SWIFTLY_API_KEY}`,
      },
    });

    const root = await protobuf.load("/gtfs-realtime.proto");
    const FeedMessage = root.lookupType("transit_realtime.FeedMessage");

    const decoded = FeedMessage.decode(new Uint8Array(response.data));
    const feed = decoded.toJSON() as Feed;

    const tripUpdates: TripUpdate[] = (feed.entity || [])
      .filter((e: TripEntity) => e.tripUpdate)
      .map((e: TripEntity) => {
        const stopTimeUpdate = e.tripUpdate!.stopTimeUpdate?.[0];

        return {
          tripId: e.tripUpdate!.trip?.tripId || "unknown",
          vehicleId: e.tripUpdate!.vehicle?.id || "unknown",
          delay: stopTimeUpdate?.arrival?.delay ?? null,
          arrivalTime: stopTimeUpdate?.arrival?.time
            ? new Date(Number(stopTimeUpdate.arrival.time) * 1000).toLocaleTimeString()
            : null,
        };
      });

    return tripUpdates;
  } catch (err) {
    console.error("Error fetching trip updates:", err);
    return [];
  }
}
