# Application Module Audit

## Phase 1 Scope

Audited:

- `backend/src/routes/applications.js`
- `backend/src/controllers/applicationController.js`
- `backend/src/services/applicationService.js`
- `backend/src/repositories/applicationRepository.js`

Goal: fix backend startup blockers caused by route imports that did not exist in `applicationController.js`, while preserving the existing API paths used by the frontend.

## Route Mapping

| Route | Method | Controller | Service | Repository |
| --- | --- | --- | --- | --- |
| `/api/applications` | GET | `listForCandidate` | `getApplications` | `findByCandidateId`, `findAll` |
| `/api/applications/recruiter` | GET | `listForRecruiter` | `getRecruiterApplications` | `findForRecruiter`, `countForRecruiter` |
| `/api/applications/recruiter/activity` | GET | `getActivity` | `getRecruiterActivity` | `getRecruiterActivity` |
| `/api/applications/recruiter/analytics` | GET | `getAnalytics` | `getRecruiterAnalytics` | `getRecruiterAnalytics` |
| `/api/applications/recruiter/:id/ai-screen` | GET | `getAiScreening` | `getAiScreening` | TODO: persistent AI screening storage |
| `/api/applications/recruiter/:id/ai-screen` | POST | `analyzeAiScreening` | `analyzeAiScreening` | `findByIdForRecruiter` |
| `/api/applications/recruiter/:id` | GET | `getForRecruiter` | `getApplicationForRecruiter` | `findByIdForRecruiter`, `getNotes`, `getEvents` |
| `/api/applications/recruiter/:id/cv` | GET | `downloadCv` | `getApplicationForRecruiter` | `findByIdForRecruiter` |
| `/api/applications/:id` | PUT | `update` | `update` | `update` |
| `/api/applications/:id` | DELETE | `remove` | `remove` | `delete` |
| `/api/applications/apply` | POST | `apply` | `applyForJob` | `create`, `addEvent` |
| `/api/applications/:id/status` | PATCH | `updateStatus` | `updateStatus` | `updateStatus`, `addEvent` |
| `/api/applications/:id/rating` | PATCH | `updateRating` | `updateRating` | `updateRating`, `addEvent` |
| `/api/applications/:id/notes` | POST | `addNote` | `addNote` | `addNote` |
| `/api/applications/:id/notes/:noteId` | PUT | `updateNote` | `updateNote` | `updateNote` |
| `/api/applications/:id/notes/:noteId` | DELETE | `deleteNote` | `deleteNote` | `deleteNote` |
| `/api/applications/:id/reject` | POST | `reject` | `reject` | `reject`, `addEvent` |
| `/api/applications/:id/offer` | POST | `offer` | `offer` | `updateStatus`, `addEvent` |
| `/api/applications/:id/accept-offer` | POST | `acceptOffer` | `acceptOffer` | `updateStatus`, `addEvent` |
| `/api/applications/:id/decline-offer` | POST | `declineOffer` | `declineOffer` | `updateStatus`, `addEvent` |

## Missing Functions Fixed

The route file imported the following names that were not exported by the controller. Controller wrappers were added:

- `listForCandidate`
- `listForRecruiter`
- `getActivity`
- `getAnalytics`
- `getAiScreening`
- `analyzeAiScreening`
- `getForRecruiter`
- `downloadCv`
- `apply`
- `update`
- `remove`
- `reject`
- `offer`
- `acceptOffer`
- `declineOffer`

The route file also imported `uploadCv` from `applicationService.js`, but that service did not export it. A Multer CV upload middleware was added.

## Broken Imports Fixed

- `backend/src/routes/applications.js` now imports only names exported by `backend/src/controllers/applicationController.js`.
- `uploadCv` is now exported by `backend/src/services/applicationService.js`.
- Legacy controller export names are kept as aliases:
  - `getApplications`
  - `getRecruiterApplications`
  - `getApplicationById`
  - `applyForJob`
  - `getNotes`

## Unused Routes

No route was removed in Phase 1. Some routes are legacy-shaped and should be normalized in Phase 4:

- `/api/applications/recruiter`
- `/api/applications/recruiter/:id`
- `/api/applications/recruiter/:id/cv`
- `/api/applications/recruiter/:id/ai-screen`
- `/api/applications/:id/accept-offer`
- `/api/applications/:id/decline-offer`

## Unused Controllers

No controller export was removed in Phase 1. Existing names were preserved to avoid breaking imports outside the audited files.

## TODO

- Persist AI screening results in the database. `getAiScreening` currently returns `null` because no AI screening table or column exists.
- Phase 3 must add explicit role authorization. Phase 1 intentionally preserved the current route middleware shape except for fixing startup blockers.
- Phase 4 should normalize candidate and recruiter application APIs without removing legacy endpoints until the frontend is updated.

## Verification

- `node -e "await import('./backend/src/routes/applications.js'); console.log('applications route import ok')"` passed.
- `node backend/src/server.js` reached database connection, but PostgreSQL was not available: `ECONNREFUSED` on `localhost:5433`.
- `npm.cmd run db:up` could not start PostgreSQL because Docker Desktop/daemon was not running in this environment.
