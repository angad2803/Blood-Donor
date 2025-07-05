// Health check endpoint for Docker
const http = require("http");

const options = {
  hostname: "localhost",
  port: process.env.PORT || 5000,
  path: "/api/health",
  method: "GET",
  timeout: 2000,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on("timeout", () => {
  console.log("Health check timeout");
  process.exit(1);
});

req.on("error", (err) => {
  console.log("Health check error:", err);
  process.exit(1);
});

req.end();
