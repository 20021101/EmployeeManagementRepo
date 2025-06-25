import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './employeeLogin.css'; 
axios.defaults.withCredentials = true;


const EmployeeLogin = ({ setEmployee }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    
    await axios.get('http://localhost:8000/sanctum/csrf-cookie', {
      withCredentials: true,
    });

    // Send login request
    const response = await axios.post(
      'http://localhost:8000/api/employee/login',
      { email, password },
      { withCredentials: true }
    );

    // Handle successful login
    if (response.data && response.data.employee && response.data.token) {
      const employeeData = response.data.employee;
      const token = response.data.token;

      // Save in localStorage
      localStorage.setItem('employeeToken', token);
      localStorage.setItem('employee', JSON.stringify(employeeData));
      setEmployee(employeeData);

      //  Redirect based on role
      const role = employeeData.role?.toLowerCase(); //if role will be uppercase
      if (role === 'hr') {
        navigate('/hr-dashboard');
      } else {
        navigate('/employee-dashboard'); // for admin and employee
      }
    } else {
      setError('Invalid login response from server.');
    }
  } catch (err) {
    setError('Login failed. Please check your credentials.');
    console.error('Login error:', err);
  }
};

  return (
    <div className="login-background">
      <div className="login-container login-card">
        <h2 className="text-center text-primary mb-4">Employee Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email:</label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password:</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLogin;
