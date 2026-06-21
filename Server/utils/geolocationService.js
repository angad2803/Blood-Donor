import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

class GeolocationService {
  constructor() {
    this.arcgisApiKey = process.env.ARCGIS_API_KEY;
    this.geocodeUrl =
      "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";
    this.routeUrl =
      "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
    this.nearbyUrl =
      "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";


    this.openStreetMapUrl = "https://nominatim.openstreetmap.org";
  }


  async geocodeAddress(address) {
    try {
      if (!this.arcgisApiKey) {
        return await this.geocodeWithOpenStreetMap(address);
      }


      const enhancedAddress = this.enhanceIndianAddress(address);

      const response = await axios.get(
        `${this.geocodeUrl}/findAddressCandidates`,
        {
          params: {
            f: "json",
            singleLine: enhancedAddress,
            outFields: "Addr_type,Type,Score,Match_addr,DisplayX,DisplayY",
            countryCode: "IND",
            category: "",
            maxLocations: 5,
            token: this.arcgisApiKey,
          },
        }
      );

      if (response.data.candidates && response.data.candidates.length > 0) {
        const candidate = response.data.candidates[0];
        return {
          latitude: candidate.location.y,
          longitude: candidate.location.x,
          formattedAddress: candidate.address,
          accuracy: candidate.score,
          source: "arcgis",
          country: "India",
        };
      }

      throw new Error("No geocoding results found");
    } catch (error) {
      console.error("Geocoding error:", error);

      return await this.geocodeWithOpenStreetMap(address);
    }
  }


  async reverseGeocode(latitude, longitude) {
    try {
      if (!this.arcgisApiKey) {
        return await this.reverseGeocodeWithOpenStreetMap(latitude, longitude);
      }

      const response = await axios.get(`${this.geocodeUrl}/reverseGeocode`, {
        params: {
          f: "json",
          location: `${longitude},${latitude}`,
          distance: 100,
          outSR: 4326,
          token: this.arcgisApiKey,
        },
      });

      if (response.data.address) {
        const addr = response.data.address;
        return {
          street: `${addr.Address || ""} ${addr.Subaddress || ""}`.trim(),
          city: addr.City || "",
          state: addr.Region || "",
          country: addr.CountryCode || "",
          zipCode: addr.Postal || "",
          formattedAddress: addr.LongLabel || addr.ShortLabel || "",
          source: "arcgis",
        };
      }

      throw new Error("No reverse geocoding results found");
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return await this.reverseGeocodeWithOpenStreetMap(latitude, longitude);
    }
  }


  async calculateRoute(
    startLat,
    startLng,
    endLat,
    endLng,
    travelMode = "driving"
  ) {
    try {
      if (!this.arcgisApiKey) {
        return await this.calculateRouteWithOpenStreetMap(
          startLat,
          startLng,
          endLat,
          endLng
        );
      }

      const stops = `${startLng},${startLat};${endLng},${endLat}`;

      const response = await axios.post(`${this.routeUrl}/solve`, null, {
        params: {
          f: "json",
          stops: stops,
          travelMode: this.getTravelModeCode(travelMode),
          returnDirections: true,
          returnRoutes: true,
          returnStops: false,
          returnBarriers: false,
          token: this.arcgisApiKey,
        },
      });

      if (response.data.routes && response.data.routes.features.length > 0) {
        const route = response.data.routes.features[0];
        const directions = response.data.directions?.[0];

        return {
          distance: route.attributes.Total_Kilometers,
          duration: route.attributes.Total_TravelTime,
          geometry: route.geometry,
          directions: directions?.features?.map((f) => f.attributes.text) || [],
          source: "arcgis",
        };
      }

      throw new Error("No route found");
    } catch (error) {
      console.error("Route calculation error:", error);
      return await this.calculateRouteWithOpenStreetMap(
        startLat,
        startLng,
        endLat,
        endLng
      );
    }
  }


  async findNearbyPlaces(
    latitude,
    longitude,
    category = "hospital",
    radius = 10000
  ) {
    try {
      if (!this.arcgisApiKey) {
        return await this.findNearbyWithOpenStreetMap(
          latitude,
          longitude,
          category
        );
      }

      const response = await axios.get(`${this.nearbyUrl}`, {
        params: {
          f: "json",
          category: this.getCategoryCode(category),
          location: `${longitude},${latitude}`,
          distance: radius,
          maxLocations: 20,
          outFields: "PlaceName,Place_addr,Phone,URL,Type",
          token: this.arcgisApiKey,
        },
      });

      if (response.data.candidates) {
        return response.data.candidates.map((place) => ({
          name: place.attributes.PlaceName,
          address: place.attributes.Place_addr,
          phone: place.attributes.Phone,
          website: place.attributes.URL,
          type: place.attributes.Type,
          latitude: place.location.y,
          longitude: place.location.x,
          distance: this.calculateDistance(
            latitude,
            longitude,
            place.location.y,
            place.location.x
          ),
          source: "arcgis",
        }));
      }

      return [];
    } catch (error) {
      console.error("Nearby places search error:", error);
      return await this.findNearbyWithOpenStreetMap(
        latitude,
        longitude,
        category
      );
    }
  }


