"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  TestTube,
  Users,
  AlertTriangle,
} from "lucide-react";

const EmailTestingDashboard = () => {
  const [emailConfig, setEmailConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [testEmail, setTestEmail] = useState("");
  const [queueStatus, setQueueStatus] = useState(null);

  // Load email configuration on component mount
  useEffect(() => {
    loadEmailConfig();
    loadQueueStatus();
  }, []);

  const loadEmailConfig = async () => {
    try {
      const response = await fetch("/api/email/config", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setEmailConfig(data.configuration);
      }
    } catch (error) {
      console.error("Failed to load email config:", error);
    }
  };

  const loadQueueStatus = async () => {
    try {
      const response = await fetch("/api/email/queue/status", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setQueueStatus(data.queueStatus);
      }
    } catch (error) {
      console.error("Failed to load queue status:", error);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ email: testEmail }),
      });

      const data = await response.json();
      setResults((prev) => ({
        ...prev,
        testEmail: data,
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        testEmail: { success: false, error: error.message },
      }));
    }
    setLoading(false);
  };

  const sendVerificationEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/email/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      setResults((prev) => ({
        ...prev,
        verification: data,
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        verification: { success: false, error: error.message },
      }));
    }
    setLoading(false);
  };

  const sendDonationReminders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/email/reminder/donation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      setResults((prev) => ({
        ...prev,
        reminders: data,
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        reminders: { success: false, error: error.message },
      }));
    }
    setLoading(false);
  };

  const queueTestEmail = async (priority = "normal") => {
    if (!testEmail) {
      alert("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/email/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          to: testEmail,
          subject: `Queue Test Email - ${priority} priority`,
          template: "welcome-donor",
          priority: priority,
          data: {
            name: "Queue Test User",
            bloodGroup: "O+",
            location: "Test City",
          },
        }),
      });

      const data = await response.json();
      setResults((prev) => ({
        ...prev,
        queueTest: data,
      }));

      // Refresh queue status
      setTimeout(loadQueueStatus, 1000);
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        queueTest: { success: false, error: error.message },
      }));
    }
    setLoading(false);
  };

  const ResultBadge = ({ result }) => {
    if (!result) return null;

    return (
      <div
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          result.success
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {result.success ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <TestTube className="w-8 h-8 mr-3 text-blue-600" />
            Email System Testing Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Test and monitor your blood donor app email functionality
          </p>
        </div>

        {/* Email Configuration Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Email Configuration Status
          </h2>

          {emailConfig ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                className={`p-4 rounded-lg border ${
                  emailConfig.sendgridConfigured
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center">
                  {emailConfig.sendgridConfigured ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                  )}
                  <span className="font-medium">SendGrid</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {emailConfig.sendgridConfigured
                    ? "Configured"
                    : "Not configured"}
                </p>
              </div>

              <div
                className={`p-4 rounded-lg border ${
                  emailConfig.gmailConfigured
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center">
                  {emailConfig.gmailConfigured ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                  )}
                  <span className="font-medium">Gmail</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {emailConfig.gmailConfigured
                    ? "Configured"
                    : "Not configured"}
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium">From Email</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {emailConfig.fromEmail}
                </p>
              </div>

              <div className="p-4 rounded-lg border bg-purple-50 border-purple-200">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-medium">Support Email</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {emailConfig.supportEmail}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">
                Loading configuration...
              </span>
            </div>
          )}
        </div>

        {/* Email Queue Status */}
        {queueStatus && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Email Queue Status
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {queueStatus.waiting}
                </div>
                <p className="text-sm text-gray-600">Waiting</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {queueStatus.active}
                </div>
                <p className="text-sm text-gray-600">Active</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {queueStatus.completed}
                </div>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {queueStatus.failed}
                </div>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Email Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Email Address</h2>
          <div className="flex items-center space-x-4">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter test email address"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Email Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Email Tests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Send className="w-5 h-5 mr-2" />
              Basic Email Tests
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Send Test Email</h3>
                  <p className="text-sm text-gray-600">
                    Send a simple test email
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <ResultBadge result={results.testEmail} />
                  <button
                    onClick={sendTestEmail}
                    disabled={loading || !testEmail}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Email Verification</h3>
                  <p className="text-sm text-gray-600">
                    Send verification email to your account
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <ResultBadge result={results.verification} />
                  <button
                    onClick={sendVerificationEmail}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Verify"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Donation Reminders</h3>
                  <p className="text-sm text-gray-600">
                    Send batch donation reminders
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <ResultBadge result={results.reminders} />
                  <button
                    onClick={sendDonationReminders}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Queue Tests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Queue Tests
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Normal Priority</h3>
                  <p className="text-sm text-gray-600">
                    Queue email with normal priority
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <ResultBadge result={results.queueTest} />
                  <button
                    onClick={() => queueTestEmail("normal")}
                    disabled={loading || !testEmail}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Queuing..." : "Queue"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">High Priority</h3>
                  <p className="text-sm text-gray-600">
                    Queue email with high priority
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => queueTestEmail("high")}
                    disabled={loading || !testEmail}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                  >
                    {loading ? "Queuing..." : "Queue"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Refresh Queue Status</h3>
                  <p className="text-sm text-gray-600">
                    Update queue statistics
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={loadQueueStatus}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Display */}
        {Object.keys(results).length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-4">
              {Object.entries(results).map(([key, result]) => (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </h3>
                    <ResultBadge result={result} />
                  </div>
                  <div className="text-sm text-gray-600">
                    <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📧 Email Testing Instructions
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Configuration:</strong> Ensure SendGrid or Gmail is
              properly configured in your environment variables.
            </p>
            <p>
              <strong>Test Email:</strong> Enter a valid email address to
              receive test emails.
            </p>
            <p>
              <strong>Queue Status:</strong> Monitor email queue performance and
              delivery status.
            </p>
            <p>
              <strong>Debugging:</strong> Check the console and server logs for
              detailed error information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTestingDashboard;
