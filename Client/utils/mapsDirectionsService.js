// Maps and Directions Service
class MapsDirectionsService {
  constructor() {
    this.apiKey = null; // Will be set if Google Maps API is available
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.degreeToRadian(lat2 - lat1);
    const dLon = this.degreeToRadian(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreeToRadian(lat1)) *
        Math.cos(this.degreeToRadian(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  degreeToRadian(deg) {
    return deg * (Math.PI / 180);
  }

  // Determine travel mode based on distance
  getTravelMode(distanceKm) {
    if (distanceKm <= 1) {
      return {
        mode: "walking",
        icon: "🚶‍♂️",
        description: "Walking distance",
        estimatedTime: Math.ceil(distanceKm * 15), // 15 min per km walking
      };
    } else if (distanceKm <= 5) {
      return {
        mode: "bicycle",
        icon: "🚲",
        description: "Cycling distance",
        estimatedTime: Math.ceil(distanceKm * 4), // 4 min per km cycling
      };
    } else if (distanceKm <= 20) {
      return {
        mode: "car",
        icon: "🚗",
        description: "Short drive",
        estimatedTime: Math.ceil(distanceKm * 2), // 2 min per km driving in city
      };
    } else {
      return {
        mode: "car",
        icon: "🚗",
        description: "Long drive",
        estimatedTime: Math.ceil(distanceKm * 1.5), // 1.5 min per km highway driving
      };
    }
  }

  // Get directions info between two points
  getDirectionsInfo(fromLat, fromLon, toLat, toLon) {
    const distance = this.calculateDistance(fromLat, fromLon, toLat, toLon);
    const travelInfo = this.getTravelMode(distance);

    return {
      distance: distance.toFixed(2),
      distanceText:
        distance < 1
          ? `${Math.round(distance * 1000)}m`
          : `${distance.toFixed(1)}km`,
      ...travelInfo,
    };
  }

  // Generate Google Maps URL for directions
  getGoogleMapsUrl(fromLat, fromLon, toLat, toLon, mode = "driving") {
    const baseUrl = "https://www.google.com/maps/dir/";
    return `${baseUrl}${fromLat},${fromLon}/${toLat},${toLon}/@${toLat},${toLon},15z/data=!3m1!4b1!4m2!4m1!3e${this.getModeCode(
      mode
    )}`;
  }

  getModeCode(mode) {
    switch (mode) {
      case "walking":
        return "2";
      case "bicycle":
        return "1";
      case "transit":
        return "3";
      case "car":
      default:
        return "0";
    }
  }

  // Generate Apple Maps URL for iOS devices
  getAppleMapsUrl(fromLat, fromLon, toLat, toLon) {
    return `http://maps.apple.com/?saddr=${fromLat},${fromLon}&daddr=${toLat},${toLon}&dirflg=d`;
  }

  // Get platform-specific maps URL
  getMapsUrl(fromLat, fromLon, toLat, toLon, mode = "driving") {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      return this.getAppleMapsUrl(fromLat, fromLon, toLat, toLon);
    } else {
      return this.getGoogleMapsUrl(fromLat, fromLon, toLat, toLon, mode);
    }
  }

  // Open directions in maps app
  openDirections(fromLat, fromLon, toLat, toLon, mode = "driving") {
    const url = this.getMapsUrl(fromLat, fromLon, toLat, toLon, mode);
    window.open(url, "_blank");
  }

  // Format location coordinates for display
  formatCoordinates(lat, lon) {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }

  // Check if coordinates are valid
  isValidCoordinates(lat, lon) {
    return (
      typeof lat === "number" &&
      typeof lon === "number" &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180 &&
      lat !== 0 &&
      lon !== 0
    );
  }
}

const mapsDirectionsService = new MapsDirectionsService();
export default mapsDirectionsService;
