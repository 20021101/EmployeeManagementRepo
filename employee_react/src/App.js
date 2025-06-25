import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import EmployeeDashboard from './employeeDashboard';
import Attendance from './attendance';
import Leave from './leave';
import EmployeeCRUD from './employee';
import ProtectedRoute from './ProtectedRoute';
import EmployeeLogin from './employeeLogin';
import Navbar from './navbar';
import Sidebar from './sidebar';
import MyDetails from './MyDetails';
import AssignDetails from './AssignDetails';
import HRDashboard from './HRDashboard';
import HRReports from './HRReports';

import axios from 'axios';
import './theme.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

//  Updated layout using Flexbox
const Layout = ({ handleLogout, activeTab, setActiveTab }) => (
  <div className="app-layout">
    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
    <div className="main-area">
      <Navbar handleLogout={handleLogout} />
      <div className="content-wrapper">
        <Outlet />
      </div>
    </div>
  </div>
);

function App() {
  const [employee, setEmployee] = useState(undefined);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const storedEmployee = JSON.parse(localStorage.getItem('employee'));
    if (storedEmployee) {
      console.log("Loaded from localStorage:", storedEmployee);
      setEmployee(storedEmployee);
    } else {
      setEmployee(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employee');
    setEmployee(null);
  };

  if (employee === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            employee ? (
              employee.role?.toLowerCase() === 'hr' ? (
                <Navigate to="/hr-dashboard" />
              ) : (
                <Navigate to="/employee-dashboard" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={
            employee ? (
              employee.role?.toLowerCase() === 'hr' ? (
                <Navigate to="/hr-dashboard" />
              ) : (
                <Navigate to="/employee-dashboard" />
              )
            ) : (
              <EmployeeLogin setEmployee={setEmployee} />
            )
          }
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <Layout
                handleLogout={handleLogout}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            }
          >
            <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leave" element={<Leave employee={employee} role={employee?.role} />} />
            <Route path="/salary" element={<div>Salary Component Placeholder</div>} />
            <Route path="/hr-dashboard" element={<HRDashboard />} />
            <Route
              path="/employee-crud"
              element={
                employee?.role ? <EmployeeCRUD employeeRole={employee.role} /> : <div>Loading role...</div>
              }
            />
            <Route path="/employee/:id/assign" element={<AssignDetails />} />
            <Route path="/my-details" element={<MyDetails />} />
            <Route path="/hrreports" element={<HRReports />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
