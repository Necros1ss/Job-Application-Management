import { pool } from "../config/db.js";

export const withTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const findByCandidate = async ({ candidateId, status }) => {
  const params = [candidateId];
  const statusClause = status ? " AND a.status = $2" : "";

  if (status) {
    params.push(status);
  }

  const result = await pool.query(
    `SELECT
        a.id,
        jp.title AS job_title,
        COALESCE(r.company_name, 'Unknown Company') AS company_name,
        a.applied_at::date AS application_date,
        a.status,
        a.job_post_id
     FROM applications a
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     LEFT JOIN recruiters r ON r.id = jp.recruiter_id
     WHERE a.candidate_id = $1${statusClause}
     ORDER BY a.applied_at DESC, a.id DESC`,
    params
  );

  return result.rows;
};

export const findByRecruiter = async ({ recruiterId, page, limit, offset, jobPostId, status }) => {
  const params = [recruiterId];
  const clauses = ["jp.recruiter_id = $1"];

  if (jobPostId) {
    params.push(jobPostId);
    clauses.push(`jp.id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    clauses.push(`a.status = $${params.length}`);
  }

  const filterSql = `WHERE ${clauses.join(" AND ")}`;
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM applications a
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     ${filterSql}`,
    params
  );

  const total = Number(countResult.rows[0]?.total || 0);
  const result = await pool.query(
    `SELECT
        a.id,
        a.candidate_id,
        a.job_post_id,
        a.applied_at::date AS application_date,
        a.status,
        a.cover_letter,
        a.rating,
        c.name AS candidate_name,
        c.email AS candidate_email,
        c.phone AS candidate_phone,
        jp.title AS job_title,
        COALESCE(r.company_name, 'Unknown Company') AS company_name,
        a.cv_file_name,
        COALESCE(note_counts.note_count, 0)::int AS note_count,
        (ai_screening.metadata->>'score')::int AS ai_score,
        ai_screening.metadata->>'recommendation' AS ai_recommendation,
        ai_screening.created_at AS ai_screened_at
     FROM applications a
     INNER JOIN candidates c ON c.id = a.candidate_id
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     LEFT JOIN recruiters r ON r.id = jp.recruiter_id
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS note_count
       FROM application_notes an
       WHERE an.application_id = a.id
     ) note_counts ON true
     LEFT JOIN LATERAL (
       SELECT ae.metadata, ae.created_at
       FROM application_events ae
       WHERE ae.application_id = a.id
         AND ae.event_type = 'ai_screening'
       ORDER BY ae.created_at DESC, ae.id DESC
       LIMIT 1
     ) ai_screening ON true
     ${filterSql}
     ORDER BY a.applied_at DESC, a.id DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    data: result.rows,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const findActivity = async ({ recruiterId }) => {
  const result = await pool.query(
    `SELECT ae.id,
            ae.application_id,
            ae.event_type,
            ae.title,
            ae.description,
            ae.created_at,
            c.name AS candidate_name,
            jp.title AS job_title
     FROM application_events ae
     INNER JOIN applications a ON a.id = ae.application_id
     INNER JOIN candidates c ON c.id = a.candidate_id
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     WHERE jp.recruiter_id = $1
     ORDER BY ae.created_at DESC, ae.id DESC
     LIMIT 10`,
    [recruiterId]
  );

  return result.rows;
};

const buildAnalyticsDateFilter = ({ startDate, endDate }, alias = "a") => {
  const clauses = [];
  const params = [];

  if (startDate) {
    params.push(startDate);
    clauses.push(`${alias}.applied_at >= $${params.length}::date`);
  }

  if (endDate) {
    params.push(endDate);
    clauses.push(`${alias}.applied_at < ($${params.length}::date + INTERVAL '1 day')`);
  }

  return { clauses, params };
};

export const findRecruiterAnalytics = async ({ recruiterId, startDate, endDate }) => {
  const dateFilter = buildAnalyticsDateFilter({ startDate, endDate });
  const baseParams = [recruiterId, ...dateFilter.params];
  const baseClauses = [
    "jp.recruiter_id = $1",
    ...dateFilter.clauses.map((clause) =>
      clause.replace(/\$(\d+)/g, (_, index) => `$${Number(index) + 1}`)
    ),
  ];
  const baseWhere = `WHERE ${baseClauses.join(" AND ")}`;
  const weekEnd = endDate || new Date().toISOString().slice(0, 10);

  const statusResult = await pool.query(
    `SELECT a.status, COUNT(*)::int AS count
     FROM applications a
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     ${baseWhere}
     GROUP BY a.status`,
    baseParams
  );

  const weekResult = await pool.query(
    `WITH weeks AS (
       SELECT generate_series(
         date_trunc('week', $2::date) - INTERVAL '7 weeks',
         date_trunc('week', $2::date),
         INTERVAL '1 week'
       )::date AS week_start
     )
     SELECT
       'Week ' || ROW_NUMBER() OVER (ORDER BY weeks.week_start) AS week,
       weeks.week_start,
       COUNT(a.id)::int AS count
     FROM weeks
     LEFT JOIN applications a
       ON date_trunc('week', a.applied_at)::date = weeks.week_start
      AND EXISTS (
        SELECT 1
        FROM job_posts jp
        WHERE jp.id = a.job_post_id
          AND jp.recruiter_id = $1
      )
     GROUP BY weeks.week_start
     ORDER BY weeks.week_start`,
    [recruiterId, weekEnd]
  );

  const jobResult = await pool.query(
    `SELECT jp.id, jp.title, COUNT(a.id)::int AS count
     FROM applications a
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     ${baseWhere}
     GROUP BY jp.id, jp.title, jp.created_at
     ORDER BY COUNT(a.id) DESC, jp.created_at DESC
     LIMIT 5`,
    baseParams
  );

  const kpiResult = await pool.query(
    `SELECT
       COUNT(*)::int AS total_applications,
       COUNT(*) FILTER (WHERE a.status = 'accepted')::int AS accepted_applications
     FROM applications a
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     ${baseWhere}`,
    baseParams
  );

  const timeToHireResult = await pool.query(
    `SELECT AVG(DATE_PART('day', accepted_event.created_at - a.applied_at))::numeric(10, 1) AS avg_time_to_hire
     FROM applications a
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     LEFT JOIN LATERAL (
       SELECT ae.created_at
       FROM application_events ae
       WHERE ae.application_id = a.id
         AND (
           ae.event_type = 'offer_sent'
           OR (ae.event_type = 'status_changed' AND ae.metadata->>'to' = 'accepted')
         )
       ORDER BY ae.created_at ASC
       LIMIT 1
     ) accepted_event ON true
     ${baseWhere}
       AND a.status = 'accepted'
       AND accepted_event.created_at IS NOT NULL`,
    baseParams
  );

  const interviewsResult = await pool.query(
    `SELECT COUNT(*)::int AS interviews_this_week
     FROM interviews i
     INNER JOIN applications a ON a.id = i.application_id
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     WHERE jp.recruiter_id = $1
       AND i.interview_datetime >= date_trunc('week', now())
       AND i.interview_datetime < date_trunc('week', now()) + INTERVAL '1 week'`,
    [recruiterId]
  );

  return {
    statuses: statusResult.rows,
    weeks: weekResult.rows,
    jobs: jobResult.rows,
    kpis: kpiResult.rows[0] || {},
    avgTimeToHire: timeToHireResult.rows[0]?.avg_time_to_hire,
    interviewsThisWeek: interviewsResult.rows[0]?.interviews_this_week || 0,
  };
};

export const findById = async ({ applicationId, recruiterId }) => {
  const result = await pool.query(
    `SELECT
        a.id,
        a.candidate_id,
        a.job_post_id,
        a.applied_at::date AS application_date,
        a.status,
        a.cover_letter,
        a.rating,
        c.name AS candidate_name,
        c.email AS candidate_email,
        c.phone AS candidate_phone,
        jp.title AS job_title,
        COALESCE(r.company_name, 'Unknown Company') AS company_name,
        a.cv_file_name,
        (ai_screening.metadata->>'score')::int AS ai_score,
        ai_screening.metadata->>'recommendation' AS ai_recommendation,
        ai_screening.created_at AS ai_screened_at
     FROM applications a
     INNER JOIN candidates c ON c.id = a.candidate_id
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     LEFT JOIN recruiters r ON r.id = jp.recruiter_id
     LEFT JOIN LATERAL (
       SELECT ae.metadata, ae.created_at
       FROM application_events ae
       WHERE ae.application_id = a.id
         AND ae.event_type = 'ai_screening'
       ORDER BY ae.created_at DESC, ae.id DESC
       LIMIT 1
     ) ai_screening ON true
     WHERE jp.recruiter_id = $1 AND a.id = $2
     LIMIT 1`,
    [recruiterId, applicationId]
  );

  return result.rows[0] || null;
};

export const findAiScreeningContext = async ({ applicationId, recruiterId }) => {
  const result = await pool.query(
    `SELECT
        a.id,
        a.candidate_id,
        a.job_post_id,
        a.cover_letter,
        a.cv_file_name,
        a.cv_mime_type,
        a.cv_file_size_bytes,
        c.name AS candidate_name,
        c.email AS candidate_email,
        c.phone AS candidate_phone,
        c.skills AS candidate_skills,
        c.experience AS candidate_experience,
        jp.title AS job_title,
        jp.description AS job_description,
        jp.requirements AS job_requirements,
        jp.responsibilities AS job_responsibilities,
        jp.experience AS job_experience,
        jp.employment_type AS employment_type,
        COALESCE(r.company_name, 'Unknown Company') AS company_name
     FROM applications a
     INNER JOIN candidates c ON c.id = a.candidate_id
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     LEFT JOIN recruiters r ON r.id = jp.recruiter_id
     WHERE a.id = $1
       AND jp.recruiter_id = $2
     LIMIT 1`,
    [applicationId, recruiterId]
  );

  return result.rows[0] || null;
};

export const findLatestAiScreening = async ({ applicationId, recruiterId }) => {
  const result = await pool.query(
    `SELECT ae.id,
            ae.application_id,
            ae.actor_user_id,
            ae.event_type,
            ae.title,
            ae.description,
            ae.metadata,
            ae.created_at
     FROM application_events ae
     INNER JOIN applications a ON a.id = ae.application_id
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     WHERE ae.application_id = $1
       AND jp.recruiter_id = $2
       AND ae.event_type = 'ai_screening'
     ORDER BY ae.created_at DESC, ae.id DESC
     LIMIT 1`,
    [applicationId, recruiterId]
  );

  return result.rows[0] || null;
};

export const findNotes = async ({ applicationId }) => {
  const result = await pool.query(
    `SELECT id, application_id, recruiter_id, note, created_at, updated_at
     FROM application_notes
     WHERE application_id = $1
     ORDER BY created_at DESC, id DESC`,
    [applicationId]
  );

  return result.rows;
};

export const findEvents = async ({ applicationId }) => {
  const result = await pool.query(
    `SELECT id, application_id, actor_user_id, event_type, title, description, metadata, created_at
     FROM application_events
     WHERE application_id = $1
     ORDER BY created_at DESC, id DESC`,
    [applicationId]
  );

  return result.rows;
};

export const findCvForRecruiter = async ({ applicationId, recruiterId }) => {
  const result = await pool.query(
    `SELECT
        a.id,
        a.cv_file_name,
        a.cv_mime_type,
        a.cv_file_size_bytes
     FROM applications a
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     WHERE jp.recruiter_id = $1 AND a.id = $2
     LIMIT 1`,
    [recruiterId, applicationId]
  );

  return result.rows[0] || null;
};

export const findJobById = async (client, { jobId }) => {
  const result = await client.query(
    "SELECT id, deadline FROM job_posts WHERE id = $1",
    [jobId]
  );

  return result.rows[0] || null;
};

export const findExistingCandidateApplication = async (client, { candidateId, jobId }) => {
  const result = await client.query(
    "SELECT 1 FROM applications WHERE candidate_id = $1 AND job_post_id = $2",
    [candidateId, jobId]
  );

  return result.rows[0] || null;
};

export const create = async (client, { candidateId, jobId, coverLetter }) => {
  const application = await client.query(
    `INSERT INTO applications (candidate_id, job_post_id, applied_at, status)
     VALUES ($1, $2, NOW(), 'applied')
     RETURNING *`,
    [candidateId, jobId]
  );

  await client.query(
    `UPDATE applications
     SET cover_letter = $1
     WHERE id = $2`,
    [coverLetter, application.rows[0].id]
  );

  return application.rows[0];
};

export const updateCvMetadata = async (client, { applicationId, fileName, mimeType, fileSizeBytes }) => {
  await client.query(
    `UPDATE applications
     SET cv_file_name = $1,
         cv_mime_type = $2,
         cv_file_size_bytes = $3,
         cv_file_path = $4
     WHERE id = $5`,
    [fileName, mimeType, fileSizeBytes, fileName, applicationId]
  );
};

export const createApplicationEvent = async (
  client,
  { applicationId, actorUserId, eventType, title, description = "", metadata = {} }
) => {
  const result = await client.query(
    `INSERT INTO application_events (
       application_id,
       actor_user_id,
       event_type,
       title,
       description,
       metadata
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING id, application_id, actor_user_id, event_type, title, description, metadata, created_at`,
    [
      applicationId,
      actorUserId,
      eventType,
      title,
      description,
      JSON.stringify(metadata),
    ]
  );

  return result.rows[0] || null;
};

export const findRecruiterByCompanyName = async (client, { companyName }) => {
  const result = await client.query(
    `SELECT id
     FROM recruiters
     WHERE lower(company_name) = lower($1)
     LIMIT 1`,
    [companyName]
  );

  return result.rows[0] || null;
};

export const createRecruiter = async (client, { loginName, passwordHash, companyName, email }) => {
  const userInsert = await client.query(
    `INSERT INTO users (login_name, password_hash, role)
     VALUES ($1, $2, 'recruiter')
     RETURNING id`,
    [loginName, passwordHash]
  );

  const recruiterId = userInsert.rows[0].id;

  await client.query(
    `INSERT INTO recruiters (id, company_name, email)
     VALUES ($1, $2, $3)`,
    [recruiterId, companyName, email]
  );

  return recruiterId;
};

export const findCandidateApplicationForUpdate = async (client, { applicationId, candidateId }) => {
  const result = await client.query(
    `SELECT id, job_post_id
     FROM applications
     WHERE id = $1 AND candidate_id = $2`,
    [applicationId, candidateId]
  );

  return result.rows[0] || null;
};

export const updateJobForCandidateApplication = async (client, { jobPostId, title, recruiterId }) => {
  await client.query(
    `UPDATE job_posts
     SET title = $1,
         recruiter_id = $2
     WHERE id = $3`,
    [title, recruiterId, jobPostId]
  );
};

export const updateCandidateApplication = async (client, { applicationId, candidateId, applicationDate, status }) => {
  const result = await client.query(
    `UPDATE applications
     SET applied_at = $1,
         status = $2
     WHERE id = $3 AND candidate_id = $4
     RETURNING id, applied_at::date AS application_date, status`,
    [applicationDate, status, applicationId, candidateId]
  );

  return result.rows[0] || null;
};

export const findOwnedApplicationForUpdate = async (client, { applicationId, recruiterId }) => {
  const result = await client.query(
    `SELECT a.id,
            a.status,
            a.candidate_id,
            a.job_post_id,
            jp.title AS job_title
     FROM applications a
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     WHERE a.id = $1
       AND jp.recruiter_id = $2
     FOR UPDATE OF a`,
    [applicationId, recruiterId]
  );

  return result.rows[0] || null;
};

export const updateStatus = async (client, { applicationId, status }) => {
  const result = await client.query(
    `UPDATE applications
     SET status = $1
     WHERE id = $2
     RETURNING id, status`,
    [status, applicationId]
  );

  return result.rows[0] || null;
};

export const updateRating = async (client, { applicationId, recruiterId, rating }) => {
  const result = await client.query(
    `UPDATE applications a
     SET rating = $1
     FROM job_posts jp
     WHERE a.id = $2
       AND a.job_post_id = jp.id
       AND jp.recruiter_id = $3
     RETURNING a.id, a.rating`,
    [rating, applicationId, recruiterId]
  );

  return result.rows[0] || null;
};

export const addNote = async (client, { applicationId, recruiterId, note }) => {
  const result = await client.query(
    `INSERT INTO application_notes (application_id, recruiter_id, note)
     VALUES ($1, $2, $3)
     RETURNING id, application_id, recruiter_id, note, created_at, updated_at`,
    [applicationId, recruiterId, note]
  );

  return result.rows[0] || null;
};

export const updateNote = async (client, { applicationId, noteId, recruiterId, note }) => {
  const result = await client.query(
    `UPDATE application_notes an
     SET note = $1,
         updated_at = now()
     FROM applications a
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     WHERE an.id = $2
       AND an.application_id = $3
       AND an.application_id = a.id
       AND an.recruiter_id = $4
       AND jp.recruiter_id = $4
     RETURNING an.id, an.application_id, an.recruiter_id, an.note, an.created_at, an.updated_at`,
    [note, noteId, applicationId, recruiterId]
  );

  return result.rows[0] || null;
};

export const deleteNote = async (client, { applicationId, noteId, recruiterId }) => {
  const result = await client.query(
    `DELETE FROM application_notes an
     USING applications a
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     WHERE an.id = $1
       AND an.application_id = $2
       AND an.application_id = a.id
       AND an.recruiter_id = $3
       AND jp.recruiter_id = $3
     RETURNING an.id`,
    [noteId, applicationId, recruiterId]
  );

  return result.rows[0] || null;
};

export const reject = async (client, { applicationId, recruiterId, reason, emailBody }) => {
  const applicationResult = await client.query(
    `SELECT a.id, a.candidate_id, a.job_post_id, jp.title AS job_title
     FROM applications a
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     WHERE a.id = $1
       AND jp.recruiter_id = $2
     LIMIT 1`,
    [applicationId, recruiterId]
  );

  const application = applicationResult.rows[0] || null;
  if (!application) {
    return null;
  }

  await client.query(
    `UPDATE applications
     SET status = 'rejected',
         rejection_reason = $1,
         rejection_email_body = $2
     WHERE id = $3`,
    [reason, emailBody, applicationId]
  );

  await client.query(
    `INSERT INTO messages (
       sender_recruiter_id,
       receiver_candidate_id,
       subject,
       content,
       job_post_id,
       application_id
     ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      recruiterId,
      application.candidate_id,
      `Application update - ${application.job_title}`,
      emailBody,
      application.job_post_id,
      applicationId,
    ]
  );

  return application;
};

export const offer = async (client, { applicationId, recruiterId, subject, emailBody }) => {
  const applicationResult = await client.query(
    `SELECT a.id, a.candidate_id, a.job_post_id, jp.title AS job_title
     FROM applications a
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     WHERE a.id = $1
       AND jp.recruiter_id = $2
     LIMIT 1`,
    [applicationId, recruiterId]
  );

  const application = applicationResult.rows[0] || null;
  if (!application) {
    return null;
  }

  await client.query(
    `UPDATE applications
     SET status = 'accepted'
     WHERE id = $1`,
    [applicationId]
  );

  const messageResult = await client.query(
    `INSERT INTO messages (
       sender_recruiter_id,
       receiver_candidate_id,
       subject,
       content,
       job_post_id,
       application_id
     ) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, created_at`,
    [
      recruiterId,
      application.candidate_id,
      subject,
      emailBody,
      application.job_post_id,
      applicationId,
    ]
  );

  return {
    application,
    message: messageResult.rows[0] || null,
  };
};

export const deleteApplication = async (client, { applicationId, candidateId }) => {
  const existing = await client.query(
    `SELECT cv_file_name
     FROM applications
     WHERE id = $1 AND candidate_id = $2
     FOR UPDATE`,
    [applicationId, candidateId]
  );

  if (existing.rows.length === 0) {
    return null;
  }

  await client.query(
    "DELETE FROM applications WHERE id = $1 AND candidate_id = $2",
    [applicationId, candidateId]
  );

  return existing.rows[0];
};

export { deleteApplication as delete };
