import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './department.css'; 

const DepartmentManager = () => {
  const token = localStorage.getItem('employeeToken');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/departments', authHeader);
      setDepartments(res.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return alert('Please enter a department name.');

    try {
      if (editId) {
        await axios.put(`http://localhost:8000/api/departments/${editId}`, { name }, authHeader);
      } else {
        await axios.post('http://localhost:8000/api/departments', { name }, authHeader);
      }

      setName('');
      setEditId(null);
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await axios.delete(`http://localhost:8000/api/departments/${id}`, authHeader);
        fetchDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
      }
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <div className="container my-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-header bg-primary text-white rounded-top-4">
              <h4 className="mb-0">Department Manager</h4>
            </div>
            <div className="card-body">
              <div className="row g-2 mb-4">
                <div className="col-12 col-md-9">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Department Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-3">
                  <button className="btn btn-success btn-lg w-100" onClick={handleSubmit}>
                    {editId ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>

              {departments.length === 0 ? (
                <p className="text-muted text-center">No departments found.</p>
              ) : (
                <div className="row g-3">
                  {departments.map((d) => (
                    <div className="col-12 col-sm-6 col-lg-4" key={d.id}>
                      <div className="card h-100 border-0 shadow-sm department-card rounded-4">
                        <div className="card-body d-flex flex-column">
                          <h5 className="card-title text-center mb-3">{d.name}</h5>
                          <div className="mt-auto d-flex justify-content-between">
                            <button
                              className="btn btn-sm btn-outline-warning w-100 me-2"
                              onClick={() => {
                                setName(d.name);
                                setEditId(d.id);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger w-100"
                              onClick={() => handleDelete(d.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card-footer text-muted text-center">
              Manage department names and update or delete as needed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentManager;
