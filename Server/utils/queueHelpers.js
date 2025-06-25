// Queue helper functions for blood donor app
import { canDonateTo } from "./compatability.js";
import User from "../models/User.js";

/**
 * Find eligible donors for a blood request
 * @param {Object} request - Blood request object
 * @returns {Promise<Array>} Array of eligible donors
 */
export async function findEligibleDonors(request) {
  try {
    const { bloodGroup, location } = request;

    // Find donors who can donate to the requested blood group
    const eligibleBloodGroups = [];

    // Check which blood groups can donate to the requested blood group
    const allBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    for (const group of allBloodGroups) {
      if (canDonateTo(group, bloodGroup)) {
        eligibleBloodGroups.push(group);
      }
    }

    // Find users with compatible blood groups
    const donors = await User.find({
      bloodGroup: { $in: eligibleBloodGroups },
      role: "donor",
      isActive: true,
      // Add location-based filtering if needed
      // location: { $regex: location, $options: 'i' }
    }).select("name email phone bloodGroup location");

    return donors;
  } catch (error) {
    console.error("Error finding eligible donors:", error);
    return [];
  }
}

/**
 * Calculate priority score for notifications
 * @param {string} urgency - Urgency level
 * @param {string} bloodGroup - Blood group
 * @returns {number} Priority score (higher = more urgent)
 */
export function calculatePriority(urgency, bloodGroup) {
  let score = 0;

  // Base score by urgency
  switch (urgency) {
    case "Emergency":
      score = 100;
      break;
    case "High":
      score = 75;
      break;
    case "Medium":
      score = 50;
      break;
    case "Low":
      score = 25;
      break;
    default:
      score = 50;
  }

  // Add extra score for rare blood groups
  if (bloodGroup === "AB-" || bloodGroup === "O-") {
    score += 20;
  }

  return score;
}

/**
 * Generate notification message based on urgency and context
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {string} Formatted message
 */
export function generateNotificationMessage(type, data) {
  const { urgency, bloodGroup, hospital, location } = data;

  const urgencyEmoji = {
    Emergency: "🚨",
    High: "⚠️",
    Medium: "🩸",
    Low: "💉",
  };

  switch (type) {
    case "urgent_request":
      return `${urgencyEmoji[urgency]} ${urgency} blood request: ${bloodGroup} needed at ${hospital}, ${location}. Please respond if you can help!`;

    case "donor_match":
      return `🎯 You're a match! Someone needs ${bloodGroup} blood donation at ${hospital}. Your help can save lives!`;

    case "offer_received":
      return `✅ Great news! A donor has responded to your blood request for ${bloodGroup} at ${hospital}.`;

    case "offer_accepted":
      return `🎉 Your donation offer has been accepted! Please contact the requester to coordinate the donation.`;

    default:
      return `🩸 Blood donation update: ${bloodGroup} at ${hospital}`;
  }
}

/**
 * Get retry configuration based on urgency
 * @param {string} urgency - Urgency level
 * @returns {Object} Retry configuration
 */
export function getRetryConfig(urgency) {
  const configs = {
    Emergency: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    },
    High: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 5,
      removeOnFail: 3,
    },
    Medium: {
      attempts: 2,
      backoff: {
        type: "fixed",
        delay: 5000,
      },
      removeOnComplete: 3,
      removeOnFail: 2,
    },
    Low: {
      attempts: 1,
      removeOnComplete: 2,
      removeOnFail: 1,
    },
  };

  return configs[urgency] || configs["Medium"];
}

/**
 * Format phone number for SMS
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
  if (!phone) return null;

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Add country code if not present (assuming US/Canada)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }

  return phone; // Return as-is if format is unclear
}

/**
 * Check if notification should be sent based on user preferences
 * @param {Object} user - User object
 * @param {string} type - Notification type
 * @returns {boolean} Whether to send notification
 */
export function shouldSendNotification(user, type) {
  // Check user notification preferences
  const preferences = user.notificationPreferences || {};

  switch (type) {
    case "email":
      return preferences.email !== false; // Default to true
    case "sms":
      return preferences.sms === true && user.phone; // Require explicit opt-in
    case "push":
      return preferences.push !== false; // Default to true
    default:
      return true;
  }
}
