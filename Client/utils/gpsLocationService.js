// Utility for capturing and managing GPS location
class GPSLocationService {
  constructor() {
    this.currentPosition = null;
    this.watchId = null;
    this.locationCallbacks = [];
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

  // Reverse geocode coordinates to address
  async reverseGeocode(latitude, longitude) {
    try {
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
