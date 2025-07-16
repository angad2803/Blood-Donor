"use client";

import React from "react";
import { useRouter } from "next/navigation";

const Home = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/login");
  };

  const handleLearnMore = () => {
    router.push("/register");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
              🩸 Blood Donor
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connecting life-savers with those in need. Save lives through our
            modern blood donation platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              Get Started
            </button>
            <button
              onClick={handleLearnMore}
              className="px-8 py-4 bg-white text-red-600 font-semibold rounded-lg border-2 border-red-600 hover:bg-red-50 transition-colors shadow-lg"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">🏥</div>
            <h3 className="text-xl font-semibold mb-2">For Hospitals</h3>
            <p className="text-gray-600">
              Post urgent blood requests and connect with verified donors
              instantly.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">🧑‍⚕️</div>
            <h3 className="text-xl font-semibold mb-2">For Donors</h3>
            <p className="text-gray-600">
              Find nearby blood requests and make a difference in someone's
              life.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-xl font-semibold mb-2">Location-Based</h3>
            <p className="text-gray-600">
              Smart matching based on location, blood type, and urgency levels.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-white rounded-xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-3xl font-bold text-center mb-8">
            Platform Impact
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">500+</div>
              <div className="text-gray-600">Lives Saved</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">1000+</div>
              <div className="text-gray-600">Registered Donors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
              <div className="text-gray-600">Partner Hospitals</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Save Lives?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join our community of heroes making a difference every day.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-12 py-4 bg-gradient-to-r from-red-600 to-blue-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-blue-700 transition-all shadow-lg transform hover:scale-105"
          >
            Start Your Journey
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
