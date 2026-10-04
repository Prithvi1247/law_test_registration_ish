"""
The ONE place that decides which documents an applicant must upload.

Reused by: the required-documents endpoint, upload validation, the review
page, submission-completeness checks, and admin document status. Do not
re-derive this list anywhere else — if the rules change, they change here
and nowhere else needs to be touched.
"""

from app.document_types import DocumentType


def get_required_documents(applicant) -> list[str]:
    """
    Returns the ordered list of document_type identifiers required for this
    applicant, based on fields already stored on the Applicant row. Multiple
    conditions stack (e.g. SC + PWD applicant needs SC_CERTIFICATE,
    PWD_CERTIFICATE and UDID_CARD).
    """
    required: list[str] = [DocumentType.PHOTO]

    if applicant.category == "SC":
        required.append(DocumentType.SC_CERTIFICATE)

    if applicant.category == "ST":
        required.append(DocumentType.ST_CERTIFICATE)

    if applicant.is_km:
        required.append(DocumentType.KM_CERTIFICATE)

    if applicant.is_pwd:
        required.append(DocumentType.PWD_CERTIFICATE)
        required.append(DocumentType.UDID_CARD)

    if applicant.is_nagpur_domicile:
        required.append(DocumentType.NAGPUR_DOMICILE)

    if applicant.is_defence:
        required.append(DocumentType.DEFENCE_CERTIFICATE)

    if applicant.is_nri:
        required.append(DocumentType.NRI_CERTIFICATE)

    return required


def get_missing_documents(applicant, uploaded_document_types: set[str]) -> list[str]:
    """Required minus uploaded, preserving the required list's order."""
    required = get_required_documents(applicant)
    return [doc_type for doc_type in required if doc_type not in uploaded_document_types]