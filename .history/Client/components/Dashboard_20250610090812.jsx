import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Dashboard from "../pages/Dashboard";

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      <h1>Welcome, {user?.name || "User"}!</h1>
      <p>Email: {user?.email}</p>
      <p>Blood Group: {user?.bloodGroup}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;
