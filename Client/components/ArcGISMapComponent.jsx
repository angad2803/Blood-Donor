import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import Locate from "@arcgis/core/widgets/Locate";
import Search from "@arcgis/core/widgets/Search";
import Directions from "@arcgis/core/widgets/Directions";
import esriConfig from "@arcgis/core/config.js";
import { toast } from "react-toastify";

const ArcGISMapComponent = ({
  bloodRequests = [],
  onRequestSelect,
  onOfferSend,
  onGetDirections, // New prop for external direction requests
  showUserLocation = true,
  height = "500px",
}) => {
  const mapRef = useRef();
  const [mapView, setMapView] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [directionsWidget, setDirectionsWidget] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [routeGraphics, setRouteGraphics] = useState([]);

  // Initialize ArcGIS Map
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setLoading(true);

        // Set API key
        const apiKey = import.meta.env.VITE_ARCGIS_API_KEY;
        if (!apiKey) {
          throw new Error("ArcGIS API key not found");
        }
        esriConfig.apiKey = apiKey;

        // Create map
        const map = new Map({
          basemap: "streets-navigation-vector", // Good for blood donation routing
        });

        // Create map view
        const view = new MapView({
          container: mapRef.current,
          map: map,
          center: [
            parseFloat(import.meta.env.VITE_DEFAULT_CENTER_LNG) || 77.209,
            parseFloat(import.meta.env.VITE_DEFAULT_CENTER_LAT) || 28.6139,
          ],
          zoom: parseInt(import.meta.env.VITE_DEFAULT_ZOOM) || 10,
          padding: { top: 50 },
        });

        // Add locate widget (GPS button)
        const locateWidget = new Locate({
          view: view,
          useHeadingEnabled: false,
          goToOverride: (view, options) => {
            options.target.scale = 1500;
            return view.goTo(options.target);
          },
        });

        // Add search widget
        const searchWidget = new Search({
          view: view,
          placeholder: "Search for hospitals, areas...",
        });

        // Add directions widget
        const directionsWidget = new Directions({
          view: view,
          routeServiceUrl:
            "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",
        });

        // Add widgets to UI
        view.ui.add(locateWidget, "top-left");
        view.ui.add(searchWidget, "top-right");

        // Store directions widget for later use
        setDirectionsWidget(directionsWidget);

        // Wait for view to load
        await view.when();
        setMapView(view);
        setLoading(false);

        console.log("✅ ArcGIS Map initialized successfully");

        // Listen for locate widget events
        locateWidget.on("locate", (event) => {
          const coords = {
            latitude: event.position.coords.latitude,
            longitude: event.position.coords.longitude,
            accuracy: event.position.coords.accuracy,
          };
          setUserLocation(coords);
          console.log("📍 User location found:", coords);
        });
      } catch (err) {
        console.error("❌ Failed to initialize ArcGIS map:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (mapRef.current) {
      initializeMap();
    }

    // Cleanup
    return () => {
      if (mapView) {
        mapView.destroy();
      }
    };
  }, []);

  // Add blood request markers when they change
  useEffect(() => {
    if (!mapView || !bloodRequests.length) return;

    // Clear existing graphics
    mapView.graphics.removeAll();

    // Add blood request markers
    bloodRequests.forEach((request, index) => {
      if (request.coordinates?.coordinates) {
        const [longitude, latitude] = request.coordinates.coordinates;

        // Create custom blood drop marker
        const bloodSymbol = new PictureMarkerSymbol({
          url:
            "data:image/svg+xml;base64," +
            btoa(`
            <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" 
                    fill="${
                      request.urgency === "emergency" ? "#dc2626" : "#ef4444"
                    }"/>
              <circle cx="15" cy="15" r="8" fill="white"/>
              <text x="15" y="19" text-anchor="middle" fill="${
                request.urgency === "emergency" ? "#dc2626" : "#ef4444"
              }" 
                    font-size="7" font-weight="bold">${
                      request.bloodGroup
                    }</text>
            </svg>
          `),
          width: 30,
          height: 40,
        });

        // Create point
        const point = new Point({
          longitude: longitude,
          latitude: latitude,
        });

        // Create graphic
        const graphic = new Graphic({
          geometry: point,
          symbol: bloodSymbol,
          attributes: {
            requestId: request._id,
            patientName: request.patientName || "Patient",
            bloodGroup: request.bloodGroup,
            hospitalName: request.hospitalName || "Hospital",
            urgency: request.urgency,
            contact: request.contactNumber,
            neededBy: request.neededBy
              ? new Date(request.neededBy).toLocaleDateString()
              : "ASAP",
          },
          popupTemplate: {
            title: "🩸 {bloodGroup} Blood Needed",
            content: `
              <div style="padding: 12px; font-family: Arial, sans-serif;">
                <div style="margin-bottom: 10px;">
                  <strong style="color: #dc2626;">Patient:</strong> {patientName}<br/>
                  <strong style="color: #dc2626;">Hospital:</strong> {hospitalName}<br/>
                  <strong style="color: #dc2626;">Urgency:</strong> 
                  <span style="color: ${
                    request.urgency === "emergency" ? "#dc2626" : "#f59e0b"
                  }; font-weight: bold;">
                    {urgency}
                  </span><br/>
                  <strong style="color: #dc2626;">Needed By:</strong> {neededBy}<br/>
                  <strong style="color: #dc2626;">Contact:</strong> {contact}
                </div>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                  <button 
                    onclick="window.handleSendOffer('${request._id}')" 
                    style="background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                    💌 Send Offer
                  </button>
                  <button 
                    onclick="window.handleGetDirections(${longitude}, ${latitude}, '${
              request.hospitalName || "Hospital"
            }')" 
                    style="background: #16a34a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                    🧭 Directions
                  </button>
                </div>
              </div>
            `,
          },
        });

        mapView.graphics.add(graphic);
      }
    });

    console.log(
      `✅ Added ${bloodRequests.length} blood request markers to ArcGIS map`
    );
  }, [mapView, bloodRequests]);

  // Add user location marker
  useEffect(() => {
    if (!mapView || !userLocation || !showUserLocation) return;

    // Create user location marker
    const userSymbol = new SimpleMarkerSymbol({
      color: [0, 122, 255, 0.8], // iOS blue
      outline: {
        color: [255, 255, 255],
        width: 3,
      },
      size: 14,
    });

    const userPoint = new Point({
      longitude: userLocation.longitude,
      latitude: userLocation.latitude,
    });

    const userGraphic = new Graphic({
      geometry: userPoint,
      symbol: userSymbol,
      attributes: {
        title: "Your Location",
        accuracy: userLocation.accuracy,
      },
      popupTemplate: {
        title: "📍 Your Current Location",
        content: `
          <div style="padding: 10px;">
            <p><strong>Accuracy:</strong> ±${Math.round(
              userLocation.accuracy
            )} meters</p>
            <p><strong>Coordinates:</strong> ${userLocation.latitude.toFixed(
              6
            )}, ${userLocation.longitude.toFixed(6)}</p>
          </div>
        `,
      },
    });

    mapView.graphics.add(userGraphic);
  }, [mapView, userLocation, showUserLocation]);

  // Function to show embedded directions
  const showEmbeddedDirections = async (toLng, toLat, hospitalName) => {
    if (!mapView || !directionsWidget) {
      toast.error("Map not ready for directions");
      return;
    }

    if (!userLocation) {
      toast.error("Please allow location access to get directions");
      return;
    }

    try {
      // Clear existing route graphics
      routeGraphics.forEach((graphic) => mapView.graphics.remove(graphic));
      setRouteGraphics([]);

      // Add directions widget to map if not already added
      if (!showDirections) {
        mapView.ui.add(directionsWidget, "top-right");
        setShowDirections(true);
      }

      // Set start and end points
      const startPoint = new Point({
        longitude: userLocation.longitude,
        latitude: userLocation.latitude,
      });

      const endPoint = new Point({
        longitude: toLng,
        latitude: toLat,
      });

      // Clear existing stops and add new ones
      directionsWidget.viewModel.stops.removeAll();

      // Add start location
      directionsWidget.viewModel.stops.add({
        geometry: startPoint,
        name: "Your Location",
      });

      // Add destination
      directionsWidget.viewModel.stops.add({
        geometry: endPoint,
        name: hospitalName || "Destination",
      });

      // Get directions
      const routeResult = await directionsWidget.viewModel.solve();

      if (routeResult && routeResult.routeResults.length > 0) {
        const route = routeResult.routeResults[0].route;

        // Create route graphic
        const routeGraphic = new Graphic({
          geometry: route.geometry,
          symbol: new SimpleLineSymbol({
            color: [0, 122, 255, 0.8],
            width: 4,
            style: "solid",
          }),
        });

        mapView.graphics.add(routeGraphic);
        setRouteGraphics([routeGraphic]);

        // Zoom to route extent
        await mapView.goTo(route.geometry.extent.expand(1.3));

        toast.success(
          `Route calculated! Distance: ${(
            route.attributes.Total_Length / 1000
          ).toFixed(1)} km`
        );
      }
    } catch (error) {
      console.error("Embedded routing error:", error);
      toast.error("Could not calculate route. Opening external maps...");

      // Fallback to external maps
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const url = isIOS
        ? `http://maps.apple.com/?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${toLat},${toLng}`
        : `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${toLat},${toLng}`;

      window.open(url, "_blank");
    }
  };

  // Function to clear directions
  const clearDirections = () => {
    if (mapView && directionsWidget && showDirections) {
      mapView.ui.remove(directionsWidget);
      setShowDirections(false);

      // Clear route graphics
      routeGraphics.forEach((graphic) => mapView.graphics.remove(graphic));
      setRouteGraphics([]);

      // Clear stops
      directionsWidget.viewModel.stops.removeAll();
    }
  };

  // Expose functions to parent component
  useEffect(() => {
    if (onGetDirections) {
      onGetDirections.current = showEmbeddedDirections;
    }
  }, [onGetDirections, showEmbeddedDirections]);

  // Global functions for popup buttons
  useEffect(() => {
    window.handleSendOffer = (requestId) => {
      console.log("📧 Send offer clicked for request:", requestId);
      if (onOfferSend) {
        onOfferSend(requestId);
      }
    };

    window.handleGetDirections = async (lng, lat, hospitalName) => {
      console.log("🧭 Embedded directions requested for:", hospitalName);
      await showEmbeddedDirections(lng, lat, hospitalName);
    };

    // Cleanup
    return () => {
      delete window.handleSendOffer;
      delete window.handleGetDirections;
    };
  }, [onOfferSend, userLocation]);

  if (loading) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-gray-100 border rounded-lg"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading ArcGIS Map...</p>
          <p className="text-gray-500 text-sm">
            Preparing blood request locations
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-red-50 border border-red-200 rounded-lg"
      >
        <div className="text-center text-red-700">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="font-bold text-lg mb-2">Map Loading Failed</h3>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="arcgis-map-container">
      <div
        ref={mapRef}
        style={{ height, width: "100%" }}
        className="border rounded-lg shadow-lg"
      />

      {/* Map Legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-800">🗺️ Map Legend:</h4>
          {showDirections && (
            <button
              onClick={clearDirections}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
            >
              ❌ Clear Route
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span>Emergency Requests</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span>Regular Requests</span>
          </div>
        </div>
        <p className="text-gray-600 mt-2 text-xs">
          📍 Click markers for details • 🧭 Use locate button for your position
          • 🔍 Search for places
          {showDirections && " • 🛣️ Route displayed on map"}
        </p>
      </div>
    </div>
  );
};

export default ArcGISMapComponent;
