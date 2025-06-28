// Test file to verify ArcGIS GPS service imports
import gpsLocationService from "./gpsLocationService.js";

console.log("GPS Location Service loaded successfully:", !!gpsLocationService);
console.log("ArcGIS initialized:", gpsLocationService.arcgisInitialized);

export default gpsLocationService;
