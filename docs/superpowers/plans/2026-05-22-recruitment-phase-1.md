# Recruitment Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a recruiter ATS workflow with list/pipeline views, persistent candidate rating, notes, timeline events, and dashboard funnel activity.

**Architecture:** Extend the existing Express route modules and React pages in place. Store workflow metadata in `applications.rating`, `application_notes`, and `application_events`, then expose them through existing recruiter application endpoints. Keep route structure unchanged: `/recruiter/application` remains the main screen.

**Tech Stack:** React + Vite + Tailwind CSS, Express.js, PostgreSQL, pg pool, JWT `requireAuth`, existing toast and skeleton components.

---

## File Map

- `backend/sql/003_recruitment_phase_1.sql`: idempotent migration for rating, notes, events, and indexes.
- `backend/sql/schema.sql`: base schema for fresh DB installs.
- `backend/src/routes/applications.js`: recruiter application list/detail, rating, notes, event creation, status/reject/offer event logging.
- `backend/src/routes/interviews.js`: event logging when scheduling interviews.
- `backend/src/routes/messages.js`: event logging when recruiter sends direct candidate messages.
- `frontend/src/lib/api.js`: add rating and note API client functions.
- `frontend/src/Pages/Recruiters/Application.jsx`: add List/Pipeline view toggle, stage grouping, pipeline cards, status quick changes.
- `frontend/src/Pages/Recruiters/ApplicationDetail.jsx`: show cover letter, persistent rating, persistent notes, timeline.
- `frontend/src/Pages/Recruiters/RecruiterDashboard.jsx`: add funnel conversion and recent activity.

## Task 1: Database Schema

**Files:**
- Create: `backend/sql/003_recruitment_phase_1.sql`
- Modify: `backend/sql/schema.sql`

- [ ] **Step 1: Add idempotent migration**

Create `backend/sql/003_recruitment_phase_1.sql`:

```sql
ALTER TABLE applications ADD COLUMN IF NOT EXISTS rating INTEGER;

CREATE TABLE IF NOT EXISTS application_notes (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    recruiter_id BIGINT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_application_notes_application
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_application_notes_recruiter
      FOREIGN KEY (recruiter_id) REFERENCES recruiters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS application_events (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    actor_user_id BIGINT,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_application_events_application
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_application_events_actor
      FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_application_notes_application_id
ON application_notes(application_id);

CREATE INDEX IF NOT EXISTS idx_application_events_application_created
ON application_events(application_id, created_at DESC);
```

- [ ] **Step 2: Update fresh-install schema**

In `backend/sql/schema.sql`, add `rating INTEGER` to the `applications` table after `cover_letter TEXT`.

Add `application_notes` and `application_events` table definitions after `messages`, before `application_files`, using the same SQL from Step 1 but without `IF NOT EXISTS` where existing schema style uses plain `CREATE TABLE`.

- [ ] **Step 3: Apply migration locally**

Run:

```bash
docker compose exec -T db psql -U postgres -d job_tracker -f /workdir/backend/sql/003_recruitment_phase_1.sql
```

If `/workdir` is not mounted inside the container, run:

```bash
Get-Content backend/sql/003_recruitment_phase_1.sql | docker compose exec -T db psql -U postgres -d job_tracker
```

Expected: `ALTER TABLE`, `CREATE TABLE`, and `CREATE INDEX` outputs with no errors.

- [ ] **Step 4: Verify schema**

Run:

```bash
docker compose exec -T db psql -U postgres -d job_tracker -c "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND ((table_name = 'applications' AND column_name = 'rating') OR table_name IN ('application_notes', 'application_events')) ORDER BY table_name, column_name;"
```

Expected: rows for `applications.rating`, all `application_notes` columns, and all `application_events` columns.

- [ ] **Step 5: Commit**

```bash
git add backend/sql/003_recruitment_phase_1.sql backend/sql/schema.sql
git commit -m "feat: add recruitment workflow schema"
```

## Task 2: Backend Application Workflow API

