import React from "react";
import { Navigate } from "react-router-dom";

const RoleSelection = () => {
  // This page is not needed since role selection is integrated into the register page
  return <Navigate to="/register" />;
};

export default RoleSelection;
