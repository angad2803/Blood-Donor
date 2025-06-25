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
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MatchedRequests from "../pages/MatchedRequests";
import ChatPage from "../pages/ChatPage";
import OAuthSuccess from "../pages/OAuthSuccess";
import CompleteProfile from "../pages/CompleteProfile";

function App() {
  const { token } = useContext(AuthContext);

  // Protected route wrapper
  const PrivateRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

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
          <Route
            path="/complete-profile"
            element={
              <PrivateRoute>
                <CompleteProfile />
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
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    </Router>
  );
}

export default App;
