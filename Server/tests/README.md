# 🧪 Test Files

This folder contains all test files for the Blood Donor Management System.

## 📋 Test Files Overview

### Email System Tests

- **`test-email-system.js`** - Comprehensive email system testing with all templates
- **`test-welcome-email.js`** - Tests welcome email functionality specifically
- **`test-oauth-emails.js`** - Tests OAuth-specific email scenarios (new users, account linking)
- **`quick-email-test.js`** - Quick email validation and basic sending test

### Queue System Tests

- **`test-bullmq.js`** - Tests all BullMQ queues (urgent, matching, email, SMS)
- **`test-queue.js`** - Basic queue connection and job processing test

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
