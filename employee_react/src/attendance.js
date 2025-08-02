import React, { useState, useEffect, useCallback, } from 'react';
import axios from 'axios';
import { MdLogin, MdLogout, MdFreeBreakfast } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './attendance.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useMemo } from 'react';

const AttendanceForm = () => {
  const token = localStorage.getItem('employeeToken');
  const [role, setRole] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loggedEmployee, setLoggedEmployee] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hrCurrentPage, setHrCurrentPage] = useState(1);

  const [showRegularizeForm, setShowRegularizeForm] = useState(false);
  const [selectedDateForCorrection, setSelectedDateForCorrection] = useState(null);
  const [manualCheckIn, setManualCheckIn] = useState('');
  const [manualCheckOut, setManualCheckOut] = useState('');
  const [reason, setReason] = useState('');
  const [holidays, setHolidays] = useState([]);
  const [leaveList, setLeaveList] = useState([]);
  const [fetchedMonths, setFetchedMonths] = useState(new Set());



  const recordsPerPage = 10;
  const hrRecordsPerPage = 10;
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  console.log("🛡️ Token being sent:", token);


  // ✅ NEW: HR fetch function
  const fetchAllAttendanceForHR = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/attendance', authHeader);
      console.log("✅ HR All Attendance:", res.data);
      setAttendanceList(res.data);
    } catch (err) {
      console.error("❌ HR Attendance Error:", err);
      toast.error('Failed to fetch all employees attendance');
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/attendance/regularization-requests', authHeader);
      console.log("Pending requests for HR:", res.data);
      setPendingRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch HR requests:", err.response?.data);
      toast.error('Failed to load HR requests');
    }
  };

  const fetchMonthlyLeaves = async (employeeId, month, year) => {
    const key = `${employeeId}-${month}-${year}`;
    if (fetchedMonths.has(key)) return;

    try {
      const res = await axios.get('http://localhost:8000/api/employee-leaves', {
        params: { employee_id: employeeId, month, year },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(res.data)) {
        // Remove duplicate leaves from the response (if any)
        const uniqueNewLeaves = res.data.filter((leave, index, self) =>
          index === self.findIndex((t) => (
            t.id === leave.id &&
            t.start_date === leave.start_date &&
            t.end_date === leave.end_date
          ))
        );

        console.log("Unique new leaves from API:", uniqueNewLeaves);

        setLeaveList(prev => {
          // Filter out leaves that are already in state
          const filteredNewLeaves = uniqueNewLeaves.filter(newLeave =>
            !prev.some(existingLeave => existingLeave.id === newLeave.id)
          );

          console.log("Leaves to add after filtering existing:", filteredNewLeaves);

          return [
            ...prev,
            ...filteredNewLeaves.map(l => ({
              ...l,
              start_date: normalizeDate(l.start_date), // Using normalizeDate instead of split
              end_date: normalizeDate(l.end_date)
            }))
          ];
        });

        setFetchedMonths(prev => new Set([...prev, key])); // More immutable way
        return res.data;
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
      // Consider adding error handling/notification here
      throw error; // Re-throw if you want calling code to handle it
    }
  };

  const getLeaveStatusForDate = (dateStr) => {
    if (!selectedEmployee) {
      console.error('No selected employee');
      return null;
    }

    console.log('Checking leaves for employee:', selectedEmployee.id);

    const currentDate = new Date(dateStr);
    const matchingLeaves = leaveList.filter(l => {
      // Skip if not for current employee
      if (l.employee_id !== selectedEmployee.id) {
        console.log(`Skipping leave ${l.id} - wrong employee (${l.employee_id} != ${selectedEmployee.id})`);
        return false;
      }

      // Skip if dates are invalid
      if (!l.start_date || !l.end_date) {
        console.log(`Skipping leave ${l.id} - missing dates`);
        return false;
      }

      const startDate = new Date(l.start_date);
      const endDate = new Date(l.end_date);

      const isMatch = currentDate >= startDate && currentDate <= endDate;
      console.log(`Leave ${l.id} (${l.start_date} to ${l.end_date}) matches ${dateStr}:`, isMatch);
      return isMatch;
    });

    console.log('Total matching leaves:', matchingLeaves.length);

    if (matchingLeaves.length === 0) return null;

    return matchingLeaves[0].status === 'approved' ? 'leave_approved' : 'leave_applied';
  };


  const fetchAttendanceByRange = useCallback(async (empId, from, to) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/employee/attendance/${empId}/range`, {
        params: { from, to },
        headers: authHeader.headers,
        withCredentials: true,
      });
      setAttendanceList(res.data);
      return res.data;
    } catch (error) {
      toast.error("Failed to fetch attendance by date range.");
    }
  }, [token]);


  useEffect(() => {
    if (!token) return;
    const fetchAttendanceByRange = async (empId, from, to) => {
      try {
        const res = await axios.get(`http://localhost:8000/api/employee/attendance/${empId}/range`, {
          params: { from, to },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          withCredentials: true,
        });
        console.log("✅ Attendance List:", res.data);
        setAttendanceList(res.data);  //display dots in calender
        return res.data;
      } catch (error) {
        toast.error("Failed to fetch attendance by date range.");
      }
    };

    const fetchCurrentEmployee = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/me', authHeader);
        setLoggedEmployee(res.data);
        setSelectedEmployee(res.data);
        setRole(res.data.role?.toLowerCase());

        const today = new Date();

        // Fetch data for last 6 months instead of just current month
        const from = new Date(today.getFullYear(), today.getMonth() - 6, 1)
          .toISOString().split("T")[0];
        const to = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          .toISOString().split("T")[0];

        const month = today.getMonth() + 1;
        const year = today.getFullYear();

        if (res.data.role?.toLowerCase() === 'hr') {
          console.log("✅ Logged in as HR");
          await fetchAllAttendanceForHR();
          await fetchPendingRequests();
        } else {
          // Add await and error handling
          try {
            await fetchAttendanceByRange(res.data.id, from, to);
            await fetchMonthlyLeaves(res.data.id, month, year);
          } catch (error) {
            console.error("Failed to fetch attendance:", error);
            toast.error('Failed to load attendance data');
          }
        }
      } catch (err) {
        toast.error('Failed to fetch logged-in employee');
      }
    };

    fetchCurrentEmployee();
  }, [token]);


  const punchIn = async () => {
    const now = new Date();
    const tenAM = new Date();
    tenAM.setHours(10, 0, 0, 0);
    if (now < tenAM) toast.info('You are logging in early!');

    try {
      // Send only employee_id as backend handles the date automatically
      const response = await axios.post('http://localhost:8000/api/attendance/punch-in', {
        employee_id: selectedEmployee.id
      }, authHeader);

      console.log("PunchIn API Response:", response.data);

      // Update state with the returned attendance data
      if (response.data?.data) {
        setAttendanceList(prev => {
          const existingIndex = prev.findIndex(a =>
            a.employee_id === selectedEmployee.id &&
            a.date === todayStr
          );

          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...response.data.data, // Use the returned attendance object
              check_in: response.data.data.check_in // Ensure check_in is properly set
            };
            return updated;
          } else {
            return [...prev, {
              ...response.data.data,
              employee_id: selectedEmployee.id,
              date: todayStr
            }];
          }
        });
      }

      toast.success(response.data?.message || 'Punch in successful!');

      // Optional: Refresh data from server
      const currentDate = new Date();
      const from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        .toISOString().split("T")[0];
      const to = new Date().toISOString().split("T")[0];
      await fetchAttendanceByRange(selectedEmployee.id, from, to);

    } catch (err) {
      console.error("PunchIn Error Details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      const errorMessage = err.response?.data?.message ||
        (err.response?.status === 400 ? 'Already punched in today' : 'Punch in failed');
      toast.error(errorMessage);
    }
  };

  const punchOut = async () => {
    const now = new Date();
    const eightPM = new Date();
    eightPM.setHours(20, 0, 0, 0);
    if (now < eightPM) {
      const confirmEarly = window.confirm("⏰ Are you sure you want to punch out before 8 PM?");
      if (!confirmEarly) return;
    } else {
      toast.info('You are logging out after 8 PM. Overtime!');
    }
    try {
      await axios.post('http://localhost:8000/api/attendance/punch-out', { employee_id: selectedEmployee.id }, authHeader);
      toast.success('Punch Out successful!');
      const today = new Date();
      const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const to = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
      fetchAttendanceByRange(selectedEmployee.id, from, to);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Punch Out already done or failed.');
    }
  };

  const breakIn = async () => {
    try {
      await axios.post('http://localhost:8000/api/attendance/break-in', { employee_id: selectedEmployee.id }, authHeader);
      toast.success('Break In successful!');
      const currentDate = new Date();
      const from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split("T")[0];
      const to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split("T")[0];
      fetchAttendanceByRange(selectedEmployee.id, from, to);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Break In already done or failed.');
    }
  };

  const breakOut = async () => {
    try {
      await axios.post('http://localhost:8000/api/attendance/break-out', { employee_id: selectedEmployee.id }, authHeader);
      toast.success('Break Out successful!');
      const currentDate = new Date();
      const from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split("T")[0];
      const to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split("T")[0];
      fetchAttendanceByRange(selectedEmployee.id, from, to);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Break Out already done or failed.');
    }
  };

  // Format time function
  const formatTime = (timeStr) => {
    if (!timeStr) return '-';

    // Handle HH:MM:SS format from backend (e.g., "09:39:13")
    if (typeof timeStr === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr.substring(0, 5); // Extract just HH:MM
    }

    // Handle HH:MM format
    if (typeof timeStr === 'string' && /^\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }

    return '-';
  };


  const getBreakPairs = (record) => {
    const breaks = Array.isArray(record.breaks) ? record.breaks : [];
    if (!breaks.length) return '-';
    const formatPair = (b) => `${formatTime(b.break_in)} - ${formatTime(b.break_out)}`;
    if (breaks.length <= 2) return breaks.map(formatPair).join(', ');
    const visibleBreaks = breaks.slice(0, 2);
    const hiddenBreaks = breaks.slice(2);
    const tooltip = hiddenBreaks.map(formatPair).join(', ');
    return <>{visibleBreaks.map(formatPair).join(', ')}<span className="tooltip-dots" title={tooltip}> ...</span></>;
  };

  const openRegularizationForm = (record) => {
    setSelectedDateForCorrection(record.date);
    setShowRegularizeForm(true);
  };

  const submitRegularization = async () => {
    try {
      await axios.post('http://localhost:8000/api/attendance/regularize', {
        employee_id: selectedEmployee.id,
        date: selectedDateForCorrection,
        requested_check_in: manualCheckIn,
        requested_check_out: manualCheckOut,
        reason: reason,
      }, authHeader);
      toast.success('Regularization request submitted');
      setShowRegularizeForm(false);
      const today = new Date();
      const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const to = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
      fetchAttendanceByRange(selectedEmployee.id, from, to);
    } catch (err) {
      toast.error('Failed to submit regularization.');
    }
  };

  const renderActionButton = (record) => {     

    if (role?.trim().toLowerCase() === 'hr') return <span className="text-muted">N/A</span>;
    const today = new Date();
    const todayStr = new Date().toISOString().split('T')[0]; // '2025-07-31'
    const recordDate = record.date;
    const isRegularized = record.regularize_status === 'requested' || record.regularize_status === 'approved';

    if (recordDate !== todayStr) {
      return (
        <div className="action-buttons d-flex flex-column align-items-center gap-1">
          <span className="badge bg-secondary">No Action</span>
          {record.total_hours && parseFloat(record.total_hours) < 8 && !isRegularized && (
            <button className="btn btn-sm btn-outline-primary" onClick={() => openRegularizationForm(record)}>
              Request
            </button>
          )}
        </div>
      );
    }


    if (!record.check_in) {

      return <button className="btn btn-sm btn-success" onClick={punchIn}><MdLogin /> Punch In</button>;
    }

    const breaks = Array.isArray(record.breaks) ? record.breaks : [];
    const hasOpenBreak = breaks.some((b) => b.break_in && !b.break_out);

    if (record.check_in && !record.check_out) {
      return (
        <div className="d-flex flex-column gap-2">
          {hasOpenBreak ? (
            <button className="btn btn-sm btn-info" onClick={breakOut}><MdFreeBreakfast /> Break Out</button>
          ) : (
            <button className="btn btn-sm btn-warning" onClick={breakIn}><MdFreeBreakfast /> Break In</button>
          )}
          <button className="btn btn-sm btn-danger" onClick={punchOut}><MdLogout /> Punch Out</button>
        </div>
      );
    }

    return <span className="badge bg-success">Done</span>;
  };

  const handleRequestAction = async (attendanceId, status) => {
    try {
      const endpoint = `http://localhost:8000/api/attendance/regularize/${attendanceId}/approve`;
      await axios.post(endpoint, { status: status }, authHeader);
      toast.success(`Request ${status} successfully!`);

      const res = await axios.get('http://localhost:8000/api/attendance/regularization-requests', authHeader);
      setPendingRequests(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };


  //to represent calender
  const getStatusDot = (status) => {
    const colorMap = {
      present: "green",
      absent: "red",
      leave_applied: "yellow",
      leave_approved: "blue",
      holiday: "purple",
      weekly_off: "gray",
      half_day_morning: "orange",
      half_day_afternoon: "pink",
    };

    const labelMap = {
      present: "Present",
      absent: "Absent",
      leave_applied: "Leave Applied",
      leave_approved: "Leave Approved",
      holiday: "Holiday",
      weekly_off: "Weekly Off",
      half_day_morning: "Half-Day (Morning)",
      half_day_afternoon: "Half-Day (Afternoon)",
    };

    if (!status) return null;

    return (
      <span
        className={`dot ${colorMap[status]}`}
        title={labelMap[status]} // Tooltip on hover
      />
    );
  };


  // Fix the isWeeklyOff function
  const isWeeklyOff = (date) => {
    const dateStr = normalizeDate(date);
    const dateObj = new Date(dateStr);
    const day = dateObj.getDay();

    // Sunday is always off
    if (day === 0) return true;

    // For Saturdays - check if it's NOT 1st or 3rd Saturday
    if (day === 6) {
      const dayOfMonth = dateObj.getDate();
      const weekOfMonth = Math.ceil(dayOfMonth / 7);
      return weekOfMonth !== 1 && weekOfMonth !== 3; // Only 2nd and 4th are off
    }

    return false;
  };

  //logic for holidays
  const fetchHolidaysForMonth = async (date) => {
    try {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const res = await axios.get('http://localhost:8000/api/holidays', {
        params: { month, year }, headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        withCredentials: true,
      });

      if (Array.isArray(res.data)) {
        setHolidays(res.data);
        return res.data;   
      }
    } catch (error) {
      console.error("Failed to fetch holidays", error);
      setHolidays([]);

    }
  };

  const isBackendHoliday = (date) => {
    const dateStr = normalizeDate(date);
    console.log('Checking holiday for:', dateStr, 'Holiday data:', holidays);

    return holidays.some(h => {
      const holidayDate = normalizeDate(h.date);
      const isMatch = holidayDate === dateStr && h.type === 'holiday';
      console.log(`Comparing: ${holidayDate} === ${dateStr} && ${h.type} === 'holiday':`, isMatch);
      return isMatch;
    });
  };



  const getCalendarStatus = (date) => {
    const dateStr = normalizeDate(date);
    console.group(`Status check for ${dateStr}`);

    if (!dateStr) {
      console.log('Invalid date');
      console.groupEnd();
      return 'absent';
    }

    // 1. Check fixed holidays first
    const holidayMatch = holidays.find(h => {
      const holidayDate = normalizeDate(h.date);
      return holidayDate === dateStr && h.type === 'holiday';
    });

    if (holidayMatch) {
      console.log('Holiday match:', holidayMatch);
      console.groupEnd();
      return 'holiday';
    }

    // 2. Check weekly off (both from holidays data and calculated)
    const weeklyOffMatch = holidays.find(h => {
      const offDate = normalizeDate(h.date);
      return offDate === dateStr && h.type === 'weekly_off';
    });

    if (weeklyOffMatch || isWeeklyOff(date)) {
      console.log('Weekly off match:', weeklyOffMatch || 'calculated');
      console.groupEnd();
      return 'weekly_off';             
    }

    // 3. Check leaves
    const leaveMatch = leaveList.find(leave => {
      const start = normalizeDate(leave.start_date);
      const end = normalizeDate(leave.end_date);
      return dateStr >= start && dateStr <= end && leave.employee_id === selectedEmployee?.id;
    });

    if (leaveMatch) {
      console.log('Leave match:', leaveMatch);
      console.groupEnd();
      return leaveMatch.status === 'approved' ? 'leave_approved' : 'leave_applied';
    }

    // 4. Check attendance
    const record = attendanceList.find(a =>
      normalizeDate(a.date) === dateStr &&
      a.employee_id === selectedEmployee?.id
    );

    if (record) {
      console.log('Attendance record:', record);
      if (record.status === 'present') {
        const status = record.day_type === 'half'
          ? (record.check_in && !record.check_out ? 'half_day_afternoon' : 'half_day_morning')
          : 'present';
        console.groupEnd();
        return status;
      }
      console.groupEnd();
      return 'absent';
    }

    console.log('No matches found');
    console.groupEnd();
    return 'absent';
  };


  //useeffct for calender 
  useEffect(() => {
    if (!selectedEmployee?.id) return;

    const loadCalendarData = async () => {
      try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();

        // Calculate date range (4 months back + 1 month forward)
        const from = new Date(year, month - 4, 1).toISOString().split('T')[0];
        const to = new Date(year, month + 1, 0).toISOString().split('T')[0];

        // Fetch all data in parallel
        const [holidaysData, leavesData, attendanceData] = await Promise.all([
          fetchHolidaysForMonth(today),
          fetchMonthlyLeaves(selectedEmployee.id, month, year),
          fetchAttendanceByRange(selectedEmployee.id, from, to)
        ]);

        // Debug logs with actual data
        console.log('Loaded calendar data:', {
          dateRange: { from, to },
          holidays: holidaysData.data,
          leaves: leavesData.data,
          attendance: attendanceData.data,
          employeeId: selectedEmployee.id
        });

        // Verify August 15th is in holidays
        if (holidaysData.data.some(h =>
          normalizeDate(h.date) === '2025-08-15' && h.type === 'holiday'
        )) {
          console.log('✅ August 15th holiday found in data');
        } else {
          console.log('❌ August 15th holiday missing from data');
        }

      } catch (err) {
        console.error('Calendar data loading failed:', {
          error: err.message,
          employeeId: selectedEmployee?.id,
          timestamp: new Date().toISOString(),
          stack: err.stack
        });
        toast.error('Failed to load calendar data. Please try again.');
      }
    };

    // Add loading state management if needed
    loadCalendarData();

    // Cleanup function if needed
    return () => {
      // Cancel any pending requests if component unmounts
    };
  }, [selectedEmployee?.id]);

  //today's record 
  // Make sure todayStr is properly formatted
  // At the top of your component (with other state declarations)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // "YYYY-MM-DD"

  // Then update your todayRecord finding logic:
  const todayRecord = useMemo(() => {
    return attendanceList.find(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return (
        record.employee_id === selectedEmployee?.id &&
        recordDate === todayStr
      );
    });
  }, [attendanceList, selectedEmployee?.id, todayStr]);

  // Normalize function
  const normalizeDate = (dateInput) => {
  if (!dateInput) return null;
  
  try {
    // Handle Date objects
    if (dateInput instanceof Date) {
      const pad = num => num.toString().padStart(2, '0');
      return `${dateInput.getFullYear()}-${pad(dateInput.getMonth()+1)}-${pad(dateInput.getDate())}`;
    }
    
    // Handle string dates
    if (typeof dateInput === 'string') {
      // Remove time portion if exists
      const dateOnly = dateInput.split('T')[0].split(' ')[0];
      const parts = dateOnly.split('-').map(part => part.padStart(2, '0'));
      
      if (parts.length === 3) {
        // Ensure year is 4 digits, month and day are 2 digits
        return `${parts[0].length === 2 ? '20' + parts[0] : parts[0]}-${parts[1]}-${parts[2]}`;
      }
    }
    
    return null;
  } catch (e) {
    console.error('Date normalization error:', e, 'Input:', dateInput);
    return null;
  }
};

  const pastRecords = attendanceList.filter(record => {
    const recordDate = normalizeDate(record.date);
    const today = normalizeDate(new Date());
    return (
      record.employee_id === selectedEmployee?.id &&
      recordDate &&
      recordDate !== today
    );
  });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = pastRecords.slice(indexOfFirstRecord, indexOfLastRecord);



  // hr records pagination
  const hrIndexOfLastRecord = hrCurrentPage * hrRecordsPerPage;
  const hrIndexOfFirstRecord = hrIndexOfLastRecord - hrRecordsPerPage;
  const hrPaginatedRecords = attendanceList.slice(hrIndexOfFirstRecord, hrIndexOfLastRecord);

  return (
    <div className="container py-4">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* Regularization Modal */}
      {showRegularizeForm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h5>Regularize for {selectedDateForCorrection}</h5>
            <label>Requested Check In:</label>
            <input type="time" value={manualCheckIn} onChange={(e) => setManualCheckIn(e.target.value)} />
            <label>Requested Check Out:</label>
            <input type="time" value={manualCheckOut} onChange={(e) => setManualCheckOut(e.target.value)} />
            <label>Reason:</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="mt-2">
              <button className="btn btn-primary" onClick={submitRegularization}>Submit</button>
              <button className="btn btn-secondary ms-2" onClick={() => setShowRegularizeForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        {/* ✅ EMPLOYEE VIEW ONLY */}
        {role?.trim().toLowerCase() !== 'hr' && (
          <>
            {/* Left Side: Today's Attendance */}
            <div className="col-md-4">
              {selectedEmployee && (

                <div className="card shadow rounded-4">
                  <div className="card-header text-white text-center rounded-top-4">
                    <h5>Today's Attendance</h5>
                  </div>
                  <div className="card-body">
                    {console.log("Raw check-in time from backend:", todayRecord?.check_in)}
                    {console.log("Formatted check-in time:", formatTime(todayRecord?.check_in))}
                    <table className="table table-bordered">
                      <tbody>
                        <tr><td><strong>Name:</strong></td><td>{selectedEmployee?.name || '-'}</td></tr>
                        <tr><td><strong>Date:</strong></td><td>{todayRecord?.date ? new Date(todayRecord.date).toISOString().split('T')[0] : todayStr}</td></tr>
                        <tr>
                          <td><strong>Check-In:</strong></td>
                          <td>
                            {todayRecord?.check_in ? (
                              <span>{formatTime(todayRecord.check_in)}</span>
                            ) : (
                              <span className="text-danger">Not checked in yet</span>
                            )}
                          </td>
                        </tr>
                        <tr><td><strong>Breaks:</strong></td><td>{todayRecord ? getBreakPairs(todayRecord) : '-'}</td></tr>
                        <tr><td><strong>Check-Out:</strong></td><td>{todayRecord?.check_out ? formatTime(todayRecord.check_out) : '-'}</td></tr>
                        <tr><td><strong>Total Hours:</strong></td><td>{todayRecord?.total_hours || '-'}</td></tr>
                        <tr>
                          <td colSpan={2}>
                            {todayRecord ? renderActionButton(todayRecord) : (
                              <button className="btn btn-sm btn-success" onClick={punchIn}>
                                <MdLogin /> Punch In
                              </button>

                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Attendance Logs */}
            <div className="col-md-8">
              <div className="card shadow rounded-4">
                <div className="card-header text-center text-white rounded-top-4">
                  <h5>Attendance Logs</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Check In</th>
                          <th>Breaks</th>
                          <th>Check Out</th>
                          <th>Total Hours</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentRecords.map((record) => (
                          <tr key={record.id}>
                            <td>{record.date}</td>
                            <td>{formatTime(record.check_in)}</td>
                            <td>{getBreakPairs(record)}</td>
                            <td>{formatTime(record.check_out)}</td>
                            <td>{record.total_hours || '-'}</td>
                            <td>
                              {isBackendHoliday(record.date) ? (
                                <span className="badge bg-info">Holiday</span>
                              ) : record.regularize_status === 'requested' ? (
                                <span className="badge bg-warning">Requested</span>
                              ) : record.regularize_status === 'approved' ? (
                                <span className="badge bg-success">Approved</span>
                              ) : record.regularize_status === 'rejected' ? (
                                <span className="badge bg-danger">Rejected</span>
                              ) : (
                                <span className="text-muted">{record.status || '-'}</span>
                              )}
                            </td>
                            <td>{renderActionButton(record)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="pagination-container mt-3">
                    {[...Array(Math.ceil(pastRecords.length / recordsPerPage)).keys()].map((num) => (
                      <button
                        key={num}
                        onClick={() => setCurrentPage(num + 1)}
                        className={`pagination-btn ${currentPage === num + 1 ? 'active' : ''}`}
                      >
                        {num + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar View Section - Right aligned under Attendance Logs */}
            <div className="calendar-section">
              <div className="card calendar-card shadow rounded-4">
                <div className="card-header text-white bg-info">
                  Calendar View
                </div>
                <div className="card-body">
                  {selectedEmployee && (
                    <Calendar
                      key={`${holidays.length}-${leaveList.length}-${attendanceList.length}`}

                      onActiveStartDateChange={({ activeStartDate }) => {
                        const month = activeStartDate.getMonth() + 1;
                        const year = activeStartDate.getFullYear();
                        const from = new Date(year, month - 1, 1).toISOString().split('T')[0];
                        const to = new Date(year, month, 0).toISOString().split('T')[0];

                        const prevMonth = month === 1 ? 12 : month - 1;
                        const prevYear = month === 1 ? year - 1 : year;

                        if (selectedEmployee) {
                          Promise.all([
                            fetchHolidaysForMonth(activeStartDate),
                            fetchMonthlyLeaves(selectedEmployee.id, month, year),
                            fetchMonthlyLeaves(selectedEmployee.id, prevMonth, prevYear),
                            fetchAttendanceByRange(selectedEmployee.id, from, to)
                          ]).catch(err => {
                            console.error('Error loading calendar data:', err);
                            toast.error('Failed to update calendar data');
                          });

                        }
                      }}

                      tileClassName={({ date, view }) => {
                        if (view === 'month' && date.getDay() === 0) {
                          return 'only-sunday-red';
                        }
                        return null;
                      }}

                      tileContent={({ date, view }) => {
                        if (view !== 'month') return null;
                        if (date > new Date()) return null;

                        const status = getCalendarStatus(date);
                        console.log(`Final status for ${date.toISOString().split('T')[0]}:`, status);
                        console.log("attendanceList inside tileContent:", attendanceList);

                        // Debug logs (optional)
                        console.log("📅 Calendar Date Status:", {
                          date: date.toISOString().split('T')[0],
                          status,
                          isHoliday: isBackendHoliday(date),
                          isWeeklyOff: isWeeklyOff(date),
                          leaveStatus: getLeaveStatusForDate(date)
                        });

                        return (
                          <div className="calendar-dot-container">
                            {getStatusDot(status)}
                            {status === 'holiday' && (
                              <span className="holiday-tooltip">Holiday</span>
                            )}
                          </div>
                        );
                      }}
                    />
                  )}
                </div>
                <div className="calendar-legend px-3 pb-3">
                  <span className="legend-item"><span className="dot green" /> Present</span>
                  <span className="legend-item"><span className="dot red" /> Absent</span>
                  <span className="legend-item"><span className="dot yellow" /> Leave Applied</span>
                  <span className="legend-item"><span className="dot blue" /> Leave Approved</span>
                  <span className="legend-item"><span className="dot gray" /> Weekly Off</span>
                  <span className="legend-item"><span className="dot purple" /> Holiday</span>
                  <div><span className="dot orange"></span> Half-Day Morning</div>
                  <div><span className="dot pink"></span> Half-Day Afternoon</div>
                </div>
              </div>
            </div>

          </>
        )}

        {/* ✅ HR VIEW ONLY */}
        {role?.trim().toLowerCase() === 'hr' && (
          <div className="col-md-12">
            <div className="card shadow rounded-4">
              <div className="card-header text-white text-center rounded-top-4 bg-dark">
                <h5>All Employees' Attendance Logs</h5>
              </div>
              <div className="card-body table-responsive">
                <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Breaks</th>
                      <th>Check Out</th>
                      <th>Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hrPaginatedRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{record.employee?.name || '-'}</td>
                        <td>{record.date}</td>
                        <td>{formatTime(record.check_in)}</td>
                        <td>{getBreakPairs(record)}</td>
                        <td>{formatTime(record.check_out)}</td>
                        <td>{record.total_hours || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* HR Pagination */}
                <div className="pagination-container mt-3">
                  {[...Array(Math.ceil(attendanceList.length / hrRecordsPerPage)).keys()].map((num) => (
                    <button
                      key={num}
                      onClick={() => setHrCurrentPage(num + 1)}
                      className={`pagination-btn ${hrCurrentPage === num + 1 ? 'active' : ''}`}
                    >
                      {num + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* HR: Regularization Requests */}
            <div className="card shadow mt-4 rounded-4">
              <div className="card-header text-white text-center rounded-top-4 bg-primary">
                <h5>Pending Attendance Regularization Requests</h5>
              </div>
              <div className="card-body table-responsive">
                {pendingRequests.length === 0 ? (
                  <p className="text-center">No pending requests 🎉</p>
                ) : (
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Date</th>
                        <th>Requested Check In</th>
                        <th>Requested Check Out</th>
                        <th>Reason</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map((req) => (
                        <tr key={req.id}>
                          <td>{req.employee?.name}</td>
                          <td>{req.date}</td>
                          <td>{req.requested_check_in}</td>
                          <td>{req.requested_check_out}</td>
                          <td>{req.reason}</td>
                          <td>
                            <button className="btn btn-sm btn-success btn-approve me-2" onClick={() => handleRequestAction(req.id, 'approved')}>Approve</button>
                            <button className="btn btn-sm btn-danger btn-reject" onClick={() => handleRequestAction(req.id, 'rejected')}>Reject</button>

                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

};

export default AttendanceForm;
