
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Chart } from 'chart.js/auto';
import './HRReports.css';

const HRReports = () => {
  const [employees, setEmployees] = useState([]);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const chartRefs = useRef([]);
  const chartInstances = useRef([]);

  const token = localStorage.getItem('employeeToken');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchMonthlyReport = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/hr/monthly-report?month=${month}&year=${year}`,
        authHeader
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

  useEffect(() => {
    chartInstances.current.forEach(chart => chart?.destroy());
    chartInstances.current = [];

    currentEmployees.forEach((emp, index) => {
      const { attendance = {}, leave = {}, salary = {} } = reports[emp.id] || {};

      const drawChart = (ref, config) => {
        if (ref) {
          const chart = new Chart(ref, config);
          chartInstances.current.push(chart);
        }
      };

      drawChart(chartRefs.current[index]?.attendance, {
        type: 'doughnut',
        data: {
          labels: ['Present', 'Absent', 'Leave'],
          datasets: [{
            data: [attendance.present, attendance.absent, attendance.leave],
            backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
          }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      });

      drawChart(chartRefs.current[index]?.leave, {
        type: 'bar',
        data: {
          labels: ['Approved', 'Rejected', 'Pending'],
          datasets: [{
            data: [leave.approved, leave.rejected, leave.pending],
            backgroundColor: ['#17a2b8', '#dc3545', '#ffc107'],
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });

      drawChart(chartRefs.current[index]?.salary, {
        type: 'bar',
        data: {
          labels: ['Base Salary', 'Deduction', 'Net Salary'],
          datasets: [{
            data: [salary.base_salary, salary.deduction, salary.net_salary],
            backgroundColor: ['#007bff', '#dc3545', '#28a745'],
          }]
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true } }
        }
      });
    });
  }, [reports, employees, currentPage]);

  const filteredEmployees = employees.filter(emp => {
    const deptMatch = selectedDepartment === '' || emp.department_id === parseInt(selectedDepartment);
    const desgMatch = selectedDesignation === '' || emp.designation_id === parseInt(selectedDesignation);
    return deptMatch && desgMatch;
  });

  const departments = [...new Map(employees.map(emp => [emp.department?.id, emp.department])).values()].filter(Boolean);
  const designations = [...new Map(employees.map(emp => [emp.designation?.id, emp.designation])).values()].filter(Boolean);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const currentEmployees = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) setCurrentPage(currentPage - 1);
    else if (direction === 'next' && currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="hr-reports-container container">
      <h2 className="hr-reports-heading">HR Monthly Reports - {month}/{year}</h2>

      <div className="hr-filter-bar mb-4">
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="form-select">
          {[...Array(12).keys()].map(m => (
            <option key={m + 1} value={m + 1}>{m + 1}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="form-select">
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="form-select">
          <option value="">All Departments</option>
          {departments.map(dep => (
            <option key={dep.id} value={dep.id}>{dep.name}</option>
          ))}
        </select>
        <select value={selectedDesignation} onChange={(e) => setSelectedDesignation(e.target.value)} className="form-select">
          <option value="">All Designations</option>
          {designations.map(des => (
            <option key={des.id} value={des.id}>{des.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center hr-loading">Loading reports...</div>
      ) : (
        <div className="row">
          {currentEmployees.length === 0 ? (
            <div className="text-center">No data found for selected filters.</div>
          ) : (
            currentEmployees.map((emp, index) => (
              <div className="col-12 col-sm-6 col-md-4 mb-4" key={emp.id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">{emp.name}</h5>
                    <h6 className="card-subtitle mb-3 text-muted">
                      {emp.designation?.name || '-'} | {emp.department?.name || '-'}
                    </h6>

                    <div className="mb-3 chart-section">
                      <strong>Attendance</strong>
                      <div className="chart-wrapper">
                        <canvas ref={(el) => {
                          if (!chartRefs.current[index]) chartRefs.current[index] = {};
                          chartRefs.current[index].attendance = el;
                        }} />
                      </div>
                    </div>

                    <div className="mb-3 chart-section">
                      <strong>Leave</strong>
                      <div className="chart-wrapper">
                        <canvas ref={(el) => {
                          if (!chartRefs.current[index]) chartRefs.current[index] = {};
                          chartRefs.current[index].leave = el;
                        }} />
                      </div>
                    </div>

                    <div className="chart-section">
                      <strong>Salary</strong>
                      <div className="chart-wrapper">
                        <canvas ref={(el) => {
                          if (!chartRefs.current[index]) chartRefs.current[index] = {};
                          chartRefs.current[index].salary = el;
                        }} />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {filteredEmployees.length > pageSize && (
        <div className="d-flex justify-content-center align-items-center mt-4 gap-3 flex-wrap">
          <button className="btn btn-outline-primary" onClick={() => handlePageChange('prev')} disabled={currentPage === 1}>Previous</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button className="btn btn-outline-primary" onClick={() => handlePageChange('next')} disabled={currentPage === totalPages}>Next</button>
        </div>
      )}
    </div>
  );
};

export default HRReports;
