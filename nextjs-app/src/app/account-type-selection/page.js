"use client";
import ProtectedRoute from "../../components/ProtectedRoute";
import AccountTypeSelection from "../../components/AccountTypeSelection";

export default function AccountTypeSelectionPage() {
  return (
    <ProtectedRoute>
      <AccountTypeSelection />
    </ProtectedRoute>
  );
}
