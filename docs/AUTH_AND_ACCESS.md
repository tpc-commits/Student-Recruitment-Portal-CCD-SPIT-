# Authentication and Batch Access

## Student Flow

1. CCD sends an invitation to the student’s college email address.
2. The invitation contains an enrollment key mapped to a graduation year.
3. The student registers with that college email, key, and contact details.
4. The student completes the six-step onboarding flow for basic details, structured permanent and current addresses, imported education, a required profile photo, and placement consent. All six steps remain directly accessible from the onboarding stepper. Work experience remains available later in the student profile.
5. The server stores onboarding data and the graduation year on the student account.
6. Login creates an eight-hour HTTP-only session cookie.
7. Jobs and resumes remain blocked until onboarding is complete. `GET /api/jobs` then returns only jobs configured for that graduation year.

The browser never submits a graduation year and cannot choose another batch.

## Local Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Start both applications:

```bash
npm run dev
```

The React application runs on `http://localhost:3000`; Express runs on `http://localhost:3002`.

Development enrollment keys are configured in `ENROLLMENT_KEYS_JSON`. The repository defaults are:

| Key | Graduation year |
| --- | --- |
| `CCD-2026-DEMO` | 2026 |
| `CCD-2027-DEMO` | 2027 |
| `CCD-2028-DEMO` | 2028 |
| `CCD-2029-DEMO` | 2029 |

## API Surface

| Method | Endpoint | Authentication | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Invitation key | Create a student account |
| `POST` | `/api/auth/login` | Email and password | Start a session |
| `GET` | `/api/auth/me` | Required | Return the current student |
| `POST` | `/api/auth/logout` | Optional | End the current session |
| `POST` | `/api/onboarding` | Required | Complete the student profile |
| `GET` | `/api/profile/photo` | Required | Return the student’s profile photo |
| `GET` | `/api/jobs` | Required | Return batch-scoped jobs |
| `GET` | `/api/resumes` | Required | List the student’s resumes |
| `POST` | `/api/resumes` | Required | Upload a resume |
| `GET` | `/api/resumes/:id/download` | Required | Download an owned resume |

Registration request:

```json
{
  "fullName": "Student Name",
  "email": "student@spit.ac.in",
  "personalEmail": "student@example.com",
  "mobile": "+919876543210",
  "enrollmentKey": "CCD-2028-DEMO",
  "password": "minimum-eight-characters"
}
```

## Production Replacement Points

The current persistence is intentionally local for backend integration work:

- Users are written to ignored `data/local/users.json`; passwords use salted `scrypt` hashes.
- Sessions are held in memory, so restarting Express signs everyone out.
- Resume files and profile photos are stored under ignored `uploads/`.
- Permanent and current addresses are stored as separate building, street, city, state, and PIN-code fields.
- Students can choose any browser-supported picture, reposition it, and zoom before the portal creates a normalized square JPEG. They must confirm that their face is visible and the photo shows only them. The server verifies only that the upload is a readable supported image; there is no automated face detection or CCD photo-approval step.
- Job profiles are defined in `server/jobs.js` until the admin application owns them.
- Invitation emails are not sent by this repository.

Before production, replace JSON storage with the company database, memory sessions with the approved session store, local files with private object storage, and demo batch keys with unique expiring invitations. Keep graduation-year filtering in the API even if the UI also filters for presentation.