**Files:**
- Modify: `backend/src/routes/applications.js`

- [ ] **Step 1: Add helper functions near existing mappers**

Add these helpers after `mapRecruiterRow`:

```js
const mapNoteRow = (row) => ({
  id: row.id,
  applicationId: row.application_id,
  recruiterId: row.recruiter_id,
  note: row.note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapEventRow = (row) => ({
  id: row.id,
  applicationId: row.application_id,
  actorUserId: row.actor_user_id,
  eventType: row.event_type,
  title: row.title,
  description: row.description,
  metadata: row.metadata || {},
  createdAt: row.created_at,
});

const mapRecruiterDetailRow = (row) => ({
  ...mapRecruiterRow(row),
  coverLetter: row.cover_letter || "",
  rating: row.rating,
});

const createApplicationEvent = async (
  client,
  { applicationId, actorUserId, eventType, title, description = "", metadata = {} }
) => {
  await client.query(
    `INSERT INTO application_events (
       application_id,
       actor_user_id,
       event_type,
       title,
       description,
       metadata
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [
      applicationId,
      actorUserId,
      eventType,
      title,
      description,
      JSON.stringify(metadata),
    ]
  );
};
```

- [ ] **Step 2: Extend recruiter list query**

In `router.get("/recruiter")`, select `a.rating`, `a.cover_letter`, and latest note count:

```sql
a.rating,
a.cover_letter,
COUNT(an.id)::int AS note_count
```

Add:

```sql
LEFT JOIN application_notes an ON an.application_id = a.id
```

Add a `GROUP BY` for all non-aggregate selected columns. Return `rating`, `coverLetter`, and `noteCount` in `mapRecruiterRow`.

- [ ] **Step 3: Extend recruiter detail query**

In `router.get("/recruiter/:id")`, select `a.rating` and `a.cover_letter`. After loading the detail row, query notes and events:

```js
const notesResult = await pool.query(
  `SELECT id, application_id, recruiter_id, note, created_at, updated_at
   FROM application_notes
   WHERE application_id = $1
   ORDER BY created_at DESC, id DESC`,
  [applicationId]
);

const eventsResult = await pool.query(
  `SELECT id, application_id, actor_user_id, event_type, title, description, metadata, created_at
   FROM application_events
   WHERE application_id = $1
   ORDER BY created_at DESC, id DESC`,
  [applicationId]
);

return res.json({
  ...mapRecruiterDetailRow(result.rows[0]),
  notes: notesResult.rows.map(mapNoteRow),
  events: eventsResult.rows.map(mapEventRow),
});
```

- [ ] **Step 4: Add rating endpoint**

Before `router.post("/:id/reject")`, add:

```js
router.patch("/:id/rating", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can rate applications" });
  }

  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  const rating = req.body.rating === null ? null : Number(req.body.rating);
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE applications a
       SET rating = $1
       FROM job_posts jp
       WHERE a.id = $2
         AND a.job_post_id = jp.id
         AND jp.recruiter_id = $3
       RETURNING a.id, a.rating`,
      [rating, applicationId, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Application not found or you don't have permission to update it" });
    }

    await createApplicationEvent(client, {
      applicationId,
      actorUserId: req.user.id,
      eventType: "rating_updated",
      title: rating === null ? "Rating cleared" : `Rating set to ${rating}/5`,
      metadata: { rating },
    });

    await client.query("COMMIT");
    return res.json({ id: applicationId, rating: result.rows[0].rating });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to update rating", detail: error.message });
  } finally {
    client.release();
  }
});
```

- [ ] **Step 5: Add notes endpoints**

Add `POST`, `PUT`, and `DELETE` note endpoints after the rating endpoint:

