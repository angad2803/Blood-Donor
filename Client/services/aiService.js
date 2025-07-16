import api from "../api/api.js";

const aiService = {
  serverEndpoint: "/ai",

  async generateResponse(userMessage, userContext = {}) {
    console.log("🤖 Client AI Service - Calling server...");
    console.log("- Message:", userMessage);
    console.log("- Endpoint:", `${this.serverEndpoint}/chat`);

    try {
      // Call server-side AI endpoint
      const response = await api.post(`${this.serverEndpoint}/chat`, {
        message: userMessage,
        userContext,
      });

      console.log("✅ Server Response:", response.data);

      if (response.data.success) {
        return {
          message: response.data.data.message,
          quickReplies: response.data.data.quickReplies || [],
        };
      } else {
        throw new Error(response.data.error || "AI service error");
      }
    } catch (error) {
      console.error("❌ AI Service Error:", error);
      console.error("❌ Error details:", error.response?.data || error.message);

      // Fallback to mock responses
      console.log("🔄 Falling back to mock responses");
      return this.getMockResponse(userMessage);
    }
  },

  getMockResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // Blood donation related responses
    if (message.includes("blood") || message.includes("donate")) {
      return {
        message:
          "Blood donation is a wonderful way to help save lives! 🩸 Each donation can help up to 3 people. Would you like to know about donation requirements or find nearby donation centers?",
        quickReplies: [
          "Donation Requirements",
          "Find Centers",
          "Health Benefits",
        ],
      };
    }

    if (message.includes("requirement") || message.includes("eligible")) {
      return {
        message:
          "To donate blood, you typically need to: Be 17+ years old, weigh at least 110 lbs, be in good health, and not have donated in the last 8 weeks (56 days). 📋",
        quickReplies: ["More Details", "Health Screening", "Schedule Donation"],
      };
    }

    if (message.includes("help") || message.includes("support")) {
      return {
        message:
          "I'm here to help! I can assist you with blood donation information, finding requests, understanding the process, and more. What would you like to know? 🤝",
        quickReplies: ["Donation Process", "Find Requests", "Health Info"],
      };
    }

    // Default response
    return {
      message:
        "Thanks for your message! I'm your Blood Donation Assistant. I can help you with donation information, finding blood requests, and answering questions about the process. How can I assist you today? 😊",
      quickReplies: ["Get Started", "Blood Types", "Donation Centers"],
    };
  },

  async getStatus() {
    try {
      const response = await api.get(`${this.serverEndpoint}/status`);
      return response.data.data;
    } catch (error) {
      console.error("AI Status Error:", error);
      return {
        provider: "mock",
        isConfigured: false,
        fallbackMode: true,
      };
    }
  },

  // For backwards compatibility
  get apiKey() {
    return null; // Server handles API keys now
  },

  get geminiApiKey() {
    return null; // Server handles API keys now
  },
};

export default aiService;
