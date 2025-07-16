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
      if (lat && lng) bounds.extend([lat, lng]);
    });
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.2));
  };
  return (
    <button
      onClick={fitBounds}
      className="absolute top-4 right-4 z-[1000] bg-white border border-gray-300 shadow-lg rounded-full px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
      title="Zoom to fit all requests"
    >
      🔍 Fit All
    </button>
  );
}

const LeafletMap = ({ requests = [], height = "500px" }) => {
  const center = [28.6139, 77.209];
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef();

  // Get user location
  useEffect(() => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setLocating(false);
        },
        () => setLocating(false),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocating(false);
    }
  }, []);

  // Quick stats
  const total = requests.length;
  const emergencies = requests.filter((r) => r.urgency === "emergency").length;

  return (
    <div className="relative">
      {/* Floating stats card */}
      <div className="absolute left-4 top-4 z-[1000] bg-white/90 shadow-lg rounded-lg px-5 py-3 border border-gray-200 flex flex-col gap-1 min-w-[170px]">
        <div className="font-bold text-lg text-red-600">🩸 Blood Requests</div>
        <div className="text-gray-700 text-sm">
          Total: <b>{total}</b>
        </div>
        <div className="text-gray-700 text-sm">
          Emergency: <b className="text-red-600">{emergencies}</b>
        </div>
      </div>
      <MapContainer
        center={center}
        zoom={10}
        style={{
          height,
          width: "100%",
          borderRadius: 18,
          boxShadow: "0 4px 32px #0002",
          border: "2px solid #e5e7eb",
        }}
        className="overflow-hidden"
        ref={mapRef}
      >
        <FitBoundsButton requests={requests} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <b>📍 Your Location</b>
              <br />
              Accuracy: ±{Math.round(userLocation.accuracy)} meters
            </Popup>
          </Marker>
        )}
        {userLocation && <CenterMapOnUser userLocation={userLocation} />}
        {requests.map((req, idx) => {
          let lat, lng;
          if (
            req.coordinates &&
            Array.isArray(req.coordinates.coordinates) &&
            req.coordinates.coordinates.length === 2
          ) {
            [lng, lat] = req.coordinates.coordinates;
            // Skip if [0,0] (invalid)
            if (lng === 0 && lat === 0) return null;
          } else if (req.lat && req.lng) {
            lat = req.lat;
            lng = req.lng;
          } else {
            // Optionally log for debugging
            console.warn("Skipping request with missing coordinates:", req);
            return null;
          }
          const isEmergency = req.urgency === "emergency";
          return (
            <Marker
              key={req._id || idx}
              position={[lat, lng]}
              icon={bloodDropIcon}
            >
              <Popup>
                <div style={{ minWidth: 180, fontFamily: "inherit" }}>
                  <div className="font-bold text-lg mb-1 flex items-center gap-1">
                    <span
                      style={{ color: isEmergency ? "#dc2626" : "#ef4444" }}
                    >
                      🩸 {req.bloodGroup}
                    </span>
                    {isEmergency && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                        EMERGENCY
                      </span>
                    )}
                  </div>
                  <div className="text-gray-800 text-sm mb-1">
                    Hospital: <b>{req.hospitalName || "Unknown"}</b>
                  </div>
                  {req.urgency && (
                    <div className="text-xs mb-1">
                      Urgency:{" "}
                      <b style={{ color: isEmergency ? "#dc2626" : "#ef4444" }}>
                        {req.urgency}
                      </b>
                    </div>
                  )}
                  {req.neededBy && (
                    <div className="text-xs mb-1">
                      Needed By: {new Date(req.neededBy).toLocaleString()}
                    </div>
                  )}
                  {req.contactNumber && (
                    <div className="text-xs mb-1">
                      Contact:{" "}
                      <a
                        href={`tel:${req.contactNumber}`}
                        className="text-blue-700 underline"
                      >
                        {req.contactNumber}
                      </a>
                    </div>
                  )}
                  {userLocation && (
                    <div className="mt-2">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-semibold"
                      >
                        Get Directions
                      </a>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {/* Legend */}
      <div className="mt-3 flex gap-6 text-sm items-center bg-white/90 rounded-lg p-3 border w-fit shadow-lg mx-auto">
        <span className="flex items-center gap-1">
          <img src={redPin} alt="Emergency" style={{ width: 24, height: 30 }} />{" "}
          <span className="font-semibold text-red-700">Emergency</span>
        </span>
        <span className="flex items-center gap-1">
          <img src={redPin} alt="Regular" style={{ width: 24, height: 30 }} />{" "}
          <span className="font-semibold text-red-500">Regular</span>
        </span>
        <span className="flex items-center gap-1">
          <img src={userIconUrl} alt="You" style={{ width: 20, height: 20 }} />{" "}
          <span className="font-semibold text-blue-700">You</span>
        </span>
        {locating && <span className="text-blue-500">Locating...</span>}
      </div>
    </div>
  );
};

export default LeafletMap;
