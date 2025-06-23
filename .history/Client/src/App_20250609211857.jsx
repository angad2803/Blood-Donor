import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import DonorsList from "./DonorsList";
import ProtectedRoute from "./ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* Protected routes */}
          <Route
            path="/donors"
            element={
              <ProtectedRoute>
                <DonorsList />
              </ProtectedRoute>
            }
          />
          {/* Add more protected routes here */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
// This is the main entry point of the React application.
