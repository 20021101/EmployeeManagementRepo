import React from 'react';
import './home.css';
const Home = ({ employee }) => {
  return (
    <div className="d-flex justify-content-center align-items-center bg-light" style={{ height: "80vh" }}>
  <div className="card shadow text-center p-5" style={{ maxWidth: '500px' }}>
    <div className="mb-3">
      <i className="bi bi-person-circle fs-1 text-primary"></i>
    </div>
    <h2>Welcome... {employee.name}!</h2>
    <p className="text-muted">Role: {employee.role}</p>
  </div>
</div>
  );
};

export default Home;
