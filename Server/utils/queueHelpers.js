
import { canDonateTo } from "./compatability.js";
import User from "../models/User.js";


export async function findEligibleDonors(request) {
  try {
    const { bloodGroup, location } = request;


    const eligibleBloodGroups = [];


    const allBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    for (const group of allBloodGroups) {
      if (canDonateTo(group, bloodGroup)) {
        eligibleBloodGroups.push(group);
      }
    }


    const donors = await User.find({
      bloodGroup: { $in: eligibleBloodGroups },
      available: true,

    }).select("name email phone bloodGroup location");

    return donors;
  } catch (error) {
    console.error("Error finding eligible donors:", error);
    return [];
  }
}


export function calculatePriority(urgency, bloodGroup) {
  let score = 0;


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


  if (bloodGroup === "AB-" || bloodGroup === "O-") {
    score += 20;
  }

  return score;
}


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


export function formatPhoneNumber(phone) {
  if (!phone) return null;


  const cleaned = phone.replace(/\D/g, "");


  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }

  return phone;
}


export function shouldSendNotification(user, type) {

  const preferences = user.notificationPreferences || {};

  switch (type) {
    case "email":
      return preferences.email !== false;
    case "sms":
      return preferences.sms === true && user.phone;
    case "push":
      return preferences.push !== false;
    default:
      return true;
  }
}
