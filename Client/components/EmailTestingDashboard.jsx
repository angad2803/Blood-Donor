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
                  <span className="font-medium">Gmail SMTP</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {emailConfig.gmailConfigured
                    ? "Configured"
                    : "Not configured"}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="font-medium">From Email</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {emailConfig.fromEmail}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="font-medium">Support Email</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {emailConfig.supportEmail}
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-pulse bg-gray-200 rounded h-20"></div>
          )}

          {emailConfig && !emailConfig.hasValidConfig && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800">
                  No Email Service Configured
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Configure SendGrid or Gmail SMTP in your .env file to enable
                real email sending.
              </p>
            </div>
          )}
        </div>

        {/* Queue Status */}
        {queueStatus && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Email Queue Status
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
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
                    {loading ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Donation Reminders</h3>
                  <p className="text-sm text-gray-600">
                    Send reminders to eligible donors
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
              <Clock className="w-5 h-5 mr-2" />
              Queue Email Tests
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">High Priority Queue</h3>
                  <p className="text-sm text-gray-600">
                    Test high priority email queue
                  </p>
                </div>
                <button
                  onClick={() => queueTestEmail("high")}
                  disabled={loading || !testEmail}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Queue High
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Normal Priority Queue</h3>
                  <p className="text-sm text-gray-600">
                    Test normal priority email queue
                  </p>
                </div>
                <button
                  onClick={() => queueTestEmail("normal")}
                  disabled={loading || !testEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Queue Normal
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Low Priority Queue</h3>
                  <p className="text-sm text-gray-600">
                    Test low priority email queue
                  </p>
                </div>
                <button
                  onClick={() => queueTestEmail("low")}
                  disabled={loading || !testEmail}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  Queue Low
                </button>
              </div>

              {results.queueTest && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">
                    <strong>Queue Result:</strong>{" "}
                    {results.queueTest.success ? "Success" : "Failed"}
                  </p>
                  {results.queueTest.jobId && (
                    <p className="text-sm text-gray-600">
                      Job ID: {results.queueTest.jobId}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {Object.keys(results).length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-3">
              {Object.entries(results).map(([key, result]) => (
                <div key={key} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <ResultBadge result={result} />
                  </div>
                  {result.message && (
                    <p className="text-sm text-gray-600 mt-1">
                      {result.message}
                    </p>
                  )}
                  {result.error && (
                    <p className="text-sm text-red-600 mt-1">{result.error}</p>
                  )}
                  {result.provider && (
                    <p className="text-sm text-blue-600 mt-1">
                      Provider: {result.provider}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTestingDashboard;
