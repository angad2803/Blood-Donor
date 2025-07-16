import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Classic solid red pin SVG (no border, no drop shadow)
const redPin = encodeURI(
  `data:image/svg+xml,<svg width='40' height='60' viewBox='0 0 40 60' fill='none' xmlns='http://www.w3.org/2000/svg'><ellipse cx='20' cy='18' rx='16' ry='16' fill='%23dc2626'/><rect x='16' y='18' width='8' height='30' rx='4' fill='%23dc2626'/></svg>`
);

const bloodDropIcon = new L.Icon({
  iconUrl: redPin,
  iconSize: [40, 60],
  iconAnchor: [20, 60],
  popupAnchor: [0, -55],
  className: "blood-drop-marker",
});

const userIconUrl = encodeURI(
  `data:image/svg+xml,<svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'><circle cx='20' cy='20' r='16' fill='%230ea5e9' stroke='white' stroke-width='4'/></svg>`
);
const userLocationIcon = new L.Icon({
  iconUrl: userIconUrl,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  className: "user-location-marker",
});

// Helper to center map on user location
function CenterMapOnUser({ userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 12);
    }
  }, [userLocation, map]);
  return null;
}

function FitBoundsButton({ requests }) {
  const map = useMap();
  const fitBounds = () => {
    const bounds = L.latLngBounds([]);
    requests.forEach((req) => {
      let lat, lng;
      if (req.coordinates?.coordinates) {
        [lng, lat] = req.coordinates.coordinates;
      } else if (req.lat && req.lng) {
        lat = req.lat;
        lng = req.lng;
      }
      if (lat && lng) {
        bounds.extend([lat, lng]);
      }
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  return (
    <button
      onClick={fitBounds}
      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm mb-2"
    >
      Fit All Requests
    </button>
  );
}

const LeafletMap = ({
  requests = [],
  userLocation = null,
  mapHeight = "400px",
}) => {
  const [isClientSide, setIsClientSide] = useState(false);

  useEffect(() => {
    setIsClientSide(true);
  }, []);

  if (!isClientSide) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height: mapHeight }}
      >
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  // Default center (can be overridden by user location)
  const defaultCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [28.6139, 77.209]; // Delhi, India

  return (
    <div className="w-full">
      <div className="mb-2">
        <FitBoundsButton requests={requests} />
      </div>
      <MapContainer
        center={defaultCenter}
        zoom={10}
        style={{ height: mapHeight, width: "100%" }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Center on user location when available */}
        {userLocation && <CenterMapOnUser userLocation={userLocation} />}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
                <br />
                <span className="text-sm text-gray-600">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Request markers */}
        {requests.map((request) => {
          let lat, lng;
          if (request.coordinates?.coordinates) {
            [lng, lat] = request.coordinates.coordinates;
          } else if (request.lat && request.lng) {
            lat = request.lat;
            lng = request.lng;
          }

          if (!lat || !lng) return null;

          return (
            <Marker
              key={request._id}
              position={[lat, lng]}
              icon={bloodDropIcon}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-lg mb-2">
                    {request.bloodType} Blood Needed
                  </h3>
                  <p>
                    <strong>Patient:</strong> {request.patientName}
                  </p>
                  <p>
                    <strong>Hospital:</strong> {request.hospitalName}
                  </p>
                  <p>
                    <strong>Units:</strong> {request.unitsNeeded}
                  </p>
                  <p>
                    <strong>Urgency:</strong>
                    <span
                      className={`ml-1 font-semibold ${
                        request.urgency === "critical"
                          ? "text-red-600"
                          : request.urgency === "high"
                            ? "text-orange-600"
                            : request.urgency === "medium"
                              ? "text-yellow-600"
                              : "text-green-600"
                      }`}
                    >
                      {request.urgency}
                    </span>
                  </p>
                  {request.contactInfo && (
                    <p>
                      <strong>Contact:</strong> {request.contactInfo}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-2">
                    Posted: {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  {request.distance && (
                    <p className="text-sm text-blue-600 font-semibold">
                      Distance: {request.distance.toFixed(1)} km
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
