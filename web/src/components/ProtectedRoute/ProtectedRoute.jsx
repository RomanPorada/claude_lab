import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children }) {
  const user = useSelector((state) => state.user);
  
  const isAuthenticated = user || localStorage.getItem("user_email");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
