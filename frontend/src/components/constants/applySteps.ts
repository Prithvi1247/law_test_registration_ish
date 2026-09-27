// Single source of truth for the six /apply/* steps. Both ApplyLayout
// (the step rail shown while filling the form) and HomePage (the progress
// checklist + "Continue Application" logic) read from this list, so the
// two can never silently drift out of sync with each other or with the
// actual route paths registered in App.tsx.
export const APPLY_STEPS = [
  { path: "personal", label: "Personal Details", shortLabel: "Personal" },
  { path: "education", label: "Education", shortLabel: "Education" },
  { path: "test", label: "Test Date", shortLabel: "Test" },
  { path: "preferences", label: "Test Centre Preferences", shortLabel: "Preferences" },
  { path: "documents", label: "Photo / Documents", shortLabel: "Documents" },
  { path: "review", label: "Review", shortLabel: "Review" },
] as const;

export type ApplyStepPath = (typeof APPLY_STEPS)[number]["path"];