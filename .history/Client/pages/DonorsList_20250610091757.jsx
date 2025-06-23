// src/pages/DonorList.jsx
import React, { useState } from "react";
import api from "../api/api";

const DonorList = () => {
  const [donors, setDonors] = useState([]);
  const [bloodGroup, setBloodGroup] = useState("");
  const [location, setLocation] = useState("");

  const fetchDonors = async () => {
    const res = await api.get(
      `/users/donors?bloodGroup=${bloodGroup}&location=${location}`
    );
    setDonors(res.data.donors);
  };

  return (
    <div>
      <h2>Find Donors</h2>
      <input
        value={bloodGroup}
        onChange={(e) => setBloodGroup(e.target.value)}
        placeholder="Blood Group"
      />
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location"
      />
      <button onClick={fetchDonors}>Search</button>

      <ul>
        {donors.map((donor) => (
          <li key={donor._id}>
            {donor.name} - {donor.bloodGroup} - {donor.location}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DonorList;
