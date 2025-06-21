import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './employee.css';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
  Select, MenuItem, InputLabel, FormControl, CircularProgress, Box, Tabs, Tab
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8000';

function Employee({ employeeRole = "employee", refresh, onViewClick }) {
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', designation_id: '', department_id: '', manager_id: '',
    role: '', joining_date: '', relieving_date: '', password: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [tab, setTab] = useState('active');
  const [paginationModel, setPaginationModel] = useState({ pageSize: 10, page: 0 });

  const token = localStorage.getItem('employeeToken');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const navigate = useNavigate();

  const fetchAllData = useCallback(async () => {
    if (!token) return;
    try {
      const [employeesRes, designationsRes, departmentsRes] = await Promise.all([
        axios.get(`/api/employees${tab === 'trashed' ? '?trashed=true' : ''}`, { headers }),
        axios.get('/api/designations', { headers }),
        axios.get('/api/departments', { headers })
      ]);

      let filteredEmployees = employeesRes.data;
      if (employeeRole === 'employee') {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          filteredEmployees = filteredEmployees.filter(emp => emp.id === payload.id);
        } catch (e) {
          console.error("Invalid token format:", e);
        }
      }

      const processed = filteredEmployees.map(emp => {
        const matchedDesignation = designationsRes.data.find(d => String(d.id) === String(emp.designation_id));
        const matchedDepartment = departmentsRes.data.find(d => String(d.id) === String(emp.department_id));
        return {
          ...emp,
          id: emp.id || emp._id,
          designation: matchedDesignation || { name: 'Unassigned' },
          department: matchedDepartment || { name: 'Unassigned' },
          manager: filteredEmployees.find(m => String(m.id) === String(emp.manager_id)) || null
        };
      });

      setEmployees(processed);
      setDesignations(designationsRes.data);
      setDepartments(departmentsRes.data);
      setManagers(processed);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }, [token, tab, employeeRole]);

  useEffect(() => { fetchAllData(); }, [fetchAllData, refresh, tab]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = () => {
    setFormData({
      name: '', email: '', phone: '', designation_id: '', department_id: '', manager_id: '',
      role: '', joining_date: '', relieving_date: '', password: ''
    });
    setEditingId(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const payload = { ...formData };
      if (!editingId && !formData.password) {
        alert("Password is required");
        setLoadingAction(false);
        return;
      }
      editingId
        ? await axios.put(`/api/employees/${editingId}`, payload, { headers })
        : await axios.post('/api/employees', payload, { headers });

      setModalOpen(false);
      fetchAllData();
    } catch (err) {
      alert('Error submitting');
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEdit = (emp) => {
    setFormData({
      name: emp.name || '', email: emp.email || '', phone: emp.phone || '',
      designation_id: emp.designation_id || '', department_id: emp.department_id || '',
      manager_id: emp.manager_id || '', role: emp.role || '',
      joining_date: emp.joining_date || '', relieving_date: emp.relieving_date || '', password: ''
    });
    setEditingId(emp.id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/employees/${id}`, { headers });
    fetchAllData();
  };

  const handleRestore = async (id) => {
    try {
      await axios.post(`/api/employees/${id}/restore`, {}, { headers });
      fetchAllData();
    } catch (err) {
      console.error('Restore failed', err);
    }
  };

  const handleForceDelete = async (id) => {
    try {
      await axios.delete(`/api/employees/${id}/force-delete`, { headers });
      fetchAllData();
    } catch (err) {
      console.error('Permanent delete failed', err);
    }
  };

  const handleDownloadLetter = async (id) => {
    try {
      const response = await axios.get(`/api/experience-letter/${id}`, {
        responseType: 'blob', headers
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Experience_Letter_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download experience letter.');
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 130 },
    {
      field: 'designation', headerName: 'Designation', width: 150,
      renderCell: (params) => params?.row?.designation?.name || 'Unassigned'
    },
    {
      field: 'department', headerName: 'Department', width: 150,
      renderCell: (params) => params?.row?.department?.name || 'Unassigned'
    },
    { field: 'role', headerName: 'Role', width: 120 },
    { field: 'joining_date', headerName: 'Joining Date', width: 130 },
    { field: 'relieving_date', headerName: 'Relieving Date', width: 130 },
    {
      field: 'actions', headerName: 'Actions', width: 400,
      renderCell: (params) => {
        const row = params.row;
        const isEmployee = employeeRole === 'employee';
        const isHRorAdmin = employeeRole === 'hr' || employeeRole === 'admin';
        return (
          <div className="action-buttons">
            {tab === 'active' ? (
              <>
                <Button size="small" onClick={() => onViewClick(row.id)}>View</Button>
                {(isEmployee || isHRorAdmin) && (
                  <>
                    <Button size="small" onClick={() => handleEdit(row)}>Edit</Button>
                    <Button size="small" onClick={() => handleDelete(row.id)}>Delete</Button>
                  </>
                )}
                {isHRorAdmin && (
                  <>
                    <Button size="small" onClick={() => handleDownloadLetter(row.id)}>Letter</Button>
                    <Button size="small" onClick={() => navigate(`/employee/${row.id}/assign`)}>Assign</Button>
                  </>
                )}
              </>
            ) : (
              <>
                {isHRorAdmin && (
                  <>
                    <Button size="small" onClick={() => handleRestore(row.id)}>Restore</Button>
                    <Button size="small" onClick={() => handleForceDelete(row.id)}>Delete Permanently</Button>
                  </>
                )}
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="mui-employee-container">
      {loadingAction && <Box className="overlay-loader"><CircularProgress /></Box>}
      <h2>Employee Management</h2>
      <Tabs value={tab} onChange={(e, val) => setTab(val)}>
        <Tab value="active" label="Active Employees" />
        {(employeeRole === 'admin' || employeeRole === 'hr') && (
          <Tab value="trashed" label="Trashed Employees" />
        )}
      </Tabs>
      {(employeeRole === 'admin' || employeeRole === 'hr') && (
        <div className="mui-toolbar">
          <Button variant="contained" onClick={openModal}>Add Employee</Button>
        </div>
      )}
      <div style={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={employees}
          columns={columns}
          pagination
          paginationModel={paginationModel}
          onPaginationModelChange={(model) => setPaginationModel(model)}
          rowsPerPageOptions={[10, 20, 50, 100]}
          getRowId={(row) => row.id || row._id}
          autoHeight
        />
      </div>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers className="employee-form">
            <div className="form-row">
              <TextField label="Name" name="name" value={formData.name} onChange={handleChange} required className="form-col" />
              <TextField label="Email" name="email" value={formData.email} onChange={handleChange} required className="form-col" />
            </div>
            <div className="form-row">
              <TextField label="Phone" name="phone" value={formData.phone} onChange={handleChange} required className="form-col" />
              <FormControl className="form-col">
                <InputLabel>Role</InputLabel>
                <Select name="role" value={formData.role} onChange={handleChange} required>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="hr">HR</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div className="form-row">
              <FormControl className="form-col">
                <InputLabel>Designation</InputLabel>
                <Select name="designation_id" value={formData.designation_id} onChange={handleChange} required>
                  {designations.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl className="form-col">
                <InputLabel>Department</InputLabel>
                <Select name="department_id" value={formData.department_id} onChange={handleChange}>
                  {departments.map(dep => <MenuItem key={dep.id} value={dep.id}>{dep.name}</MenuItem>)}
                </Select>
              </FormControl>
            </div>
            <div className="form-row">
              <FormControl className="form-col">
                <InputLabel>Manager</InputLabel>
                <Select name="manager_id" value={formData.manager_id} onChange={handleChange}>
                  {managers.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>
            </div>
            <div className="form-row">
              <TextField type="date" name="joining_date" label="Joining Date" value={formData.joining_date} onChange={handleChange} InputLabelProps={{ shrink: true }} className="form-col" />
              <TextField type="date" name="relieving_date" label="Relieving Date" value={formData.relieving_date} onChange={handleChange} InputLabelProps={{ shrink: true }} className="form-col" />
            </div>
            {!editingId && (
              <div className="form-row">
                <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required className="form-col" />
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loadingAction}>
              {editingId ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

export default Employee;
