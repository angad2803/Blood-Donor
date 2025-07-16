import React, { useState } from "react";
import api from "../api/api.js";

function DonorsList() {
  const [bloodGroup, setBloodGroup] = useState("");
  const [location, setLocation] = useState("");
  const [donors, setDonors] = useState([]);

  const handleSearch = async () => {
    try {
      const res = await api.get("/donors", {
        params: { bloodGroup, location },
      });
      setDonors(res.data.donors);
    } catch (err) {
      console.error(err);
      alert("Error fetching donors");
    }
  };

  return (
    <div>
      <h2>Find Blood Donors</h2>
      <input
        placeholder="Blood Group"
        value={bloodGroup}
        onChange={(e) => setBloodGroup(e.target.value)}
      />
      <input
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      <ul>
        {donors.map((donor) => (
          <li key={donor._id}>
            {donor.name} - {donor.bloodGroup} - {donor.location}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DonorsList;
