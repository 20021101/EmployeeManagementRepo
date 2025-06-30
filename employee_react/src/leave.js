import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './leave.css';
import DataTable from 'react-data-table-component';

axios.defaults.withCredentials = true;

const Leave = ({ employee, role: propRole }) => {
  const [leaves, setLeaves] = useState([]);
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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

  const renderActionBy = (leave) => {
    if (!leave.admin_id) return '-';
    return `${leave.admin?.role || 'user'} ${leave.admin_id}`;
  };

  const filteredLeaves = leaves.filter(item => {
    const matchesText = (
      (item.employee?.name || item.name).toLowerCase().includes(filterText.toLowerCase()) ||
      item.reason.toLowerCase().includes(filterText.toLowerCase())
    );

    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;

    return matchesText && matchesStatus;
  });

  if (!employee) return <div className="alert alert-danger">Please log in.</div>;

  const customStyles = {
    headCells: {
      style: {
        paddingLeft: '12px',
        paddingRight: '12px',
        backgroundColor: '#f8f9fa',
        fontWeight: '600',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
      },
    },
    cells: {
      style: {
        paddingLeft: '12px',
        paddingRight: '12px',
        fontSize: '0.875rem',
      },
    },
    rows: {
      style: {
        '&:not(:last-of-type)': {
          borderBottom: '1px solid #eee',
        },
      },
    },
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const columns = [
    {
      name: 'EMPLOYEE',
      selector: row => row.employee?.name || row.name,
      sortable: true,
      cell: row => (
        <div className="employee-info">
          <div className="avatar">{row.employee?.name?.charAt(0) || row.name?.charAt(0)}</div>
          <div>
            <div className="name">{row.employee?.name || row.name}</div>
            <div className="id">ID: {row.employee_id}</div>
          </div>
        </div>
      ),
      minWidth: '200px'
    },
    {
      name: 'LEAVE PERIOD',
      selector: row => row.start_date,
      cell: row => (
        <div className="leave-period">
          <div className="date">{row.start_date}</div>
          <div className="separator">to</div>
          <div className="date">{row.end_date}</div>
          <div className="duration">
            {calculateDuration(row.start_date, row.end_date)} days
          </div>
        </div>
      ),
      minWidth: '180px'
    },
    {
      name: 'REASON',
      selector: row => row.reason,
      cell: row => (
        <div className="reason">
          {row.reason || '-'}
        </div>
      ),
      minWidth: '250px'
    },
    {
      name: 'STATUS',
      selector: row => row.status,
      cell: row => (
        <div className={`status ${row.status || 'pending'}`}>
          <span className="status-text">
            {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Pending'}
          </span>
        </div>
      ),
      width: '120px'
    },
    {
      name: 'ACTION BY',
      selector: row => row.admin_id,
      cell: row => (
        <div className="action-by">
          {renderActionBy(row)}
        </div>
      ),
      width: '150px'
    },
    ...(['admin', 'hr'].includes(role.toLowerCase()) ? [{
      name: 'ACTIONS',
      cell: row => (
        <div className="actions">
          <button 
            className={`btn-action approve ${row.status === 'approved' ? 'disabled' : ''}`}
            onClick={() => updateStatus(row.id, 'approved')}
            disabled={row.status === 'approved'}
          >
            Approve
          </button>
          <button 
            className={`btn-action reject ${row.status === 'rejected' ? 'disabled' : ''}`}
            onClick={() => updateStatus(row.id, 'rejected')}
            disabled={row.status === 'rejected'}
          >
            Reject
          </button>
        </div>
      ),
      width: '180px'
    }] : [])
  ];

  return (
    <div className="leave-management-container">
      <div className="header">
        <h2>
          <i className="icon calendar"></i>
          {['admin', 'hr'].includes(role.toLowerCase()) ? 'Leave Management Dashboard' : 'My Leave Requests'}
        </h2>
        <div className="controls">
          <div className="search-box">
            <i className="icon search"></i>
            <input 
              type="text" 
              placeholder="Search by name or reason..." 
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {!['admin', 'hr'].includes(role.toLowerCase()) && (
        <div className="request-form">
          <h4>New Leave Request</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group reason">
              <label>Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <button 
              type="button" 
              className="submit-btn"
              onClick={handleLeaveRequest}
            >
              Apply For Leave
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className={`alert-message ${messageType}`}>
          {message}
          <span className="close" onClick={() => setMessage('')}>×</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="leave-table-container">
        <DataTable
          columns={columns}
          data={filteredLeaves}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 15]}
          customStyles={{
            headCells: {
              style: {
                backgroundColor: '#f8fafc',
                fontWeight: 600,
                fontSize: '14px',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              },
            },
            cells: {
              style: {
                paddingTop: '12px',
                paddingBottom: '12px',
              },
            },
          }}
          highlightOnHover
          striped
          noDataComponent={
            <div className="no-data">
              <i className="icon calendar-x"></i>
              <p>No leave records found</p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default Leave;