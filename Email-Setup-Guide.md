# 📧 Email Configuration Guide

This guide will help you set up real email sending for your Blood Donor Management System using either SendGrid or Gmail SMTP.

## 🚀 Quick Setup

### Option 1: SendGrid (Recommended for Production)

1. **Create a SendGrid Account**

   - Go to [sendgrid.com](https://sendgrid.com)
   - Sign up for a free account (100 emails/day free tier)

2. **Get Your API Key**

   - Log in to SendGrid dashboard
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Choose "Restricted Access" and give these permissions:
     - Mail Send: Full Access
     - Template Engine: Read Access (if using templates)
   - Copy the generated API key

3. **Update Your .env File**

   ```env
   SENDGRID_API_KEY=SG.your_actual_api_key_here
   FROM_EMAIL=noreply@yourdomain.com
   SUPPORT_EMAIL=support@yourdomain.com
   ```

4. **Verify Sender Identity** (Important!)
   - Go to Settings → Sender Authentication
   - Add and verify your sender email address
   - This prevents emails from going to spam

### Option 2: Gmail SMTP (Good for Testing)

1. **Enable 2-Factor Authentication**

   - Go to your Google Account settings
   - Security → 2-Step Verification → Turn On

2. **Generate App Password**

   - Go to Security → App passwords
   - Select app: "Mail"
   - Select device: "Other" (enter "Blood Donor App")
   - Copy the 16-character password

3. **Update Your .env File**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASS=your_16_character_app_password
   FROM_EMAIL=your.email@gmail.com
   SUPPORT_EMAIL=your.email@gmail.com
   ```

## 🧪 Testing Your Configuration

### 1. Using the Test Script

```bash
# Navigate to server directory
cd Server

# Run comprehensive email tests
node test-email-system.js your-test-email@example.com

# Test with multiple recipients for bulk testing
node test-email-system.js your-email@example.com friend@example.com
```

### 2. Using the Web Dashboard

1. Start your server: `npm run dev`
2. Navigate to the Email Testing Dashboard in your app
3. Enter your email address
4. Test different email types:
   - Basic test email
   - Welcome email template
   - Urgent blood request alert
   - Email verification

### 3. Using the API Directly

```bash
# Test basic email
curl -X POST http://localhost:5000/api/email/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"email": "test@example.com"}'

# Check email configuration
curl -X GET http://localhost:5000/api/email/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Using BullMQ Test Script

```bash
# Edit the email addresses in test-bullmq.js first
node test-bullmq.js

# Then check the Bull Board dashboard
# http://localhost:5000/admin/queues
```

## 📊 Monitoring Email Delivery

### Bull Board Dashboard

- Visit: `http://localhost:5000/admin/queues`
- Monitor email queue status
- View failed jobs and retry them
- See processing times and success rates

### Console Logs

The system provides detailed logging:

```
📧 Email sent via SendGrid to user@example.com: Welcome to Blood Donor Network
✅ Email job 123 completed
❌ Email job 124 failed: Invalid email address
```

### Email Analytics

The system logs email analytics for monitoring:

- Email type (welcome, urgent, verification, etc.)
- Success/failure rates
- Provider used (SendGrid/Gmail)
- Error details for failures

## 🎯 Real-World Usage

### Automatic Emails Triggered by:

1. **New User Registration**

   - Welcome email for donors
   - Email verification link

2. **Blood Request Creation**

   - Confirmation email to requester
   - Urgent alerts to matching donors

3. **Donor Responses**

   - Notification to blood requester
   - Confirmation to donor

4. **Periodic Reminders**
   - Donation eligibility reminders
   - Inactive user re-engagement

### Queue Priorities:

- **High Priority**: Urgent blood alerts, email verification
- **Normal Priority**: Welcome emails, donation confirmations
- **Low Priority**: Newsletters, non-critical reminders

## 🔧 Troubleshooting

### Common Issues:

1. **"Authentication failed" with Gmail**

   - Ensure 2FA is enabled
   - Use App Password, not regular password
   - Check if "Less secure app access" is disabled (it should be)

2. **SendGrid emails going to spam**

   - Verify sender identity in SendGrid dashboard
   - Add SPF/DKIM records to your domain DNS
   - Start with low volume and gradually increase

3. **"No email service configured" message**

   - Check your .env file has the correct variables
   - Restart your server after changing .env
   - Verify variable names match exactly

4. **Emails not sending but no errors**
   - Check Bull Board dashboard for failed jobs
   - Look at server console for error messages
   - Verify email addresses are valid format

### Debug Commands:

```bash
# Check email configuration
node -e "
import { validateEmailConfig } from './utils/emailService.js';
console.log(validateEmailConfig());
"

# Test email service directly
node -e "
import { sendTestEmail } from './utils/emailService.js';
sendTestEmail('your@email.com').then(console.log).catch(console.error);
"
```

## 🚀 Production Recommendations

### For Production Use:

1. **Use SendGrid or Similar Service**

   - More reliable than SMTP
   - Better deliverability
   - Built-in analytics
   - Higher sending limits

2. **Domain Configuration**

   - Use your own domain for sender email
   - Set up proper DNS records (SPF, DKIM, DMARC)
   - Verify domain ownership with email provider

3. **Email Templates**

   - Customize email templates with your branding
   - Use responsive HTML designs
   - Include unsubscribe links for bulk emails

4. **Monitoring and Alerts**

   - Set up alerts for failed email jobs
   - Monitor bounce rates and spam complaints
   - Implement email analytics dashboard

5. **Rate Limiting**
   - Configure appropriate sending limits
   - Use queue priorities effectively
   - Implement retry logic with exponential backoff

### Security Considerations:

- Never commit real API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor for suspicious email activity
- Implement email verification to prevent spam

## 📞 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review server console logs
3. Test with the provided testing tools
4. Verify your email service configuration
5. Check the Bull Board dashboard for queue issues

Remember: Start with a test email address and gradually move to production emails once everything is working correctly!
