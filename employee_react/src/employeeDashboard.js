import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import Sidebar from './sidebar';
import Employee from './employee';
import Attendance from './attendance';
import Leave from './leave';
import Home from './Home';
import ImportEmployees from './ImportEmployees';
import SalaryPanel from './SalaryPanel';
import DepartmentManager from './DepartmentManager';
import DesignationManager from './DesignationManager';
import AssignDetails from './AssignDetails';
import MyDetails from './MyDetails';
import './employeeDashboard.css';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [employee, setEmployee] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  useEffect(() => {
    const storedEmployee = localStorage.getItem('employee');
    const defaultTab = localStorage.getItem('activeTab') || 'home';

    if (storedEmployee) {
      const parsed = JSON.parse(storedEmployee);
      parsed.role = parsed.role?.toLowerCase();
      setEmployee(parsed);
      setSelectedEmployeeId(parsed.id);
    } else {
      setEmployee(false);
    }

    setActiveTab(defaultTab);
    localStorage.removeItem('activeTab');
  }, []);

  if (employee === null) return null;
  if (!employee) return <Navigate to="/login" />;

  const isHR = employee.role === 'hr';
  const isAdmin = employee.role === 'admin';
  const isHRorAdmin = isHR || isAdmin;

  const handleAssignEmployee = (empId) => {
    setSelectedEmployeeId(empId);
    setActiveTab('assign');
  };

  const handleViewEmployee = (empId) => {
    setSelectedEmployeeId(empId);
    setActiveTab('mydetails');
  };

  return (
    <div className="container-fluid p-0">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="dashboard-wrapper">
        <div className="dashboard-header">
          <h4>Employee Dashboard</h4>
          <span>
            Welcome, <strong>{employee.name}</strong> ({employee.role})
          </span>
        </div>

        <div className="dashboard-body">
          <div className="card-responsive">
            {activeTab === 'home' && <Home employee={employee} />}

            {activeTab === 'employee' && (
              <>
                {isHRorAdmin && (
                  <>
                    {isAdmin && (
                      <ImportEmployees onImportDone={() => setRefresh(!refresh)} />
                    )}
                    <Employee
                      employeeRole={employee.role}
                      refresh={refresh}
                      onAssignClick={handleAssignEmployee}
                      onViewClick={handleViewEmployee}
                    />
                  </>
                )}
                {employee.role === 'employee' && (
                  <Employee
                    employeeRole={employee.role}
                    employeeId={employee.id}
                    refresh={refresh}
                    singleView={true}
                    onAssignClick={handleAssignEmployee}
                    onViewClick={handleViewEmployee}
                  />
                )}
              </>
            )}

            {activeTab === 'attendance' && <Attendance />}
            {activeTab === 'leave' && <Leave employee={employee} />}
            {activeTab === 'salary' && <SalaryPanel employeeId={employee.id} />}
            {activeTab === 'department' && isHRorAdmin && <DepartmentManager />}
            {activeTab === 'designation' && isHRorAdmin && <DesignationManager />}
            {activeTab === 'assign' && isHRorAdmin && <AssignDetails employeeId={selectedEmployeeId} />}
            {activeTab === 'mydetails' && <MyDetails employeeId={selectedEmployeeId} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