```js
router.post("/:id/notes", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can add notes" });
  }

  const applicationId = Number(req.params.id);
  const note = typeof req.body.note === "string" ? req.body.note.trim() : "";

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  if (!note) {
    return res.status(400).json({ message: "Note is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ownership = await client.query(
      `SELECT a.id
       FROM applications a
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       WHERE a.id = $1 AND jp.recruiter_id = $2
       LIMIT 1`,
      [applicationId, req.user.id]
    );

    if (ownership.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Application not found or you don't have permission to add notes" });
    }

    const result = await client.query(
      `INSERT INTO application_notes (application_id, recruiter_id, note)
       VALUES ($1, $2, $3)
       RETURNING id, application_id, recruiter_id, note, created_at, updated_at`,
      [applicationId, req.user.id, note]
    );

    await createApplicationEvent(client, {
      applicationId,
      actorUserId: req.user.id,
      eventType: "note_added",
      title: "Internal note added",
      description: note,
      metadata: { noteId: result.rows[0].id },
    });

    await client.query("COMMIT");
    return res.status(201).json(mapNoteRow(result.rows[0]));
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to add note", detail: error.message });
  } finally {
    client.release();
  }
});

router.put("/:id/notes/:noteId", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can update notes" });
  }

  const applicationId = Number(req.params.id);
  const noteId = Number(req.params.noteId);
  const note = typeof req.body.note === "string" ? req.body.note.trim() : "";

  if (!Number.isInteger(applicationId) || applicationId <= 0 || !Number.isInteger(noteId) || noteId <= 0) {
    return res.status(400).json({ message: "Invalid note reference" });
  }

  if (!note) {
    return res.status(400).json({ message: "Note is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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
      [note, noteId, applicationId, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Note not found or you don't have permission to update it" });
    }

    await createApplicationEvent(client, {
      applicationId,
      actorUserId: req.user.id,
      eventType: "note_updated",
      title: "Internal note updated",
      description: note,
      metadata: { noteId },
    });

    await client.query("COMMIT");
    return res.json(mapNoteRow(result.rows[0]));
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to update note", detail: error.message });
  } finally {
    client.release();
  }
});

router.delete("/:id/notes/:noteId", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can delete notes" });
  }

  const applicationId = Number(req.params.id);
  const noteId = Number(req.params.noteId);

  if (!Number.isInteger(applicationId) || applicationId <= 0 || !Number.isInteger(noteId) || noteId <= 0) {
    return res.status(400).json({ message: "Invalid note reference" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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
      [noteId, applicationId, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Note not found or you don't have permission to delete it" });
    }

    await createApplicationEvent(client, {
      applicationId,
      actorUserId: req.user.id,
      eventType: "note_deleted",
      title: "Internal note deleted",
      metadata: { noteId },
    });

    await client.query("COMMIT");
    return res.status(204).send();
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to delete note", detail: error.message });
  } finally {
    client.release();
  }
});
```

- [ ] **Step 6: Log status events**

In `router.patch("/:id/status")`, switch to a transaction with `client`, keep the existing ownership update, and after success call:

```js
await createApplicationEvent(client, {
  applicationId,
  actorUserId: req.user.id,
  eventType: "status_changed",
  title: `Status changed to ${status}`,
  metadata: { status },
});
```

- [ ] **Step 7: Log rejection and offer events**

In reject and offer routes, after the application/message updates and before `COMMIT`, call `createApplicationEvent` with:

```js
eventType: "application_rejected",
title: "Application rejected",
description: reason || emailBody,
metadata: { reason }
```

and:

```js
eventType: "offer_sent",
title: "Offer sent",
description: subject,
metadata: { messageId: messageResult.rows[0]?.id }
```

- [ ] **Step 8: Import check**

Run:

```bash
node --input-type=module -e "await import('./backend/src/routes/applications.js'); console.log('applications route ok')"
```

Expected: `applications route ok`.

- [ ] **Step 9: Commit**

```bash
git add backend/src/routes/applications.js
git commit -m "feat: add application ratings notes and events api"
```

## Task 3: Backend Event Logging For Interviews And Messages

**Files:**
- Modify: `backend/src/routes/interviews.js`
- Modify: `backend/src/routes/messages.js`

