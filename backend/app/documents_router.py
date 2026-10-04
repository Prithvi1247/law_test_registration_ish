from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user_id, get_owned_applicant, require_admin
from app.document_types import DOCUMENT_TYPE_LABELS, ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE_BYTES
from app.document_rules import get_required_documents, get_missing_documents
from app.storage import build_storage_path, upload_object, remove_object, create_signed_url
from models.applicant import Applicant
from models.document import ApplicantDocument
from schemas.document import (
    DocumentResponse,
    RequiredDocumentsResponse,
    RequiredDocumentItem,
    DocumentCompletionResponse,
    AdminDocumentResponse,
)

router = APIRouter()


def _to_document_response(doc: ApplicantDocument) -> DocumentResponse:
    return DocumentResponse(
        id=doc.id,
        applicant_id=doc.applicant_id,
        document_type=doc.document_type,
        document_label=DOCUMENT_TYPE_LABELS.get(doc.document_type, doc.document_type),
        original_filename=doc.original_filename,
        content_type=doc.content_type,
        file_size=doc.file_size,
        upload_status=doc.upload_status,
        verification_status=doc.verification_status,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


@router.get(
    "/applicants/{applicant_id}/required-documents",
    response_model=RequiredDocumentsResponse,
)
def get_required_documents_endpoint(
    applicant_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    applicant = get_owned_applicant(applicant_id, db, current_user_id)
    required_types = get_required_documents(applicant)

    return RequiredDocumentsResponse(
        applicant_id=applicant.id,
        required_documents=[
            RequiredDocumentItem(
                document_type=t,
                document_label=DOCUMENT_TYPE_LABELS.get(t, t),
            )
            for t in required_types
        ],
    )


@router.get("/applicants/{applicant_id}/documents", response_model=list[DocumentResponse])
def list_documents(
    applicant_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    applicant = get_owned_applicant(applicant_id, db, current_user_id)

    # Indexed lookup on applicant_id (see ix_applicant_documents_applicant_id
    # in the migration) — Supabase Storage is never touched here.
    documents = (
        db.query(ApplicantDocument)
        .filter(ApplicantDocument.applicant_id == applicant.id)
        .all()
    )

    return [_to_document_response(doc) for doc in documents]


@router.get(
    "/applicants/{applicant_id}/documents/completion",
    response_model=DocumentCompletionResponse,
)
def get_document_completion(
    applicant_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Required vs. uploaded, computed server-side. Used by the review page and
    by submit_application in main.py — never trust frontend state for this.
    """
    applicant = get_owned_applicant(applicant_id, db, current_user_id)

    required = get_required_documents(applicant)
    uploaded_types = {
        row[0]
        for row in db.query(ApplicantDocument.document_type)
        .filter(
            ApplicantDocument.applicant_id == applicant.id,
            ApplicantDocument.upload_status == "UPLOADED",
        )
        .all()
    }
    missing = get_missing_documents(applicant, uploaded_types)

    return DocumentCompletionResponse(
        applicant_id=applicant.id,
        required=required,
        uploaded=sorted(uploaded_types),
        missing=missing,
        is_complete=len(missing) == 0,
    )


@router.post("/applicants/{applicant_id}/documents", response_model=DocumentResponse)
async def upload_document(
    applicant_id: int,
    document_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    applicant = get_owned_applicant(applicant_id, db, current_user_id)

    if applicant.status != "draft":
        raise HTTPException(
            status_code=409,
            detail="This application has already been submitted and can no longer be edited.",
        )

    # Reject any document_type that isn't actually applicable to this
    # applicant — e.g. a General-category applicant can't upload an
    # SC_CERTIFICATE. This is the same get_required_documents() used
    # everywhere else, so the rule can't drift between endpoints.
    if document_type not in get_required_documents(applicant):
        raise HTTPException(
            status_code=400,
            detail=f"'{document_type}' is not applicable to this applicant.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, JPG and PNG files are allowed")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File size must be below 2 MB")

    filename = file.filename or ""
    extension = filename.rsplit(".", 1)[-1] if "." in filename else ""
    storage_path = build_storage_path(applicant.id, document_type, extension)

    try:
        upload_object(storage_path, file_bytes, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    existing = (
        db.query(ApplicantDocument)
        .filter(
            ApplicantDocument.applicant_id == applicant.id,
            ApplicantDocument.document_type == document_type,
        )
        .first()
    )
    old_storage_path = existing.storage_path if existing else None

    if existing:
        # Replacement: same row, same applicant/document_type — never a new
        # row for the same document type (the unique constraint would
        # reject it anyway).
        existing.storage_path = storage_path
        existing.original_filename = file.filename
        existing.content_type = file.content_type
        existing.file_size = len(file_bytes)
        existing.upload_status = "UPLOADED"
        existing.verification_status = "NOT_REVIEWED"  # re-upload resets review
        document = existing
    else:
        document = ApplicantDocument(
            applicant_id=applicant.id,
            document_type=document_type,
            storage_path=storage_path,
            original_filename=file.filename,
            content_type=file.content_type,
            file_size=len(file_bytes),
            upload_status="UPLOADED",
            verification_status="NOT_REVIEWED",
        )
        db.add(document)

    db.commit()
    db.refresh(document)

    # Clean up the old object only after the DB row is safely committed to
    # the new path, so a mid-flight failure never leaves the row pointing
    # at a deleted object.
    if old_storage_path:
        try:
            remove_object(old_storage_path)
        except Exception as e:
            print("STORAGE CLEANUP WARNING (old document not removed):", repr(e))

    return _to_document_response(document)


@router.get(
    "/admin/applicants/{applicant_id}/documents",
    response_model=list[AdminDocumentResponse],
)
def admin_get_documents(
    applicant_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    # The entire "scalability requirement": one indexed query keyed on
    # applicant_id, returning a handful of rows no matter how large the
    # bucket or the applicant table gets.
    documents = (
        db.query(ApplicantDocument)
        .filter(ApplicantDocument.applicant_id == applicant_id)
        .all()
    )

    results = []
    for doc in documents:
        try:
            signed_url = create_signed_url(doc.storage_path)
        except Exception as e:
            signed_url = ""
            print("SIGNED URL ERROR:", repr(e))

        results.append(
            AdminDocumentResponse(
                document_type=doc.document_type,
                document_label=DOCUMENT_TYPE_LABELS.get(doc.document_type, doc.document_type),
                original_filename=doc.original_filename,
                verification_status=doc.verification_status,
                upload_status=doc.upload_status,
                download_url=signed_url,
            )
        )

    return results