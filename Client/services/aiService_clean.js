import api from "../api/api.js";

class AIService {
  constructor() {
    this.serverEndpoint = "/api/ai";
  }

  async generateResponse(userMessage, userContext = {}) {
    console.log("🤖 AI Service: Starting generateResponse");
    console.log("📝 User message:", userMessage);
    console.log("👤 User context:", userContext);

    try {
      console.log("🌐 Making API call to:", `${this.serverEndpoint}/chat`);
      console.log("📤 Request payload:", {
        message: userMessage,
        userContext,
      });

      // Call server-side AI endpoint
      const response = await api.post(`${this.serverEndpoint}/chat`, {
        message: userMessage,
        userContext,
      });

      console.log("📨 API Response received:", response.data);

      if (response.data.success) {
        console.log(
          "✅ API Success - Gemini response:",
          response.data.data.message
        );
        return {
          message: response.data.data.message,
          quickReplies: response.data.data.quickReplies || [],
        };
      } else {
        console.log("❌ API returned error:", response.data.message);
        throw new Error(response.data.message || "Failed to generate response");
      }
    } catch (error) {
      console.error("💥 AI Service Error:", error);
      console.log("🔄 Falling back to mock response");

      // Fallback to mock responses if server fails
      return this.generateMockResponse(userMessage, userContext);
    }
  }

  async getStatus() {
    console.log("🔍 AI Service: Checking API status");

    try {
      console.log(
        "🌐 Making status request to:",
        `${this.serverEndpoint}/status`
      );
      const response = await api.get(`${this.serverEndpoint}/status`);

      console.log("📊 Status response:", response.data);
      console.log("🔧 API Provider:", response.data.data?.provider);
      console.log("✅ Is Configured:", response.data.data?.isConfigured);

      return response.data.data;
    } catch (error) {
      console.error("💥 AI Status Error:", error);
      console.log("🔄 Returning fallback status");
      return {
        provider: "mock",
        isConfigured: false,
        fallbackMode: true,
      };
    }
  }

