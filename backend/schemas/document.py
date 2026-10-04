from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    applicant_id: int
    document_type: str
    document_label: str
    original_filename: str | None
    content_type: str | None
    file_size: int | None
    upload_status: str
    verification_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RequiredDocumentItem(BaseModel):
    document_type: str
    document_label: str


class RequiredDocumentsResponse(BaseModel):
    applicant_id: int
    required_documents: list[RequiredDocumentItem]


class DocumentCompletionResponse(BaseModel):
    applicant_id: int
    required: list[str]
    uploaded: list[str]
    missing: list[str]
    is_complete: bool


class AdminDocumentResponse(BaseModel):
    document_type: str
    document_label: str
    original_filename: str | None
    verification_status: str
    upload_status: str
    download_url: str