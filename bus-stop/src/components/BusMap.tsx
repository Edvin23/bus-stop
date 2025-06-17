import { GoogleMap, LoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: '100%',
  height: '500px'
};

const center = {
  lat: 34.0522,
  lng: -118.2437
};

function BusMap() {
  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
        {/* Bus markers will go here later */}
      </GoogleMap>
    </LoadScript>
  );
}

export default BusMap;
