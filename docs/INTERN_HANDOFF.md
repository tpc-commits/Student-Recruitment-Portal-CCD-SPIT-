# Student Portal Intern Handoff

This document explains the current student-facing prototype and the safest way to continue it. 

## Current Scope

The repository currently contains a responsive, static React model of the student experience for the Student Recruitment Portal.

Implemented student modules:

- Home dashboard
- Job profiles, search, filters, and job details
- Applied-job state and eligibility explanation
- Personal profile and documents
- Exam Cell–synced academic records
- Academic correction-request flow
- Experience, skills, projects, and accomplishments
- Interviews, assessments, events, and competitions
- Resume repository
- Student help centre

The admin application, authentication, Exam Cell integration, notifications, and production recruitment APIs are intentionally not implemented yet. A local Express service now handles resume uploads and should later be connected to authenticated object storage.

## Data Ownership

Keep these boundaries when connecting the prototype to backend services:

| Data | Source of truth | Student access |
| --- | --- | --- |
| Semester marks, SGPA, CGPA, credits | Exam Cell | Read-only |
| Backlogs and academic status | Exam Cell | Read-only |
| Branch, admission year, graduation year | Exam Cell | Read-only |
| Academic corrections | Student request → Exam Cell review | Create and track requests |
| Personal summary, skills, projects, experience | Student | Create and edit |
| Resume versions | Student | Upload, select, and replace |
| Job profiles and eligibility rules | CCD Admin | View and apply only |
| Application and recruitment status | Recruitment workflow | View and perform allowed actions |

Eligibility must be calculated from the latest imported Exam Cell record and the rules attached to a job profile. Do not let the browser decide final eligibility by itself.

## Local Setup

Requirements:

- Node.js 22.13 or newer
- npm

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

This starts the React application on port `3000` and the Express resume API on port `3002`. Uploaded files are stored in the ignored `uploads/resumes/` development directory.

Set `NEXT_PUBLIC_RESUME_API_URL` when the browser-facing API URL differs from `http://localhost:3002`. Set `API_PORT`, `API_HOST`, and `CLIENT_ORIGIN` to configure the Express service.

Create a production build:

```bash
npm run build
```

Run the build and server-rendering tests:

```bash
npm test
```

Run static analysis:

```bash
npm run lint
```

## Source Map

```text
app/
  globals.css              Global CSS entry and Tailwind import
  layout.tsx               Document shell and social metadata
  page.tsx                 Route entry; renders StudentPortal
components/
  student-portal/
    StudentPortal.tsx      Student screens, static data, and UI state
styles/
  student-portal.css       Student portal layout and responsive styles
  ccd-theme.css            Company colors, logo styling, and brand overrides
public/
  ccd-logo.png             CCD brand mark used in the portal and favicon
  ccd-logo-light.png       White-background logo used by the portal
  og.png                   Social sharing image
tests/
  rendered-html.test.mjs   Production rendering and required-file checks
  resume-api.test.mjs      Express upload validation and persistence checks
server/
  index.js                 Local Express resume upload and download API
worker/
  index.ts                 Cloudflare Worker entry
build/
  sites-vite-plugin.ts     Deployment metadata packaging
.openai/
  hosting.json             Sites deployment configuration
```

## UI Architecture

`app/page.tsx` is deliberately small. It owns routing only and delegates the student product to `StudentPortal`.

`StudentPortal.tsx` currently keeps temporary UI state in React because this is a static prototype. State resets when the page reloads. Important state examples include:

- active navigation module
- active profile section
- selected job and job-detail tab
- local applied/not-interested status
- academic correction form status

When APIs are introduced, move module-specific data fetching and mutations into dedicated service and feature files instead of expanding the route entry.

Recommended future feature boundaries:

```text
features/
  academics/
  applications/
  assessments/
  interviews/
  jobs/
  profile/
  resumes/
services/
  api-client.ts
  exam-cell.ts
  recruitment.ts
```

Do not add these folders until real API work begins; empty architecture adds maintenance cost.

## Backend Integration Order

1. Add authentication and a typed current-student session.
2. Replace static profile and academic data with read APIs.
3. Add the Exam Cell sync status and correction-request endpoints.
4. Replace job data with admin-managed job-profile APIs.
5. Calculate eligibility on the server and return reason codes.
6. Add application submission and recruitment-stage tracking.
7. Add resume upload/storage and document permissions.
8. Add notifications and audit history.

## Suggested API Contracts

Prefer explicit, versioned response types. Academic records should include source and freshness metadata.

```ts
interface StudentAcademicRecord {
  source: "exam-cell";
  syncedAt: string;
  cgpa: number;
  activeBacklogs: number;
  academicStatus: "regular" | "backlog" | "graduated";
  semesters: SemesterResult[];
}

interface JobEligibilityResult {
  eligible: boolean;
  evaluatedAt: string;
  academicRecordVersion: string;
  reasons: EligibilityReason[];
}
```

The client should display these results, not recreate the eligibility algorithm.

## Coding Conventions

- Use TypeScript for application code.
- Keep route files small and move product logic into feature components.
- Prefer typed objects over unstructured JSON.
- Keep server-owned data read-only in the UI.
- Add loading, empty, success, and error states for every API-backed view.
- Use accessible buttons and form labels for all interactive controls.
- Preserve responsive behavior for desktop, tablet, and mobile.
- Add or update tests when behavior changes.
- Do not commit secrets or local `.env` files.
- Do not modify the company-owned `README.md` or `LICENSE` without written approval.

## Handoff Checklist

Before passing work to the next intern:

- `npm ci` completes from a clean checkout.
- `npm run build` passes.
- `npm test` passes.
- `npm run lint` has no new errors.
- New environment variables are documented in an approved location.
- API changes include request and response examples.
- Academic data remains read-only for students.
- Eligibility decisions remain server-authoritative.
- No generated build output or local credentials are committed.
