import protobuf from 'protobufjs';

export interface BusPosition {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
  routeId?: string;
  routeShortName?: string;
  headsign?: string;
  speed?: number;
  heading?: number;
  vehicleType?: string;
}

export interface SwiftlyVehicle {
  id: string;
  routeId?: string;
  routeShortName?: string;
  headsign?: string;
  vehicleType?: string;
  directionId?: string;
  loc: {
    lat: number;
    lon: number;
    time: number;
    speed?: number;
    heading?: number;
  };
}

export interface SwiftlyResponse {
  success: boolean;
  route: string;
  data: {
    agencyKey: string;
    vehicles: SwiftlyVehicle[];
  };
}

interface FeedEntity {
  id?: string;
  vehicle?: {
    vehicle?: { id?: string };
    position: { latitude: number; longitude: number };
    timestamp?: number | string;
  };
}

// API endpoints - use relative URLs for production
const VEHICLE_POSITIONS_API = '/api/vehicle-positions';
const SWIFTLY_VEHICLES_API = '/api/swiftly/vehicles';

// Make sure you have the GTFS-Realtime proto file in your public folder or somewhere accessible
const PROTO_PATH = '/gtfs-realtime.proto';

export async function fetchBusPositions(): Promise<BusPosition[]> {
  try {
    console.log('Fetching from:', VEHICLE_POSITIONS_API);
    const response = await fetch(VEHICLE_POSITIONS_API);
    console.log('Response status:', response.status, 'ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`Failed to fetch vehicle positions: ${response.status} ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    console.log('Received buffer size:', buffer.byteLength);

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

    console.log('Parsed buses:', buses.length);
    return buses;
  } catch (error) {
    console.error('Error fetching GTFS-RT bus positions:', error);
    throw error;
  }
}

export async function fetchSwiftlyBusPositions(agencyKey: string = 'lametro'): Promise<BusPosition[]> {
  try {
    const url = `${SWIFTLY_VEHICLES_API}?agencyKey=${agencyKey}`;
    console.log('Fetching from Swiftly:', url);
    
    const response = await fetch(url);
    console.log('Swiftly response status:', response.status, 'ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Swiftly response error:', errorText);
      throw new Error(`Failed to fetch Swiftly vehicle positions: ${response.status} ${response.statusText}`);
    }
    
    // Swiftly returns GTFS-RT binary data, so we need to decode it
    const buffer = await response.arrayBuffer();
    console.log('Swiftly buffer size:', buffer.byteLength);
    
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

    console.log('Swiftly parsed buses:', buses.length);
    return buses;
  } catch (error) {
    console.error('Error fetching Swiftly bus positions:', error);
    throw error;
  }
}

// Combined function that tries Swiftly first, falls back to GTFS-RT
export async function fetchBusPositionsWithFallback(agencyKey: string = 'lametro'): Promise<BusPosition[]> {
  try {
    // Try Swiftly API first
    return await fetchSwiftlyBusPositions(agencyKey);
  } catch (swiftlyError) {
    console.warn('Swiftly API failed, falling back to GTFS-RT:', swiftlyError);
    try {
      // Fall back to GTFS-RT
      return await fetchBusPositions();
    } catch (gtfsError) {
      console.error('Both APIs failed:', gtfsError);
      throw new Error('Unable to fetch bus positions from any source');
    }
  }
}
