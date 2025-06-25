import React, { useRef, useState } from 'react';
import axios from 'axios';
import './modal.css';

function ImportEmployees({ onImportDone }) {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState([]); 

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setErrors([]); // when file change resets error
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setErrors(['Please select a file.']);
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploading(true);
      setErrors([]);

      await axios.post('http://localhost:8000/api/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Employees imported successfully!');
      setShowModal(false);
      setSelectedFile(null);
      onImportDone();
    } catch (error) {
      const backendErrors = [];

      if (error.response?.data?.errors) {
        // Laravel Validation errors 
        for (const key in error.response.data.errors) {
          backendErrors.push(...error.response.data.errors[key]);
        }
      } else if (error.response?.data?.error) {
        backendErrors.push(error.response.data.error);
      } else {
        backendErrors.push('Import failed due to unknown error.');
      }

      setErrors(backendErrors); //to show errors in UI
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <button className="btn btn-primary" onClick={() => setShowModal(true)}>
        Import Employees
      </button>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h4>Select Excel File</h4>

            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
            />

            {/* Show validation errors here */}
            {errors.length > 0 && (
              <div className="alert alert-danger mt-3">   
                <ul className="mb-0">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-actions mt-3">
              <button className="btn btn-secondary me-2" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleImport} disabled={uploading}>
                {uploading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportEmployees;
