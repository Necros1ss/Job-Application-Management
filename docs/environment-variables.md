# Environment Variables

Do not commit real `.env` files. Only `.env.example` files should be committed.

## Backend

| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by the Express API and migration scripts. | `postgresql://postgres:postgres123@localhost:5433/job_tracker` |
| `JWT_SECRET` | Secret used to sign short-lived access tokens. Must be random and at least 32 characters. | `replace-with-a-random-access-token-secret-at-least-32-chars` |
| `JWT_REFRESH_SECRET` | Secret used to sign refresh tokens. Must be different from `JWT_SECRET`. | `replace-with-a-different-random-refresh-secret-at-least-32-chars` |
| `PORT` | Backend HTTP port. | `5000` |
| `NODE_ENV` | Runtime mode. Use `development`, `test`, or `production`. | `development` |
| `CLIENT_ORIGIN` | Comma-separated list of allowed frontend origins for CORS. | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | General API rate-limit window in milliseconds. | `900000` |
| `RATE_LIMIT_MAX` | Maximum requests per rate-limit window. | `100` |
| `MAIL_HOST` | SMTP server hostname. | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP server port. | `587` |
| `MAIL_USER` | SMTP username. | `replace-with-smtp-user` |
| `MAIL_PASS` | SMTP password or app password. | `replace-with-smtp-password` |
| `MAIL_FROM` | Default sender used for outgoing emails. | `Job Tracker <noreply@example.com>` |
| `GEMINI_API_KEY` | Gemini API key used for AI CV screening. Leave blank to disable AI screening. | `replace-with-gemini-api-key` |
| `GEMINI_MODEL` | Gemini model name used by AI CV screening. | `gemini-3.5-flash` |
| `UPLOAD_DIR` | Relative or absolute directory for uploaded CV files. | `./uploads/cv` |
| `MAX_FILE_SIZE_MB` | Maximum upload size for CV files in MB. | `20` |

## Frontend

| Variable | Purpose | Example |
| --- | --- | --- |
| `VITE_API_URL` | API base URL used by the React app. | `/api` |

## Security Hotfix Notes

- A real Gemini API key was found in `backend/.env` and replaced with a placeholder locally.
- Rotate the exposed Gemini key in the provider dashboard if this project was shared, uploaded, or archived with `backend/.env`.
- `.gitignore` already ignores `.env` and `.env.*` while allowing `.env.example`.
- `frontend/.env` is not present in this workspace.

## Pending Standardization

The current backend code reads `MAIL_*` variables. Phase 6 will standardize email variables to `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, and `MAIL_FROM`.