- [ ] **Step 1: Add local event helper to interviews route**

Add the same `createApplicationEvent` helper near the top of `backend/src/routes/interviews.js`.

- [ ] **Step 2: Log interview scheduled event**

In `router.post("/")`, after inserting the interview and before `COMMIT`, call:

```js
await createApplicationEvent(client, {
  applicationId,
  actorUserId: req.user.id,
  eventType: "interview_scheduled",
  title: "Interview scheduled",
  description: notes,
  metadata: {
    interviewId: interviewResult.rows[0]?.id,
    interviewDateTime,
    mode,
  },
});
```

- [ ] **Step 3: Add local event helper to messages route**

Add the same helper near the top of `backend/src/routes/messages.js`.

- [ ] **Step 4: Log recruiter message event**

In `router.post("/")`, after inserting the message and before `COMMIT`, if `normalizedApplicationId` is present, call:

```js
await createApplicationEvent(client, {
  applicationId: normalizedApplicationId,
  actorUserId: req.user.id,
  eventType: "message_sent",
  title: "Message sent",
  description: subject.trim(),
  metadata: { messageId: result.rows[0]?.id },
});
```

- [ ] **Step 5: Import check**

Run:

```bash
node --input-type=module -e "await import('./backend/src/routes/interviews.js'); await import('./backend/src/routes/messages.js'); console.log('event routes ok')"
```

Expected: `event routes ok`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/interviews.js backend/src/routes/messages.js
git commit -m "feat: log recruitment timeline events"
```

## Task 4: Frontend API Client

**Files:**
- Modify: `frontend/src/lib/api.js`

- [ ] **Step 1: Add API methods**

Inside `applicationsApi`, add:

```js
updateRating: (id, rating) =>
  request(`/applications/${id}/rating`, {
    method: "PATCH",
    body: JSON.stringify({ rating }),
  }),
addNote: (id, payload) =>
  request(`/applications/${id}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  }),
updateNote: (id, noteId, payload) =>
  request(`/applications/${id}/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),
deleteNote: (id, noteId) =>
  request(`/applications/${id}/notes/${noteId}`, {
    method: "DELETE",
  }),
```

- [ ] **Step 2: Build check**

Run:

```bash
npm run build:frontend
```

Expected: Vite build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api.js
git commit -m "feat: add recruitment workflow api client"
```

## Task 5: Recruiter Application List And Pipeline

**Files:**
- Modify: `frontend/src/Pages/Recruiters/Application.jsx`

- [ ] **Step 1: Add stage definitions**

Replace the current `stageMetaByStatus` and `actionByStatus` with a single `PIPELINE_STAGES` array and derive maps from it:

```js
const PIPELINE_STAGES = [
  { id: "applied", label: "Applied", badge: "bg-slate-100 text-slate-700", dot: "bg-slate-500" },
  { id: "reviewed", label: "Reviewed", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  { id: "scheduled_interview", label: "Interview", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  { id: "accepted", label: "Offer", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  { id: "rejected", label: "Rejected", badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
];
```

- [ ] **Step 2: Add view state and status update handler**

Add:

```js
const [viewMode, setViewMode] = useState("list");
const [updatingApplicationId, setUpdatingApplicationId] = useState(null);
```

Add handler:

```js
const updateApplicationStatus = async (applicationId, status) => {
  try {
    setUpdatingApplicationId(applicationId);
    const updated = await applicationsApi.updateStatus(applicationId, status);
    setApplications((current) =>
      current.map((item) =>
        item.id === applicationId ? { ...item, status: updated.status || status } : item
      )
    );
  } catch (error) {
    setError(error.message || "Failed to update application status");
  } finally {
    setUpdatingApplicationId(null);
  }
};
```

- [ ] **Step 3: Add view toggle UI**

In the toolbar, add buttons:

```jsx
<div className="flex items-center bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
  {["list", "pipeline"].map((mode) => (
    <button
      key={mode}
      type="button"
      onClick={() => setViewMode(mode)}
      className={`px-4 py-2 rounded-md text-sm font-semibold capitalize ${
        viewMode === mode ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {mode === "list" ? "List" : "Pipeline"}
    </button>
  ))}
