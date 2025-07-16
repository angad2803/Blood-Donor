/**
 * GPS Location Service
 * Provides geolocation functionality using browser's native geolocation API
 */

const gpsLocationService = {
  arcgisInitialized: false,

  /**
   * Check if geolocation is supported by the browser
   * @returns {boolean} True if geolocation is supported
   */
  isSupported() {
    return "geolocation" in navigator;
  },

  /**
   * Capture location automatically with optional purpose and prompt
   * @param {string} purpose - Purpose of location capture (for logging)
   * @param {boolean} showPrompt - Whether to show user prompt (not used in this implementation)
   * @returns {Promise<Object>} Location result object
   */
  // eslint-disable-next-line no-unused-vars
  async captureLocationAutomatically(purpose = "general", showPrompt = false) {
    return new Promise((resolve) => {
      if (!this.isSupported()) {
        resolve({
          success: false,
          error: "Geolocation not supported",
          coordinates: null,
          address: null,
          city: null,
          region: null,
        });
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Try to get address from reverse geocoding
            const address = await this.reverseGeocode(latitude, longitude);

            resolve({
              success: true,
              coordinates: [longitude, latitude],
              latitude,
              longitude,
              address: address.display_name || null,
              city: address.city || address.town || address.village || null,
              region: address.state || address.province || null,
              country: address.country || null,
              accuracy: position.coords.accuracy,
            });
          } catch {
            // If reverse geocoding fails, still return coordinates
            resolve({
              success: true,
              coordinates: [longitude, latitude],
              latitude,
              longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              city: null,
              region: null,
              country: null,
              accuracy: position.coords.accuracy,
            });
          }
        },
        (error) => {
          let errorMessage = "Location capture failed";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }

          resolve({
            success: false,
            error: errorMessage,
            coordinates: null,
            address: null,
            city: null,
            region: null,
          });
        },
        options
      );
    });
  },

  /**
   * Reverse geocode coordinates to get address information
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<Object>} Address information
   */
  async reverseGeocode(latitude, longitude) {
    try {
      // Using OpenStreetMap Nominatim for reverse geocoding (free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.address
        ? data
        : { display_name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };
    } catch (error) {
      console.warn("Reverse geocoding failed:", error);
      return {
        display_name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      };
    }
  },

  /**
   * Store location data (placeholder for compatibility)
   * @param {Object} locationData - Location data to store
   */
  storeLocation(locationData) {
    console.log("Storing location data:", locationData);
    // This could be enhanced to store in localStorage or send to server
  },
};

export { gpsLocationService };
export default gpsLocationService;
