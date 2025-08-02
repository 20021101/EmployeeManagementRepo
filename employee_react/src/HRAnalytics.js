import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, AreaChart, Area,XAxis, YAxis, CartesianGrid, RadialBarChart, RadialBar, Legend, Tooltip, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

import './HRAnalytics.css';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8000';

const HRAnalytics = () => {
  const [employees, setEmployees] = useState([]);
  const [reports, setReports] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');

  const token = localStorage.getItem('employeeToken');

  const fetchMonthlyReport = async () => {
    try {
      const res = await axios.get(`/api/hr/monthly-report?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
    } catch (err) {
      console.error('Error fetching employee reports:', err);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`/api/hr/monthly-summary?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMonthlyReport(), fetchSummary()]).finally(() => setLoading(false));
  }, [month, year]);

  //  Debugging useEffect — logs summary when it updates
  useEffect(() => {
    if (summary) {
      console.log('📊 Summary Data:', summary);
    }
  }, [summary]);

  const filteredEmployees = employees.filter(emp => {
    const deptMatch = selectedDepartment === '' || emp.department_id === parseInt(selectedDepartment);
    const desgMatch = selectedDesignation === '' || emp.designation_id === parseInt(selectedDesignation);
    return deptMatch && desgMatch;
  });

  const departments = [...new Map(employees.map(emp => [emp.department?.id, emp.department])).values()].filter(Boolean);
  const designations = [...new Map(employees.map(emp => [emp.designation?.id, emp.designation])).values()].filter(Boolean);

  const COLORS = ['#00C49F', '#FF8042', '#FFBB28'];

  return (
    <div className="hr-analytics-container">
      <div className="analytics-header">
        <h1>HR Monthly Analytics</h1>
        <div className="filters">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {[...Array(12).keys()].map(m => (
              <option key={m + 1} value={m + 1}>
                {new Date(2000, m).toLocaleString('default', { month: 'short' })}
              </option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(dep => (
              <option key={dep.id} value={dep.id}>{dep.name}</option>
            ))}
          </select>
          <select value={selectedDesignation} onChange={e => setSelectedDesignation(e.target.value)}>
            <option value="">All Designations</option>
            {designations.map(des => (
              <option key={des.id} value={des.id}>{des.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading || !summary ? (
        <div className="loading">Loading analytics...</div>
      ) : (
        <div className="charts-wrapper">
          <div className="chart-box">
            <h3>Attendance Summary</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Present', value: summary.totalPresent },
                { name: 'Absent', value: summary.totalAbsent },
                { name: 'Leave', value: summary.totalAttendanceLeave }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box">
            <h3>Salary Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Base Salary', value: summary.totalBaseSalary },
                    { name: 'Deductions', value: summary.totalDeductions },
                    { name: 'Net Pay', value: summary.totalNetSalary }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box">
            <h3>Leave Summary</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="20%"
                outerRadius="90%"
                barSize={15}
                data={[
                  { name: 'Approved', value: summary.totalLeaveApproved, fill: '#00C49F' },
                  { name: 'Pending', value: summary.totalLeavePending, fill: '#FFBB28' },
                  { name: 'Rejected', value: summary.totalLeaveRejected, fill: '#FF8042' },
                ]}
              >
                <RadialBar
                  minAngle={15}
                  label={{ position: 'insideStart', fill: '#fff' }}
                  background
                  clockWise
                  dataKey="value"
                />
                <Legend
                  iconSize={10}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box">
            <h3>New Joinings</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={[
                  {
                    month: new Date(2000, month - 1).toLocaleString('default', { month: 'short' }),
                    joinings: summary.newJoinings,
                  },
                ]}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorJoinings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="joinings"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorJoinings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}
    </div>
  );
};

export default HRAnalytics;
