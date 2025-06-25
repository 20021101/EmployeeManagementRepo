import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AssignDetails.css';
import { useParams } from 'react-router-dom'; 

function AssignDetails() {
  const { id: employeeId } = useParams(); // get employeeId from route
  const navigate = useNavigate();
  const token = localStorage.getItem('employeeToken');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignData, setAssignData] = useState({
    department_id: '',
    designation_id: '',
    manager_id: ''
  });

  useEffect(() => {
    if (employeeId) {
      fetchInitialData();
    }
  }, [employeeId]);

  const fetchInitialData = async () => {
    try {
      const [deptRes, desigRes, mgrRes] = await Promise.all([
        axios.get('/api/departments', authHeader),
        axios.get('/api/designations', authHeader),
        axios.get('/api/employees', authHeader)
      ]);

      setDepartments(deptRes.data);
      setDesignations(desigRes.data);
      setManagers(mgrRes.data);

      const res = await axios.get(`/api/employees/${employeeId}/assign`, authHeader);
      setAssignData({
        department_id: res.data.department_id || '',
        designation_id: res.data.designation_id || '',
        manager_id: res.data.manager_id || ''
      });
    } catch (err) {
      console.warn('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setAssignData({ ...assignData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/employees/${employeeId}/assign`, assignData, authHeader);
      alert('Details assigned successfully!');
      navigate('/');
    } catch (err) {
      alert('Assignment failed!');
      console.error(err);
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8">
          <div className="card shadow assign-card">
            <div className="card-header bg-primary text-white text-center">
              <h5 className="mb-0">Assign Details to Employee</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Department</label>
                  <select
                    className="form-select"
                    name="department_id"
                    value={assignData.department_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dep => (
                      <option key={dep.id} value={dep.id}>{dep.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Designation</label>
                  <select
                    className="form-select"
                    name="designation_id"
                    value={assignData.designation_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Designation</option>
                    {designations.map(des => (
                      <option key={des.id} value={des.id}>{des.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Manager (Optional)</label>
                  <select
                    className="form-select"
                    name="manager_id"
                    value={assignData.manager_id}
                    onChange={handleChange}
                  >
                    <option value="">No Manager</option>
                    {managers.map(mgr => (
                      <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <button type="submit" className="btn btn-success w-100">
                    Assign Details
                  </button>
                </div>
              </form>
            </div>
            <div className="card-footer text-center text-muted small">
              Please verify details before submitting.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignDetails;
