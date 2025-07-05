import protobuf from 'protobufjs';

export interface BusPosition {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
}

interface FeedEntity {
  id?: string;
  vehicle?: {
    vehicle?: { id?: string };
    position: { latitude: number; longitude: number };
    timestamp?: number | string;
  };
}

// URL points to your backend proxy route
const VEHICLE_POSITIONS_API = 'http://localhost:5000/api/vehicle-positions';

// Make sure you have the GTFS-Realtime proto file in your public folder or somewhere accessible
const PROTO_PATH = '/gtfs-realtime.proto';

export async function fetchBusPositions(): Promise<BusPosition[]> {
  const response = await fetch(VEHICLE_POSITIONS_API);
  if (!response.ok) {
    throw new Error('Failed to fetch vehicle positions');
  }
  const buffer = await response.arrayBuffer();

  const root = await protobuf.load(PROTO_PATH);
  const FeedMessage = root.lookupType('transit_realtime.FeedMessage');
  const message = FeedMessage.decode(new Uint8Array(buffer));
  const object = FeedMessage.toObject(message, { enums: String, longs: String, defaults: true });

  const buses: BusPosition[] = [];

  if (object.entity && Array.isArray(object.entity)) {
    object.entity.forEach((entity: FeedEntity) => {
      const vehicle = entity.vehicle;
      if (vehicle && vehicle.position) {
        buses.push({
          id: vehicle.vehicle?.id || entity.id || 'unknown',
          lat: vehicle.position.latitude,
          lng: vehicle.position.longitude,
          timestamp: Number(vehicle.timestamp) || Date.now(),
        });
      }
    });
  }

  return buses;
}
