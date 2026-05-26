# Backend/UI Fix Notes

## Sync Status

- Recorded on: 2026-05-26
- `origin/main` at `cf7c387` ("Fix bug light/dark mode")
- Local `HEAD` at `a48e32b` ("doc: remove README illustration")
- Branch status: `main...origin/main [ahead 1, behind 1]`
- `fork` remote fetch failed with "Repository not found"
- No merge/pull was performed because local worktree has many modified and untracked files
- Worktree is dirty: ~61 modified files + ~10 untracked entries (new routes, HR Manager/Interviewer UI pages, debug scripts, docs)

## Scope

- Fix remaining backend runtime bugs
- Fix demo seed login/schema bug
- Align HR Manager moderation wording
- Verify clean DB + 5-role demo flow

## Do Not Touch

- Do not revert unrelated local changes
- Do not delete untracked source files unless confirmed generated/debug-only

## Git State Snapshot (2026-05-26)

```
## main...origin/main [ahead 1, behind 1]
```

Key modified files (backend):
- `backend/src/routes/interviews.js` — interview creation, transaction rollback
- `backend/src/routes/hrManager.js` — HR Manager routes (new file)
- `backend/src/validators/interviewValidators.js` — interviewerId support
- `backend/src/services/applicationService.js` — application service layer
- `backend/src/controllers/authController.js` — auth flow
- `backend/src/utils/apiResponse.js` — routeErrorResponse helper
- `backend/scripts/seed-demo-users.js` — demo user seeding
- `backend/sql/schema.sql` — DB schema

Key modified files (frontend):
- `frontend/src/Pages/Recruiters/InterviewList.jsx` — interviewer selection UI
- `frontend/src/Pages/Recruiters/ApplicationDetail.jsx` — interviewer selection
- `frontend/src/Pages/Candidates/Applications.jsx` — candidate applications
- `frontend/src/Pages/Candidates/Messages.jsx` — messaging
- `frontend/src/App.jsx` — routing

New untracked files:
- `backend/src/routes/hrManager.js` — HR Manager API routes
- `frontend/src/Pages/HRManager/` — HR Manager UI pages
- `frontend/src/Pages/Interviewer/` — Interviewer UI pages
- `frontend/src/lib/api/` — API client files
- `backend/scripts/create-admin.js`, `migrate.js`, `fix-user-role-enum.js`
- `backend/src/config/debug_db.cjs`, `debug_db2.cjs`
- `docs/` — documentation

## Verification Results

_(to be filled after runtime verification — see Task 11 in plan)_

- Frontend lint:
- Frontend build:
- Backend syntax:
- Clean DB startup:
- Backend health:
- Seed demo users:
- Login 5 demo roles:
- Manual 5-role flow:
- Remaining limitations:
