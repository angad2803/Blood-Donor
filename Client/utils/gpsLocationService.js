// Enhanced GPS Location Service with ArcGIS Integration
// Uses dynamic imports to avoid Vite bundling issues

class GPSLocationService {
  constructor() {
    this.currentPosition = null;
    this.watchId = null;
    this.locationCallbacks = [];
    this.arcgisApiKey = null;
    this.arcgisInitialized = false;
    this.esriConfig = null;

    // Initialize ArcGIS with dynamic imports
    this.initializeArcGIS();
  }

  // Initialize ArcGIS with dynamic imports to avoid bundling issues
  async initializeArcGIS() {
    try {
      const apiKey = import.meta.env.VITE_ARCGIS_API_KEY;
      if (apiKey && apiKey.length > 10) {
        // Use dynamic import to avoid Vite pre-bundling issues
        const { default: esriConfig } = await import("@arcgis/core/config.js");
        this.esriConfig = esriConfig;
        esriConfig.apiKey = apiKey;

        this.arcgisApiKey = apiKey;
        this.arcgisInitialized = true;
        console.log("✅ ArcGIS initialized successfully with dynamic imports");
      } else {
        console.warn("⚠️ ArcGIS API key not found, using basic geolocation");
        this.arcgisInitialized = false;
      }
    } catch (error) {
      console.error("❌ Failed to initialize ArcGIS:", error);
      this.arcgisInitialized = false;
      // Fallback to REST API approach
      this.arcgisApiKey = import.meta.env.VITE_ARCGIS_API_KEY;
      if (this.arcgisApiKey) {
        console.log("✅ Using ArcGIS REST API fallback");
      }
    }
  }

  // Check if geolocation is supported
  isSupported() {
    return "geolocation" in navigator;
  }

