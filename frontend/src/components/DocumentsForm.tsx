import { useEffect, useState } from "react";

import {
  getRequiredDocuments,
  getApplicantDocuments,
  uploadDocument,
  type RequiredDocument,
  type UploadedDocument,
} from "../api/documents";

interface DocumentsFormProps {
  applicantId: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function DocumentsForm({
  applicantId,
  onContinue,
  onBack,
}: DocumentsFormProps) {
  const [requiredDocuments, setRequiredDocuments] = useState<
    RequiredDocument[]
  >([]);

  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocument[]
  >([]);

  const [selectedFiles, setSelectedFiles] = useState<
    Record<string, File | null>
  >({});

  const [uploading, setUploading] = useState<
    Record<string, boolean>
  >({});

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] = useState(true);

  const [pageError, setPageError] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadDocuments();
  }, [applicantId]);

  async function loadDocuments() {
    try {
      setLoading(true);
      setPageError(null);

      const [required, uploaded] = await Promise.all([
        getRequiredDocuments(applicantId),
        getApplicantDocuments(applicantId),
      ]);

      setRequiredDocuments(required.required_documents);
      setUploadedDocuments(uploaded);
    } catch (error) {
      console.error(error);
      setPageError(
        "Unable to load your required documents."
      );
    } finally {
      setLoading(false);
    }
  }

  function getUploadedDocument(documentType: string) {
    return uploadedDocuments.find(
      (document) =>
        document.document_type === documentType &&
        document.upload_status === "uploaded"
    );
  }

  function handleFileChange(
    documentType: string,
    file: File | null
  ) {
    setSelectedFiles((previous) => ({
      ...previous,
      [documentType]: file,
    }));

    setErrors((previous) => ({
      ...previous,
      [documentType]: "",
    }));
  }

  async function handleUpload(
    document: RequiredDocument
  ) {
    const file = selectedFiles[document.document_type];

    if (!file) {
      setErrors((previous) => ({
        ...previous,
        [document.document_type]:
          "Please select a file first.",
      }));

      return;
    }

    setUploading((previous) => ({
      ...previous,
      [document.document_type]: true,
    }));

    setErrors((previous) => ({
      ...previous,
      [document.document_type]: "",
    }));

    try {
      await uploadDocument(
        applicantId,
        file,
        document.document_type
      );

      // Reload uploaded documents after successful upload.
      const uploaded = await getApplicantDocuments(
        applicantId
      );

      setUploadedDocuments(uploaded);

      setSelectedFiles((previous) => ({
        ...previous,
        [document.document_type]: null,
      }));
    } catch (error) {
      console.error(error);

      setErrors((previous) => ({
        ...previous,
        [document.document_type]:
          "Upload failed. Please try again.",
      }));
    } finally {
      setUploading((previous) => ({
        ...previous,
        [document.document_type]: false,
      }));
    }
  }

  function allDocumentsUploaded() {
    return requiredDocuments.every(
      (document) =>
        !!getUploadedDocument(document.document_type)
    );
  }

  if (loading) {
    return (
      <div className="documents-form">
        <p>Loading required documents...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="documents-form">
        <p>{pageError}</p>

        <button type="button" onClick={loadDocuments}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="documents-form">
      <div className="documents-header">
        <h2>Required Documents</h2>

        <p>
          Please upload all documents required for your
          application.
        </p>
      </div>

      <div className="documents-list">
        {requiredDocuments.map((document) => {
          const uploaded = getUploadedDocument(
            document.document_type
          );

          const selectedFile =
            selectedFiles[document.document_type];

          const isUploading =
            uploading[document.document_type];

          const error =
            errors[document.document_type];

          return (
            <div
              key={document.document_type}
              className="document-item"
            >
              <div className="document-info">
                <h3>{document.document_label}</h3>

                <span className="document-required">
                  Required
                </span>
              </div>

              {uploaded ? (
                <div className="document-uploaded">
                  <div>
                    <strong>
                      ✓ {uploaded.original_filename}
                    </strong>

                    <p>
                      Document uploaded successfully.
                    </p>
                  </div>

                  <label className="document-replace">
                    Replace

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      hidden
                      onChange={(event) => {
                        const file =
                          event.target.files?.[0] ?? null;

                        handleFileChange(
                          document.document_type,
                          file
                        );
                      }}
                    />
                  </label>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(event) => {
                      const file =
                        event.target.files?.[0] ?? null;

                      handleFileChange(
                        document.document_type,
                        file
                      );
                    }}
                  />

                  {selectedFile && (
                    <p>
                      Selected: {selectedFile.name}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={
                      !selectedFile || isUploading
                    }
                    onClick={() =>
                      handleUpload(document)
                    }
                  >
                    {isUploading
                      ? "Uploading..."
                      : "Upload"}
                  </button>
                </>
              )}

              {uploaded && selectedFile && (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() =>
                    handleUpload(document)
                  }
                >
                  {isUploading
                    ? "Uploading..."
                    : "Upload Replacement"}
                </button>
              )}

              {error && (
                <p className="document-error">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="documents-actions">
        <button type="button" onClick={onBack}>
          Back
        </button>

        <button
          type="button"
          disabled={!allDocumentsUploaded()}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>

      {!allDocumentsUploaded() && (
        <p className="documents-warning">
          Please upload all required documents before
          continuing.
        </p>
      )}
    </div>
  );
}