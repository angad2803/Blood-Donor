import dotenv from "dotenv";
dotenv.config();

import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Nodemailer (Gmail fallback)
const gmailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email templates
const emailTemplates = {
  "request-created": (data) => ({
    subject: `Blood Request Created - ${data.bloodGroup} Needed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🩸 Blood Request Created Successfully</h2>
        <p>Dear ${data.requesterName},</p>
        <p>Your blood request has been created and is now live on our platform.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Request Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Blood Group:</strong> ${data.bloodGroup}</li>
            <li><strong>Hospital:</strong> ${data.hospital}</li>
            <li><strong>Urgency:</strong> <span style="color: ${
              data.urgency === "Emergency" ? "#dc2626" : "#059669"
            }">${data.urgency}</span></li>
            <li><strong>Request ID:</strong> ${data.requestId}</li>
          </ul>
        </div>
        
        <p>We're actively matching you with compatible donors in your area. You'll receive notifications when donors respond.</p>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/requests/${data.requestId}" 
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Request
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions, contact us at ${process.env.SUPPORT_EMAIL}
        </p>
      </div>
    `,
  }),

  "donor-offer": (data) => ({
    subject: `New Donor Response - ${data.bloodGroup} Request`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">🎯 New Donor Response!</h2>
        <p>Dear ${data.requesterName},</p>
        <p>Great news! A donor has responded to your blood request.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3>Donor Response:</h3>
          <p><strong>Donor:</strong> ${data.donorName}</p>
          <p><strong>Blood Group Needed:</strong> ${data.bloodGroup}</p>
          <p><strong>Hospital:</strong> ${data.hospital}</p>
          <p><strong>Message:</strong> "${data.message}"</p>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/requests/${data.requestId}" 
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View & Respond
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Please coordinate with the donor as soon as possible.
        </p>
      </div>
    `,
  }),

  "urgent-donor-alert": (data) => ({
    subject: `🚨 URGENT: ${data.bloodGroup} Blood Needed - ${data.urgency}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🚨 URGENT BLOOD NEEDED</h2>
        <p>Dear ${data.donorName},</p>
        <p>An <strong>${data.urgency.toLowerCase()}</strong> blood request has been posted that matches your blood type.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3>Request Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Blood Group Needed:</strong> ${data.bloodGroup}</li>
            <li><strong>Location:</strong> ${data.location}</li>
            <li><strong>Hospital:</strong> ${data.hospital}</li>
            <li><strong>Urgency:</strong> <span style="color: #dc2626">${
              data.urgency
            }</span></li>
            <li><strong>Requested by:</strong> ${data.requesterName}</li>
          </ul>
        </div>
        
        <p><strong>Your immediate response could save a life!</strong></p>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/requests/${data.requestId}" 
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Respond Now
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Time is critical. Please respond as soon as possible.
        </p>
      </div>
    `,
  }),

  "welcome-donor": (data) => ({
    subject: "Welcome to Blood Donor Network - Thank You for Saving Lives!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">🎉 Welcome to Blood Donor Network!</h2>
        <p>Dear ${data.name},</p>
        <p>Thank you for joining our blood donor community! Your willingness to help save lives makes you a hero.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Donor Profile:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Name:</strong> ${data.name}</li>
            <li><strong>Blood Group:</strong> ${data.bloodGroup}</li>
            <li><strong>Location:</strong> ${data.location}</li>
            <li><strong>Status:</strong> Active Donor</li>
          </ul>
        </div>
        
        <h3>What's Next?</h3>
        <ul>
          <li>📱 You'll receive urgent notifications for matching blood requests</li>
          <li>🏥 Connect directly with hospitals and patients in need</li>
          <li>💬 Use our chat system to coordinate donations</li>
          <li>📊 Track your donation history and impact</li>
        </ul>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/dashboard" 
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Go to Dashboard
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Thank you for being part of our life-saving community!
        </p>
      </div>
    `,
  }),

  welcome: (data) => ({
    subject: "Welcome to Blood Donor Connect!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">🩸 Welcome to Blood Donor Connect!</h2>
        <p>Dear ${data.name},</p>
        <p>Thank you for joining Blood Donor Connect! We're excited to have you as part of our life-saving community.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #dc2626;">Your Account Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Name:</strong> ${data.name}</li>
            <li><strong>Account Type:</strong> ${
              data.accountType || "User"
            }</li>
            ${
              data.isOAuth
                ? "<li><strong>Login Method:</strong> Google OAuth</li>"
                : ""
            }
          </ul>
          ${
            data.message
              ? `<p style="color: #b91c1c; font-weight: bold;">${data.message}</p>`
              : ""
          }
        </div>
        
        <h3 style="color: #374151;">What's Next?</h3>
        <ul style="color: #6b7280;">
          <li>🏥 Browse blood requests in your area</li>
          <li>💬 Connect with donors and recipients</li>
          <li>📱 Get real-time notifications for urgent requests</li>
          <li>❤️ Help save lives in your community</li>
        </ul>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #374151; font-size: 14px;">
            <strong>Need Help?</strong> Contact our support team at 
            <a href="mailto:${
              process.env.SUPPORT_EMAIL || "support@blooddonorconnect.com"
            }" style="color: #dc2626;">${
      process.env.SUPPORT_EMAIL || "support@blooddonorconnect.com"
    }</a>
          </p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Together, we can save lives! 🙏
        </p>
      </div>
    `,
  }),

  alert: (data) => ({
    subject: data.subject || "Blood Donor Connect Alert",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${
          data.priority === "High"
            ? "#dc2626"
            : data.priority === "Medium"
            ? "#d97706"
            : "#059669"
        };">
          ${
            data.priority === "High"
              ? "🚨"
              : data.priority === "Medium"
              ? "⚠️"
              : "ℹ️"
          } Blood Donor Connect Alert
        </h2>
        <p>Dear ${data.name},</p>
        <p>${data.message}</p>
        
        ${
          data.actionText && data.actionDetails
            ? `
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${data.actionText}:</h3>
          <p style="margin-bottom: 0; font-weight: bold;">${data.actionDetails}</p>
        </div>
        `
            : ""
        }
        
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated message from Blood Donor Connect.
        </p>
      </div>
    `,
  }),

  "email-verification": (data) => ({
    subject: "Verify Your Email - Blood Donor Network",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">📧 Verify Your Email Address</h2>
        <p>Dear ${data.name},</p>
        <p>Please verify your email address to complete your registration on Blood Donor Network.</p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 18px; margin-bottom: 20px;">Click the button below to verify your email:</p>
          <a href="${process.env.CLIENT_URL}/verify-email?token=${data.verificationToken}" 
             style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        
        <p>Or copy this link into your browser:</p>
        <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${process.env.CLIENT_URL}/verify-email?token=${data.verificationToken}
        </p>
        
        <p style="color: #6b7280; font-size: 14px;">
          This verification link will expire in 24 hours. If you didn't create this account, please ignore this email.
        </p>
      </div>
    `,
  }),

  "donation-reminder": (data) => ({
    subject: "Time to Save Lives Again! Donation Reminder",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">🩸 Ready to Donate Again?</h2>
        <p>Hello ${data.donorName},</p>
        <p>It's been ${
          data.weeksSinceLastDonation
        } weeks since your last donation. You're now eligible to donate again!</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Current Blood Needs in Your Area:</h3>
          <ul>
            ${
              data.urgentRequests
                ?.map(
                  (req) =>
                    `<li><strong>${req.bloodGroup}</strong> needed at ${req.hospital} - <span style="color: #dc2626">${req.urgency}</span></li>`
                )
                .join("") || "<li>No urgent requests at the moment</li>"
            }
          </ul>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/nearby-requests" 
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Nearby Requests
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Your last donation helped save lives. Ready to be a hero again?
        </p>
      </div>
    `,
  }),

  "request-fulfilled": (data) => ({
    subject: `Great News! Your ${data.bloodGroup} Request Has Been Fulfilled`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">🎉 Request Fulfilled Successfully!</h2>
        <p>Dear ${data.requesterName},</p>
        <p>Wonderful news! Your blood request has been successfully fulfilled.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3>Fulfillment Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Blood Group:</strong> ${data.bloodGroup}</li>
            <li><strong>Donor:</strong> ${data.donorName}</li>
            <li><strong>Hospital:</strong> ${data.hospital}</li>
            <li><strong>Fulfilled Date:</strong> ${new Date(
              data.fulfilledDate
            ).toLocaleDateString()}</li>
          </ul>
        </div>
        
        <p>Thank you for using our platform. We're glad we could help connect you with a life-saving donor!</p>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/requests/${data.requestId}" 
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Request Details
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Please consider leaving feedback about your experience to help us improve our service.
        </p>
      </div>
    `,
  }),
};

// Main email sending function
export async function sendEmail(to, subject, template, data) {
  try {
    let emailContent;

    // Generate email content from template
    if (template && emailTemplates[template]) {
      emailContent = emailTemplates[template](data);
      subject = emailContent.subject;
    } else {
      emailContent = {
        subject: subject,
        html: `<p>${data?.message || "No message provided"}</p>`,
      };
    }

    const emailData = {
      to: to,
      from: process.env.FROM_EMAIL || "noreply@blooddonor.com",
      subject: subject,
      html: emailContent.html,
    };

    // Try SendGrid first, fallback to Gmail
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(emailData);
      console.log(`📧 Email sent via SendGrid to ${to}: ${subject}`);
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await gmailTransporter.sendMail(emailData);
      console.log(`📧 Email sent via Gmail to ${to}: ${subject}`);
    } else {
      console.log(
        `📧 Email simulated (no service configured) to ${to}: ${subject}`
      );
      return { success: true, provider: "simulated" };
    }

    return {
      success: true,
      provider: process.env.SENDGRID_API_KEY ? "sendgrid" : "gmail",
    };
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    throw error;
  }
}

// Enhanced email sending function with better error handling and retry logic
export async function sendEmailWithRetry(
  to,
  subject,
  template,
  data,
  maxRetries = 3
) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Attempt ${attempt}/${maxRetries} to send email to ${to}`);
      const result = await sendEmail(to, subject, template, data);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ Email attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to send email after ${maxRetries} attempts: ${lastError.message}`
  );
}

// Send welcome email to new donors
export async function sendWelcomeEmail(userEmail, userData) {
  return sendEmail(userEmail, null, "welcome-donor", userData);
}

// Send email verification
export async function sendVerificationEmail(userEmail, userData) {
  return sendEmail(userEmail, null, "email-verification", userData);
}

// Send donation reminder
export async function sendDonationReminder(userEmail, userData) {
  return sendEmail(userEmail, null, "donation-reminder", userData);
}

// Send request creation confirmation
export async function sendRequestConfirmation(userEmail, requestData) {
  return sendEmail(userEmail, null, "request-created", requestData);
}

// Send donor offer notification
export async function sendDonorOfferNotification(userEmail, offerData) {
  return sendEmail(userEmail, null, "donor-offer", offerData);
}

// Send request fulfillment notification
export async function sendRequestFulfillmentNotification(
  userEmail,
  fulfillmentData
) {
  return sendEmail(userEmail, null, "request-fulfilled", fulfillmentData);
}

// Test email function
export async function sendTestEmail(to) {
  return sendEmail(to, "Test Email from Blood Donor App", null, {
    message: "This is a test email to verify email functionality is working!",
  });
}

// Bulk email sending with rate limiting
export async function sendBulkEmails(emails, template, data, rateLimit = 5) {
  const results = [];
  const chunks = [];

  // Split emails into chunks to avoid rate limiting
  for (let i = 0; i < emails.length; i += rateLimit) {
    chunks.push(emails.slice(i, i + rateLimit));
  }

  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (email) => {
      try {
        const result = await sendEmail(email, null, template, {
          ...data,
          recipientEmail: email,
        });
        return { email, success: true, result };
      } catch (error) {
        return { email, success: false, error: error.message };
      }
    });

    const chunkResults = await Promise.allSettled(chunkPromises);
    results.push(
      ...chunkResults.map((result) =>
        result.status === "fulfilled"
          ? result.value
          : { success: false, error: result.reason }
      )
    );

    // Wait between chunks to respect rate limits
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      console.log(`⏳ Waiting 2 seconds before next batch...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;

  console.log(
    `📊 Bulk email results: ${successCount} sent, ${failureCount} failed`
  );

  return {
    total: results.length,
    successful: successCount,
    failed: failureCount,
    results: results,
  };
}

// Email analytics and logging
export function logEmailAnalytics(
  emailType,
  recipient,
  success,
  provider,
  error = null
) {
  const logData = {
    timestamp: new Date().toISOString(),
    type: emailType,
    recipient: recipient,
    success: success,
    provider: provider,
    error: error,
  };

  // In a real app, you might want to save this to a database or analytics service
  console.log(`📊 Email Analytics:`, JSON.stringify(logData, null, 2));

  return logData;
}

// Validate email configuration
export function validateEmailConfig() {
  const hasValidSendGrid =
    process.env.SENDGRID_API_KEY &&
    process.env.SENDGRID_API_KEY !== "your_sendgrid_api_key_here";
  const hasValidGmail =
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_USER !== "your_gmail@gmail.com" &&
    process.env.EMAIL_PASS !== "your_app_password";

  return {
    sendgrid: hasValidSendGrid,
    gmail: hasValidGmail,
    hasAnyValidConfig: hasValidSendGrid || hasValidGmail,
    fromEmail: process.env.FROM_EMAIL || "noreply@blooddonor.com",
    supportEmail: process.env.SUPPORT_EMAIL || "support@blooddonor.com",
  };
}
