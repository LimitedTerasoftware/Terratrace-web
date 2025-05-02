import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useMemo } from "react";

// Define state coordinates (Single Marker per state)
const statesCoordinates = {
  "Andaman and Nicobar": { lat: 10.218834, lng: 92.615831 },
  "West Bengal": { lat:  22.98675690, lng: 87.85497550 },
  "Arunachal Pradesh": { lat: 27.100, lng: 93.616 },
  "Himachal Pradesh": { lat: 31.1048, lng: 77.1734 },
  "Nagaland": { lat: 26.1584, lng: 94.5624 },
  "Andhra Pradesh": { lat: 15.9129, lng: 79.7400 },
  "Telangana": { lat: 17.3850, lng: 78.4867 },
  "Odisha": { lat: 20.9517, lng: 85.0985 },
};

const mapContainerStyle = {
  width: "100%",
  height: "370px",
};

const IndiaMap = () => {
  const center = useMemo(() => ({ lat: 22.98675690, lng: 87.85497550 }), []);

  return (
    <LoadScript googleMapsApiKey="AIzaSyCPHNQoyCkDJ3kOdYZAjZElbhXuJvx-Odg">
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={5}>
        {Object.entries(statesCoordinates).map(([state, coordinates], index) => (
          <Marker key={index} position={coordinates} title={state} />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default IndiaMap;