  // Fallback mock responses (used when server is unavailable)
  generateMockResponse(userMessage, userContext = {}) {
    const message = userMessage.toLowerCase();

    // Enhanced blood donation responses
    const responses = {
      donate: {
        message: `Hi ${userContext?.name || "there"}! 🩸 To donate blood, you need to:\n\n✅ Be 18-65 years old\n✅ Weigh at least 50kg\n✅ Be in good health\n✅ Have not donated in the last 3 months\n\n${userContext?.bloodGroup ? `Your blood group ${userContext.bloodGroup} is valuable!` : ""}\n\nWould you like me to help you find nearby donation centers?`,
        quickReplies: [
          "Find donation centers",
          "Check my eligibility",
          "Schedule appointment",
          "Donation benefits",
        ],
      },
      eligibility: {
        message: `Let me help check your eligibility! ${userContext?.bloodGroup ? `For ${userContext.bloodGroup} donors:` : ""}\n\n📋 Basic Requirements:\n• Are you between 18-65 years old?\n• Do you weigh at least 50kg?\n• Have you donated blood in the last 3 months?\n• Are you currently taking any medications?\n• Any recent surgeries or tattoos?\n\nAnswer these to get a personalized assessment!`,
        quickReplies: [
          "Yes, I'm eligible",
          "I'm not sure",
          "Check medications",
          "Recent surgery",
        ],
      },
      emergency: {
        message: `🚨 EMERGENCY BLOOD REQUEST 🚨\n\nFor immediate medical emergencies:\n1️⃣ Call 108 (Emergency Services) FIRST\n2️⃣ Contact nearby hospitals directly\n3️⃣ Use our emergency request feature\n4️⃣ Share on social media for urgent help\n\n${userContext?.location ? `Your location: ${userContext.location}` : "Please share your location for better help"}\n\nWould you like me to help create an urgent blood request?`,
        quickReplies: [
          "Create urgent request",
          "Find hospitals",
          "Call 108",
          "Share on social",
        ],
      },
      find: {
        message: `🔍 Based on your location ${userContext?.location ? `(${userContext.location})` : "(please update your location)"}, I can help you find:\n\n🩸 Available ${userContext?.bloodGroup || "blood"} donors\n🏥 Nearby hospitals with blood banks\n🌡️ Blood collection centers\n📍 Mobile donation camps\n📱 Emergency contacts\n\nWhat would you like to find?`,
        quickReplies: [
          "Find donors",
          "Blood banks",
          "Hospitals nearby",
          "Mobile camps",
        ],
      },
      hospital: {
        message: `🏥 Nearby Hospitals & Blood Banks:\n\n${userContext?.location ? `Near ${userContext.location}:` : "Popular locations:"}\n\n🏥 City General Hospital - 2.3 km\n   📞 +91-11-2234-5678\n🏥 Regional Medical Center - 4.1 km\n   📞 +91-11-2345-6789\n🩸 Red Cross Blood Bank - 1.8 km\n   📞 +91-11-3456-7890\n🩸 Community Blood Center - 3.7 km\n   📞 +91-11-4567-8901\n\nTap for directions or call directly!`,
        quickReplies: [
          "Get directions",
          "Call hospital",
          "Check availability",
          "More hospitals",
        ],
      },
      medication: {
        message: `💊 Medication & Blood Donation Guidelines:\n\n✅ SAFE TO DONATE:\n• Most vitamins & supplements\n• Birth control pills\n• Blood pressure medications\n• Thyroid medications\n\n⚠️ WAIT PERIOD REQUIRED:\n• Antibiotics (wait 24-48 hours after last dose)\n• Pain medications (check with staff)\n• Cold medicines (wait until recovered)\n\n❌ DEFER DONATION:\n• Blood thinners (warfarin, heparin)\n• Certain antidepressants\n• Chemotherapy drugs\n\n⚕️ Always inform our medical team about ALL medications!`,
        quickReplies: [
          "Check specific medication",
          "Talk to medical team",
          "General guidelines",
          "Book consultation",
        ],
      },
      "blood group": {
        message: `🩸 Your Blood Group: ${userContext?.bloodGroup || "Not specified"}\n\n📊 Blood Compatibility Chart:\n\n🔴 Universal Donors: O- (can donate to all)\n🔵 Universal Recipients: AB+ (can receive from all)\n\n${userContext?.bloodGroup ? this.getBloodCompatibilityInfo(userContext.bloodGroup) : "Please update your blood group in profile for personalized info!"}\n\nWant to learn more about blood compatibility?`,
        quickReplies: [
          "Compatibility chart",
          "Who can I donate to?",
          "Who can donate to me?",
          "Update blood group",
        ],
      },
      process: {
        message: `📝 Blood Donation Process:\n\n1️⃣ REGISTRATION (5 min)\n   • Health questionnaire\n   • ID verification\n\n2️⃣ HEALTH SCREENING (10 min)\n   • Blood pressure check\n   • Hemoglobin test\n   • Medical history review\n\n3️⃣ DONATION (10-15 min)\n   • Actual blood collection\n   • 450ml collected safely\n\n4️⃣ RECOVERY (15 min)\n   • Refreshments provided\n   • Rest and observation\n\nTotal time: ~45 minutes. You're saving 3 lives! 🦸‍♂️`,
        quickReplies: [
          "Book appointment",
          "Preparation tips",
          "After donation care",
          "Benefits of donating",
        ],
      },
      benefits: {
        message: `🌟 Benefits of Blood Donation:\n\n❤️ HEALTH BENEFITS:\n• Free health check-up\n• Reduces risk of heart disease\n• Burns 650 calories per donation\n• Stimulates new blood cell production\n\n😊 EMOTIONAL BENEFITS:\n• Save up to 3 lives per donation\n• Feel good about helping others\n• Build community connections\n• Receive gratitude from recipients\n\n🎁 OTHER PERKS:\n• Free snacks & refreshments\n• Digital certificate\n• Donor recognition programs\n• Priority for blood when needed\n\nReady to become a life-saver?`,
        quickReplies: [
          "Start donating",
          "Health benefits",
          "Recognition programs",
          "Find centers",
        ],
      },
    };

    // Advanced keyword matching
    const keywords = Object.keys(responses);
    let matchedKeyword = keywords.find((keyword) => message.includes(keyword));

    // Specific phrase matching
    if (!matchedKeyword) {
      if (
        message.includes("blood group") ||
        message.includes("blood type") ||
        message.includes("compatibility")
      ) {
        matchedKeyword = "blood group";
      } else if (
        message.includes("process") ||
        message.includes("procedure") ||
        message.includes("steps")
      ) {
        matchedKeyword = "process";
      } else if (
        message.includes("benefit") ||
        message.includes("why donate") ||
        message.includes("advantages")
      ) {
        matchedKeyword = "benefits";
      } else if (
        message.includes("help") ||
        message.includes("how") ||
        message.includes("guide")
      ) {
        matchedKeyword = "process";
      }
    }

    if (matchedKeyword && responses[matchedKeyword]) {
      console.log("🎯 Mock response matched:", matchedKeyword);
      return responses[matchedKeyword];
    }

    // Contextual responses based on user data
    if (userContext?.bloodGroup) {
      console.log(
        "🎯 Returning contextual response for user with blood group:",
        userContext.bloodGroup
      );
      return {
        message: `Hi ${userContext.name || "there"}! I'm here to help with blood donation. Your blood group ${userContext.bloodGroup} is valuable for saving lives!\n\n🩸 How can I assist you today?\n\n• Guide you through donation process\n• Check your eligibility\n• Find donors or blood banks nearby\n• Handle emergency requests\n• Answer medical questions\n• Share donation benefits\n\nWhat would you like to explore?`,
        quickReplies: [
          "Check eligibility",
          "Find blood banks",
          "Emergency help",
          "Donation benefits",
        ],
      };
    }

    // Default comprehensive response
    console.log("🔄 Returning default mock response");
    return {
      message: `Hello! 👋 I'm your AI assistant for blood donation support.\n\n🩸 I can help you with:\n\n• **Donation Process** - Step-by-step guidance\n• **Eligibility Check** - Requirements & health screening\n• **Find Resources** - Donors, blood banks, hospitals\n• **Emergency Support** - Urgent blood requests\n• **Medical Info** - Safety guidelines & FAQs\n• **Benefits** - Why donating blood matters\n\n💡 Try asking: "How do I donate blood?" or "Find blood donors near me"\n\nWhat would you like to know?`,
      quickReplies: [
        "Donation process",
        "Find donors",
        "Emergency help",
        "Check eligibility",
      ],
    };
  }

