import express from "express";
import auth from "../middleware/auth.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenAI } from "openai";

const router = express.Router();

// AI Service - supports both OpenAI and Gemini
class AIService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.provider = process.env.AI_PROVIDER || "gemini";
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 1000;
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
  }

  async generateResponse(message, userContext = {}) {
    console.log("🤖 AI Service Debug:");
    console.log("- Provider:", this.provider);
    console.log(
      "- Has Gemini Key:",
      !!(this.geminiApiKey && this.geminiApiKey !== "your_gemini_api_key_here")
    );
    console.log(
      "- Has OpenAI Key:",
      !!(this.openaiApiKey && this.openaiApiKey !== "your_openai_api_key_here")
    );
    console.log("- User Message:", message);

    try {
      if (
        this.provider === "gemini" &&
        this.geminiApiKey &&
        this.geminiApiKey !== "your_gemini_api_key_here"
      ) {
        console.log("✅ Using Gemini AI");
        return await this.generateGeminiResponse(message, userContext);
      } else if (
        this.provider === "openai" &&
        this.openaiApiKey &&
        this.openaiApiKey !== "your_openai_api_key_here"
      ) {
        console.log("✅ Using OpenAI");
        return await this.generateOpenAIResponse(message, userContext);
      } else {
        console.log("⚠️ Using Mock Responses (AI not configured)");
        // Fallback to mock responses
        return this.generateMockResponse(message, userContext);
      }
    } catch (error) {
      console.error("❌ AI Response Error:", error);
      console.log("🔄 Falling back to mock responses");
      return this.generateMockResponse(message, userContext);
    }
  }

  async generateGeminiResponse(message, userContext) {
    console.log("🔮 Gemini API Call Starting...");

    if (
      !this.geminiApiKey ||
      this.geminiApiKey === "your_gemini_api_key_here"
    ) {
      throw new Error("Gemini API key not configured");
    }

    const genAI = new GoogleGenerativeAI(this.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = this.buildSystemPrompt(userContext);
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;

    console.log("📤 Sending to Gemini:", message);

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    console.log("📥 Gemini Response:", text.substring(0, 100) + "...");

    return {
      message: text,
      quickReplies: this.generateQuickReplies(message, text),
    };
  }

  async generateOpenAIResponse(message, userContext) {
    if (
      !this.openaiApiKey ||
      this.openaiApiKey === "your_openai_api_key_here"
    ) {
      throw new Error("OpenAI API key not configured");
    }

    const openai = new OpenAI({
      apiKey: this.openaiApiKey,
    });

    const systemPrompt = this.buildSystemPrompt(userContext);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    });

    const text = completion.choices[0].message.content;

    return {
      message: text,
      quickReplies: this.generateQuickReplies(message, text),
    };
  }

  buildSystemPrompt(userContext) {
    const { name, bloodGroup, location, isHospital } = userContext;

    return `You are an intelligent AI assistant for a comprehensive Blood Donation app in India called "Blood Donor". You specialize in helping users with blood donation, emergency requests, and connecting donors with recipients.

**App Features You Can Help With:**
- Creating and managing blood donation requests
- Finding compatible donors nearby using GPS/location services
- Sending offers to donate blood to specific requests
- Managing accepted offers and scheduling donations
- Real-time chat with donors/recipients
- ArcGIS map integration for location tracking and route planning
- Emergency blood request notifications
- Hospital management features for verified medical institutions
- Admin dashboard for managing users and requests

**Current User Context:**
- Name: ${name || "Not provided"}
- Blood Group: ${bloodGroup || "Not specified"} ${bloodGroup ? "(Important for compatibility matching)" : ""}
- Location: ${location || "Not specified"} ${location ? "(Used for nearby donor search)" : ""}
- User Type: ${isHospital ? "🏥 Verified Hospital/Medical Institution" : "👤 Individual User/Donor"}

**Donation Process in Our App:**
1. **Creating Requests**: Users can create urgent or regular blood requests with details like blood group, quantity, hospital info, and urgency level
2. **Finding Donors**: App uses GPS to find nearby compatible donors and sends them notifications
3. **Sending Offers**: Donors can browse requests and send offers to donate, including availability times
4. **Acceptance & Coordination**: Recipients can accept offers and coordinate through in-app chat
5. **Meeting Point**: App suggests optimal meeting points using ArcGIS integration
6. **Route Planning**: Provides turn-by-turn directions to donation centers or meeting points
7. **Completion**: Users can mark donations as completed and rate their experience

**Blood Group Compatibility (Indian Standards):**
- A+ can donate to: A+, AB+ | can receive from: A+, A-, O+, O-
- A- can donate to: A+, A-, AB+, AB- | can receive from: A-, O-
- B+ can donate to: B+, AB+ | can receive from: B+, B-, O+, O-
- B- can donate to: B+, B-, AB+, AB- | can receive from: B-, O-
- AB+ can donate to: AB+ | can receive from: All blood groups (Universal recipient)
- AB- can donate to: AB+, AB- | can receive from: AB-, A-, B-, O-
- O+ can donate to: O+, A+, B+, AB+ | can receive from: O+, O-
- O- can donate to: All blood groups (Universal donor) | can receive from: O-

**Indian Blood Donation Guidelines:**
- Age: 18-65 years
- Weight: Minimum 50kg
- Interval: 3 months between donations (12 weeks)
- Health: No cold, fever, or medication in last 72 hours
- Alcohol: Not consumed in last 24 hours
- Hemoglobin: Minimum 12.5 g/dL for men, 12.0 g/dL for women

**Emergency Protocol:**
For life-threatening emergencies, always advise:
1. Call 108 (National Emergency Ambulance) immediately
2. Contact nearest hospital directly
3. Use our app's emergency request feature for urgent blood needs
4. Inform local blood banks

**Response Guidelines:**
- Be empathetic, especially for emergency situations
- Provide specific, actionable advice related to our app features
- Use Indian medical standards and terminology
- Suggest relevant app features to solve their problems
- Keep responses helpful but not overly technical
- Always prioritize safety and medical accuracy
- Encourage community participation in blood donation
- Use emojis appropriately to make responses engaging

Respond in a caring, knowledgeable tone as a blood donation expert who understands the Indian healthcare system and our app's capabilities.`;
  }

  generateQuickReplies(userMessage, aiResponse) {
    const message = userMessage.toLowerCase();
    const response = aiResponse.toLowerCase();

    if (message.includes("eligib") || response.includes("eligib")) {
      return ["Check requirements", "Health guidelines", "Age requirements"];
    }
    if (message.includes("emergency") || message.includes("urgent")) {
      return ["Call emergency", "Find blood banks", "Create urgent request"];
    }
    if (message.includes("donate") || message.includes("donation")) {
      return ["Donation process", "Find centers", "Health tips"];
    }
    if (message.includes("find") || message.includes("nearby")) {
      return ["Search donors", "Blood banks", "Hospitals nearby"];
    }

    return ["More info", "Find donors", "Emergency help", "Donation tips"];
  }

  generateMockResponse(message, userContext) {
    const msg = message.toLowerCase();

    // Enhanced responses specific to the Blood Donor app
    if (msg.includes("donation process") || msg.includes("how to donate")) {
      return {
        message: `🩸 **Blood Donation Process in Our App:**

1. **Create Profile** - Complete your profile with blood group and location
2. **Browse Requests** - View urgent and regular blood requests nearby
3. **Send Offer** - Tap "Send Offer" on compatible requests (${userContext?.bloodGroup || "your blood group"})
4. **Get Accepted** - Recipients review and accept your offer
5. **Coordinate** - Use in-app chat to plan meeting details
6. **Meet & Donate** - Our app provides route planning to the location
7. **Complete** - Mark donation as completed and help save lives! 🙏

**Your Status:** ${userContext?.bloodGroup ? `You can donate to ${this.getCompatibleRecipients(userContext.bloodGroup)} recipients` : "Add your blood group to see compatibility"}

Ready to start? Tap "Browse Requests" to see who needs your help!`,
        quickReplies: [
          "Browse requests",
          "My compatibility",
          "Donation centers",
          "Safety guidelines",
        ],
      };
    }

    if (msg.includes("eligib") || msg.includes("can i donate")) {
      return {
        message: `✅ **Blood Donation Eligibility Check:**

**Basic Requirements:**
• Age: 18-65 years ✓
• Weight: Minimum 50kg ✓
• Good general health ✓
• 3 months since last donation ✓

**Before Donating:**
• No fever/cold in last 72 hours
• No alcohol in last 24 hours
• No medication for chronic conditions
• Hemoglobin levels adequate

**In Our App:**
1. Complete your health questionnaire
2. Get eligibility status instantly
3. Find nearby donation centers
4. Schedule appointments directly

${userContext?.bloodGroup ? `Your blood group: **${userContext.bloodGroup}** - Compatible with ${this.getCompatibleRecipients(userContext.bloodGroup)}` : "💡 Add your blood group for personalized compatibility info"}`,
        quickReplies: [
          "Health check",
          "Find centers",
          "Schedule now",
          "Blood compatibility",
        ],
      };
    }

    if (msg.includes("emergency") || msg.includes("urgent")) {
      return {
        message: `🚨 **Emergency Blood Request Process:**

**For Life-Threatening Emergencies:**
1. **Call 108** (National Emergency) immediately
2. Contact nearest hospital directly
3. Use our **Emergency Request** feature

**Create Emergency Request:**
1. Tap the red "Emergency" button
2. Select blood group needed
3. Add hospital/location details
4. Set urgency level (Critical/Urgent)
5. We'll notify nearby donors instantly!

**Our Emergency Features:**
• GPS-based instant donor alerts
• Hospital verification system
• Real-time tracking
• Priority notifications

${userContext?.location ? `📍 Your location: ${userContext.location} - We'll find donors nearby` : "📍 Enable location for faster emergency response"}

**Remember:** Our app complements emergency services, not replaces them!`,
        quickReplies: [
          "Create emergency request",
          "Find hospitals",
          "Call 108",
          "Donor alerts",
        ],
      };
    }

    if (
      msg.includes("find donors") ||
      msg.includes("search") ||
      msg.includes("nearby")
    ) {
      return {
        message: `🔍 **Find Donors in Our App:**

**Smart Donor Search:**
• **GPS Integration** - Finds donors within 50km radius
• **Blood Group Matching** - Only compatible donors
• **Real-time Availability** - Active donors only
• **Rating System** - Trusted donor profiles

**Search Process:**
1. Create your blood request
2. Set urgency level and location
3. App automatically finds compatible donors
4. Sends push notifications instantly
5. Donors can send offers to help

**Advanced Filters:**
• Distance (5km to 100km)
• Donor rating (4+ stars)
• Availability (next 24-48 hours)
• Verified donors only

${userContext?.bloodGroup ? `For ${userContext.bloodGroup}: You can find ${this.getCompatibleDonors(userContext.bloodGroup)} donors` : "Add your blood group to see compatible donors"}
${userContext?.location ? `📍 Searching near: ${userContext.location}` : "📍 Enable location for accurate results"}`,
        quickReplies: [
          "Create request",
          "View map",
          "Filter donors",
          "Emergency search",
        ],
      };
    }

    if (
      msg.includes("blood group") ||
      msg.includes("compatibility") ||
      msg.includes("blood type")
    ) {
      const bloodGroup = userContext?.bloodGroup;
      if (bloodGroup) {
        return {
          message: `🩸 **Your Blood Group: ${bloodGroup}**

**You can DONATE to:**
${this.getCompatibleRecipients(bloodGroup)}

**You can RECEIVE from:**
${this.getCompatibleDonors(bloodGroup)}

**In Our App:**
• Auto-matches you with compatible requests
• Shows your donation impact (lives saved)
• Filters out incompatible requests
• Emergency alerts for your blood group

**${bloodGroup} Facts:**
${this.getBloodGroupFacts(bloodGroup)}

Want to see current requests for ${bloodGroup}?`,
          quickReplies: [
            `Find ${bloodGroup} requests`,
            "Compatibility chart",
            "My impact",
            "Donation history",
          ],
        };
      } else {
        return {
          message: `🩸 **Blood Group Compatibility Guide:**

**Universal Donors:** O- (can donate to everyone)
**Universal Recipients:** AB+ (can receive from everyone)

**Complete Compatibility:**
• **A+** → A+, AB+ | ← A+, A-, O+, O-
• **A-** → A+, A-, AB+, AB- | ← A-, O-
• **B+** → B+, AB+ | ← B+, B-, O+, O-
• **B-** → B+, B-, AB+, AB- | ← B-, O-
• **AB+** → AB+ | ← All groups
• **AB-** → AB+, AB- | ← AB-, A-, B-, O-
• **O+** → O+, A+, B+, AB+ | ← O+, O-
• **O-** → All groups | ← O-

**Add your blood group to your profile for:**
✓ Personalized request matching
✓ Emergency alerts for your type
✓ Compatibility notifications`,
          quickReplies: [
            "Add blood group",
            "Emergency alerts",
            "Request matching",
            "Learn more",
          ],
        };
      }
    }

    if (
      msg.includes("app") ||
      msg.includes("feature") ||
      msg.includes("how to use")
    ) {
      return {
        message: `📱 **Blood Donor App Features:**

**Main Dashboard:**
• Quick stats (requests, donations, impact)
• Emergency request button
• Nearby activities map
• Your donation history

**Key Features:**
🔴 **Emergency Requests** - Instant donor alerts
🗺️ **ArcGIS Maps** - GPS tracking & route planning
💬 **In-app Chat** - Coordinate with donors/recipients
⭐ **Rating System** - Build trust in community
🏥 **Hospital Integration** - Verified medical institutions
📊 **Analytics** - Track your donation impact

**Getting Started:**
1. Complete your profile (blood group, location)
2. Verify identity (phone/email)
3. Browse requests or create your own
4. Start saving lives! 🙏

**Pro Tips:**
• Enable location for better matching
• Keep profile updated
• Respond quickly to urgent requests
• Rate your donation experiences`,
        quickReplies: [
          "Complete profile",
          "Browse requests",
          "Enable GPS",
          "Emergency setup",
        ],
      };
    }

    // Default response with app-specific context
    return {
      message: `🩸 **Welcome to Blood Donor App!**

I'm your AI assistant here to help you save lives through blood donation. Here's what I can help you with:

**Quick Actions:**
🔍 Find compatible donors near you
📝 Create blood donation requests
🚨 Handle emergency blood needs
📍 Locate nearby blood banks & hospitals
💡 Learn about donation process & eligibility
📊 Track your donation impact

**Your Profile:** ${userContext?.name ? `Hello ${userContext.name}!` : "Complete your profile to get started"}
${userContext?.bloodGroup ? `Blood Group: ${userContext.bloodGroup}` : "• Add your blood group for personalized help"}
${userContext?.location ? `Location: ${userContext.location}` : "• Enable location for better matching"}

**Ready to save lives?** Ask me anything about blood donation or use our app features!`,
      quickReplies: [
        "Donation process",
        "Find donors",
        "Emergency help",
        "App features",
      ],
    };
  }

  getCompatibleRecipients(bloodGroup) {
    const compatibility = {
      "A+": "A+, AB+",
      "A-": "A+, A-, AB+, AB-",
      "B+": "B+, AB+",
      "B-": "B+, B-, AB+, AB-",
      "AB+": "AB+ only",
      "AB-": "AB+, AB-",
      "O+": "O+, A+, B+, AB+",
      "O-": "All blood groups (Universal Donor! 🌟)",
    };
    return compatibility[bloodGroup] || "compatible recipients";
  }

  getCompatibleDonors(bloodGroup) {
    const compatibility = {
      "A+": "A+, A-, O+, O-",
      "A-": "A-, O-",
      "B+": "B+, B-, O+, O-",
      "B-": "B-, O-",
      "AB+": "All blood groups (Universal Recipient! 🌟)",
      "AB-": "AB-, A-, B-, O-",
      "O+": "O+, O-",
      "O-": "O- only",
    };
    return compatibility[bloodGroup] || "compatible donors";
  }

  getBloodGroupFacts(bloodGroup) {
    const facts = {
      "A+": "• Most common blood group in India (~22%)\n• Great for helping many people\n• High demand in hospitals",
      "A-": "• Less common (~6% population)\n• Very valuable for emergencies\n• Can help both A+ and A- patients",
      "B+": "• Common in Indian population (~32%)\n• High demand, especially in North India\n• Can donate to B+ and AB+ patients",
      "B-": "• Rare blood group (~2% population)\n• Extremely valuable donation\n• Critical for B- and AB- patients",
      "AB+":
        "• Universal plasma donor\n• Can receive from anyone\n• Rare but valuable for specific cases",
      "AB-":
        "• Very rare blood group (~1%)\n• Precious for medical emergencies\n• Limited donation options make you special",
      "O+": "• Most common blood group (~35%)\n• High demand in all hospitals\n• Can help 4 different blood groups",
      "O-": "• Universal donor - SUPERHERO! 🦸‍♂️\n• Only 6% of population\n• Can save anyone in emergencies",
    };
    return facts[bloodGroup] || "• Every blood group is valuable and needed!";
  }
}

const aiService = new AIService();

// @route   POST /api/ai/chat
// @desc    Generate AI response for chatbot
// @access  Private
router.post("/chat", auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Get user context from the authenticated user
    const userContext = {
      name: req.user.name,
      bloodGroup: req.user.bloodGroup,
      location: req.user.location,
      isHospital: req.user.isHospital || false,
    };

    // Generate AI response
    const response = await aiService.generateResponse(message, userContext);

    res.json({
      success: true,
      data: {
        message: response.message,
        quickReplies: response.quickReplies || [],
        timestamp: new Date().toISOString(),
        provider: aiService.provider,
      },
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate response",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// @route   GET /api/ai/status
// @desc    Check AI service status
// @access  Private
router.get("/status", auth, async (req, res) => {
  try {
    const hasGeminiKey = !!(
      aiService.geminiApiKey &&
      aiService.geminiApiKey !== "your_gemini_api_key_here"
    );
    const hasOpenAIKey = !!(
      aiService.openaiApiKey &&
      aiService.openaiApiKey !== "your_openai_api_key_here"
    );

    res.json({
      success: true,
      data: {
        provider: aiService.provider,
        hasGeminiKey,
        hasOpenAIKey,
        isConfigured: hasGeminiKey || hasOpenAIKey,
        fallbackMode: !hasGeminiKey && !hasOpenAIKey,
      },
    });
  } catch (error) {
    console.error("AI Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get AI status",
    });
  }
});

export default router;
