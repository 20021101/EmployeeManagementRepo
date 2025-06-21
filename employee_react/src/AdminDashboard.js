import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminMessages, setAdminMessages] = useState({});

  useEffect(() => {
    const storedEmployee = JSON.parse(localStorage.getItem("employee"));
    const token = localStorage.getItem("employeeToken");

    if (!storedEmployee || !token || storedEmployee.role !== "admin") {
      localStorage.clear();
      navigate("/login");
    } else {
      setEmployee(storedEmployee);
      fetchLeaves(token);
    }
  }, [navigate]);

  const fetchLeaves = async (token) => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/leave", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLeaves(res.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
      setError("Unable to fetch leave requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    const token = localStorage.getItem("employeeToken");
    const adminmessage = adminMessages[id] || "";

    try {
      await axios.put(
        `http://localhost:8000/api/leave/${id}/status`,
        { status, adminmessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchLeaves(token);
    } catch (error) {
      console.error("Status update failed:", error);
      setError("Status update failed.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleMessageChange = (id, message) => {
    setAdminMessages({ ...adminMessages, [id]: message });
  };

  if (!employee) return null;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Welcome Admin, {employee.name}</h2>

      <div className="d-flex justify-content-between mb-3">
        <h4>Leave Requests</h4>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>

      {loading && <div className="alert alert-info">Loading...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {leaves.length === 0 ? (
        <p>No leave requests found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-light">
              <tr>
                <th>Employee</th>
                <th>Reason</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Admin Message</th>
                <th>New Message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id}>
                  <td>{leave.employee_name}</td>
                  <td>{leave.reason}</td>
                  <td>{leave.start_date}</td>
                  <td>{leave.end_date}</td>
                  <td>
                    <span className={`fw-bold text-${
                      leave.status === "approved"
                        ? "success"
                        : leave.status === "rejected"
                        ? "danger"
                        : "warning"
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td>{leave.adminmessage || "—"}</td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Add message"
                      value={adminMessages[leave.id] || ""}
                      onChange={(e) => handleMessageChange(leave.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(leave.id, "approved")}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange(leave.id, "rejected")}>Reject</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(leave.id, "pending")}>Pending</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
