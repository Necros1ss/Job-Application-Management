# Role-Based Access Control (RBAC) Matrix

| Route | Method | Role |
|-------|--------|------|
| `/admin/*` | ALL | Admin |
| `/applications/my` | GET | Candidate |
| `/applications/apply` | POST | Candidate |
| `/applications/recruiter/*` | ALL | Recruiter |
| `/auth/change-password` | POST | Any Authenticated |
| `/saved-jobs/*` | ALL | Candidate |
| `/messages/*` | ALL | Any Authenticated |
| `/onboarding/recruiter/*` | ALL | Recruiter |
| `/onboarding/candidate/*` | ALL | Candidate |
| `/interviews/recruiter/*` | ALL | Recruiter |
| `/interviews/interviewer/*` | ALL | Interviewer |
| `/employees/recruiter/*` | ALL | Recruiter |
| `/employees/me` | GET | Candidate |
