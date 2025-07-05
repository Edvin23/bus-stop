import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { type BusPosition } from '../services/gtfsRtService';

const containerStyle = { width: '100vw', height: '100vh' };
const center = { lat: 34.0522, lng: -118.2437 }; // Los Angeles

interface BusMapProps {
  busPositions: BusPosition[];
}

export default function BusMap({ busPositions }: BusMapProps) {
  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY!}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
        {busPositions.map((bus) => (
          <Marker
            key={bus.id}
            position={{ lat: bus.lat, lng: bus.lng }}
            title={`Bus ID: ${bus.id}`}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}
