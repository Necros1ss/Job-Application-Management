import express from "express";
import { requireAuth, authorize } from "../middlewares/auth.js";
import { pool } from "../config/db.js";

const router = express.Router();

const mapSavedJob = (row) => ({
  id: row.id,
  candidateId: row.candidate_id,
  jobId: row.job_id,
    jobPostId: row.job_id,
  jobTitle: row.job_title,
  companyName: row.company_name,
  location: row.location,
  salary: row.salary,
  status: "saved",
  savedAt: row.saved_at,
});

router.post("/", requireAuth, authorize("candidate"), async (req, res) => {
    if (req.user.role !== "candidate") {
        return res.status(403).json({ message: "Only candidate accounts can save jobs" });
    }

    const { jobId } = req.body;
    const jobIdNum = Number(jobId);

    if (!jobId || isNaN(jobIdNum) || jobIdNum <= 0) {
        return res.status(400).json({ message: "Invalid job id" });
    }

    try {
        const existingSavedJob = await pool.query(
            `SELECT id
             FROM saved_jobs
             WHERE candidate_id = $1 AND job_post_id = $2
             LIMIT 1`,
            [req.user.id, jobIdNum]
        );

        if (existingSavedJob.rows.length > 0) {
            return res.status(200).json({
                id: existingSavedJob.rows[0].id,
                candidateId: req.user.id,
                jobId: jobIdNum,
                jobPostId: jobIdNum,
                status: "saved",
            });
        }

        const jobCheck = await pool.query(
            "SELECT id FROM job_posts WHERE id = $1",
            [jobIdNum]
        );

        if (jobCheck.rows.length === 0) {
            return res.status(404).json({ message: "Job post not found" });
        }

        const saveJobs = await pool.query(
            `INSERT INTO saved_jobs (candidate_id, job_post_id, saved_at)
             VALUES ($1, $2, NOW())
             RETURNING
                id,
                candidate_id,
                job_post_id AS job_id,
                saved_at`,
            [req.user.id, jobIdNum]
        );
        return res.status(201).json(mapSavedJob(saveJobs.rows[0]));
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ message: "This job is already saved" });
        }
        return res.status(500).json({ message: "Internal server error", detail: error.message });
    }
});

router.get("/", requireAuth, authorize("candidate"), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                sj.id AS id,
                sj.candidate_id,
                sj.saved_at,
                jp.id AS job_id,
                jp.title AS job_title,
                jp.location,
                jp.salary,
                r.company_name
            FROM saved_jobs sj
            JOIN job_posts jp ON sj.job_post_id = jp.id
            JOIN recruiters r ON jp.recruiter_id = r.id
            WHERE sj.candidate_id = $1
            ORDER BY sj.saved_at DESC`, 
            [req.user.id]
        );
        return res.json(result.rows.map(mapSavedJob));
    } catch (error) {
        console.error("Error fetching saved jobs:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/:id", requireAuth, authorize("candidate"), async (req, res) => {
    if (req.user.role !== "candidate") {
        return res.status(403).json({ message: "Only candidate accounts can delete applications" });
    }

    const { id } = req.params;
    const client = await pool.connect();

    try{
        await client.query("BEGIN");
        
        const result = await client.query(
            "DELETE FROM saved_jobs WHERE id = $1 AND candidate_id = $2",
            [id, req.user.id]
        );

        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Saved job not found" });
        }

        await client.query("COMMIT");

        return res.status(204).send();
    }
    catch(error) {
        await client.query("ROLLBACK");
        return res.status(500).json({ message: "Failed to delete saved job", detail: error.message });
    }
    finally{
        client.release();
    }
});

export default router;