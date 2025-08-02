import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './HRReports.css';
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8000';


const HRReports = () => {
  const [employees, setEmployees] = useState([]);
  const [reports, setReports] = useState({});  
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const token = localStorage.getItem('employeeToken');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchMonthlyReport = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/hr/monthly-report?month=${month}&year=${year}`, 
        {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  }

      );
      const sortedEmployees = res.data.sort((a, b) => a.employee.id - b.employee.id);
      const empList = sortedEmployees.map(r => r.employee);
      const tempReports = {};
      sortedEmployees.forEach(item => {
        tempReports[item.employee.id] = {
          attendance: item.attendance,
          leave: item.leave,
          salary: item.salary
        };
      });
      setEmployees(empList);
      setReports(tempReports);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching monthly report:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMonthlyReport();
  }, [month, year]);

  const filteredEmployees = employees.filter(emp => {
    const deptMatch = selectedDepartment === '' || emp.department_id === parseInt(selectedDepartment);
    const desgMatch = selectedDesignation === '' || emp.designation_id === parseInt(selectedDesignation);
    return deptMatch && desgMatch;
  });

  const departments = [...new Map(employees.map(emp => [emp.department?.id, emp.department])).values()].filter(Boolean);
  const designations = [...new Map(employees.map(emp => [emp.designation?.id, emp.designation])).values()].filter(Boolean);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const currentEmployees = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getAttendancePercentage = (present, total) => {
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="hr-dashboard-container">
      <div className="hrreport-header">
        <div className="header-content">
          <h1>HR Monthly Reports</h1>
          <div className="header-actions">
            <div className="date-filters">
              <select 
                value={month} 
                onChange={(e) => setMonth(parseInt(e.target.value))} 
                className="form-select-sm"
              >
                {[...Array(12).keys()].map(m => (
                  <option key={m + 1} value={m + 1}>
                    {new Date(2000, m, 1).toLocaleString('default', { month: 'short' })}
                  </option>
                ))}
              </select>
              <select 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))} 
                className="form-select-sm"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button className="refresh-btn" onClick={fetchMonthlyReport}>
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
        <div className="secondary-filters">
          <select 
            value={selectedDepartment} 
            onChange={(e) => setSelectedDepartment(e.target.value)} 
            className="form-select"
          >
            <option value="">All Departments</option>
            {departments.map(dep => (
              <option key={dep.id} value={dep.id}>{dep.name}</option>
            ))}
          </select>
          <select 
            value={selectedDesignation} 
            onChange={(e) => setSelectedDesignation(e.target.value)} 
            className="form-select"
          >
            <option value="">All Designations</option>
            {designations.map(des => (
              <option key={des.id} value={des.id}>{des.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading employee data...</p>
          </div>
        ) : (
          <>
            <div className="data-table-container">
              <table className="employee-data-table">
                <thead>
                  <tr>
                    <th className="employee-col">Employee</th>
                    <th className="position-col">Position</th>
                    <th className="attendance-col">Attendance</th>
                    <th className="leave-col">Leave Status</th>
                    <th className="salary-col">Salary Breakdown</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.length === 0 ? (
                    <tr className="no-data-row">
                      <td colSpan="6">
                        <div className="no-data-content">
                          <i className="bi bi-exclamation-circle"></i>
                          <span>No matching records found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentEmployees.map((emp) => {
                      const { attendance = {}, leave = {}, salary = {} } = reports[emp.id] || {};
                      const totalDays = (attendance.present || 0) + (attendance.absent || 0) + (attendance.leave || 0);
                      const attendancePercentage = getAttendancePercentage(attendance.present || 0, totalDays);
                      
                      return (
                        <tr key={emp.id}>
                          <td className="employee-cell">
                            <div className="employee-avatar">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="employee-details">
                              <div className="employee-name">{emp.name}</div>
                              <div className="employee-id">EMP-{emp.id.toString().padStart(4, '0')}</div>
                              <div className="employee-dept">{emp.department?.name || 'Unassigned'}</div>
                            </div>
                          </td>
                          <td className="position-cell">
                            <div className="designation">{emp.designation?.name || '-'}</div>
                            <div className="employment-type">Full-time</div>
                          </td>
                          <td className="attendance-cell">
                            <div className="attendance-progress">
                              <div 
                                className="progress-bar" 
                                style={{ width: `${attendancePercentage}%` }}
                                data-percentage={attendancePercentage}
                              ></div>
                            </div>
                            <div className="attendance-stats">
                              <div className="stat-item">
                                <span className="stat-label">Present:</span>
                                <span className="stat-value present">{attendance.present || 0}</span>
                              </div>
                              <div className="stat-item">
                                <span className="stat-label">Absent:</span>
                                <span className="stat-value absent">{attendance.absent || 0}</span>
                              </div>
                              <div className="stat-item">
                                <span className="stat-label">Leave:</span>
                                <span className="stat-value leave">{attendance.leave || 0}</span>
                              </div>
                            </div>
                          </td>
                          <td className="leave-cell">
                            <div className="leave-badges">
                              <div className="badge approved">
                                <i className="bi bi-check-circle"></i>
                                {leave.approved || 0}
                              </div>
                              <div className="badge pending">
                                <i className="bi bi-hourglass"></i>
                                {leave.pending || 0}
                              </div>
                              <div className="badge rejected">
                                <i className="bi bi-x-circle"></i>
                                {leave.rejected || 0}
                              </div>
                            </div>
                          </td>
                          <td className="salary-cell">
                            <div className="salary-details">
                              <div className="salary-item">
                                <span>Base:</span>
                                <span className="base-salary">{formatCurrency(salary.base_salary)}</span>
                              </div>
                              <div className="salary-item">
                                <span>Deductions:</span>
                                <span className="deductions">{formatCurrency(salary.deduction)}</span>
                              </div>
                              <div className="salary-item net">
                                <span>Net Pay:</span>
                                <span className="net-salary">{formatCurrency(salary.net_salary)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="actions-cell">
                            <button className="action-btn view">
                              <i className="bi bi-eye"></i>
                            </button>
                            <button className="action-btn download">
                              <i className="bi bi-download"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredEmployees.length > pageSize && (
              <div className="pagination-controls">
                <button 
                  className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HRReports;