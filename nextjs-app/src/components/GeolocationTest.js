// GeolocationTest.js
"use client";

import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const GeolocationTest = () => {
  const { user } = useContext(AuthContext);
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

  // Browser Geolocation Test
  const testBrowserGeolocation = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });
  };

  // Location Update Test
  const testLocationUpdate = async () => {
    const response = await fetch("/api/user/location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        latitude: testData.latitude,
        longitude: testData.longitude,
        accuracy: 50,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update location");
    }

    return await response.json();
  };

  // Find Nearby Requests Test
  const testFindNearbyRequests = async () => {
    const response = await fetch("/api/match/nearby");

    if (!response.ok) {
      throw new Error("Failed to fetch nearby requests");
    }

    return await response.json();
  };

  // Matched Requests Test
  const testMatchedRequests = async () => {
    const response = await fetch("/api/requests/match");

    if (!response.ok) {
      throw new Error("Failed to fetch matched requests");
    }

    return await response.json();
  };

  // Test all functions
  const runAllTests = async () => {
    const tests = [
      { name: "browserGeolocation", fn: testBrowserGeolocation },
      { name: "locationUpdate", fn: testLocationUpdate },
      { name: "findNearbyRequests", fn: testFindNearbyRequests },
      { name: "matchedRequests", fn: testMatchedRequests },
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

  const testConfig = [
    {
      name: "browserGeolocation",
      title: "Browser Geolocation",
      description: "Test HTML5 geolocation API to get current position",
    },
    {
      name: "locationUpdate",
      title: "Location Update",
      description: "Test updating user location in database",
    },
    {
      name: "findNearbyRequests",
      title: "Find Nearby Requests",
      description: "Test finding blood requests near user location",
    },
    {
      name: "matchedRequests",
      title: "Matched Requests",
      description: "Test blood type compatibility matching",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Geolocation & Matching Test Suite
          </h1>
          <p className="text-gray-600">
            Test GPS functionality and blood request matching algorithms
          </p>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              👤 Test User Info
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <div className="font-medium">{user.name || "N/A"}</div>
              </div>
              <div>
                <span className="text-gray-600">Blood Group:</span>
                <div className="font-medium">{user.bloodGroup || "N/A"}</div>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <div className="font-medium">{user.location || "N/A"}</div>
              </div>
              <div>
                <span className="text-gray-600">Donor:</span>
                <div className="font-medium">{user.isDonor ? "Yes" : "No"}</div>
              </div>
            </div>
          </div>
        )}

        {/* Test Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            ⚙️ Test Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Address
              </label>
              <input
                type="text"
                value={testData.address}
                onChange={(e) =>
                  setTestData({ ...testData, address: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Group
              </label>
              <select
                value={testData.bloodGroup}
                onChange={(e) =>
                  setTestData({ ...testData, bloodGroup: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(
                  (bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={testData.latitude}
                onChange={(e) =>
                  setTestData({
                    ...testData,
                    latitude: parseFloat(e.target.value),
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={testData.longitude}
                onChange={(e) =>
                  setTestData({
                    ...testData,
                    longitude: parseFloat(e.target.value),
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Global Test Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runAllTests}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Running Tests..." : "🚀 Run All Tests"}
            </button>
            <button
              onClick={() => setTestResults({})}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              🗑️ Clear Results
            </button>
          </div>
        </div>

        {/* Individual Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testConfig.map((test) => (
            <div key={test.name} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-800 mb-2">{test.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{test.description}</p>

              <button
                onClick={() =>
                  runTest(
                    test.name,
                    eval(
                      `test${test.name.charAt(0).toUpperCase() + test.name.slice(1)}`
                    )
                  )
                }
                disabled={loading && activeTest === test.name}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                {loading && activeTest === test.name ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Testing...
                  </span>
                ) : (
                  `🧪 Test ${test.title}`
                )}
              </button>

              {formatResult(testResults[test.name])}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeolocationTest;
