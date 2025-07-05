import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState } from 'react';
import { type BusPosition } from '../services/gtfsRtService';

const containerStyle = { width: '100vw', height: '100vh' };
const center = { lat: 34.0522, lng: -118.2437 }; // Los Angeles

interface BusMapProps {
  busPositions: BusPosition[];
}

// Custom bus marker icon
const createBusIcon = (heading?: number) => ({
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#4285F4" stroke="white" stroke-width="2"/>
      <path d="M8 8h8v8H8z" fill="white"/>
      <text x="12" y="14" text-anchor="middle" fill="#4285F4" font-size="8" font-weight="bold">BUS</text>
    </svg>
  `),
  scaledSize: new google.maps.Size(24, 24),
  anchor: new google.maps.Point(12, 12),
  rotation: heading || 0,
});

export default function BusMap({ busPositions }: BusMapProps) {
  const [selectedBus, setSelectedBus] = useState<BusPosition | null>(null);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatSpeed = (speed?: number) => {
    if (!speed) return 'N/A';
    return `${Math.round(speed * 2.237)} mph`; // Convert m/s to mph
  };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY!}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
        {busPositions.map((bus) => (
          <Marker
            key={bus.id}
            position={{ lat: bus.lat, lng: bus.lng }}
            icon={createBusIcon(bus.heading)}
            onClick={() => setSelectedBus(bus)}
            title={`Bus ${bus.routeShortName || bus.id}`}
          />
        ))}

        {selectedBus && (
          <InfoWindow
            position={{ lat: selectedBus.lat, lng: selectedBus.lng }}
            onCloseClick={() => setSelectedBus(null)}
          >
            <div style={{ padding: '8px', maxWidth: '200px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                Bus {selectedBus.routeShortName || selectedBus.id}
              </h3>
              <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                <p><strong>Route:</strong> {selectedBus.routeShortName || 'N/A'}</p>
                <p><strong>Destination:</strong> {selectedBus.headsign || 'N/A'}</p>
                <p><strong>Speed:</strong> {formatSpeed(selectedBus.speed)}</p>
                <p><strong>Last Update:</strong> {formatTime(selectedBus.timestamp)}</p>
                {selectedBus.vehicleType && (
                  <p><strong>Type:</strong> {selectedBus.vehicleType}</p>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}
