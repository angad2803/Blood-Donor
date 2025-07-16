import api from '../api/api.js';

class AIService {
  constructor() {
    this.serverEndpoint = '/api/ai';
  }

  async generateResponse(userMessage, userContext = {}) {
    try {
      // Call server-side AI endpoint
      const response = await api.post(`${this.serverEndpoint}/chat`, {
        message: userMessage,
        userContext
      });

      if (response.data.success) {
        return {
          message: response.data.data.message,
          quickReplies: response.data.data.quickReplies || []
        };
      } else {
        throw new Error(response.data.message || 'Failed to generate response');
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Fallback to mock responses if server fails
      return this.generateMockResponse(userMessage, userContext);
    }
  }

  async getStatus() {
    try {
      const response = await api.get(`${this.serverEndpoint}/status`);
      return response.data.data;
    } catch (error) {
      console.error('AI Status Error:', error);
      return {
        provider: 'mock',
        isConfigured: false,
        fallbackMode: true
      };
    }
  }

  // Fallback mock responses (used when server is unavailable)
  generateMockResponse(userMessage, userContext = {}) {
    const responses = {
      'donate': {
        message: "To donate blood, you need to:\n\n1. Be 18-65 years old\n2. Weigh at least 50kg\n3. Be in good health\n4. Have not donated in the last 3 months\n\nWould you like me to help you find nearby donation centers?",
        quickReplies: ["Find donation centers", "Check my eligibility", "Schedule appointment"]
      },
      'eligibility': {
        message: "Let me check your eligibility! Please answer:\n\n• Are you between 18-65 years old?\n• Do you weigh at least 50kg?\n• Have you donated blood in the last 3 months?\n• Are you currently taking any medications?",
        quickReplies: ["Yes, I'm eligible", "I'm not sure", "Check medications"]
      },
      'emergency': {
        message: "🚨 For medical emergencies, please call emergency services immediately!\n\nFor urgent blood needs:\n• Call local hospitals directly\n• Use our emergency request feature\n• Contact blood banks in your area\n\nWould you like me to help you create an urgent blood request?",
        quickReplies: ["Create urgent request", "Find hospitals", "Blood bank contacts"]
      },
      'find': {
        message: `Based on your location (${userContext?.location || 'your area'}), I can help you find:\n\n🩸 Available donors\n🏥 Nearby hospitals\n🌡️ Blood banks\n📍 Donation centers\n\nWhat are you looking for?`,
        quickReplies: ["Find donors", "Hospitals nearby", "Blood banks", "Donation centers"]
      },
      'hospital': {
        message: "Here are nearby hospitals and blood banks:\n\n🏥 City General Hospital - 2.3 km\n🏥 Regional Medical Center - 4.1 km\n🩸 Red Cross Blood Bank - 1.8 km\n🩸 Community Blood Center - 3.7 km\n\nWould you like directions to any of these?",
        quickReplies: ["Get directions", "Call hospital", "Check availability", "More options"]
      },
      'medication': {
        message: "Some medications may affect blood donation eligibility:\n\n✅ Safe: Most vitamins, birth control, blood pressure meds\n⚠️ Wait period: Antibiotics (24-48 hours after last dose)\n❌ Defer: Blood thinners, certain antidepressants\n\nFor specific medications, please consult with our medical team.",
        quickReplies: ["Check specific medication", "Talk to medical team", "General guidelines"]
      }
    };

    // Simple keyword matching for fallback
    const keywords = Object.keys(responses);
    const matchedKeyword = keywords.find(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );

    if (matchedKeyword) {
      return responses[matchedKeyword];
    }

    // Special responses for specific phrases
    if (userMessage.toLowerCase().includes('blood group') || userMessage.toLowerCase().includes('blood type')) {
      return {
        message: `Your blood group is ${userContext?.bloodGroup || 'not specified'}.\n\nBlood compatibility:\n• Universal donors: O-\n• Universal recipients: AB+\n• Your compatibility depends on your specific blood type.\n\nWould you like to learn more about blood compatibility?`,
        quickReplies: ["Blood compatibility chart", "Who can I donate to?", "Who can donate to me?"]
      };
    }

    // Default response
    return {
      message: "I understand you're asking about blood donation. Here are some ways I can help:\n\n• Guide you through the donation process\n• Check donor eligibility\n• Find nearby donors or centers\n• Handle emergency requests\n• Answer medical questions\n\nWhat would you like to know more about?",
      quickReplies: ["Donation process", "Find donors", "Emergency help", "Medical questions"]
    };
  }

  // For backwards compatibility
  get apiKey() {
    return null; // Server handles API keys now
  }

  get geminiApiKey() {
    return null; // Server handles API keys now
  }
}

const aiService = new AIService();
export default aiService;
