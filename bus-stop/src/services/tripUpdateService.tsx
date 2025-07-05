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

export interface Prediction {
  time: number;
  sec: number;
  min: number;
  tripId: string;
  vehicleId: string;
  departure?: boolean;
  delayed?: boolean;
}

export interface Destination {
  directionId: string;
  headsign: string;
  predictions: Prediction[];
}

export interface StopPrediction {
  routeShortName: string;
  routeName: string;
  routeId: string;
  stopId: string;
  stopName: string;
  stopCode?: number;
  destinations: Destination[];
}

export interface PredictionsResponse {
  success: boolean;
  route: string;
  data: {
    agencyKey: string;
    predictionsData: StopPrediction[];
  };
}

export interface PredictionsNearLocationResponse {
  success: boolean;
  route: string;
  data: {
    agencyKey: string;
    predictionsData: (StopPrediction & { distanceToStop: number })[];
  };
}

const PREDICTIONS_API = 'http://localhost:5555/api/swiftly/predictions';
const PREDICTIONS_NEAR_LOCATION_API = 'http://localhost:5555/api/swiftly/predictions-near-location';

export async function fetchPredictions(
  agencyKey: string = 'lametro',
  stop: string,
  route?: string,
  number: number = 3
): Promise<StopPrediction[]> {
  try {
    const params = new URLSearchParams({
      agencyKey,
      stop,
      number: number.toString()
    });
    
    if (route) {
      params.append('route', route);
    }

    const response = await fetch(`${PREDICTIONS_API}?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch predictions');
    }

    const data: PredictionsResponse = await response.json();
    
    if (!data.success || !data.data.predictionsData) {
      throw new Error('Invalid response from predictions API');
    }

    return data.data.predictionsData;
  } catch (error) {
    console.error('Error fetching predictions:', error);
    throw error;
  }
}

export async function fetchPredictionsNearLocation(
  agencyKey: string = 'lametro',
  lat: number,
  lon: number,
  meters: number = 1500,
  number: number = 3
): Promise<(StopPrediction & { distanceToStop: number })[]> {
  try {
    const params = new URLSearchParams({
      agencyKey,
      lat: lat.toString(),
      lon: lon.toString(),
      meters: meters.toString(),
      number: number.toString()
    });

    const response = await fetch(`${PREDICTIONS_NEAR_LOCATION_API}?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch predictions near location');
    }

    const data: PredictionsNearLocationResponse = await response.json();
    
    if (!data.success || !data.data.predictionsData) {
      throw new Error('Invalid response from predictions near location API');
    }

    return data.data.predictionsData;
  } catch (error) {
    console.error('Error fetching predictions near location:', error);
    throw error;
  }
}

export function formatPredictionTime(prediction: Prediction): string {
  if (prediction.min === 0) {
    return 'Due';
  } else if (prediction.min === 1) {
    return '1 min';
  } else {
    return `${prediction.min} mins`;
  }
}

export function sortPredictionsByTime(predictions: Prediction[]): Prediction[] {
  return predictions.sort((a, b) => a.sec - b.sec);
}
