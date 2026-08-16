import { useEffect, useState, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { uploadDocument } from "../../api/documents";
import { getApplicationReview } from "../../api/review";
import { ApiError, NetworkError } from "../../api/client";
import { useOnboarding } from "../../state/OnboardingContext";
import "./steps.css";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function DocumentsStep() {
  const navigate = useNavigate();
  const { applicantId } = useOnboarding();

  const [existingPhotoName, setExistingPhotoName] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  // Visual-only preview URL for the currently chosen file — never sent to
  // the backend, purely for the on-screen thumbnail.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    if (applicantId === null) return;
    setIsLoadingExisting(true);
    getApplicationReview(applicantId)
      .then((review) => {
        const photo = review.documents.find((d) => d.document_type === "PHOTO");
        setExistingPhotoName(photo ? photo.original_filename ?? photo.file_url : null);
      })
      .catch(() => {
        // Non-fatal — treat as no existing photo known.
      })
      .finally(() => setIsLoadingExisting(false));
  }, [applicantId]);

  // Keep the object URL in sync with the selected file, and release the
  // previous one so we don't leak memory across re-selections.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function applySelectedFile(selected: File | null) {
    setError(null);
    setJustUploaded(false);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ALLOWED_TYPES.has(selected.type)) {
      setError("Only JPG and PNG images are allowed.");
      setFile(null);
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      setError("File size must be below 2 MB.");
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    applySelectedFile(e.target.files?.[0] ?? null);
  }

  // Purely presentational drag/drop wrapper around the same input's
  // behavior — dropping a file hands it to the identical validation path
  // as picking one via the file dialog.
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragActive(false);
    applySelectedFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function handleUpload() {
    if (applicantId === null) {
      setError("Please complete Personal Details first.");
      return;
    }
    if (!file) {
      setError("Please choose a photo to upload.");
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      // Backend replaces any existing PHOTO row rather than duplicating it.
      await uploadDocument(applicantId, file);
      setJustUploaded(true);
      setExistingPhotoName(file.name);
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError("Something went wrong while uploading your photo.");
      }
    } finally {
      setIsUploading(false);
    }
  }

  const canContinue = existingPhotoName !== null || justUploaded;

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Application · Step 5 of 6</p>
      <h2 className="content-card__title">Photo / Documents</h2>
      <p className="content-card__description">
        Upload a recent passport-style photograph to complete your application.
      </p>

      {isLoadingExisting && <p>Checking for an existing photo…</p>}

      {!isLoadingExisting && existingPhotoName && !justUploaded && !file && (
        <div className="alert alert-info">
          <p>
            A photo is already on file (<strong>{existingPhotoName}</strong>). You can keep it and continue, or
            choose a new one below to replace it.
          </p>
        </div>
      )}

      {file && previewUrl ? (
        <div className="upload-preview">
          <img src={previewUrl} alt="Selected upload preview" className="upload-preview__thumb" />
          <div className="upload-preview__meta">
            <div className="upload-preview__name">{file.name}</div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)" }}>
              {(file.size / 1024).toFixed(0)} KB
            </div>
            {justUploaded && <div className="upload-preview__status">✓ Uploaded successfully</div>}
          </div>
        </div>
      ) : null}

      <div
        className={`upload-area${file ? " has-file" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        style={isDragActive ? { borderColor: "var(--color-ink-600)" } : undefined}
      >
        <div className="upload-area__icon" aria-hidden="true">
          ⬆
        </div>
        <div className="upload-area__label">
          {existingPhotoName ? "Replace Photo" : "Applicant Photo"}
        </div>
        <p className="upload-area__hint">Drag and drop, or choose a file below · JPG or PNG, under 2 MB</p>
        <label htmlFor="photo" style={{ position: "absolute", left: "-9999px" }}>
          {existingPhotoName ? "Replace Photo" : "Applicant Photo"} (JPG or PNG, under 2 MB)
        </label>
        <input id="photo" type="file" accept="image/jpeg,image/png" onChange={handleFileChange} />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="step-actions">
        <button type="button" className="btn btn-secondary" onClick={handleUpload} disabled={isUploading || !file}>
          {isUploading ? "Uploading…" : existingPhotoName ? "Upload Replacement" : "Upload Photo"}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate("/apply/review")}
          disabled={!canContinue}
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
}