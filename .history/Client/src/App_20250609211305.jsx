import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DonorsList from "./components/DonorsList";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DonorsList />} />
        {/* Add Register, Login, Profile pages later */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
