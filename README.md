# Job Application Tracker

Spring Boot 3 (Java 17) REST API + React (Vite) front end.

**Features**
- Kanban board with drag-and-drop between stages: Wishlist, Applied, Interview, Offer, Rejected
- Add, edit, delete and search applications (company, title, location, salary, link, dates, notes)
- Follow-up dates with a "follow up today" banner and a scheduled email reminder job
- Stats: total, applied, interviews, offers, response rate
- Email/password sign-up with JWT, plus Google OAuth2 sign-in
- Each user only ever sees their own applications

## Run the backend
Requires Java 17+ and Maven.
```bash
cd backend
mvn spring-boot:run          # http://localhost:8080
```
Uses an H2 file database by default. For MySQL, edit the datasource lines in
`backend/src/main/resources/application.properties`.

| Environment variable | Purpose |
|---|---|
| `JWT_SECRET` | 32+ character signing secret. Change it in production. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Enable "Continue with Google" |
| `FRONTEND_URL` | Defaults to `http://localhost:5173` (CORS and OAuth redirect) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | Send reminder emails. If `MAIL_HOST` is empty, reminders are only logged. |
| `REMINDER_CRON` | Defaults to `0 0 8 * * *` (every day at 8:00 server time) |

Gmail example: `MAIL_HOST=smtp.gmail.com`, `MAIL_USERNAME=you@gmail.com`, `MAIL_PASSWORD=<app password>`.

## Run the frontend
Requires Node 18+.
```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

## Set up Google OAuth
1. Google Cloud Console, APIs & Services, Credentials, Create OAuth client ID (Web application).
2. Authorized redirect URI: `http://localhost:8080/login/oauth2/code/google`
3. Start the backend with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set.

## How auth works
1. Email login: `POST /api/auth/login` returns a JWT. React stores it and sends `Authorization: Bearer <token>`.
2. Google login: the button opens `/oauth2/authorization/google` on the backend. After Google approves,
   `OAuth2SuccessHandler` finds or creates the user, issues the same kind of JWT, and redirects to
   `/oauth2/redirect?token=...` in React.
3. `JwtFilter` validates the token on every request and every query is filtered by the signed-in user's id.

## API
| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/auth/me` | current user |
| GET | `/api/applications` | your applications |
| GET | `/api/applications/stats` | totals, per-stage counts, response rate |
| POST | `/api/applications` | create |
| PUT | `/api/applications/{id}` | update |
| PATCH | `/api/applications/{id}/status` | move between stages (used by drag and drop) |
| DELETE | `/api/applications/{id}` | delete |

## Interview talking points
- Per-user data isolation: `findByIdAndOwnerId` returns 404 for other users' records instead of leaking them.
- DTO request records, so a client can't set `ownerId` or `reminderSent`.
- `@Scheduled` cron job with an optional mail sender (`ObjectProvider<JavaMailSender>`), idempotent via `reminderSent`.
- Optimistic UI on drag and drop with rollback if the API call fails.
- Stateless JWT for the API; OAuth2 only used to prove identity, then exchanged for the app's own JWT.

## Project layout
```
backend/src/main/java/com/jobtracker
  config/      SecurityConfig, GlobalExceptionHandler
  security/    JwtUtil, JwtFilter, OAuth2SuccessHandler
  model/       User, JobApplication, Status
  repository/  UserRepository, JobApplicationRepository
  controller/  AuthController, ApplicationController
  service/     ReminderJob
frontend/src
  pages/       Board, Login, Register, OAuthRedirect
  components/  ApplicationDialog
```
