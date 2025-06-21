import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminLeaveList = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/leaves');
      setLeaves(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch leave requests.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await axios.put(`http://localhost:8000/api/leaves/status/${id}`, { status });
      setMessage(`Leave status updated to "${status}"`);
      fetchLeaves();
    } catch (err) {
      console.error(err);
      setError('Failed to update leave status.');
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  return (
    <div className="container mt-4">
      <h2>Leave Requests</h2>

      {loading && <div className="alert alert-info">Loading...</div>}
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-light">
            <tr>
              <th>Employee</th>
              <th>Dates</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length > 0 ? (
              leaves.map(leave => (
                <tr key={leave.id}>
                  <td>{leave.employee_name || leave.employee?.name || '—'}</td>
                  <td>{leave.start_date} to {leave.end_date}</td>
                  <td>{leave.reason}</td>
                  <td>
                    <span className={`fw-bold text-${
                      leave.status === 'approved' ? 'success' :
                      leave.status === 'rejected' ? 'danger' : 'warning'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => updateStatus(leave.id, 'approved')}
                        disabled={updatingId === leave.id}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => updateStatus(leave.id, 'rejected')}
                        disabled={updatingId === leave.id}
                      >
                        Reject
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => updateStatus(leave.id, 'pending')}
                        disabled={updatingId === leave.id}
                      >
                        Pending
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="text-center">No leave requests found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLeaveList;
