# 🧪 Test Scripts Documentation

This directory contains comprehensive test scripts for the Blood Donor Management System, covering email services, queue systems, and geolocation features.

## 📋 Available Test Scripts

### Core System Tests

#### 1. `test-bullmq.js` - Queue System Testing

Tests the BullMQ job processing system with Redis.

```bash
node test-bullmq.js
```

**Tests:**

- Queue connection and configuration
- Job creation and processing
- Worker functionality
- Bull Board dashboard integration

#### 2. `test-email-system.js` - Complete Email System Test

Comprehensive testing of the entire email infrastructure.

```bash
node test-email-system.js [--provider sendgrid|gmail] [--send-real-emails]
```

**Tests:**

- SendGrid and Gmail SMTP configurations
- All email templates (welcome, verification, alerts, etc.)
- Queue integration
- Error handling and retries

#### 3. `test-queue.js` - Queue Infrastructure Test

Tests the queue system setup and job processing.

```bash
node test-queue.js
```

**Tests:**

- Redis connection
- Queue creation and management
- Job scheduling and execution
- Dashboard monitoring

### Email-Specific Tests

#### 4. `test-welcome-email.js` - Welcome Email Test

Tests welcome email functionality for new users.

```bash
node test-welcome-email.js
```

#### 5. `test-oauth-emails.js` - OAuth Email Test

Tests email notifications for OAuth login events.

```bash
node test-oauth-emails.js
```

#### 6. `quick-email-test.js` - Quick Email Verification

Fast test to verify basic email sending capability.

```bash
node quick-email-test.js
```

### NEW: Geolocation Tests

#### 7. `test-geolocation.js` - Complete Geolocation System Test ⭐ **NEW**

Comprehensive testing of geolocation, mapping, and ArcGIS integration.

```bash
node test-geolocation.js [--cleanup]
```

**Tests:**

- **Geolocation Service:**

  - Address geocoding (ArcGIS + OpenStreetMap fallback)
  - Reverse geocoding
  - Route calculation and directions
  - Nearby places search (hospitals, clinics)
  - Optimal meeting point calculation

- **Matching Service:**

  - Compatible donor finding with geospatial queries
  - Nearby blood request search
  - Real-time location updates
  - Smart matching algorithms with distance/urgency scoring

- **Database Geospatial Queries:**

  - MongoDB `$near` queries
  - `$geoNear` aggregation with calculated distances
  - `$geoWithin` circular area searches
  - 2dsphere index verification

- **Test Data Generation:**
  - Creates realistic test donors and hospitals across multiple cities
  - Generates blood requests with various urgency levels
  - Implements proper geospatial coordinates and addresses

**Options:**

- `--cleanup`: Remove test data after completion

## 🚀 How to Run Tests

### From Server Directory:

```bash
# Run individual tests
node tests/test-welcome-email.js
node tests/test-oauth-emails.js
node tests/test-email-system.js
node tests/test-bullmq.js
node tests/quick-email-test.js
node tests/test-queue.js

# Run email system test with your email
node tests/test-email-system.js your-email@example.com

# Run comprehensive BullMQ test
node tests/test-bullmq.js
```

### Prerequisites:

1. **Server must be running**: `npm run dev`
2. **Redis must be running**: Check Docker or local Redis
3. **MongoDB must be connected**: Check connection in server logs
4. **Email service configured**: SendGrid API key or Gmail SMTP in `.env`

## 📧 Email Tests

- Send real emails if email service is configured
- Queue jobs through BullMQ for processing
- Test various email templates (welcome, urgent alerts, verification, etc.)
- Verify email delivery through SendGrid or Gmail SMTP

## 🔍 Queue Tests

- Test job creation and processing
- Verify worker functionality
- Test queue priorities and concurrency
- Monitor through Bull Board dashboard: `http://localhost:5000/admin/queues`

## 🐛 Debugging

- Check server console logs for detailed processing information
- Use Bull Board dashboard to monitor queue status
- Verify email delivery in your inbox
- Check Redis connection if jobs aren't processing

## 📊 Expected Output

Tests will show:

- ✅ Successful operations
- ❌ Failed operations with error details
- 📧 Email sending confirmations
- 🎯 Queue job status updates
- 💡 Helpful tips and dashboard links

All tests are designed to be safe and non-destructive for your development environment.
