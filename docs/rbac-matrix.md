# Role-Based Access Control (RBAC) Matrix

| Route | Method | Role |
|-------|--------|------|
| `/admin/*` | ALL | Admin |
| `/hr-manager/*` | ALL | HR Manager, Admin |
| `/auth/signup` | POST | Public |
| `/auth/login` | POST | Public |
| `/auth/refresh` | POST | Public |
| `/auth/logout` | POST | Public |
| `/auth/forgot-password` | POST | Public |
| `/auth/reset-password` | POST | Public |
| `/auth/change-password` | POST | Any Authenticated |
| `/applications` | GET | Candidate, Admin |
| `/applications/apply` | POST | Candidate, Admin |
| `/applications/recruiter/*` | GET, POST | Recruiter, Admin |
| `/applications/:id` | PUT, DELETE | Candidate, Admin |
| `/applications/:id/status` | PATCH | Recruiter, Admin |
| `/applications/:id/rating` | PATCH | Recruiter, Admin |
| `/applications/:id/notes` | POST, PUT, DELETE | Recruiter, Admin |
| `/applications/:id/reject` | POST | Recruiter, Admin |
| `/applications/:id/offer` | POST | Recruiter, Admin |
| `/applications/:id/accept-offer` | POST | Candidate, Admin |
| `/applications/:id/decline-offer` | POST | Candidate, Admin |
| `/jobs` | GET | Public |
| `/jobs/mine` | GET | Recruiter, Admin |
| `/jobs/:id` | GET | Public |
| `/jobs` | POST | Recruiter, Admin |
| `/jobs/:id` | PUT, DELETE | Recruiter, Admin |
| `/users/me` | GET, PATCH, DELETE | Any Authenticated |
| `/users/me/avatar` | GET, PATCH | Any Authenticated |
| `/users/notification-preferences`| PATCH | Any Authenticated |
| `/notifications/stream` | GET | Any Authenticated |
| `/interviews/recruiter` | GET | Recruiter, Admin |
| `/interviews/candidate` | GET | Candidate, Admin |
| `/interviews` | POST | Recruiter, Admin |
| `/interviews/:id` | PUT, DELETE | Recruiter, Admin |
| `/interviews/interviewers` | GET | Recruiter, Admin |
| `/interviews/interviewer` | GET | Interviewer, Admin |
| `/interviews/:id/evaluation` | POST | Interviewer, Admin |
| `/interviews/:id/evaluation` | GET | Recruiter, Interviewer, Admin |
| `/employees/accepted-applications`| GET | Recruiter, Admin |
| `/employees/recruiter` | GET | Recruiter, Admin |
| `/employees/me` | GET | Candidate, Admin |
| `/employees/convert` | POST | Recruiter, Admin |
| `/employees/:id` | PATCH | Recruiter, Admin |
| `/employees/attendance` | GET | Recruiter, Candidate, Admin |
| `/employees/attendance` | POST | Recruiter, Admin |
| `/employees/leave-requests` | GET | Recruiter, Candidate, Admin |
| `/employees/leave-requests` | POST | Candidate, Admin |
| `/employees/leave-requests/:id` | PATCH | Recruiter, Admin |
| `/onboarding/recruiter` | GET | Recruiter, Admin |
| `/onboarding/candidate` | GET | Candidate, Admin |
| `/onboarding/accepted-applications`| GET | Recruiter, Admin |
| `/onboarding/tasks` | POST | Recruiter, Admin |
| `/onboarding/tasks/:id/status` | PATCH | Recruiter, Candidate, Admin |
| `/onboarding/tasks/:id` | DELETE | Recruiter, Admin |
| `/saved-jobs` | POST, GET | Candidate, Admin |
| `/saved-jobs/:id` | DELETE | Candidate, Admin |
| `/messages/inbox` | GET | Any Authenticated |
| `/messages/unread-count` | GET | Any Authenticated |
| `/messages/:id/read` | PATCH | Any Authenticated |
| `/messages` | POST | Any Authenticated |

**Note:** The `Admin` role intrinsically bypasses role checks via `requireRole` middleware and effectively has `Any Authenticated` or `Admin` access across all routes.
