import { apiRequest } from "./client";

/**
 * POST /applicants/{applicant_id}/documents
 * multipart/form-data, field name "file". Backend hardcodes document_type
 * to "PHOTO" — there's no field for choosing a different type.
 *
 * NOTE (backend gap #6 from the architecture review): re-uploading does
 * not replace the previous PHOTO row — it inserts a new one. There is no
 * delete/replace endpoint, so a second upload for the same applicant will
 * leave two document rows server-side. Flagged, not worked around.
 */
export async function uploadDocument(
  applicantId: number,
  file: File
): Promise<{ message: string; document_id: number; document_type: string }> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest(`/applicants/${applicantId}/documents`, {
    method: "POST",
    body: formData,
    isFormData: true,
  });
}
