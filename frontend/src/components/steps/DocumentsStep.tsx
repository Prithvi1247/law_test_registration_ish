// DocumentsStep.tsx

import {
  useEffect,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  getRequiredDocuments,
  getApplicantDocuments,
  uploadDocument,
  type RequiredDocument,
  type UploadedDocument,
} from "../../api/documents";

import { ApiError, NetworkError } from "../../api/client";
import { useOnboarding } from "../../state/OnboardingContext";

import "./steps.css";

const PHOTO_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
]);

const GENERAL_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

const PHOTO_MAX_SIZE = 2 * 1024 * 1024;
const DOCUMENT_MAX_SIZE = 5 * 1024 * 1024;

interface SelectedFile {
  file: File;
  previewUrl: string | null;
}

export function DocumentsStep() {
  const navigate = useNavigate();
  const { applicantId } = useOnboarding();

  const [requiredDocuments, setRequiredDocuments] = useState<
    RequiredDocument[]
  >([]);

  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocument[]
  >([]);

  const [selectedFiles, setSelectedFiles] = useState<
    Record<string, SelectedFile | null>
  >({});

  const [uploading, setUploading] = useState<
    Record<string, boolean>
  >({});

  const [errors, setErrors] = useState<
    Record<string, string | null>
  >({});

  const [isLoading, setIsLoading] = useState(true);

  const [pageError, setPageError] = useState<string | null>(
    null
  );

  // ---------------------------------------------------------
  // Load required + already uploaded documents
  // ---------------------------------------------------------

  useEffect(() => {
    if (applicantId === null) {
      setIsLoading(false);
      return;
    }

    loadDocuments();
  }, [applicantId]);

  async function loadDocuments() {
    if (applicantId === null) return;

    try {
      setIsLoading(true);
      setPageError(null);

      const [requiredResponse, uploadedResponse] =
        await Promise.all([
          getRequiredDocuments(applicantId),
          getApplicantDocuments(applicantId),
        ]);

      setRequiredDocuments(
        requiredResponse.required_documents
      );

      setUploadedDocuments(uploadedResponse);
    } catch (err) {
      if (
        err instanceof ApiError ||
        err instanceof NetworkError
      ) {
        setPageError(err.message);
      } else {
        setPageError(
          "Could not load your required documents."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ---------------------------------------------------------
  // Find uploaded document by type
  // ---------------------------------------------------------

  function getUploadedDocument(documentType: string) {
    return uploadedDocuments.find(
      (document) =>
        document.document_type === documentType &&
        document.upload_status === "uploaded"
    );
  }

  // ---------------------------------------------------------
  // File validation
  // ---------------------------------------------------------

  function validateFile(
    document: RequiredDocument,
    file: File
  ): string | null {
    const isPhoto = document.document_type === "PHOTO";

    const allowedTypes = isPhoto
      ? PHOTO_ALLOWED_TYPES
      : GENERAL_ALLOWED_TYPES;

    const maxSize = isPhoto
      ? PHOTO_MAX_SIZE
      : DOCUMENT_MAX_SIZE;

    if (!allowedTypes.has(file.type)) {
      if (isPhoto) {
        return "Only JPG and PNG images are allowed.";
      }

      return "Only JPG, PNG and PDF files are allowed.";
    }

    if (file.size > maxSize) {
      if (isPhoto) {
        return "Photo must be below 2 MB.";
      }

      return "Document must be below 5 MB.";
    }

    if (file.size === 0) {
      return "The selected file is empty.";
    }

    return null;
  }

  // ---------------------------------------------------------
  // Select file
  // ---------------------------------------------------------

  function applySelectedFile(
    document: RequiredDocument,
    file: File | null
  ) {
    const documentType = document.document_type;

    setErrors((previous) => ({
      ...previous,
      [documentType]: null,
    }));

    if (!file) {
      setSelectedFiles((previous) => ({
        ...previous,
        [documentType]: null,
      }));

      return;
    }

    const validationError = validateFile(
      document,
      file
    );

    if (validationError) {
      setErrors((previous) => ({
        ...previous,
        [documentType]: validationError,
      }));

      setSelectedFiles((previous) => ({
        ...previous,
        [documentType]: null,
      }));

      return;
    }

    let previewUrl: string | null = null;

    if (file.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(file);
    }

    setSelectedFiles((previous) => ({
      ...previous,
      [documentType]: {
        file,
        previewUrl,
      },
    }));
  }

  function handleFileChange(
    document: RequiredDocument,
    event: ChangeEvent<HTMLInputElement>
  ) {
    applySelectedFile(
      document,
      event.target.files?.[0] ?? null
    );
  }

  // ---------------------------------------------------------
  // Drag and drop
  // ---------------------------------------------------------

  function handleDragOver(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
  }

  function handleDrop(
    document: RequiredDocument,
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    applySelectedFile(
      document,
      event.dataTransfer.files?.[0] ?? null
    );
  }

  // ---------------------------------------------------------
  // Upload
  // ---------------------------------------------------------

  async function handleUpload(
    document: RequiredDocument
  ) {
    if (applicantId === null) {
      setErrors((previous) => ({
        ...previous,
        [document.document_type]:
          "Please complete Personal Details first.",
      }));

      return;
    }

    const selected =
      selectedFiles[document.document_type];

    if (!selected) {
      setErrors((previous) => ({
        ...previous,
        [document.document_type]:
          "Please choose a file first.",
      }));

      return;
    }

    const documentType = document.document_type;

    setUploading((previous) => ({
      ...previous,
      [documentType]: true,
    }));

    setErrors((previous) => ({
      ...previous,
      [documentType]: null,
    }));

    try {
      await uploadDocument(
        applicantId,
        selected.file,
        documentType
      );

      // Reload the server state after upload.
      const uploaded = await getApplicantDocuments(
        applicantId
      );

      setUploadedDocuments(uploaded);

      // Release image preview URL.
      if (selected.previewUrl) {
        URL.revokeObjectURL(selected.previewUrl);
      }

      setSelectedFiles((previous) => ({
        ...previous,
        [documentType]: null,
      }));
    } catch (err) {
      if (
        err instanceof ApiError ||
        err instanceof NetworkError
      ) {
        setErrors((previous) => ({
          ...previous,
          [documentType]: err.message,
        }));
      } else {
        setErrors((previous) => ({
          ...previous,
          [documentType]:
            "Something went wrong while uploading the document.",
        }));
      }
    } finally {
      setUploading((previous) => ({
        ...previous,
        [documentType]: false,
      }));
    }
  }

  // ---------------------------------------------------------
  // Completion
  // ---------------------------------------------------------

  function allDocumentsUploaded() {
    return requiredDocuments.every(
      (document) =>
        getUploadedDocument(document.document_type) !==
        undefined
    );
  }

  // ---------------------------------------------------------
  // Applicant missing
  // ---------------------------------------------------------

  if (applicantId === null) {
    return (
      <div className="content-card">
        <p
          className="form-error"
          role="alert"
        >
          Please complete Personal Details first.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

  if (isLoading) {
    return (
      <div className="content-card">
        <p>Loading your required documents…</p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Error
  // ---------------------------------------------------------

  if (pageError) {
    return (
      <div className="content-card">
        <p
          className="form-error"
          role="alert"
        >
          {pageError}
        </p>

        <div className="step-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadDocuments}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">
        Application · Step 5 of 6
      </p>

      <h2 className="content-card__title">
        Photo / Documents
      </h2>

      <p className="content-card__description">
        Upload all documents required for your application.
      </p>

      <div className="documents-list">
        {requiredDocuments.map((document) => {
          const uploaded = getUploadedDocument(
            document.document_type
          );

          const selected =
            selectedFiles[document.document_type];

          const isUploading =
            uploading[document.document_type] ?? false;

          const error =
            errors[document.document_type];

          const isPhoto =
            document.document_type === "PHOTO";

          return (
            <div
              key={document.document_type}
              className="document-item"
            >
              {/* -------------------------------------------
                  Document heading
              -------------------------------------------- */}

              <div className="document-item__header">
                <div>
                  <h3>
                    {document.document_label}
                  </h3>

                  <span className="badge badge-draft">
                    Required
                  </span>
                </div>

                {uploaded && (
                  <span className="badge badge-verified">
                    Uploaded
                  </span>
                )}
              </div>

              {/* -------------------------------------------
                  Existing uploaded document
              -------------------------------------------- */}

              {uploaded && !selected && (
                <div className="alert alert-info">
                  <p>
                    ✓{" "}
                    <strong>
                      {uploaded.original_filename ??
                        "Document uploaded"}
                    </strong>
                  </p>

                  <p>
                    You can keep this document or
                    choose a new file below to replace it.
                  </p>
                </div>
              )}

              {/* -------------------------------------------
                  Selected file preview
              -------------------------------------------- */}

              {selected && (
                <div className="upload-preview">
                  {selected.previewUrl ? (
                    <img
                      src={selected.previewUrl}
                      alt="Selected upload preview"
                      className="upload-preview__thumb"
                    />
                  ) : (
                    <div className="upload-preview__file">
                      📄
                    </div>
                  )}

                  <div className="upload-preview__meta">
                    <div className="upload-preview__name">
                      {selected.file.name}
                    </div>

                    <div
                      style={{
                        fontSize: "var(--fs-xs)",
                        color:
                          "var(--color-text-muted)",
                      }}
                    >
                      {(
                        selected.file.size / 1024
                      ).toFixed(0)}{" "}
                      KB
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------------------------------
                  Drop zone
              -------------------------------------------- */}

              <div
                className={`upload-area${
                  selected ? " has-file" : ""
                }`}
                onDragOver={handleDragOver}
                onDrop={(event) =>
                  handleDrop(document, event)
                }
              >
                <div
                  className="upload-area__icon"
                  aria-hidden="true"
                >
                  ⬆
                </div>

                <div className="upload-area__label">
                  {uploaded
                    ? `Replace ${document.document_label}`
                    : `Upload ${document.document_label}`}
                </div>

                <p className="upload-area__hint">
                  Drag and drop, or choose a file below ·{" "}
                  {isPhoto
                    ? "JPG or PNG, under 2 MB"
                    : "JPG, PNG or PDF, under 5 MB"}
                </p>

                <label
                  htmlFor={`document-${document.document_type}`}
                  style={{
                    position: "absolute",
                    left: "-9999px",
                  }}
                >
                  Choose {document.document_label}
                </label>

                <input
                  id={`document-${document.document_type}`}
                  type="file"
                  accept={
                    isPhoto
                      ? "image/jpeg,image/png"
                      : "image/jpeg,image/png,application/pdf"
                  }
                  onChange={(event) =>
                    handleFileChange(
                      document,
                      event
                    )
                  }
                />
              </div>

              {/* -------------------------------------------
                  Error
              -------------------------------------------- */}

              {error && (
                <p
                  className="form-error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {/* -------------------------------------------
                  Upload button
              -------------------------------------------- */}

              <div className="document-item__actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={
                    isUploading || !selected
                  }
                  onClick={() =>
                    handleUpload(document)
                  }
                >
                  {isUploading
                    ? "Uploading…"
                    : uploaded
                      ? "Upload Replacement"
                      : "Upload"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* -----------------------------------------------
          Empty requirement state
      ------------------------------------------------ */}

      {requiredDocuments.length === 0 && (
        <div className="alert alert-info">
          <p>
            No supporting documents are currently
            required.
          </p>
        </div>
      )}

      {/* -----------------------------------------------
          Continue
      ------------------------------------------------ */}

      {!allDocumentsUploaded() &&
        requiredDocuments.length > 0 && (
          <div
            className="alert alert-info"
            style={{ marginTop: "var(--space-4)" }}
          >
            <p>
              Please upload all required documents
              before continuing.
            </p>
          </div>
        )}

      <div className="step-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
        >
          Back
        </button>

        <button
          type="button"
          className="btn btn-primary"
          disabled={!allDocumentsUploaded()}
          onClick={() =>
            navigate("/apply/review")
          }
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
}