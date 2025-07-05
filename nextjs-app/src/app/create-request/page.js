"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import CreateRequest from "../../components/CreateRequest";

export default function CreateRequestPage() {
  return (
    <ProtectedRoute>
      <CreateRequest />
    </ProtectedRoute>
  );
}
