import express from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const EMPLOYEE_STATUSES = new Set(["active", "inactive"]);
const ATTENDANCE_STATUSES = new Set(["present", "remote", "late", "absent"]);
const LEAVE_STATUSES = new Set(["approved", "rejected"]);

const mapEmployeeRow = (row) => ({
  id: row.id,
  candidateId: row.candidate_id,
  recruiterId: row.recruiter_id,
  applicationId: row.application_id,
  employeeCode: row.employee_code,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone || "",
  jobTitle: row.job_title || "",
  department: row.department || "",
  employmentType: row.employment_type || "",
  startDate: row.start_date,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  companyName: row.company_name,
});

const mapAttendanceRow = (row) => ({
  id: row.id,
  employeeId: row.employee_id,
  workDate: row.work_date,
  checkIn: row.check_in,
  checkOut: row.check_out,
  status: row.status,
  notes: row.notes || "",
  employeeName: row.employee_name,
});

const mapLeaveRow = (row) => ({
  id: row.id,
  employeeId: row.employee_id,
  leaveType: row.leave_type,
  startDate: row.start_date,
  endDate: row.end_date,
  reason: row.reason || "",
  status: row.status,
  reviewedBy: row.reviewed_by,
  reviewedAt: row.reviewed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  employeeName: row.employee_name,
  jobTitle: row.job_title,
});

router.get("/accepted-applications", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can access accepted applications" });
  }

  try {
    const result = await pool.query(
      `SELECT a.id,
              a.candidate_id,
              c.name AS candidate_name,
              c.email AS candidate_email,
              c.phone AS candidate_phone,
              jp.title AS job_title,
              jp.employment_type,
              r.company_name
       FROM applications a
       INNER JOIN candidates c ON c.id = a.candidate_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       INNER JOIN recruiters r ON r.id = jp.recruiter_id
       LEFT JOIN employees e ON e.application_id = a.id
       WHERE jp.recruiter_id = $1
         AND a.status = 'accepted'
         AND e.id IS NULL
       ORDER BY a.applied_at DESC, a.id DESC`,
      [req.user.id]
    );

    return res.json(result.rows.map((row) => ({
      id: row.id,
      candidateId: row.candidate_id,
      candidateName: row.candidate_name,
      candidateEmail: row.candidate_email,
      candidatePhone: row.candidate_phone,
      jobTitle: row.job_title,
      employmentType: row.employment_type,
      companyName: row.company_name,
    })));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load accepted applications", detail: error.message });
  }
});

