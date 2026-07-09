import React, { useContext, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "../components/auth/Login";
import { AuthContext } from "../context/AuthContext";
import useThemeStore from "../stores/themeStore";
import "./styles/swiper-carousel.css";
import GSAPDemo from "../components/ui/GSAPDemo";
import GSAPDemoSimple from "../components/ui/GSAPDemoSimple";
import GSAPDemoTest from "../components/ui/GSAPDemoTest";
import Dashboard from "../pages/dashboard/Dashboard";
import CreateRequest from "../pages/requests/CreateRequest";
import DonorList from "../pages/requests/DonorsList";
import Register from "../pages/auth/Register";
import RequestForm from "../pages/requests/RequestForm";
import NearbyRequests from "../pages/requests/NearbyRequests";
import HospitalRequests from "../pages/requests/HospitalRequests";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MatchedRequests from "../pages/requests/MatchedRequests";
import OAuthSuccess from "../pages/auth/OAuthSuccess";
import CompleteProfile from "../pages/auth/CompleteProfile";
import AccountTypeSelection from "../pages/auth/AccountTypeSelection";
import SessionManager from "../components/auth/SessionManager";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import AdminCleanup from "../components/admin/AdminCleanup";
import Admin from "../pages/admin/Admin";
import LandingPage from "../pages/landing/LandingPage";
import ChatPage from "../pages/ChatPage";
import { useTranslation } from "react-i18next";

function App() {
  const { token, isLoading } = useContext(AuthContext);
  const { initializeTheme } = useThemeStore();
  const { t } = useTranslation();


  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);


  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">{t("loading", "Loading...")}</div>
      </div>
    );
  }


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
            <Route path="/gsap-demo" element={<GSAPDemo />} />
            <Route path="/gsap-simple" element={<GSAPDemoSimple />} />
            <Route path="/gsap-test" element={<GSAPDemoTest />} />
            <Route
              path="/account-type-selection"
              element={<AccountTypeSelection />}
            />

            {}
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

            {}
            <Route
              path="/hospital/requests"
              element={
                <PrivateRoute>
                  <HospitalRequests />
                </PrivateRoute>
              }
            />



            {}
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <Admin />
                </PrivateRoute>
              }
            />

            {}
            <Route
              path="/admin-cleanup"
              element={
                <PrivateRoute>
                  <AdminCleanup />
                </PrivateRoute>
              }
            />

            {/* Landing page — always accessible */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Chat Route */}
            <Route
              path="/chat/:requestId"
              element={
                <PrivateRoute>
                  <ChatPage />
                </PrivateRoute>
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
