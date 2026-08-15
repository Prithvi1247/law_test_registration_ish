import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { uploadDocument } from "../../api/documents";
import { getApplicationReview } from "../../api/review";
import { ApiError, NetworkError } from "../../api/client";
import { useOnboarding } from "../../state/OnboardingContext";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function DocumentsStep() {
  const navigate = useNavigate();
  const { applicantId } = useOnboarding();

  const [existingPhotoName, setExistingPhotoName] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setJustUploaded(false);
    const selected = e.target.files?.[0] ?? null;
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
    <div>
      <h2>Photo / Documents</h2>

      {isLoadingExisting && <p>Checking for an existing photo…</p>}

      {!isLoadingExisting && existingPhotoName && !justUploaded && (
        <p>
          A photo is already on file ({existingPhotoName}). You can keep it and continue, or upload a new
          one below to replace it.
        </p>
      )}

      <div className="field">
        <label htmlFor="photo">{existingPhotoName ? "Replace Photo" : "Applicant Photo"} (JPG or PNG, under 2 MB)</label>
        <input id="photo" type="file" accept="image/jpeg,image/png" onChange={handleFileChange} />
      </div>

      {error && <p className="form-error">{error}</p>}
      {justUploaded && <p style={{ color: "#0a7a2f" }}>Photo uploaded successfully.</p>}

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="button" onClick={handleUpload} disabled={isUploading || !file}>
          {isUploading ? "Uploading…" : existingPhotoName ? "Upload Replacement" : "Upload Photo"}
        </button>
        <button type="button" onClick={() => navigate("/apply/review")} disabled={!canContinue}>
          Continue to Review
        </button>
      </div>
    </div>
  );
}