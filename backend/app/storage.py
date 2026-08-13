import os

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