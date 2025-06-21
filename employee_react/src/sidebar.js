import React, { useEffect, useState } from 'react';
import './sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const storedEmployee = localStorage.getItem('employee');
    if (storedEmployee) {
      try {
        setEmployee(JSON.parse(storedEmployee));
      } catch (error) {
        console.warn("Invalid employee data in localStorage:", error);
      }
    }
  }, []);

  const role = employee?.role?.toLowerCase() || '';
  const isHRorAdmin = role === 'hr' || role === 'admin';

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);

    const sidebar = document.getElementById('sidebarMenuMobile');
    if (sidebar && window.bootstrap?.Offcanvas) {
      try {
        const offcanvas = window.bootstrap.Offcanvas.getOrCreateInstance(sidebar);
        offcanvas.hide();
      } catch (e) {
        console.warn("Offcanvas error:", e);
      }
    }
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'employee', label: 'Employee' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leave', label: 'Leave' },
    { id: 'salary', label: 'Salary' },
    ...(isHRorAdmin ? [
      { id: 'department', label: 'Departments' },
      { id: 'designation', label: 'Designations' },
      { id: 'assign', label: 'Assign Details' }
    ] : []),
    ...(role === 'hr' ? [
      { id: 'hrreports', label: 'HR Reports' }
    ] : []),
    { id: 'mydetails', label: 'My Details' }
  ];

  const renderNavItems = () =>
    navItems.map(tab => (
      <li className="nav-item" key={tab.id}>
        <button
          className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => handleTabClick(tab.id)}
        >
          {tab.label}
        </button>
      </li>
    ));

  return (
    <>
      {/* ✅ Mobile Toggle Button */}
      <button
        className="btn btn-primary d-lg-none m-2"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#sidebarMenuMobile"
        aria-controls="sidebarMenuMobile"
      >
        ☰ Menu
      </button>

      {/* ✅ Mobile Offcanvas Sidebar */}
      <div
        className="offcanvas offcanvas-start d-lg-none"
        tabIndex="-1"
        id="sidebarMenuMobile"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title text-white">Dashboard</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body">
          <ul className="nav flex-column">
            {renderNavItems()}
          </ul>
        </div>
      </div>

      {/* ✅ Desktop Sidebar (hidden on small screens) */}
      <div className="sidebar-static d-none d-lg-block">
        <div className="sidebar-title">Dashboard</div>
        <ul className="nav flex-column px-3">
          {renderNavItems()}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
