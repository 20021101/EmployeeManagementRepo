import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './attendance.css';

const AttendanceForm = () => {
  const token = localStorage.getItem('employeeToken');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('present');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [attendanceList, setAttendanceList] = useState([]);
  const [editId, setEditId] = useState(null);

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/employees', authHeader);
      setEmployees(res.data);
    } catch (err) {
      setError('Failed to load employees.');
      autoClearError();
    }
  }, [authHeader]);

  useEffect(() => {
    if (token) fetchEmployees();
  }, [fetchEmployees, token]);

  const fetchAttendance = async (empId) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/attendance/${empId}`, authHeader);
      setAttendanceList(res.data);
    } catch (err) {
      setError('Failed to load attendance.');
      autoClearError();
    }
  };

  const autoClearMessage = () => setTimeout(() => setMessage(''), 3000);
  const autoClearError = () => setTimeout(() => setError(''), 3000);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) {
      setError('Please select an employee.');
      autoClearError();
      return;
    }

    const payload = {
      employee_id: selectedEmployee.id,
      date,
      status,
    };

    try {
      if (editId) {
        await axios.put(`http://localhost:8000/api/attendance/${editId}`, payload, authHeader);
        setMessage('Attendance updated.');
      } else {
        await axios.post('http://localhost:8000/api/attendance', payload, authHeader);
        setMessage('Attendance added.');
      }
      setDate('');
      setStatus('present');
      setEditId(null);
      fetchAttendance(selectedEmployee.id);
      autoClearMessage();
    } catch (err) {
      setError('Submission failed.');
      autoClearError();
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/attendance/${id}`, authHeader);
      setMessage('Attendance record deleted.');
      fetchAttendance(selectedEmployee.id);
      autoClearMessage();
    } catch (err) {
      setError('Failed to delete record.');
      autoClearError();
    }
  };

  const handleEmployeeChange = (e) => {
    const emp = employees.find((emp) => emp.id === parseInt(e.target.value));
    setSelectedEmployee(emp || null);
    setDate('');
    setStatus('present');
    setEditId(null);
    setError('');
    if (emp) fetchAttendance(emp.id);
  };

  return (
    <div className="container my-4">
      <div className="card shadow-lg attendance-card border-0 rounded-4">
        <div className="card-header bg-primary text-white rounded-top-4">
          <h4 className="mb-0">{editId ? 'Edit Attendance' : 'Mark Attendance'}</h4>
        </div>
        <div className="card-body">
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="row g-3 align-items-end mb-4">
            <div className="col-12 col-md-4">
              <label className="form-label">Employee</label>
              <select
                className="form-select"
                required
                onChange={handleEmployeeChange}
                value={selectedEmployee?.id || ''}
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
              </select>
            </div>

            <div className="col-12 col-md-2">
              <button type="submit" className="btn btn-success w-100">
                {editId ? 'Update' : 'Add'}
              </button>
            </div>
          </form>

          {attendanceList.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover table-bordered align-middle text-center attendance-table">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceList.map((record) => (
                    <tr key={record.id}>
                      <td>{record.employee?.name || selectedEmployee?.name}</td>
                      <td>{record.date}</td>
                      <td>{record.status}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => {
                              setDate(record.date);
                              setStatus(record.status);
                              setEditId(record.id);
                              setError('');
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(record.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card-footer text-muted text-center">
          Track and update attendance records of employees.
        </div>
      </div>
    </div>
  );
};

export default AttendanceForm;