  // Helper function for blood compatibility info
  getBloodCompatibilityInfo(bloodGroup) {
    const compatibility = {
      "A+": {
        canDonateTo: ["A+", "AB+"],
        canReceiveFrom: ["A+", "A-", "O+", "O-"],
      },
      "A-": {
        canDonateTo: ["A+", "A-", "AB+", "AB-"],
        canReceiveFrom: ["A-", "O-"],
      },
      "B+": {
        canDonateTo: ["B+", "AB+"],
        canReceiveFrom: ["B+", "B-", "O+", "O-"],
      },
      "B-": {
        canDonateTo: ["B+", "B-", "AB+", "AB-"],
        canReceiveFrom: ["B-", "O-"],
      },
      "AB+": { canDonateTo: ["AB+"], canReceiveFrom: ["All blood types"] },
      "AB-": {
        canDonateTo: ["AB+", "AB-"],
        canReceiveFrom: ["AB-", "A-", "B-", "O-"],
      },
      "O+": {
        canDonateTo: ["O+", "A+", "B+", "AB+"],
        canReceiveFrom: ["O+", "O-"],
      },
      "O-": { canDonateTo: ["All blood types"], canReceiveFrom: ["O-"] },
    };

    const info = compatibility[bloodGroup];
    if (info) {
      return `\n🎯 Your Compatibility:\n• Can donate to: ${Array.isArray(info.canDonateTo) ? info.canDonateTo.join(", ") : info.canDonateTo}\n• Can receive from: ${Array.isArray(info.canReceiveFrom) ? info.canReceiveFrom.join(", ") : info.canReceiveFrom}`;
    }
    return "";
  }

  // For backwards compatibility
  get apiKey() {
    return null; // Server handles API keys now
  }

  get geminiApiKey() {
    return null; // Server handles API keys now
  }
}

// Create and export instance
const aiService = new AIService();
export default aiService;
