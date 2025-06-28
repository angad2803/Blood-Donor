import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import esriConfig from "@arcgis/core/config.js";

const ArcGISMapTest = () => {
  const mapRef = useRef();
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const testArcGIS = async () => {
      try {
        setStatus("Checking API key...");

        // Check if API key is configured
        const apiKey = import.meta.env.VITE_ARCGIS_API_KEY;
        console.log("API Key found:", apiKey ? "Yes" : "No");

        if (!apiKey || apiKey === "your_arcgis_api_key_here") {
          setError(
            "API key not configured. Please add VITE_ARCGIS_API_KEY to .env file"
          );
          setStatus("Failed");
          return;
        }

        setStatus("Setting up ArcGIS config...");
        esriConfig.apiKey = apiKey;

        setStatus("Creating map...");
        const map = new Map({
          basemap: "streets-navigation-vector",
        });

        setStatus("Creating map view...");
        const view = new MapView({
          container: mapRef.current,
          map: map,
          center: [77.209, 28.6139], // Delhi, India
          zoom: 10,
        });

        setStatus("Waiting for map to load...");
        await view.when();

        setStatus("✅ ArcGIS Map Test Successful!");
        console.log("✅ ArcGIS Map Test: Map loaded successfully");
      } catch (err) {
        console.error("❌ ArcGIS Map Test Error:", err);
        setError(err.message);
        setStatus("Failed");
      }
    };

    if (mapRef.current) {
      testArcGIS();
    }
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">ArcGIS Map Test</h2>

      <div className="mb-4 p-3 bg-gray-100 rounded">
        <p>
          <strong>Status:</strong> {status}
        </p>
        {error && (
          <p className="text-red-600 mt-2">
            <strong>Error:</strong> {error}
          </p>
        )}
      </div>

      <div
        ref={mapRef}
        style={{ height: "400px", width: "100%" }}
        className="border rounded-lg"
      />
    </div>
  );
};

export default ArcGISMapTest;
