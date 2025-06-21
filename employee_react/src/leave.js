import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './leave.css';

const Leave = ({ employee, role: propRole }) => {
  const [leaves, setLeaves] = useState([]);
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const token = localStorage.getItem('employeeToken');
  const storedEmployee = JSON.parse(localStorage.getItem('employee'));
  const role = propRole || storedEmployee?.role || '';

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    if (employee && token) fetchLeaves();
  }, [employee, token]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchLeaves = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/leaves', authHeader);
      setLeaves(response.data);
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setMessage('Failed to fetch leaves.');
      setMessageType('danger');
    }
  };

  const handleLeaveRequest = async (e) => {
    e.preventDefault();

    const today = new Date().setHours(0, 0, 0, 0);
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(0, 0, 0, 0);

    if (start < today) {
      setError('Start date cannot be in the past.');
      return;
    }
    if (end < start) {
      setError('End date cannot be before start date.');
      return;
    }

    try {
      const data = {
        employee_id: employee.id,
        name: employee.name,
        reason,
        start_date: startDate,
        end_date: endDate,
      };

      await axios.post('http://localhost:8000/api/leaves', data, authHeader);
      setReason('');
      setStartDate('');
      setEndDate('');
      setError('');
      setMessage('Leave applied successfully. Email sent to Admin/HR.');
      setMessageType('success');
      fetchLeaves();
    } catch (err) {
      console.error('Error requesting leave:', err);
      setMessage('Something went wrong while applying.');
      setMessageType('danger');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const data = {
        status,
        admin_id: employee.id,
      };
      await axios.put(`http://localhost:8000/api/leaves/${id}/status`, data, authHeader);
      setMessage(`Leave ${status} successfully. Email sent to employee.`);
      setMessageType('success');
      fetchLeaves();
    } catch (err) {
      console.error('Error updating status:', err);
      setMessage('Failed to update leave status.');
      setMessageType('danger');
    }
  };

  if (!employee) return <div className="alert alert-danger">Please log in.</div>;

  return (
    <div className="container leave-container">
      <h2 className="text-center mb-4">
        {['admin', 'hr'].includes(role.toLowerCase()) ? 'All Leave Requests' : 'My Leave Requests'}
      </h2>

      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show`} role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {error && <div className="alert alert-warning">{error}</div>}

      {!['admin', 'hr'].includes(role.toLowerCase()) && (
        <form onSubmit={handleLeaveRequest} className="row g-3 mb-4 leave-form">
          <div className="col-md-4">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Reason</label>
            <input
              type="text"
              className="form-control"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <div className="col-12">
            <button type="submit" className="btn btn-primary w-100">
              Apply for Leave
            </button>
          </div>
        </form>
      )}

      <div className="leave-cards">
        {leaves.length > 0 ? (
          leaves.map((leave) => (
            <div className="leave-card" key={leave.id}>
              <p><strong>Name:</strong> {leave.employee?.name || leave.name}</p>
              <p><strong>Start:</strong> {leave.start_date}</p>
              <p><strong>End:</strong> {leave.end_date}</p>
              <p><strong>Reason:</strong> {leave.reason}</p>
              <p className={`fw-bold text-${leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'warning'}`}>
                <strong>Status:</strong> {leave.status}
              </p>
              <p><strong>Handled By (ID):</strong> {leave.admin_id || '—'}</p>

              {['admin', 'hr'].includes(role.toLowerCase()) && (
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-success btn-sm" onClick={() => updateStatus(leave.id, 'approved')}>
                    Approve
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => updateStatus(leave.id, 'rejected')}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center mt-4">No leave records found.</div>
        )}
      </div>
    </div>
  );
};

export default Leave;
