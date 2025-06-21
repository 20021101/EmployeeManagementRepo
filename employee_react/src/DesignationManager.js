import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './designation.css'; // Custom styles

const DesignationManager = () => {
  const token = localStorage.getItem('employeeToken');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const [designations, setDesignations] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);

  const fetchDesignations = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/designations', authHeader);
      setDesignations(res.data);
    } catch (err) {
      console.error('Failed to fetch designations:', err);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return alert('Please enter a designation name.');

    try {
      if (editId) {
        await axios.put(`http://localhost:8000/api/designations/${editId}`, { name }, authHeader);
      } else {
        await axios.post('http://localhost:8000/api/designations', { name }, authHeader);
      }

      setName('');
      setEditId(null);
      fetchDesignations();
    } catch (err) {
      console.error('Failed to save designation:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this designation?')) {
      try {
        await axios.delete(`http://localhost:8000/api/designations/${id}`, authHeader);
        fetchDesignations();
      } catch (err) {
        console.error('Failed to delete designation:', err);
      }
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  return (
    <div className="container my-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-header bg-primary text-white rounded-top-4">
              <h4 className="mb-0">Designation Manager</h4>
            </div>
            <div className="card-body">
              <div className="row g-2 mb-4">
                <div className="col-12 col-md-9">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Designation Name"
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

              {designations.length === 0 ? (
                <p className="text-muted text-center">No designations found.</p>
              ) : (
                <div className="row g-3">
                  {designations.map((d) => (
                    <div className="col-12 col-sm-6 col-lg-4" key={d.id}>
                      <div className="card designation-card h-100 border-0 shadow-sm rounded-4">
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
              You can add, update, or delete designations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignationManager;
