import React from 'react';
import { Link } from 'react-router-dom';
import './navbar.css';

const Navbar = ({ handleLogout }) => {
  const employee = JSON.parse(localStorage.getItem('employee'));

  return (
    <nav className="navbar navbar-expand-lg custom-navbar shadow-sm">
      <div className="container-fluid d-flex align-items-center justify-content-between">
        
        {/* ☰ Sidebar Toggle */}
        <button
          className="btn btn-outline-light d-lg-none me-2"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#sidebarMenu"
          aria-controls="sidebarMenu"
        >
          ☰
        </button>

        {/* Logo */}
        <Link className="navbar-brand d-flex align-items-center" to="/employee-dashboard">
          <img src="/logo-BDEWyTls.png" alt="Logo" height="40" className="me-2" />
          <span className="d-none d-sm-inline">Dashboard</span>
        </Link>

        {/* Welcome + Logout */}
        <div className="d-flex align-items-center ms-auto">
          {employee && (
            <span className="text-white me-3 welcome-msg text-truncate">
              Welcome, <strong>{employee.name}</strong> ({employee.role})
            </span>
          )}
          <Link to="/login" className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            Logout
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
