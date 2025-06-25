import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('employee');
      setEmployee(stored ? JSON.parse(stored) : false);
    } catch (err) {
      setEmployee(false);
    }
  }, []);


  if (employee === null) return null;

  if (!employee) {
    return <Navigate to="/login" />;
  }

  // Both admin and employee can access the protected route
  return <Outlet />;
};

export default ProtectedRoute;