  async findOptimalMeetingPoint(donorLat, donorLng, hospitalLat, hospitalLng) {
    try {

      const midLat = (donorLat + hospitalLat) / 2;
      const midLng = (donorLng + hospitalLng) / 2;


      const nearbyPlaces = await this.findNearbyPlaces(
        midLat,
        midLng,
        "medical",
        5000
      );

      if (nearbyPlaces.length > 0) {

        return nearbyPlaces.sort((a, b) => a.distance - b.distance)[0];
      }


      const address = await this.reverseGeocode(midLat, midLng);

      return {
        name: "Suggested Meeting Point",
        address: address.formattedAddress,
        latitude: midLat,
        longitude: midLng,
        type: "midpoint",
        source: "calculated",
      };
    } catch (error) {
      console.error("Optimal meeting point calculation error:", error);
      throw error;
    }
  }


  getTravelModeCode(mode) {
    const modes = {
      driving: "FEgifRtFndKNcJMJ",
      walking: "caFAgoThrvUpgeVc",
      public_transport: "jXe8pnizaUSojZaZ",
    };
    return modes[mode] || modes.driving;
  }

  getCategoryCode(category) {
    const categories = {
      hospital: "Hospital",
      clinic: "Clinic",
      medical: "Health Care",
      pharmacy: "Pharmacy",
    };
    return categories[category] || categories.hospital;
  }




  async geocodeWithOpenStreetMap(address) {
    try {
      const enhancedAddress = this.enhanceIndianAddress(address);
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: enhancedAddress,
            format: "json",
            limit: 1,
            addressdetails: 1,
            countrycodes: "in",
          },
          headers: {
            "User-Agent": "BloodDonorApp/1.0 (contact@blooddonorapp.com)",
          },
        }
      );

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formattedAddress: result.display_name,
          accuracy: parseFloat(result.importance || 0.5),
          source: "openstreetmap",
          country: result.address?.country || "India",
        };
      }

      throw new Error("No OpenStreetMap geocoding results found");
    } catch (error) {
      console.error("OpenStreetMap geocoding error:", error);
      throw error;
    }
  }


  async reverseGeocodeWithOpenStreetMap(latitude, longitude) {
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/reverse",
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: "json",
            addressdetails: 1,
          },
          headers: {
            "User-Agent": "BloodDonorApp/1.0 (contact@blooddonorapp.com)",
          },
        }
      );

      if (response.data && response.data.address) {
        const addr = response.data.address;
        return {
          street: `${addr.house_number || ""} ${addr.road || ""}`.trim(),
          city: addr.city || addr.town || addr.village || "",
          state: addr.state || "",
          country: addr.country || "",
          zipCode: addr.postcode || "",
          formattedAddress: response.data.display_name,
          source: "openstreetmap",
        };
      }

      throw new Error("No OpenStreetMap reverse geocoding results found");
    } catch (error) {
      console.error("OpenStreetMap reverse geocoding error:", error);
      throw error;
    }
  }


  async calculateRouteWithOpenStreetMap(startLat, startLng, endLat, endLng) {
    try {

      const response = await axios.get(
        `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}`,
        {
          params: {
            overview: "false",
            steps: "false",
          },
        }
      );

      if (
        response.data &&
        response.data.routes &&
        response.data.routes.length > 0
      ) {
        const route = response.data.routes[0];
        return {
          distance: route.distance / 1000,
          duration: route.duration / 60,
          geometry: null,
          directions: [],
          source: "osrm",
        };
      }


      const distance = this.calculateDistance(
        startLat,
        startLng,
        endLat,
        endLng
      );
      return {
        distance: distance,
        duration: distance * 2,
        geometry: null,
        directions: [],
        source: "straight-line",
      };
    } catch (error) {
      console.error("OpenStreetMap routing error:", error);

      const distance = this.calculateDistance(
        startLat,
        startLng,
        endLat,
        endLng
      );
      return {
        distance: distance,
        duration: distance * 2,
        geometry: null,
        directions: [],
        source: "straight-line",
      };
    }
  }


  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }


  isValidCoordinates(latitude, longitude) {
    return (
      latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
    );
  }


  formatCoordinates(latitude, longitude, precision = 6) {
    return {
      latitude: parseFloat(latitude.toFixed(precision)),
      longitude: parseFloat(longitude.toFixed(precision)),
    };
  }


  enhanceIndianAddress(address) {

    if (!address.toLowerCase().includes("india")) {
      address += ", India";
    }


    const replacements = {
      rd: "Road",
      st: "Street",
      mkt: "Market",
      sec: "Sector",
      blk: "Block",
      nagar: "Nagar",
      colony: "Colony",
      delhi: "New Delhi",
      mumbai: "Mumbai",
      bangalore: "Bengaluru",
      calcutta: "Kolkata",
    };

    let enhanced = address;
    Object.entries(replacements).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, "gi");
      enhanced = enhanced.replace(regex, full);
    });

    return enhanced;
  }
}

export default new GeolocationService();
