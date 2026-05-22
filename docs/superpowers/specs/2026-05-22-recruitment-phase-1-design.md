# Recruitment Phase 1 Design

## Goal

Upgrade the existing Job Application Management app into a stronger ATS-style recruitment workflow while keeping the current React + Express + PostgreSQL stack and the current route structure. Phase 1 focuses on recruiter workflow quality, candidate communication, and reporting. It does not implement onboarding, payroll, attendance, leave, or broader HRMS modules.

## Scope

Phase 1 upgrades the existing `/recruiter/application` page instead of adding a separate pipeline route. Recruiters should be able to review applications in the current table view or switch to a pipeline view that groups candidates by stage.

Included:

- Application list and Kanban pipeline on `/recruiter/application`.
- Candidate detail upgrades: cover letter, rating, internal notes, timeline.
- Interview scheduling and status changes reflected in a timeline.
- Messages remain connected to the candidate inbox.
- Recruiter dashboard adds funnel counts, conversion summary, and recent activity.

Excluded:

- Post-offer onboarding.
- Employee management beyond candidate/application data.
- Payroll, attendance, leave, helpdesk, or HRMS administration.

## Visual Direction

Keep the current product feel and adjust the workflow UI to match the repo palette.

- Primary actions use `emerald-600`.
- Sidebar keeps `bg-[#19211D]`.
- Main surfaces stay quiet: white cards, light gray backgrounds, compact tables.
- Stages use restrained semantic colors:
  - Applied: gray/slate.
  - Reviewed: blue.
  - Interview: amber or indigo, with minimal purple.
  - Offer: emerald.
  - Rejected: red.
- Avoid copying Horilla UI directly; use Horilla only as workflow inspiration.

## Data Model

Add columns/tables that support recruiter workflow without changing existing auth or application ownership.

`applications`:

- Add `rating INTEGER` nullable, constrained in app logic to 1-5.
- Keep current `status` enum values: `applied`, `reviewed`, `scheduled_interview`, `accepted`, `rejected`.
- Keep `cover_letter` from the previous migration.

`application_notes`:

- `id BIGSERIAL PRIMARY KEY`
- `application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE`
- `recruiter_id BIGINT NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE`
- `note TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

`application_events`:

- `id BIGSERIAL PRIMARY KEY`
- `application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE`
- `actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL`
- `event_type VARCHAR(50) NOT NULL`
- `title VARCHAR(255) NOT NULL`
- `description TEXT`
- `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Indexes:

- `application_notes(application_id)`
- `application_events(application_id, created_at DESC)`

## Backend API

Extend existing route modules rather than creating a new service layer.

Applications:

- `GET /applications/recruiter`
  - Continue returning paginated applications.
  - Include `rating`, `coverLetter`, and lightweight note count or latest note if useful.
  - Continue supporting `jobPostId`.
  - Add optional `status` filter if the frontend needs it.

- `GET /applications/recruiter/:id`
  - Include cover letter, rating, notes, and timeline events.
  - Continue enforcing recruiter ownership through job post ownership.

- `PATCH /applications/:id/rating`
  - Recruiter-only.
  - Validates rating is integer 1-5 or null.
  - Updates `applications.rating`.
  - Writes an `application_events` record.

- `POST /applications/:id/notes`
  - Recruiter-only.
  - Adds an internal note.
  - Writes an `application_events` record.

- `PUT /applications/:id/notes/:noteId`
  - Recruiter-only.
  - Edits only notes owned by the recruiter and attached to applications they own.

- `DELETE /applications/:id/notes/:noteId`
  - Recruiter-only.
  - Deletes only notes owned by the recruiter and attached to applications they own.

Events:

- Status updates, interview scheduling, rejection, offer, and recruiter messages should append timeline events.
- Event writes should happen in the same transaction as the business action where practical.

## Frontend API Client

Extend `applicationsApi` in `frontend/src/lib/api.js`:

- `updateRating(id, rating)`
- `addNote(id, payload)`
- `updateNote(id, noteId, payload)`
- `deleteNote(id, noteId)`

No change to token handling.

## Recruiter Application Page

Keep `/recruiter/application` as the main application management screen.

Top area:

- Existing metrics remain but are recalculated from the visible dataset.
- Add view toggle: `List` and `Pipeline`.
- Keep Active Job filter.
- Add stage filter only if it remains simple and does not clutter the page.

List view:

- Preserve the current table layout.
- Align stage labels and actions with the new stage model.
- Candidate row opens the existing detail screen.

Pipeline view:

- Columns: Applied, Reviewed, Interview, Offer, Rejected.
- Each application card shows candidate name, job title, applied date, rating, stage, and quick action.
- Clicking a card opens `ApplicationDetail`.
- Moving stages can be implemented with buttons or select controls first. Drag-and-drop is optional for this phase and should not block completion.

## Application Detail

Enhance the current detail page instead of replacing it.

Left panel:

- CV preview remains.
- Add cover letter panel below or beside the CV preview if present.

Right panel:

- Candidate identity and contact remain.
- Add rating control.
- Status select remains.
- Quick actions remain: offer, move to interview, schedule interview, reject, send message.
- Internal notes become persistent, not just a textarea placeholder.
- Timeline panel lists events in reverse chronological order.

Notes:

- Recruiter notes are private.
- Notes are visible only to the recruiter account that owns the job application workflow.

Timeline:

- Timeline includes applied, status changed, interview scheduled, message sent, offer sent, rejected, rating changed, note added.
- Empty state says there is no activity yet.

## Messages And Notifications

Keep the existing `messages` table and candidate Messages page.

Changes:

- When recruiter sends a message from `ApplicationDetail`, append an `application_events` item.
- When interview, rejection, or offer creates a message, append an event too.
- Unread count is already available through `messagesApi.unreadCount`; badge UI can be added later if it fits cleanly.

## Recruiter Dashboard

Keep the current dashboard layout and add better recruitment signals.

Add or improve:

- Funnel counts: Applied, Reviewed, Interview, Offer, Rejected.
- Conversion: Applied to Interview, Interview to Offer.
- Recent activity panel from `application_events`.
- Existing active jobs summary remains.

Dashboard should stay dense and operational, not turn into a landing page.

## Error Handling And Loading

Frontend:

- Every API call uses `try/catch`.
- User-facing failures call `showError()`.
- Mutations call `showSuccess()` on success where appropriate.
- Loading states use existing Skeleton components or compact skeleton rows/cards.

Backend:

- All SQL uses parameterized queries.
- Ownership checks remain recruiter/candidate scoped.
- Mutations return useful JSON and proper HTTP status codes.

## Verification

Before completion:

- Run `npm run build:frontend`.
- Run backend module import checks for touched route files.
- If DB is available, run the migration and verify new columns/tables through `information_schema`.
- Manually smoke-test:
  - Recruiter applications list loads.
  - Pipeline view groups applications.
  - Application detail loads cover letter, notes, rating, timeline.
  - Rating and notes persist.
  - Status change updates list/detail.
  - Schedule/reject/offer/message writes a candidate message and timeline event.

