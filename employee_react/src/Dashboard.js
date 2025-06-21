import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const employee = JSON.parse(localStorage.getItem('employee'));
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('employeeToken');

      await axios.post(
        'http://localhost:8000/api/employee/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      localStorage.removeItem('employeeToken');
      localStorage.removeItem('employee');
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (!employee) {
    return (
      <div className="container mt-5">
        <h2>Employee data not found. Please log in again.</h2>
      </div>
    );
  }

  return (
    <div className="container mt-5 text-center">
      <h2>Welcome, {employee.name}</h2>
      <p className="text-success">You are logged in successfully!</p>
      <button onClick={handleLogout} className="btn btn-danger mt-3">Logout</button>
    </div>
  );
};

export default Dashboard;