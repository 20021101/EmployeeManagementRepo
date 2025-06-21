import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MyDetails.css';

const MyDetails = () => {
  const [employee, setEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    joining_date: ''
  });

  const token = localStorage.getItem('employeeToken');
  const currentUser = JSON.parse(localStorage.getItem('employee'));
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchDetails = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/employees/${currentUser.id}/with-details`,
        authHeader
      );
      setEmployee(res.data);
      setFormData({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        joining_date: res.data.joining_date || ''
      });
    } catch (error) {
      console.error('Error fetching details', error);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `http://localhost:8000/api/employees/${currentUser.id}`,
        formData,
        authHeader
      );
      setIsEditing(false);
      fetchDetails();
    } catch (err) {
      console.error("Error updating employee", err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  if (!employee) {
    return (
      <div className="details-container loading-container">
        <div className="spinner-border" role="status" />
        <p>Loading your details...</p>
      </div>
    );
  }

  return (
    <div className="details-container">
      <div className="details-card">
        <h2 className="details-title">My Details</h2>
        <div className="details-table-wrapper">
          <table className="details-table">
            <tbody>
              {[
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'text' },
                { label: 'Joining Date', key: 'joining_date', type: 'date' }
              ].map(({ label, key, type }) => (
                <tr key={key}>
                  <th>{label}</th>
                  <td>
                    {isEditing ? (
                      <input
                        type={type}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                      />
                    ) : (
                      type === 'date' ? formatDate(employee[key]) : employee[key]
                    )}
                  </td>
                </tr>
              ))}
              <tr>
                <th>Designation</th>
                <td>{employee.designation?.name || 'Not Assigned'}</td>
              </tr>
              <tr>
                <th>Department</th>
                <td>{employee.department?.name || 'Not Assigned'}</td>
              </tr>
              <tr>
                <th>Manager</th>
                <td>{employee.manager?.name || 'Not Assigned'}</td>
              </tr>
              <tr>
                <th>Relieving Date</th>
                <td>{formatDate(employee.relieving_date)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="details-buttons">
          {isEditing ? (
            <>
              <button className="btn btn-success" onClick={handleSave}>Save</button>
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyDetails;
