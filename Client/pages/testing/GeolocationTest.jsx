import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import LocationManager from "../components/LocationManager";
import MapVisualization from "../components/MapVisualization";

const GeolocationTest = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTest, setActiveTest] = useState("");
  const [testData, setTestData] = useState({
    address: "AIIMS New Delhi, India",
    latitude: 28.5665,
    longitude: 77.209,
    bloodGroup: "O+",
    urgency: "High",
  });

  // Test functions
  const runTest = async (testName, testFunction) => {
    setActiveTest(testName);
    setLoading(true);
    try {
      const result = await testFunction();
      setTestResults((prev) => ({
        ...prev,
        [testName]: { success: true, data: result, timestamp: new Date() },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [testName]: {
          success: false,
          error: error.message,
          timestamp: new Date(),
        },
      }));
    } finally {
      setLoading(false);
      setActiveTest("");
    }
  };

  // Geocoding Test
  const testGeocoding = async () => {
    const response = await api.post("/match/geocode", {
      address: testData.address,
    });
    return response.data;
  };

  // Reverse Geocoding Test
  const testReverseGeocoding = async () => {
    const response = await api.post("/match/reverse-geocode", {
      latitude: testData.latitude,
      longitude: testData.longitude,
    });
    return response.data;
  };

  // Route Calculation Test
  const testRouteCalculation = async () => {
    const response = await api.post("/match/route", {
      startLat: 37.4419,
      startLng: -122.143,
      endLat: 37.7749,
      endLng: -122.4194,
      travelMode: "driving",
    });
    return response.data;
  };

  // Nearby Places Test
  const testNearbyPlaces = async () => {
    const response = await api.get("/match/nearby-places", {
      params: {
        latitude: testData.latitude,
        longitude: testData.longitude,
        category: "hospital",
        radius: 10000,
      },
    });
    return response.data;
  };

  // Location Update Test
  const testLocationUpdate = async () => {
    try {
      const response = await api.post("/user/location", {
        latitude: testData.latitude,
        longitude: testData.longitude,
        accuracy: 50,
      });
      return response.data;
    } catch (error) {
      // Fallback to match endpoint
      const response = await api.post("/match/location", {
        latitude: testData.latitude,
        longitude: testData.longitude,
        accuracy: 50,
      });
      return response.data;
    }
  };

  // Find Nearby Donors Test
  const testFindNearbyDonors = async () => {
    // First create a test blood request (baseURL already includes /api)
    const requestResponse = await api.post("/request/create", {
      bloodGroup: testData.bloodGroup,
      hospital: "Test Hospital",
      urgency: testData.urgency,
      location: "Test Location",
      latitude: testData.latitude,
      longitude: testData.longitude,
    });

    if (requestResponse.data.success) {
      const response = await api.get(
        `/match/donors/${requestResponse.data.data._id}`,
        {
          params: {
            maxDistance: 50000,
            limit: 10,
            includeRoutes: true,
          },
        }
      );
      return response.data;
    }
    throw new Error("Failed to create test blood request");
  };

  // Find Nearby Requests Test
  const testFindNearbyRequests = async () => {
    const response = await api.get("/match/nearby", {
      params: {
        maxDistance: 50000,
        limit: 10,
      },
    });
    return response.data;
  };

  // Test all functions
  const runAllTests = async () => {
    const tests = [
      { name: "geocoding", fn: testGeocoding },
      { name: "reverseGeocoding", fn: testReverseGeocoding },
      { name: "routeCalculation", fn: testRouteCalculation },
      { name: "nearbyPlaces", fn: testNearbyPlaces },
      { name: "locationUpdate", fn: testLocationUpdate },
      { name: "findNearbyRequests", fn: testFindNearbyRequests },
    ];

    for (const test of tests) {
      await runTest(test.name, test.fn);
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const formatResult = (result) => {
    if (!result) return null;

    return (
      <div
        className={`mt-2 p-3 rounded ${
          result.success
            ? "bg-green-50 border border-green-200"
            : "bg-red-50 border border-red-200"
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <span
            className={`text-sm font-medium ${
              result.success ? "text-green-800" : "text-red-800"
            }`}
          >
            {result.success ? "✅ Success" : "❌ Failed"}
          </span>
          <span className="text-xs text-gray-500">
            {result.timestamp.toLocaleTimeString()}
          </span>
        </div>

        {result.success ? (
          <div className="text-sm text-gray-700">
            <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border overflow-auto max-h-32">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-sm text-red-700">
            <strong>Error:</strong> {result.error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🗺️ Geolocation System Testing
          </h1>
          <p className="mt-2 text-gray-600">
            Interactive testing interface for all geolocation and mapping
            features
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Test Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>

              {/* Test Data Inputs */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Address
                  </label>
                  <input
                    type="text"
                    value={testData.address}
                    onChange={(e) =>
                      setTestData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    placeholder="Enter address to test geocoding"
                  />

                  {/* Indian Address Presets */}
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      🇮🇳 Indian Address Presets:
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        {
                          name: "AIIMS Delhi",
                          address: "AIIMS New Delhi, India",
                          lat: 28.5665,
                          lng: 77.209,
                        },
                        {
                          name: "Apollo Mumbai",
                          address: "Apollo Hospital, Mumbai, India",
                          lat: 19.076,
                          lng: 72.8777,
                        },
                        {
                          name: "Fortis Bangalore",
                          address: "Fortis Hospital, Bangalore, India",
                          lat: 12.9716,
                          lng: 77.5946,
                        },
                        {
                          name: "CMC Vellore",
                          address: "Christian Medical College, Vellore, India",
                          lat: 12.9165,
                          lng: 79.1325,
                        },
                        {
                          name: "PGIMER Chandigarh",
                          address: "PGIMER, Chandigarh, India",
                          lat: 30.7333,
                          lng: 76.7794,
                        },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() =>
                            setTestData((prev) => ({
                              ...prev,
                              address: preset.address,
                              latitude: preset.lat,
                              longitude: preset.lng,
                            }))
                          }
                          className="text-xs px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded border"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={testData.latitude}
                      onChange={(e) =>
                        setTestData((prev) => ({
                          ...prev,
                          latitude: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={testData.longitude}
                      onChange={(e) =>
                        setTestData((prev) => ({
                          ...prev,
                          longitude: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Group
                    </label>
                    <select
                      value={testData.bloodGroup}
                      onChange={(e) =>
                        setTestData((prev) => ({
                          ...prev,
                          bloodGroup: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    >
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urgency
                    </label>
                    <select
                      value={testData.urgency}
                      onChange={(e) =>
                        setTestData((prev) => ({
                          ...prev,
                          urgency: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    >
                      {["Low", "Medium", "High", "Emergency"].map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Individual Test Buttons */}
              <div className="space-y-2 mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Individual Tests
                </h3>

                {[
                  {
                    key: "geocoding",
                    label: "📍 Geocode Address",
                    fn: testGeocoding,
                  },
                  {
                    key: "reverseGeocoding",
                    label: "🔄 Reverse Geocode",
                    fn: testReverseGeocoding,
                  },
                  {
                    key: "routeCalculation",
                    label: "🛣️ Calculate Route",
                    fn: testRouteCalculation,
                  },
                  {
                    key: "nearbyPlaces",
                    label: "🏥 Find Nearby Places",
                    fn: testNearbyPlaces,
                  },
                  {
                    key: "locationUpdate",
                    label: "📲 Update Location",
                    fn: testLocationUpdate,
                  },
                  {
                    key: "findNearbyRequests",
                    label: "🩸 Find Nearby Requests",
                    fn: testFindNearbyRequests,
                  },
                ].map((test) => (
                  <button
                    key={test.key}
                    onClick={() => runTest(test.key, test.fn)}
                    disabled={loading}
                    className={`w-full p-2 text-left rounded text-sm transition-colors ${
                      activeTest === test.key
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                    } disabled:opacity-50`}
                  >
                    {test.label}
                    {activeTest === test.key && (
                      <span className="float-right">⏳</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Run All Tests Button */}
              <button
                onClick={runAllTests}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? "⏳ Running Tests..." : "🚀 Run All Tests"}
              </button>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold mb-3">System Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>User Type:</span>
                  <span className="font-medium">
                    {user?.isDonor
                      ? "👤 Donor"
                      : user?.isHospital
                      ? "🏥 Hospital"
                      : "❓ Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Location Sharing:</span>
                  <span className="font-medium">
                    {user?.locationPreferences?.shareRealTimeLocation
                      ? "✅ Enabled"
                      : "❌ Disabled"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tests Run:</span>
                  <span className="font-medium">
                    {Object.keys(testResults).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Successful:</span>
                  <span className="font-medium text-green-600">
                    {Object.values(testResults).filter((r) => r.success).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="font-medium text-red-600">
                    {
                      Object.values(testResults).filter((r) => !r.success)
                        .length
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>

              {Object.keys(testResults).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🧪</div>
                  <p>No tests run yet. Click a test button to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(testResults).map(([testName, result]) => (
                    <div
                      key={testName}
                      className="border-b border-gray-200 pb-4 last:border-b-0"
                    >
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {testName.charAt(0).toUpperCase() +
                          testName.slice(1).replace(/([A-Z])/g, " $1")}
                      </h3>
                      {formatResult(result)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location Manager Component */}
            <div className="mt-6">
              <LocationManager />
            </div>

            {/* Map Visualization Component */}
            <div className="mt-6">
              <MapVisualization />
            </div>
          </div>
        </div>

        {/* Integration Guide */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🗺️ ArcGIS Integration
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Current Status:</strong> Using OpenStreetMap fallback for
              free geocoding.
            </p>
            <p>
              <strong>To enable ArcGIS:</strong>
            </p>
            <ol className="list-decimal list-inside ml-4 space-y-1">
              <li>
                Get an ArcGIS API key from{" "}
                <a
                  href="https://developers.arcgis.com"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  developers.arcgis.com
                </a>
              </li>
              <li>
                Add{" "}
                <code className="bg-blue-100 px-1 rounded">
                  ARCGIS_API_KEY=your_key_here
                </code>{" "}
                to your <code className="bg-blue-100 px-1 rounded">.env</code>{" "}
                file
              </li>
              <li>
                Set{" "}
                <code className="bg-blue-100 px-1 rounded">
                  ENABLE_ARCGIS_INTEGRATION=true
                </code>
              </li>
              <li>Restart the server and test again</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeolocationTest;
