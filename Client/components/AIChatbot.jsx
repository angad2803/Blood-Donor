import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import aiService from '../services/aiService';

const AIChatbot = ({ isOpen, onClose, user }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      message: "Hi! I'm your Blood Donation Assistant. How can I help you today?",
      timestamp: new Date(),
      quickReplies: [
        "How to donate blood?",
        "Find nearby donors",
        "Check eligibility",
        "Emergency help"
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);

  // GSAP Animations
  useEffect(() => {
    if (isOpen && chatRef.current) {
      gsap.fromTo(chatRef.current, 
        { 
          opacity: 0, 
          scale: 0.8, 
          y: 50 
        },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.4, 
          ease: "back.out(1.7)" 
        }
      );
    }
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // AI Response Generator using real AI API
  const generateAIResponse = async (userMessage) => {
    try {
      // Use real AI service with user context
      const userContext = {
        name: user?.name,
        bloodGroup: user?.bloodGroup,
        location: user?.location,
        isHospital: user?.isHospital
      };
      
      // Try AI API first, fallback to mock responses if no API key
      if (aiService.apiKey || aiService.geminiApiKey) {
        return await aiService.generateResponse(userMessage, userContext);
      } else {
        // Fallback to mock responses if no API key configured
        return getMockResponse(userMessage);
      }
    } catch (error) {
      console.error('AI Response Error:', error);
      return getMockResponse(userMessage);
    }
  };

  // Fallback mock responses (used when no AI API is configured)
  const getMockResponse = (userMessage) => {
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
        message: `Based on your location (${user?.location || 'your area'}), I can help you find:\n\n🩸 Available donors\n🏥 Nearby hospitals\n🌡️ Blood banks\n📍 Donation centers\n\nWhat are you looking for?`,
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
        message: `Your blood group is ${user?.bloodGroup || 'not specified'}.\n\nBlood compatibility:\n• Universal donors: O-\n• Universal recipients: AB+\n• Your compatibility depends on your specific blood type.\n\nWould you like to learn more about blood compatibility?`,
        quickReplies: ["Blood compatibility chart", "Who can I donate to?", "Who can donate to me?"]
      };
    }

    // Default response
    return {
      message: "I understand you're asking about blood donation. Here are some ways I can help:\n\n• Guide you through the donation process\n• Check donor eligibility\n• Find nearby donors or centers\n• Handle emergency requests\n• Answer medical questions\n\nWhat would you like to know more about?",
      quickReplies: ["Donation process", "Find donors", "Emergency help", "Medical questions"]
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(async () => {
      const aiResponse = await generateAIResponse(inputMessage);
      
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        message: aiResponse.message,
        timestamp: new Date(),
        quickReplies: aiResponse.quickReplies
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickReply = (reply) => {
    setInputMessage(reply);
    setTimeout(() => handleSendMessage(), 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        ref={chatRef}
        className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col relative overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.95) 0%, 
              rgba(248, 250, 252, 0.98) 100%
            )
          `,
          boxShadow: `
            0 25px 50px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.3)
          `
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold">Blood Donation Assistant</h3>
                <p className="text-xs opacity-90">
                  {aiService.apiKey || aiService.geminiApiKey ? 'AI Powered' : 'Smart Assistant'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-3 ${
                msg.type === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm whitespace-pre-line">{msg.message}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {/* Quick Replies */}
                {msg.quickReplies && msg.type === 'bot' && (
                  <div className="mt-3 space-y-2">
                    {msg.quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickReply(reply)}
                        className="block w-full text-left text-xs bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors border border-gray-200"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl p-3 max-w-[80%]">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything about blood donation..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full p-2 hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
