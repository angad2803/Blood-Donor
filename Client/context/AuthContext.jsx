import React, { createContext, useState, useEffect } from "react";
import api from "../api/api.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tabId] = useState(
    () => `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  ); // Generate unique tab ID

  // Load user and token from sessionStorage first, then localStorage as fallback
  useEffect(() => {
    // First check sessionStorage (tab-specific)
    const sessionToken = sessionStorage.getItem("token");
    const sessionUser = sessionStorage.getItem("user");

    if (sessionToken && sessionUser) {
      setUser(JSON.parse(sessionUser));
      setToken(sessionToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${sessionToken}`;
      setIsLoading(false);
      return;
    }

    // Fallback to localStorage (shared across tabs)
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      // Verify token is still valid
      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      api
        .get("/user/me")
        .then((res) => {
          const userData = res.data.user;
          setUser(userData);
          setToken(storedToken);
          // Store in sessionStorage for this tab
          sessionStorage.setItem("token", storedToken);
          sessionStorage.setItem("user", JSON.stringify(userData));
        })
        .catch(() => {
          // Token is invalid, clear storage
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          delete api.defaults.headers.common["Authorization"];
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Only respond to logout events from other tabs
      if (e.key === "token" && e.newValue === null && user) {
        // Another tab logged out, so log out this tab too
        setUser(null);
        setToken(null);
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        delete api.defaults.headers.common["Authorization"];
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  // Check for multiple active sessions
  useEffect(() => {
    if (user && token) {
      // Store active tab info
      const tabInfo = {
        tabId,
        userId: user._id,
        userName: user.name,
        timestamp: Date.now(),
      };

      // Store in localStorage to communicate with other tabs
      const activeTabs = JSON.parse(localStorage.getItem("activeTabs") || "[]");
      const filteredTabs = activeTabs.filter(
        (tab) => tab.userId === user._id && Date.now() - tab.timestamp < 60000 // Remove tabs older than 1 minute
      );

      const updatedTabs = [...filteredTabs, tabInfo];
      localStorage.setItem("activeTabs", JSON.stringify(updatedTabs));

      // Clean up on unmount
      return () => {
        const currentTabs = JSON.parse(
          localStorage.getItem("activeTabs") || "[]"
        );
        const cleanedTabs = currentTabs.filter((tab) => tab.tabId !== tabId);
        localStorage.setItem("activeTabs", JSON.stringify(cleanedTabs));
      };
    }
  }, [user, token, tabId]);

  // Login function
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });

      const { token, user } = res.data;

      // Save to both localStorage and sessionStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(user));

      // Set token for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update context
      setUser(user);
      setToken(token);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  };

  // Login function for OAuth (to be called from OAuthSuccess)
  const loginWithToken = (token, userData) => {
    // Save to both localStorage and sessionStorage
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(userData));

    // Set token for future requests
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Update context
    setUser(userData);
    setToken(token);
  };

  // Logout function with option to logout from all tabs
  const logout = (allTabs = true) => {
    if (allTabs) {
      // Clear localStorage to logout from all tabs
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    // Always clear sessionStorage for current tab
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    setToken(null);
  };

  // Separate function to logout only current tab
  const logoutCurrentTab = () => logout(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        logoutCurrentTab,
        loginWithToken,
        isLoading,
        tabId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
