import os
from uuid import uuid4

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("Supabase storage credentials are missing")


def test_storage(supabase):
    try:
        result = supabase.storage.list_buckets()
        print("BUCKETS:", result)
    except Exception as e:
        print("BUCKET TEST ERROR:", repr(e))


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
)

BUCKET_NAME = "applicant-documents"

# IMPORTANT: this bucket must be created/marked PRIVATE in the Supabase
# dashboard (or via the management API when provisioning). This client code
# never makes it public — but it also can't verify that setting from here,
# so double-check it once in Supabase before relying on signed URLs for
# access control.


def build_storage_path(applicant_id: int, document_type: str, extension: str) -> str:
    """
    applicants/{applicant_id}/documents/{document_type}/{uuid}.{extension}

    This path is entirely predictable from data we already have — no
    directory listing is ever needed to find or construct it.
    """
    ext = extension.lstrip(".").lower()
    suffix = f".{ext}" if ext else ""
    return f"applicants/{applicant_id}/documents/{document_type}/{uuid4()}{suffix}"


def upload_object(storage_path: str, file_bytes: bytes, content_type: str) -> None:
    supabase.storage.from_(BUCKET_NAME).upload(
        storage_path,
        file_bytes,
        {"content-type": content_type},
    )


def remove_object(storage_path: str) -> None:
    supabase.storage.from_(BUCKET_NAME).remove([storage_path])


def create_signed_url(storage_path: str, expires_in_seconds: int = 300) -> str:
    """
    Short-lived signed URL for admin download. Never return a permanent or
    public URL — the bucket is private, so this is the only way in.

    NOTE: the exact response shape returned by supabase-py's
    create_signed_url varies a bit by client version (signedURL vs
    signedUrl vs a nested `data` key). Verify against the installed
    `supabase` package version and adjust the key(s) below if needed.
    """
    result = supabase.storage.from_(BUCKET_NAME).create_signed_url(
        storage_path, expires_in_seconds
    )
    return (
        result.get("signedURL")
        or result.get("signedUrl")
        or result.get("signed_url")
        or ""
    )