router.get("/recruiter", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can access employees" });
  }

  try {
    const result = await pool.query(
      `SELECT e.id,
              e.candidate_id,
              e.recruiter_id,
              e.application_id,
              e.employee_code,
              e.full_name,
              e.email,
              e.phone,
              e.job_title,
              e.department,
              e.employment_type,
              e.start_date,
              e.status,
              e.created_at,
              e.updated_at,
              r.company_name
       FROM employees e
       INNER JOIN recruiters r ON r.id = e.recruiter_id
       WHERE e.recruiter_id = $1
       ORDER BY e.created_at DESC, e.id DESC`,
      [req.user.id]
    );

    return res.json(result.rows.map(mapEmployeeRow));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load employees", detail: error.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Only candidate accounts can access their employee profile" });
  }

  try {
    const result = await pool.query(
      `SELECT e.id,
              e.candidate_id,
              e.recruiter_id,
              e.application_id,
              e.employee_code,
              e.full_name,
              e.email,
              e.phone,
              e.job_title,
              e.department,
              e.employment_type,
              e.start_date,
              e.status,
              e.created_at,
              e.updated_at,
              r.company_name
       FROM employees e
       INNER JOIN recruiters r ON r.id = e.recruiter_id
       WHERE e.candidate_id = $1
       ORDER BY e.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    return res.json(result.rows[0] ? mapEmployeeRow(result.rows[0]) : null);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load employee profile", detail: error.message });
  }
});

router.post("/convert", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can convert candidates" });
  }

  const applicationId = Number(req.body.applicationId);
  const department = typeof req.body.department === "string" ? req.body.department.trim() : "";
  const startDate = req.body.startDate || null;
  const employeeCode = typeof req.body.employeeCode === "string" ? req.body.employeeCode.trim() : "";

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const applicationResult = await client.query(
      `SELECT a.id,
              a.candidate_id,
              c.name AS candidate_name,
              c.email AS candidate_email,
              c.phone AS candidate_phone,
              jp.title AS job_title,
              jp.employment_type
       FROM applications a
       INNER JOIN candidates c ON c.id = a.candidate_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       WHERE a.id = $1
         AND jp.recruiter_id = $2
         AND a.status = 'accepted'
       LIMIT 1`,
      [applicationId, req.user.id]
    );

    if (applicationResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Accepted application not found or you don't have permission to convert it" });
    }

    const application = applicationResult.rows[0];

    const result = await client.query(
      `INSERT INTO employees (
         candidate_id,
         recruiter_id,
         application_id,
         employee_code,
         full_name,
         email,
         phone,
         job_title,
         department,
         employment_type,
         start_date
       ) VALUES ($1, $2, $3, COALESCE(NULLIF($4, ''), $5), $6, $7, $8, $9, $10, $11, $12)
       RETURNING id,
                 candidate_id,
                 recruiter_id,
                 application_id,
                 employee_code,
                 full_name,
                 email,
                 phone,
                 job_title,
                 department,
                 employment_type,
                 start_date,
                 status,
                 created_at,
                 updated_at`,
      [
        application.candidate_id,
        req.user.id,
        applicationId,
        employeeCode,
        `EMP-${applicationId}`,
        application.candidate_name,
        application.candidate_email,
        application.candidate_phone || "",
        application.job_title,
        department,
        application.employment_type || "",
        startDate,
      ]
    );

    await client.query(
      `INSERT INTO application_events (
         application_id,
         actor_user_id,
         event_type,
         title,
         description,
         metadata
       ) VALUES ($1, $2, 'candidate_converted_to_employee', 'Candidate converted to employee', $3, $4::jsonb)`,
      [
        applicationId,
        req.user.id,
        application.candidate_name,
        JSON.stringify({ employeeId: result.rows[0].id }),
      ]
    );

    await client.query("COMMIT");
    return res.status(201).json(mapEmployeeRow(result.rows[0]));
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({ message: "This candidate is already converted or employee code is already used" });
    }
    return res.status(500).json({ message: "Failed to convert candidate", detail: error.message });
  } finally {
    client.release();
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can update employees" });
  }

  const employeeId = Number(req.params.id);
  const department = typeof req.body.department === "string" ? req.body.department.trim() : "";
  const status = typeof req.body.status === "string" ? req.body.status.trim() : "";

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return res.status(400).json({ message: "Invalid employee id" });
  }

  if (!EMPLOYEE_STATUSES.has(status)) {
    return res.status(400).json({ message: "Invalid employee status" });
  }

  try {
    const result = await pool.query(
      `UPDATE employees
       SET department = $1,
           status = $2,
           updated_at = now()
       WHERE id = $3
         AND recruiter_id = $4
       RETURNING id,
                 candidate_id,
                 recruiter_id,
                 application_id,
                 employee_code,
                 full_name,
                 email,
                 phone,
                 job_title,
                 department,
                 employment_type,
                 start_date,
                 status,
                 created_at,
                 updated_at`,
      [department, status, employeeId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found or you don't have permission to update it" });
    }

    return res.json(mapEmployeeRow(result.rows[0]));
  } catch (error) {
    return res.status(500).json({ message: "Failed to update employee", detail: error.message });
  }
});

router.get("/attendance", requireAuth, async (req, res) => {
  if (!["recruiter", "candidate"].includes(req.user.role)) {
    return res.status(403).json({ message: "Only recruiter or candidate accounts can access attendance" });
  }

  const recruiterMode = req.user.role === "recruiter";

  try {
    const result = await pool.query(
      `SELECT ar.id,
              ar.employee_id,
              ar.work_date,
              ar.check_in,
              ar.check_out,
              ar.status,
              ar.notes,
              e.full_name AS employee_name
       FROM attendance_records ar
       INNER JOIN employees e ON e.id = ar.employee_id
       WHERE ${recruiterMode ? "e.recruiter_id" : "e.candidate_id"} = $1
       ORDER BY ar.work_date DESC, ar.id DESC
       LIMIT 100`,
      [req.user.id]
    );

    return res.json(result.rows.map(mapAttendanceRow));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load attendance", detail: error.message });
  }
});

router.post("/attendance", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can record attendance" });
  }

  const employeeId = Number(req.body.employeeId);
  const workDate = req.body.workDate;
  const checkIn = req.body.checkIn || null;
  const checkOut = req.body.checkOut || null;
  const status = typeof req.body.status === "string" ? req.body.status.trim() : "present";
  const notes = typeof req.body.notes === "string" ? req.body.notes.trim() : "";

  if (!Number.isInteger(employeeId) || employeeId <= 0 || !workDate) {
    return res.status(400).json({ message: "employeeId and workDate are required" });
  }

  if (!ATTENDANCE_STATUSES.has(status)) {
    return res.status(400).json({ message: "Invalid attendance status" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO attendance_records (
         employee_id,
         work_date,
         check_in,
         check_out,
         status,
         notes
       )
       SELECT id, $2, $3, $4, $5, $6
       FROM employees
       WHERE id = $1
         AND recruiter_id = $7
       ON CONFLICT (employee_id, work_date)
       DO UPDATE SET check_in = EXCLUDED.check_in,
                     check_out = EXCLUDED.check_out,
                     status = EXCLUDED.status,
                     notes = EXCLUDED.notes,
                     updated_at = now()
       RETURNING id, employee_id, work_date, check_in, check_out, status, notes`,
      [employeeId, workDate, checkIn, checkOut, status, notes, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found or you don't have permission to record attendance" });
    }

    return res.status(201).json(mapAttendanceRow(result.rows[0]));
  } catch (error) {
    return res.status(500).json({ message: "Failed to record attendance", detail: error.message });
  }
});