</div>
```

- [ ] **Step 4: Add pipeline grouping**

Add:

```js
const applicationsByStage = useMemo(() => {
  const grouped = Object.fromEntries(PIPELINE_STAGES.map((stage) => [stage.id, []]));
  displayApplications.forEach((app) => {
    const key = grouped[app.status] ? app.status : "applied";
    grouped[key].push(app);
  });
  return grouped;
}, [displayApplications]);
```

- [ ] **Step 5: Render pipeline view**

Before the table block, render a 5-column pipeline when `viewMode === "pipeline"`. Each card should show candidate name, job title, applied date, rating stars, and a stage select:

```jsx
{viewMode === "pipeline" ? (
  <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
    {PIPELINE_STAGES.map((stage) => (
      <div key={stage.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[360px]">
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
            <h2 className="font-bold text-gray-900">{stage.label}</h2>
          </div>
          <span className="text-xs font-bold text-gray-400">{applicationsByStage[stage.id].length}</span>
        </div>
        <div className="p-3 space-y-3">
          {applicationsByStage[stage.id].map((app) => (
            <div key={app.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 hover:bg-white hover:shadow-sm transition">
              <button type="button" onClick={() => setSelectedApplication(app)} className="text-left w-full">
                <p className="font-bold text-gray-900">{app.name}</p>
                <p className="text-sm text-gray-500 mt-1">{app.jobTitle}</p>
                <p className="text-xs text-gray-400 mt-2">{app.subtext}</p>
              </button>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-amber-600">
                  {app.rating ? `${app.rating}/5` : "No rating"}
                </span>
                <select
                  value={app.status}
                  disabled={updatingApplicationId === app.id}
                  onChange={(event) => updateApplicationStatus(app.id, event.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700"
                >
                  {PIPELINE_STAGES.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
) : (
  existingTable
)}
```

- [ ] **Step 6: Build check**

Run:

```bash
npm run build:frontend
```

Expected: Vite build succeeds.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/Pages/Recruiters/Application.jsx
git commit -m "feat: add recruiter application pipeline view"
```

## Task 6: Application Detail Notes Rating Timeline

**Files:**
- Modify: `frontend/src/Pages/Recruiters/ApplicationDetail.jsx`

- [ ] **Step 1: Add state**

Add:

```js
const [rating, setRating] = useState(null);
const [notes, setNotes] = useState([]);
const [events, setEvents] = useState([]);
const [newNote, setNewNote] = useState("");
const [isSavingRating, setIsSavingRating] = useState(false);
const [isSavingNote, setIsSavingNote] = useState(false);
```

- [ ] **Step 2: Hydrate detail state**

When `applicationsApi.getForRecruiter(candidate.id)` resolves, set:

```js
setRating(response?.rating ?? null);
setNotes(Array.isArray(response?.notes) ? response.notes : []);
setEvents(Array.isArray(response?.events) ? response.events : []);
```

- [ ] **Step 3: Add rating save handler**

Add:

```js
const handleRatingChange = async (nextRating) => {
  if (!source?.id) return;
  try {
    setIsSavingRating(true);
    const updated = await applicationsApi.updateRating(source.id, nextRating);
    setRating(updated.rating);
    showSuccess("Rating updated");
    const refreshed = await applicationsApi.getForRecruiter(source.id);
    setEvents(Array.isArray(refreshed?.events) ? refreshed.events : []);
  } catch (err) {
    showError(err.message || "Failed to update rating");
  } finally {
    setIsSavingRating(false);
  }
};
```

- [ ] **Step 4: Add note save handler**

Add:

```js
const handleAddNote = async () => {
  const note = newNote.trim();
  if (!source?.id || !note) return;
  try {
    setIsSavingNote(true);
    const created = await applicationsApi.addNote(source.id, { note });
    setNotes((current) => [created, ...current]);
    setNewNote("");
    showSuccess("Note saved");
    const refreshed = await applicationsApi.getForRecruiter(source.id);
    setEvents(Array.isArray(refreshed?.events) ? refreshed.events : []);
  } catch (err) {
    showError(err.message || "Failed to save note");
  } finally {
    setIsSavingNote(false);
  }
};
```

- [ ] **Step 5: Render cover letter**

Under the CV preview panel, render:

```jsx
{source?.coverLetter && (
  <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-5">
    <h3 className="font-bold text-gray-800 mb-3">Cover Letter</h3>
    <p className="text-sm text-gray-600 leading-7 whitespace-pre-wrap">{source.coverLetter}</p>
  </div>
)}
```

- [ ] **Step 6: Render rating control**

In the candidate status card, add:

```jsx
<div className="mt-5 pt-5 border-t border-gray-100">
  <label className="block text-sm font-semibold text-gray-700 mb-2">Recruiter Rating</label>
  <div className="flex items-center gap-2">
    {[1, 2, 3, 4, 5].map((value) => (
      <button
        key={value}
        type="button"
        disabled={isSavingRating}
        onClick={() => handleRatingChange(value)}
        className={`w-9 h-9 rounded-lg border text-sm font-bold ${
          rating >= value
            ? "bg-amber-100 text-amber-700 border-amber-200"
            : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
        }`}
      >
        ★
      </button>
    ))}
    {rating && (
      <button type="button" onClick={() => handleRatingChange(null)} className="text-xs text-gray-400 hover:text-red-500">
        Clear
      </button>
    )}
  </div>
</div>
```

- [ ] **Step 7: Replace internal notes placeholder**

Replace the existing internal notes textarea card with persistent notes UI:

```jsx
<div className="bg-white p-6 rounded-2xl border border-gray-200">
  <h3 className="font-bold text-gray-800 mb-4">Internal Notes</h3>
  <textarea
    rows="4"
    value={newNote}
    onChange={(event) => setNewNote(event.target.value)}
    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none resize-none text-sm"
    placeholder="Add a private note about this candidate..."
  />
  <button
    type="button"
    onClick={handleAddNote}
    disabled={isSavingNote || !newNote.trim()}
    className="mt-3 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors disabled:bg-gray-300"
  >
    {isSavingNote ? "Saving..." : "Save Note"}
  </button>
  <div className="mt-4 space-y-3">
    {notes.map((note) => (
      <div key={note.id} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
        <p className="text-xs text-gray-400 mt-2">{formatMessageTime(note.createdAt)}</p>
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 8: Render timeline**

Add a timeline card below notes:

```jsx
<div className="bg-white p-6 rounded-2xl border border-gray-200">
  <h3 className="font-bold text-gray-800 mb-4">Timeline</h3>
  {events.length === 0 ? (
    <p className="text-sm text-gray-500">No activity yet.</p>
  ) : (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="flex gap-3">
          <div className="mt-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">{event.title}</p>
            {event.description && <p className="text-sm text-gray-500 mt-1">{event.description}</p>}
            <p className="text-xs text-gray-400 mt-1">{formatMessageTime(event.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 9: Refresh events after mutations**

After successful status/interview/reject/offer/message mutations, refresh detail by calling `applicationsApi.getForRecruiter(source.id)` and updating `events`, `notes`, and `rating`.

- [ ] **Step 10: Build check**

Run:

```bash
npm run build:frontend
```

Expected: Vite build succeeds.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/Pages/Recruiters/ApplicationDetail.jsx
git commit -m "feat: add recruiter candidate notes rating and timeline"
```

## Task 7: Recruiter Dashboard Activity

**Files:**
- Modify: `backend/src/routes/applications.js`
- Modify: `frontend/src/lib/api.js`
- Modify: `frontend/src/Pages/Recruiters/RecruiterDashboard.jsx`

- [ ] **Step 1: Add backend activity endpoint**

In `backend/src/routes/applications.js`, add:

```js
router.get("/recruiter/activity", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can access activity" });
  }

  try {
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
      [req.user.id]
    );

    return res.json(result.rows.map((row) => ({
      id: row.id,
      applicationId: row.application_id,
      eventType: row.event_type,
      title: row.title,
      description: row.description,
      createdAt: row.created_at,
      candidateName: row.candidate_name,
      jobTitle: row.job_title,
    })));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load recruitment activity", detail: error.message });
  }
});
```

Place this route before `router.get("/recruiter/:id")` so it does not get captured as an id.

- [ ] **Step 2: Add API client**

In `applicationsApi`, add:

```js
listRecruiterActivity: () => request("/applications/recruiter/activity"),
```

- [ ] **Step 3: Load activity in dashboard**

In `RecruiterDashboard.jsx`, add state:

```js
const [activity, setActivity] = useState([]);
```

Update `Promise.all` to include `applicationsApi.listRecruiterActivity()` and set `activity`.

- [ ] **Step 4: Render conversion and activity panel**

Add conversion values:

```js
const interviewConversion = stats.totalCandidates > 0
  ? Math.round((stats.interviews / stats.totalCandidates) * 100)
  : 0;
const offerConversion = stats.interviews > 0
  ? Math.round((stats.offers / stats.interviews) * 100)
  : 0;
```

Render a compact card above Active Jobs:

```jsx
<div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
  <h2 className="text-lg font-bold text-gray-900 mb-4">Recruitment Funnel</h2>
  <div className="grid grid-cols-2 gap-3">
    <div className="rounded-xl bg-emerald-50 p-4">
      <p className="text-xs font-bold text-emerald-700 uppercase">Applied to Interview</p>
      <p className="text-3xl font-extrabold text-emerald-800 mt-2">{interviewConversion}%</p>
    </div>
    <div className="rounded-xl bg-blue-50 p-4">
      <p className="text-xs font-bold text-blue-700 uppercase">Interview to Offer</p>
      <p className="text-3xl font-extrabold text-blue-800 mt-2">{offerConversion}%</p>
    </div>
  </div>
</div>

<div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
  <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
  <div className="space-y-4">
    {activity.length === 0 ? (
      <p className="text-sm text-gray-500">No recruitment activity yet.</p>
    ) : activity.map((item) => (
      <div key={item.id} className="flex gap-3">
        <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800">{item.title}</p>
          <p className="text-xs text-gray-500">{item.candidateName} • {item.jobTitle}</p>
        </div>
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 5: Verification**

Run:

```bash
npm run build:frontend
node --input-type=module -e "await import('./backend/src/routes/applications.js'); console.log('activity route ok')"
```

Expected: both commands pass.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/applications.js frontend/src/lib/api.js frontend/src/Pages/Recruiters/RecruiterDashboard.jsx
git commit -m "feat: add recruiter funnel activity dashboard"
```

## Task 8: Final Verification And Push

**Files:**
- Review all changed files.

- [ ] **Step 1: Run frontend build**

```bash
npm run build:frontend
```

Expected: Vite build succeeds.

- [ ] **Step 2: Run backend import check**

```bash
node --input-type=module -e "await import('./backend/src/routes/applications.js'); await import('./backend/src/routes/interviews.js'); await import('./backend/src/routes/messages.js'); console.log('backend recruitment phase 1 imports ok')"
```

Expected: `backend recruitment phase 1 imports ok`.

- [ ] **Step 3: Verify schema if DB is running**

```bash
docker compose exec -T db psql -U postgres -d job_tracker -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('application_notes', 'application_events') ORDER BY table_name;"
```

Expected: `application_events` and `application_notes`.

- [ ] **Step 4: Review git diff**

```bash
git status --short
git log --oneline -8
```

Expected: working tree clean after commits, latest commits reflect Phase 1 work.

- [ ] **Step 5: Push**

```bash
git push
```

Expected: branch pushes to `origin/feature/error-boundary-skeleton`.
