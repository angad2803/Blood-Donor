import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Profile = () => {
  const { user } = useContext(AuthContext);

  if (!user) return <div className="p-8">Not logged in.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-blue-700 mb-6">
          Profile
        </h2>
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Name:</span> {user.name}
          </div>
          <div>
            <span className="font-semibold">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-semibold">Blood Group:</span>{" "}
            {user.bloodGroup}
          </div>
          <div>
            <span className="font-semibold">Location:</span> {user.location}
          </div>
          <div>
            <span className="font-semibold">Donor:</span>{" "}
            {user.isDonor ? "Yes" : "No"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
