import React, { useEffect, useState } from 'react';
import './sidebar.css';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [employee, setEmployee] = useState(null);
  const navigate = useNavigate();

  // Load employee & activeTab on first mount and redirect
  useEffect(() => {
    const storedEmployee = localStorage.getItem('employee');
    const storedActiveTab = localStorage.getItem('activeTab') || 'home';

    if (storedEmployee) {
      try {
        const parsedEmployee = JSON.parse(storedEmployee);
        setEmployee(parsedEmployee);

        const role = parsedEmployee.role?.toLowerCase() || '';
        setActiveTab(storedActiveTab);

        // Redirect based on last active tab
        switch (storedActiveTab) {
          case 'home':
            if (role === 'hr') {
              navigate('/hr-dashboard');
            } else {
              navigate('/employee-dashboard');
            }
            break;
          case 'employee':
            navigate('/employee-crud');
            break;
          case 'attendance':
            navigate('/attendance');
            break;
          case 'leave':
            navigate('/leave');
            break;
          case 'salary':
            navigate('/salary');
            break;
          case 'departments':
            navigate('/departments');
            break;
          case 'designations':
            navigate('/designations');
            break;
          case 'assign':
            navigate('/employee/1/assign');
            break;
          case 'hrreports':
            navigate('/hrreports');
            break;
          case 'analytics':
            navigate('/hr-analytics');
            break;
          case 'mydetails':
            navigate('/my-details');
            break;
          default:
            navigate('/employee-dashboard');
            break;
        }
      } catch (error) {
        console.warn("Invalid employee data in localStorage:", error);
      }
    }
  }, []);

  const role = employee?.role?.toLowerCase() || '';
  const isHRorAdmin = role === 'hr' || role === 'admin';

  // Handle tab click and navigate
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);

    switch (tab) {
      case 'home':
        if (role === 'hr') {
          navigate('/hr-dashboard');
        } else {
          navigate('/employee-dashboard');
        }
        break;
      case 'employee':
        navigate('/employee-crud');
        break;
      case 'attendance':
        navigate('/attendance');
        break;
      case 'leave':
        navigate('/leave');
        break;
      case 'salary':
        navigate('/salary');
        break;
      case 'departments':
        navigate('/departments');
        break;
      case 'designations':
        navigate('/designations');
        break;
      case 'assign':
        navigate('/employee/1/assign');
        break;
      case 'hrreports':
        navigate('/hrreports');
        break;
      case 'analytics':
        navigate('/hr-analytics');
        break;
      case 'mydetails':
        navigate('/my-details');
        break;
      default:
        break;
    }

    // Close mobile sidebar if open
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

  // Navigation items to show
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'employee', label: 'Employee' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leave', label: 'Leave' },
    { id: 'salary', label: 'Salary' },
    ...(isHRorAdmin ? [
      { id: 'departments', label: 'Departments' },
      { id: 'designations', label: 'Designations' },
      { id: 'assign', label: 'Assign Details' }
    ] : []),
    ...(role === 'hr' ? [
      { id: 'hrreports', label: 'HR Reports' },
      { id: 'analytics', label: 'Analytics' }
    ] : []),
    { id: 'mydetails', label: 'My Details' }
  ];

  // Render nav items
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
      {/* Mobile Toggle Button */}
      <button
        className="btn btn-primary d-lg-none m-2"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#sidebarMenuMobile"
        aria-controls="sidebarMenuMobile"
      >
        ☰ Menu
      </button>

      {/* Mobile Offcanvas Sidebar */}
      <div
        className="offcanvas offcanvas-start d-lg-none"
        tabIndex="-1"
        id="sidebarMenuMobile"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Dashboard</h5>
          <button
            type="button"
            className="btn-close"
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

      {/* Desktop Sidebar */}
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
