import { apiRequest } from "./client";

export interface RequiredDocument {
  document_type: string;
  document_label: string;
}

export interface RequiredDocumentsResponse {
  applicant_id: number;
  required_documents: RequiredDocument[];
}

export interface UploadedDocument {
  id: number;
  applicant_id: number;
  document_type: string;
  document_label: string;
  original_filename: string | null;
  content_type: string | null;
  file_size: number | null;
  upload_status: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentCompletionResponse {
  applicant_id: number;
  required: string[];
  uploaded: string[];
  missing: string[];
  is_complete: boolean;
}

export async function getRequiredDocuments(
  applicantId: number
): Promise<RequiredDocumentsResponse> {
  return apiRequest<RequiredDocumentsResponse>(
    `/applicants/${applicantId}/required-documents`
  );
}

export async function getApplicantDocuments(
  applicantId: number
): Promise<UploadedDocument[]> {
  return apiRequest<UploadedDocument[]>(
    `/applicants/${applicantId}/documents`
  );
}

export async function getDocumentCompletion(
  applicantId: number
): Promise<DocumentCompletionResponse> {
  return apiRequest<DocumentCompletionResponse>(
    `/applicants/${applicantId}/documents/completion`
  );
}

export async function uploadDocument(
  applicantId: number,
  file: File,
  documentType: string
): Promise<{
  message: string;
  document_id: number;
  document_type: string;
}> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("document_type", documentType);

  return apiRequest(
    `/applicants/${applicantId}/documents`,
    {
      method: "POST",
      body: formData,
      isFormData: true,
    }
  );
}