router.get("/leave-requests", requireAuth, async (req, res) => {
  if (!["recruiter", "candidate"].includes(req.user.role)) {
    return res.status(403).json({ message: "Only candidate or recruiter accounts can access leave requests" });
  }

  const recruiterMode = req.user.role === "recruiter";

  try {
    const result = await pool.query(
      `SELECT lr.id,
              lr.employee_id,
              lr.leave_type,
              lr.start_date,
              lr.end_date,
              lr.reason,
              lr.status,
              lr.reviewed_by,
              lr.reviewed_at,
              lr.created_at,
              lr.updated_at,
              e.full_name AS employee_name,
              e.job_title
       FROM leave_requests lr
       INNER JOIN employees e ON e.id = lr.employee_id
       WHERE (${recruiterMode ? "e.recruiter_id" : "e.candidate_id"} = $1)
       ORDER BY lr.created_at DESC, lr.id DESC`,
      [req.user.id]
    );

    return res.json(result.rows.map(mapLeaveRow));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load leave requests", detail: error.message });
  }
});

router.post("/leave-requests", requireAuth, async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Only candidate employee accounts can request leave" });
  }

  const leaveType = typeof req.body.leaveType === "string" ? req.body.leaveType.trim() : "annual";
  const startDate = req.body.startDate;
  const endDate = req.body.endDate;
  const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";

  if (!startDate || !endDate) {
    return res.status(400).json({ message: "startDate and endDate are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO leave_requests (
         employee_id,
         leave_type,
         start_date,
         end_date,
         reason
       )
       SELECT id, $2, $3, $4, $5
       FROM employees
       WHERE candidate_id = $1
         AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1
       RETURNING id, employee_id, leave_type, start_date, end_date, reason, status, reviewed_by, reviewed_at, created_at, updated_at`,
      [req.user.id, leaveType || "annual", startDate, endDate, reason]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Active employee profile not found" });
    }

    return res.status(201).json(mapLeaveRow(result.rows[0]));
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit leave request", detail: error.message });
  }
});

router.patch("/leave-requests/:id", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can review leave requests" });
  }

  const requestId = Number(req.params.id);
  const status = typeof req.body.status === "string" ? req.body.status.trim() : "";

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ message: "Invalid leave request id" });
  }

  if (!LEAVE_STATUSES.has(status)) {
    return res.status(400).json({ message: "Invalid leave request status" });
  }

  try {
    const result = await pool.query(
      `UPDATE leave_requests lr
       SET status = $1,
           reviewed_by = $2,
           reviewed_at = now(),
           updated_at = now()
       FROM employees e
       WHERE lr.id = $3
         AND lr.employee_id = e.id
         AND e.recruiter_id = $2
       RETURNING lr.id,
                 lr.employee_id,
                 lr.leave_type,
                 lr.start_date,
                 lr.end_date,
                 lr.reason,
                 lr.status,
                 lr.reviewed_by,
                 lr.reviewed_at,
                 lr.created_at,
                 lr.updated_at,
                 e.full_name AS employee_name,
                 e.job_title`,
      [status, req.user.id, requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Leave request not found or you don't have permission to review it" });
    }

    return res.json(mapLeaveRow(result.rows[0]));
  } catch (error) {
    return res.status(500).json({ message: "Failed to review leave request", detail: error.message });
  }
});

export default router;
