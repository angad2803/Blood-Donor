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
<Route path="/nearby" element={<NearbyRequests />} />;

function App() {
  const { token } = useContext(AuthContext);

  // Protected route wrapper
  const PrivateRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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

        {/* Default redirect */}
        <Route
          path="/"
          element={
            token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
