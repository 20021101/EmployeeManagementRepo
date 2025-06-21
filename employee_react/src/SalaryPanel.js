import React, { useState, useEffect } from 'react';
import axios from 'axios';
import fileDownload from 'js-file-download';
import './SalaryPanel.css';

const SalaryPanel = ({ employeeId }) => {
  const [salary, setSalary] = useState(null);
  const [month] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    const token = localStorage.getItem('employeeToken');

    axios.post(
      'http://localhost:8000/api/salary/calculate',
      { employee_id: employeeId, month, year },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        withCredentials: true,
      }
    )
    .then(res => setSalary(res.data))
    .catch(err => console.error('Error fetching salary:', err));
  }, [employeeId, month, year]);

  const downloadSlip = async () => {
    const token = localStorage.getItem('employeeToken');
    try {
      const response = await axios.get(`http://localhost:8000/api/salary/slip/${salary.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf',
        },
        responseType: 'blob',
      });
      fileDownload(response.data, `salary_slip_${month}_${year}.pdf`);
    } catch (err) {
      console.error('Error downloading slip:', err);
    }
  };

  if (!salary) return <p className="loading-text">Loading salary...</p>;

  return (
    <div className="salary-panel">
      <div className="salary-card">
        <h3>Salary for {month}/{year}</h3>
        <div className="salary-details">
          <p><span>Base Salary:</span> ₹{salary.base_salary}</p>
          <p><span>Total Leaves:</span> {salary.total_leaves}</p>
          <p><span>Deduction:</span> ₹{salary.deduction}</p>
          <p className="net-salary"><strong>Net Salary:</strong> ₹{salary.net_salary}</p>
        </div>
        <button className="download-btn" onClick={downloadSlip}>Download Salary Slip</button>
      </div>
    </div>
  );
};

export default SalaryPanel;