  // Get current position with high accuracy
  async getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000, // 5 minutes cache
    };

    const finalOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          };
          resolve(this.currentPosition);
        },
        (error) => {
          const errorMessages = {
            [error.PERMISSION_DENIED]:
              "Location access denied. Please enable location permissions in your browser settings to use this feature.",
            [error.POSITION_UNAVAILABLE]:
              "Location information is currently unavailable. Please check your device's location settings.",
            [error.TIMEOUT]:
              "Location request timed out. Please try again or check your internet connection.",
          };
          reject(
            new Error(
              errorMessages[error.code] || "Unknown location error occurred"
            )
          );
        },
        finalOptions
      );
    });
  }

  // Get location with user-friendly prompts
  async requestLocationWithPrompt(purpose = "improve your experience") {
    try {
      // Check if permission is already granted
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        if (permission.state === "denied") {
          throw new Error(
            "Location access was previously denied. Please enable it in your browser settings."
          );
        }
      }

      // Show user-friendly prompt first
      const userConsent = window.confirm(
        `To ${purpose}, we'd like to access your current location. This helps us:\n\n` +
          "• Find nearby blood donation requests\n" +
          "• Show relevant donors in your area\n" +
          "• Provide accurate distance calculations\n\n" +
          "Your location is only used for matching purposes and is not shared with third parties.\n\n" +
          "Click OK to allow location access."
      );

      if (!userConsent) {
        throw new Error("Location access declined by user");
      }

      const position = await this.getCurrentPosition();
      return position;
    } catch (error) {
      console.warn("GPS location request failed:", error.message);
      throw error;
    }
  }

  // Send location to backend
  async updateLocationOnServer(locationData, additionalData = {}) {
    try {
      const api = (await import("../api/api.js")).default;

      const payload = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp,
        ...additionalData,
      };

      const response = await api.post("/user/location", payload);
      return response.data;
    } catch (error) {
      console.error("Failed to update location on server:", error);
      throw error;
    }
  }

  // Automatic location capture with fallback
  async captureLocationAutomatically(purpose, showPrompt = true) {
    try {
      let position;

      if (showPrompt) {
        position = await this.requestLocationWithPrompt(purpose);
      } else {
        position = await this.getCurrentPosition({ timeout: 5000 });
      }

      // Reverse geocode to get address
      const address = await this.reverseGeocode(
        position.latitude,
        position.longitude
      );

      // Update server
      await this.updateLocationOnServer(position, { address });

      return {
        success: true,
        position,
        address,
        message: "Location captured successfully",
      };
    } catch (error) {
      console.warn("Automatic location capture failed:", error.message);
      return {
        success: false,
        error: error.message,
        message: "Could not capture location automatically",
      };
    }
  }
  // Enhanced reverse geocode using ArcGIS (SDK or REST API)
  async reverseGeocode(latitude, longitude) {
    try {
      // Try ArcGIS SDK first if available
      if (this.arcgisInitialized && this.esriConfig) {
        try {
          // Use dynamic import for better compatibility
          const [{ default: locator }, { default: Point }] = await Promise.all([
            import("@arcgis/core/rest/locator.js"),
            import("@arcgis/core/geometry/Point.js"),
          ]);

          const geocodingUrl =
            import.meta.env.VITE_ARCGIS_GEOCODING_URL ||
            "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

          const response = await locator.locationToAddress(geocodingUrl, {
            location: new Point({
              longitude: longitude,
              latitude: latitude,
            }),
          });

          if (response && response.address) {
            const address = response.address;
            // Format for India
            const formattedAddress = [
              address.Address,
              address.Neighborhood,
              address.City,
              address.Region,
              address.CountryCode,
            ]
              .filter(Boolean)
              .join(", ");

            console.log("✅ ArcGIS SDK geocoding successful");
            return formattedAddress || `${latitude}, ${longitude}`;
          }
        } catch (sdkError) {
          console.warn(
            "ArcGIS SDK geocoding failed, trying REST API:",
            sdkError
          );
        }
      }

      // Fallback to REST API
      if (this.arcgisApiKey) {
        const geocodingUrl =
          import.meta.env.VITE_ARCGIS_GEOCODING_URL ||
          "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

        const url = `${geocodingUrl}/reverseGeocode?location=${longitude},${latitude}&f=json&token=${this.arcgisApiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data && data.address) {
          const address = data.address;
          // Format for India
          const formattedAddress = [
            address.Address,
            address.Neighborhood,
            address.City,
            address.Subregion,
            address.Region,
            address.CountryCode,
          ]
            .filter(Boolean)
            .join(", ");

          console.log(
            "✅ ArcGIS reverse geocoding successful:",
            formattedAddress
          );
          return (
            formattedAddress ||
            `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          );
        }
      }

      // Fallback to backend API
      const api = (await import("../api/api.js")).default;
      const response = await api.get(
        `/match/reverse-geocode?lat=${latitude}&lng=${longitude}`
      );
      return (
        response.data.address ||
        `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      );
    } catch (error) {
      console.warn("Reverse geocoding failed:", error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  // Calculate route using ArcGIS (SDK or REST API)
  async calculateRoute(startPoint, endPoint) {
    if (!this.arcgisApiKey) {
      console.warn("ArcGIS not available, cannot calculate route");
      return null;
    }

    try {
      const routeUrl =
        import.meta.env.VITE_ARCGIS_ROUTING_URL ||
        "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"; // Create stops parameter for REST API
      const stops = `${startPoint.longitude},${startPoint.latitude};${endPoint.longitude},${endPoint.latitude}`;

      const url = `${routeUrl}/solve?f=json&token=${this.arcgisApiKey}&stops=${stops}&returnDirections=true`;

      const response = await fetch(url);
      const data = await response.json();

      if (
        data &&
        data.routes &&
        data.routes.features &&
        data.routes.features.length > 0
      ) {
        const route = data.routes.features[0];
        const directions = data.directions && data.directions[0];

        return {
          distance: route.attributes.Total_Length || 0,
          duration: route.attributes.Total_Time || 0,
          directions: directions
            ? directions.features.map((feature) => ({
                text: feature.attributes.text,
                length: feature.attributes.length,
                time: feature.attributes.time,
              }))
            : [],
          geometry: route.geometry,
        };
      }
    } catch (error) {
      console.error("ArcGIS route calculation failed:", error);
    }

    return null;
  }

  // Get distance between two points using ArcGIS or fallback
  async getDistance(point1, point2) {
    try {
      const route = await this.calculateRoute(point1, point2);
      if (route) {
        return {
          distance: `${(route.distance / 1000).toFixed(1)} km`,
          duration: `${Math.round(route.duration)} min`,
          method: "arcgis",
        };
      }
    } catch (error) {
      console.warn(
        "ArcGIS distance calculation failed, using Haversine:",
        error
      );
    }

    // Fallback to Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.latitude * Math.PI) / 180) *
        Math.cos((point2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return {
      distance: `${distance.toFixed(1)} km`,
      duration: `${Math.round(distance * 3)} min`, // Rough estimate: 20 km/h average
      method: "haversine",
    };
  }

  // Watch position changes
  startWatching(callback, options = {}) {
    if (!this.isSupported()) return null;

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 60000, // 1 minute
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };
        callback(this.currentPosition);
      },
      (error) => callback(null, error),
      { ...defaultOptions, ...options }
    );

    return this.watchId;
  }

  // Stop watching position
  stopWatching() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Get stored location from localStorage
  getStoredLocation() {
    try {
      const stored = localStorage.getItem("userLocation");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  // Store location in localStorage
  storeLocation(locationData) {
    try {
      localStorage.setItem("userLocation", JSON.stringify(locationData));
    } catch (error) {
      console.warn("Could not store location locally:", error);
    }
  }
}

// Create and export a singleton instance
const gpsLocationService = new GPSLocationService();
export default gpsLocationService;
