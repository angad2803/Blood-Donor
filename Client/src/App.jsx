import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "../components/Login";
import { AuthContext } from "../context/AuthContext";
import Dashboard from "../pages/Dashboard";
import CreateRequest from "../pages/CreateRequest";
import DonorList from "../pages/DonorsList";
import Register from "../pages/Register";
import RequestForm from "../pages/RequestForm";
import NearbyRequests from "../pages/NearbyRequests";
import HospitalRequests from "../pages/HospitalRequests";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MatchedRequests from "../pages/MatchedRequests";
import ChatPage from "../pages/ChatPage";
import OAuthSuccess from "../pages/OAuthSuccess";
import CompleteProfile from "../pages/CompleteProfile";
import AccountTypeSelection from "../pages/AccountTypeSelection";
import SessionManager from "../components/SessionManager";
import GeolocationTest from "../pages/GeolocationTest";
import ErrorBoundary from "../components/ErrorBoundary";

function App() {
  const { token, isLoading } = useContext(AuthContext);

  // Show loading while checking authentication state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  // Protected route wrapper
  const PrivateRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <ErrorBoundary>
      <Router>
        <>
          <SessionManager />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route
              path="/account-type-selection"
              element={<AccountTypeSelection />}
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route path="/request" element={<RequestForm />} />
            <Route path="/nearby" element={<NearbyRequests />} />
            <Route path="/nearby-requests" element={<NearbyRequests />} />
            <Route path="/match" element={<MatchedRequests />} />
            <Route
              path="/chat/:requestId"
              element={
                <PrivateRoute>
                  <ChatPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/create-request"
              element={
                <PrivateRoute>
                  <CreateRequest />
                </PrivateRoute>
              }
            />
            <Route
              path="/donors"
              element={
                <PrivateRoute>
                  <DonorList />
                </PrivateRoute>
              }
            />

            {/* Hospital-specific routes */}
            <Route
              path="/hospital/requests"
              element={
                <PrivateRoute>
                  <HospitalRequests />
                </PrivateRoute>
              }
            />

            {/* Geolocation Testing Page */}
            <Route
              path="/geolocation-test"
              element={
                <PrivateRoute>
                  <GeolocationTest />
                </PrivateRoute>
              }
            />

            {/* Default redirect */}
            <Route
              path="/"
              element={
                token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
              }
            />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
