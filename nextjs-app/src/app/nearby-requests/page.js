"use client";
import ProtectedRoute from "../../components/ProtectedRoute";
import NearbyRequests from "../../components/NearbyRequests";

export default function NearbyRequestsPage() {
  return (
    <ProtectedRoute>
      <NearbyRequests />
    </ProtectedRoute>
  );
}
