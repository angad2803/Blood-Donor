import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // On token change, fetch user info or logout
  useEffect(() => {
    if (token) {
      // Optional: fetch user profile from backend to verify token & get user details
      axios
        .get("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data))
        .catch(() => {
          logout();
        });
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post("/api/auth/login", { email, password });
    setToken(res.data.token);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const register = async (userData) => {
    const res = await axios.post("/api/auth/register", userData);
    setToken(res.data.token);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
