import React from "react";
import ArcGISMapTest from "../components/ArcGISMapTest";

const ArcGISMapTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🗺️ ArcGIS Map Test Page
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">
              To fix the map display issue:
            </h3>
            <ol className="text-blue-700 space-y-2">
              <li>
                1. Get a free ArcGIS API key from{" "}
                <a
                  href="https://developers.arcgis.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  developers.arcgis.com
                </a>
              </li>
              <li>
                2. Create a{" "}
                <code className="bg-blue-100 px-1 rounded">.env</code> file in
                the Client directory
              </li>
              <li>
                3. Add{" "}
                <code className="bg-blue-100 px-1 rounded">
                  VITE_ARCGIS_API_KEY=your_actual_api_key_here
                </code>
              </li>
              <li>4. Restart the development server</li>
            </ol>
          </div>
        </div>

        <ArcGISMapTest />
      </div>
    </div>
  );
};

export default ArcGISMapTestPage;
