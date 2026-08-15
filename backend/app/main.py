from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from models.user import User
from schemas.user import UserResponse, UserCreate, UserLogin
from app.dependencies import get_db
from models.education import ApplicantEducation
from schemas.education import EducationCreate, EducationResponse
from models.applicant import Applicant
from schemas.applicant import ApplicantCreate, ApplicantUpdate, ApplicantResponse
from fastapi import Query

from models.test_date import TestDate
from models.test_centre import TestCentre
from schemas.test import TestDateResponse, TestCentreResponse

from fastapi import HTTPException

from models.test_selection import ApplicantTestSelection
from models.city_preference import ApplicantCityPreference
from models.test_date import TestDate
from models.test_centre import TestCentre
from schemas.test_selection import TestSelectionCreate

from fastapi import File, UploadFile, HTTPException
from uuid import uuid4

from app.storage import supabase, BUCKET_NAME, test_storage
from models.document import ApplicantDocument

from models.education import ApplicantEducation
from models.test_date import TestDate
from models.city_preference import ApplicantCityPreference
from models.document import ApplicantDocument

from schemas.review import ReviewResponse
from app.security import hash_password
from sqlalchemy import or_
from app.security import verify_password
from fastapi import HTTPException

app = FastAPI(title="SLAT Registration API")


# NEW — shared guard for the DRAFT-editable / SUBMITTED-read-only lifecycle.
# Uses the existing Applicant.status field; no new status system.
def ensure_draft(applicant: Applicant):
    if applicant.status != "draft":
        raise HTTPException(
            status_code=409,
            detail="This application has already been submitted and can no longer be edited."
        )


@app.get("/")
def root():
    return {"message": "SLAT Registration API is running"}


@app.get("/db-test")
def db_test(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).scalar()

    return {
        "database": result
    }

