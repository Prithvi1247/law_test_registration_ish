# Admission Onboarding Portal — Frontend

React + TypeScript + Vite frontend for the 7-step admission onboarding flow.
Only **Section 1 — Personal Details** is functional; every other section is
a typed placeholder so the full flow's shape is visible.

## Project structure

```
onboarding-portal/
├── index.html                          Vite HTML entry
├── package.json
├── vite.config.ts                      dev server + /api proxy to FastAPI
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── src/
    ├── main.tsx                        ReactDOM root, mounts <App />
    ├── App.tsx                         top-level shell (stubs a userId — auth is out of scope)
    ├── types/
    │   └── onboarding.ts                all request/response shapes from the API contract
    ├── api/
    │   ├── client.ts                    shared fetch wrapper (network/HTTP error handling)
    │   └── applicants.ts                createApplicant() — POST /applicants (the only wired call)
    ├── state/
    │   └── OnboardingContext.tsx        holds userId/applicantId across the whole flow
    ├── validation/
    │   └── personalDetails.ts           Section 1 field validation
    ├── components/
    │   ├── PersonalDetailsForm.tsx      Section 1 — fully implemented
    │   ├── PersonalDetailsForm.css
    │   └── steps/                       Sections 2–7 — placeholders only
    │       ├── NotImplementedStep.tsx   shared "not implemented" placeholder
    │       ├── EducationStep.tsx
    │       ├── TestDetailsStep.tsx
    │       ├── CityPreferencesStep.tsx
    │       ├── DocumentsStep.tsx
    │       ├── ReviewStep.tsx
    │       └── SubmissionStep.tsx
    └── pages/
        └── OnboardingFlow.tsx            steps through all 7 sections in order
```

## What's implemented vs. placeholder

| Section | File | Status |
|---|---|---|
| 1. Personal Details | `components/PersonalDetailsForm.tsx` | **Implemented** — validates, calls `POST /applicants`, stores applicant ID |
| 2. Education | `components/steps/EducationStep.tsx` | Placeholder |
| 3. Test Details | `components/steps/TestDetailsStep.tsx` | Placeholder |
| 4. City Preferences | `components/steps/CityPreferencesStep.tsx` | Placeholder |
| 5. Photo/Documents | `components/steps/DocumentsStep.tsx` | Placeholder |
| 6. Review | `components/steps/ReviewStep.tsx` | Placeholder |
| 7. Final Submission | `components/steps/SubmissionStep.tsx` | Placeholder (no documented endpoint yet) |

`types/onboarding.ts` already includes typed shapes for every documented
endpoint (education, test dates/centres, test selection, documents, review)
so each later section can be built against a contract instead of
re-deriving it from the spec — but no UI or API call beyond `POST
/applicants` is wired up yet.

## Key behaviors (Section 1)

- `is_nri` is `boolean | null` — `null` means "not yet chosen" and blocks
  submission; it's never coerced to `false`.
- Clicking Continue when an `applicantId` already exists (e.g. navigating
  back to Section 1) skips `POST /applicants` and just advances — no
  duplicate applicants.
- Mobile number is validated as a plausible digit string only; no OTP
  logic, endpoint, or UI is included.
- `country_code` defaults to `+91`.
- All network/validation/HTTP errors are caught and shown inline; the flow
  never silently advances on failure.

## Running locally

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:8000` (adjust the
target in `vite.config.ts` to match wherever the FastAPI backend runs).

## Not included (per spec)

Backend/schema changes, authentication, OTP, document upload logic, review
data-fetching, final submission logic, payment, DigiLocker, AI, visual
redesign/advanced styling.
