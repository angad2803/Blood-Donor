import React from "react";

const RouteInfo = ({ route, className = "" }) => {
  if (!route) return null;

  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const formatDuration = (duration) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
        🛣️ Route Information
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-blue-700 font-medium">Distance</p>
          <p className="text-blue-900">{formatDistance(route.distance)}</p>
        </div>

        <div>
          <p className="text-blue-700 font-medium">Duration</p>
          <p className="text-blue-900">{formatDuration(route.duration)}</p>
        </div>

        <div>
          <p className="text-blue-700 font-medium">Mode</p>
          <p className="text-blue-900 capitalize">
            {route.travelMode || "driving"}
          </p>
        </div>
      </div>

      {route.directions && route.directions.length > 0 && (
        <div className="mt-4">
          <p className="text-blue-700 font-medium text-sm mb-2">Directions:</p>
          <div className="bg-white rounded border max-h-32 overflow-y-auto">
            <ol className="text-xs text-blue-800 p-3 space-y-1">
              {route.directions.slice(0, 5).map((direction, index) => (
                <li key={index} className="flex">
                  <span className="mr-2 text-blue-600">{index + 1}.</span>
                  <span>{direction}</span>
                </li>
              ))}
              {route.directions.length > 5 && (
                <li className="text-blue-600 italic">
                  ... and {route.directions.length - 5} more steps
                </li>
              )}
            </ol>
          </div>
        </div>
      )}

      {route.source && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-blue-600">
            Route provided by:{" "}
            <span className="font-medium capitalize">{route.source}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default RouteInfo;
