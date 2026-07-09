Redis Deployment & Validation Guide

Summary

- Your `Server/.env` already contains a `REDIS_URL` (looks like Upstash). See: [Server/.env](Server/.env#L1-L49).

Quick checklist

- Provider: Upstash (rediss://...)
- Add `REDIS_URL` to Render service env vars
- Redeploy backend on Render
- Validate connectivity with a Node `ioredis` ping

Steps

1. Confirm Upstash settings

- Open https://console.upstash.com and select your Redis database.
- Copy the Redis URI shown (starts with `rediss://` for TLS). Keep it secret.

2. Set `REDIS_URL` on Render

- In Render dashboard → Services → <your-backend-service> → Environment → Environment Variables.
- Add or update key `REDIS_URL` with the full connection string from Upstash.
- Save and trigger a redeploy.

3. Validate connectivity (quick PowerShell test)

- Locally or in a Render shell you can run this one-liner (PowerShell):

```powershell
$env:REDIS_URL="rediss://default:REDACTED@cuddly-llama-72227.upstash.io:6379"; node -e "import Redis from 'ioredis'; const r=new Redis(process.env.REDIS_URL); r.ping().then(console.log).catch((e)=>{console.error('Ping error', e)}).finally(()=>r.disconnect());"
```

- Replace the `REDIS_URL` value with the one from Upstash if testing locally. Expected output: `PONG`.

4. Validate from your running app

- After redeploy, check Render service logs for messages from BullMQ / Redis connection. Look for successful connection messages or `PONG` from the test script.
- Trigger a background job (e.g., send a test email or enqueue a small job) and verify it completes.

Optional: Add a scripted test file

- Create `Server/scripts/test-redis.js` (example contents):

```js
import Redis from "ioredis";
const url = process.env.REDIS_URL;
if (!url) {
  console.error("REDIS_URL not set");
  process.exit(1);
}
const r = new Redis(url);
(async () => {
  try {
    console.log("Pinging Redis...");
    const res = await r.ping();
    console.log("Redis response:", res);
  } catch (err) {
    console.error("Redis ping failed:", err);
    process.exitCode = 2;
  } finally {
    r.disconnect();
  }
})();
```

- Run it with:

```powershell
cd Server
node scripts/test-redis.js
```

Security and production notes

- Keep `REDIS_URL` secret; do not commit to git.
- Upstash uses TLS (`rediss://`) — that's preferred for public PaaS.
- For production scale, consider managed Redis (Render, AWS ElastiCache) with backups and proper networking.

Need help next?

- I can: (A) create `Server/scripts/test-redis.js` for you and run it locally, or (B) update Render env vars in a guided checklist with exact UI fields. Which would you like next?