@app.get("/users", response_model = list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()

    return users

@app.post("/users", response_model = UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    user = User(
        email=user_data.email,
        mobile_number=user_data.mobile_number,
        password_hash=hash_password(user_data.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user

@app.post("/login", response_model=UserResponse)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        or_(
            User.email == login_data.identifier,
            User.mobile_number == login_data.identifier
        )
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email/mobile or password"
        )

    if not user.password_hash or not verify_password(
        login_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email/mobile or password"
        )

    return user

@app.post("/applicants", response_model=ApplicantResponse)
def create_applicant(
    applicant_data: ApplicantCreate,
    db: Session = Depends(get_db)
):
    applicant = Applicant(
        user_id=applicant_data.user_id,
        full_name=applicant_data.full_name,
        date_of_birth=applicant_data.date_of_birth,
        country_code=applicant_data.country_code,
        mobile_number=applicant_data.mobile_number,
        category=applicant_data.category,
        is_nri=applicant_data.is_nri,
        nationality=applicant_data.nationality,
        status="draft" # status set by default as draft
    )

    db.add(applicant)
    db.commit()
    db.refresh(applicant)

    return applicant


# NEW — supports editing Personal Details from Review without creating a
# second applicant. Does not touch user_id or status.
@app.patch("/applicants/{applicant_id}", response_model=ApplicantResponse)
def update_applicant(
    applicant_id: int,
    applicant_data: ApplicantUpdate,
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(
        Applicant.id == applicant_id
    ).first()

    if not applicant:
        raise HTTPException(
            status_code=404,
            detail="Applicant not found"
        )

    ensure_draft(applicant)

    applicant.full_name = applicant_data.full_name
    applicant.date_of_birth = applicant_data.date_of_birth
    applicant.country_code = applicant_data.country_code
    applicant.mobile_number = applicant_data.mobile_number
    applicant.category = applicant_data.category
    applicant.is_nri = applicant_data.is_nri
    applicant.nationality = applicant_data.nationality

    db.commit()
    db.refresh(applicant)

    return applicant

@app.post(
    "/applicants/{applicant_id}/education",
    response_model=EducationResponse
)
def create_education(
    applicant_id: int,
    education_data: EducationCreate,
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(
        Applicant.id == applicant_id
    ).first()

    if not applicant:
        raise HTTPException(
            status_code=404,
            detail="Applicant not found"
        )

    ensure_draft(applicant)

    # CHANGED: was create-only, which violated the unique applicant_id
    # constraint on a second call. Now upserts — update the existing row
    # if one exists, otherwise create it. Endpoint path/method unchanged
    # so the frontend contract doesn't need to know which case happened.
    education = db.query(ApplicantEducation).filter(
        ApplicantEducation.applicant_id == applicant_id
    ).first()

    if education:
        education.educational_background = education_data.educational_background
    else:
        education = ApplicantEducation(
            applicant_id=applicant_id,
            educational_background=education_data.educational_background
        )
        db.add(education)

    db.commit()
    db.refresh(education)

    return education

@app.get(
    "/test-dates",
    response_model=list[TestDateResponse]
)
def get_test_dates(db: Session = Depends(get_db)):
    return (
        db.query(TestDate)
        .filter(TestDate.is_active == True)
        .order_by(TestDate.test_date)
        .all()
    )

@app.get(
    "/test-centres",
    response_model=list[TestCentreResponse]
)
def get_test_centres(
    state: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(TestCentre).filter(
        TestCentre.is_active == True
    )

    if state:
        query = query.filter(TestCentre.state == state)

    return query.order_by(TestCentre.city).all()

@app.post("/applicants/{applicant_id}/test-selection")
def save_test_selection(
    applicant_id: int,
    selection: TestSelectionCreate,
    db: Session = Depends(get_db)
):
    # 1. Check applicant
    applicant = db.query(Applicant).filter(
        Applicant.id == applicant_id
    ).first()

    if not applicant:
        raise HTTPException(
            status_code=404,
            detail="Applicant not found"
        )

    ensure_draft(applicant)

    # 2. Check test date
    test_date = db.query(TestDate).filter(
        TestDate.id == selection.test_date_id,
        TestDate.is_active == True
    ).first()

    if not test_date:
        raise HTTPException(
            status_code=404,
            detail="Test date not found or inactive"
        )

    # 3. Check number of preferences
    if not 1 <= len(selection.city_preferences) <= 3:
        raise HTTPException(
            status_code=400,
            detail="You must select between 1 and 3 city preferences"
        )

    # 4. Check ranks
    ranks = [p.preference_rank for p in selection.city_preferences]

    if sorted(ranks) != list(range(1, len(ranks) + 1)):
        raise HTTPException(
            status_code=400,
            detail="Preference ranks must be consecutive starting from 1"
        )

    # 5. Check duplicate centres
    centre_ids = [
        p.test_centre_id
        for p in selection.city_preferences
    ]

    if len(centre_ids) != len(set(centre_ids)):
        raise HTTPException(
            status_code=400,
            detail="The same city cannot be selected more than once"
        )

    # 6. Check centres exist and are active
    centres = db.query(TestCentre).filter(
        TestCentre.id.in_(centre_ids),
        TestCentre.is_active == True
    ).all()

    if len(centres) != len(centre_ids):
        raise HTTPException(
            status_code=400,
            detail="One or more selected cities are invalid"
        )

    # CHANGED: this call is now an upsert for the (applicant_id,
    # test_date_id) pair — saving Test 1 must never touch Test 2's rows,
    # and re-saving Test 1 must replace its old preferences, not add to
    # them. Delete any existing selection + preferences for this specific
    # test date only, then insert the new ones, all in one transaction.
    db.query(ApplicantCityPreference).filter(
        ApplicantCityPreference.applicant_id == applicant_id,
        ApplicantCityPreference.test_date_id == selection.test_date_id
    ).delete()

    db.query(ApplicantTestSelection).filter(
        ApplicantTestSelection.applicant_id == applicant_id,
        ApplicantTestSelection.test_date_id == selection.test_date_id
    ).delete()

    # 7. Save test selection
    test_selection = ApplicantTestSelection(
        applicant_id=applicant_id,
        test_date_id=selection.test_date_id
    )

    db.add(test_selection)

    # 8. Save city preferences
    for preference in selection.city_preferences:
        city_preference = ApplicantCityPreference(
            applicant_id=applicant_id,
            test_date_id=selection.test_date_id,
            test_centre_id=preference.test_centre_id,
            preference_rank=preference.preference_rank
        )

        db.add(city_preference)

    db.commit()

    return {
        "message": "Test preferences saved successfully"
    }


# NEW — supports deselecting a test date (Test Date editing). Deletes that
# date's preferences + selection row only; other test dates are untouched.
@app.delete("/applicants/{applicant_id}/test-selection/{test_date_id}")
def delete_test_selection(
    applicant_id: int,
    test_date_id: int,
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(
        Applicant.id == applicant_id
    ).first()

    if not applicant:
        raise HTTPException(
            status_code=404,
            detail="Applicant not found"
        )

    ensure_draft(applicant)

    selection = db.query(ApplicantTestSelection).filter(
        ApplicantTestSelection.applicant_id == applicant_id,
        ApplicantTestSelection.test_date_id == test_date_id
    ).first()

    if not selection:
        # Nothing to delete — not an error, just a no-op.
        return {"message": "No selection existed for this test date"}

    db.query(ApplicantCityPreference).filter(
        ApplicantCityPreference.applicant_id == applicant_id,
        ApplicantCityPreference.test_date_id == test_date_id
    ).delete()

    db.delete(selection)
    db.commit()

    return {"message": "Test date selection removed"}

@app.post("/applicants/{applicant_id}/documents")
async def upload_document(
    applicant_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Check applicant
    applicant = db.query(Applicant).filter(
        Applicant.id == applicant_id
    ).first()

    if not applicant:
        raise HTTPException(
            status_code=404,
            detail="Applicant not found"
        )

    ensure_draft(applicant)

    # Basic file validation
    allowed_types = {
        "image/jpeg",
        "image/png"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG and PNG images are allowed"
        )

    # Read file
    file_bytes = await file.read()

    # 2 MB limit
    if len(file_bytes) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size must be below 2 MB"
        )

    # CHANGED: replace any existing PHOTO instead of creating a second row.
    # Look up the current PHOTO (if any) BEFORE uploading the new file, so
    # we still have its storage path to clean up afterwards.
    existing_photo = db.query(ApplicantDocument).filter(
        ApplicantDocument.applicant_id == applicant_id,
        ApplicantDocument.document_type == "PHOTO"
    ).first()

    # Generate unique storage path
    extension = file.filename.split(".")[-1]
    file_path = f"{applicant_id}/{uuid4()}.{extension}"

    print(test_storage(supabase))

    # Upload new file to Supabase Storage first — if this fails, the old
    # photo (if any) is left untouched rather than deleted-then-failed.
    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            file_path,
            file_bytes,
            {
                "content-type": file.content_type
            }
        )
    except Exception as e:
        print("STORAGE ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail=f"Storage upload failed: {str(e)}"
        )

    # Now that the new file is safely uploaded, remove the old one (best
    # effort — a storage cleanup failure shouldn't block the replacement
    # from completing in the database).
    if existing_photo:
        try:
            supabase.storage.from_(BUCKET_NAME).remove([existing_photo.file_url])
        except Exception as e:
            print("STORAGE CLEANUP WARNING (old photo not removed):", repr(e))

        db.delete(existing_photo)

    # Save metadata in PostgreSQL
    document = ApplicantDocument(
        applicant_id=applicant_id,
        document_type="PHOTO",
        file_url=file_path,
        original_filename=file.filename,
        mime_type=file.content_type,
        file_size_bytes=len(file_bytes)
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "message": "Document uploaded successfully",
        "document_id": document.id,
        "document_type": document.document_type
    }


@app.get(
    "/applicants/{applicant_id}/review",
    response_model=ReviewResponse
)
def get_application_review(
    applicant_id: int,
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(
        Applicant.id == applicant_id
    ).first()

    if not applicant:
        raise HTTPException(
            status_code=404,
            detail="Applicant not found"
        )

    education = db.query(ApplicantEducation).filter(
        ApplicantEducation.applicant_id == applicant_id
    ).first()

    # CHANGED: was a single test_selection + flat city_preferences list.
    # Now fetch every selected test date for this applicant, and for each
    # one, only the preferences that belong to that (applicant, test_date)
    # pair — never mixing preferences across dates.
    test_selections = db.query(ApplicantTestSelection).filter(
        ApplicantTestSelection.applicant_id == applicant_id
    ).all()

    test_dates_out = []

    for test_selection in test_selections:
        test_date = db.query(TestDate).filter(
            TestDate.id == test_selection.test_date_id
        ).first()

        if not test_date:
            continue

        preferences = (
            db.query(
                ApplicantCityPreference,
                TestCentre
            )
            .join(
                TestCentre,
                ApplicantCityPreference.test_centre_id == TestCentre.id
            )
            .filter(
                ApplicantCityPreference.applicant_id == applicant_id,
                ApplicantCityPreference.test_date_id == test_selection.test_date_id
            )
            .order_by(ApplicantCityPreference.preference_rank)
            .all()
        )

        test_dates_out.append({
            "id": test_date.id,
            "test_name": test_date.test_name,
            "test_date": test_date.test_date,
            "city_preferences": [
                {
                    "preference_rank": preference.preference_rank,
                    "city": centre.city,
                    "state": centre.state
                }
                for preference, centre in preferences
            ]
        })

    documents = db.query(ApplicantDocument).filter(
        ApplicantDocument.applicant_id == applicant_id
    ).all()

    return {
        "personal": applicant,
        "education": education,
        "test_dates": test_dates_out,
        "documents": documents
    }