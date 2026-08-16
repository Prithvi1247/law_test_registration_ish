from fastapi import FastAPI, Depends
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
from sqlalchemy.exc import IntegrityError
from app.security import verify_password
from fastapi import HTTPException

from models.payment import Payment
from schemas.payment import PaymentInitiate, PaymentResponse, PaymentDashboardResponse, PaymentTestDateLine
from app.fees import TEST_FEE_INR, PROGRAMME_REGISTRATION_FEE_INR, calculate_amount_payable

from models.otp import UserOtp
from schemas.otp import SendOtpRequest, SendOtpResponse, VerifyOtpRequest
from app.otp import (
    generate_otp, otp_expiry, is_expired, send_otp_dev,
    RESEND_COOLDOWN_SECONDS, MAX_VERIFY_ATTEMPTS, OTP_TTL_SECONDS, DEV_EXPOSE_OTP
)
from datetime import datetime, timezone, timedelta

app = FastAPI(title="SLAT Registration API")


def ensure_draft(applicant: Applicant):
    if applicant.status != "draft":
        raise HTTPException(
            status_code=409,
            detail="This application has already been submitted and can no longer be edited."
        )


@app.get("/")
def root():
    return {"message": "SLAT Registration API is running"}


@app.post("/users", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists. Please log in instead."
        )

    if db.query(User).filter(User.mobile_number == user_data.mobile_number).first():
        raise HTTPException(
            status_code=409,
            detail="An account with this mobile number already exists. Please log in instead."
        )

    user = User(
        email=user_data.email,
        mobile_number=user_data.mobile_number,
        password_hash=hash_password(user_data.password)
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        constraint = str(getattr(exc.orig, "diag", None) and exc.orig.diag.constraint_name or "")

        if constraint == "users_email_key":
            detail = "An account with this email already exists. Please log in instead."
        elif constraint == "users_mobile_number_key":
            detail = "An account with this mobile number already exists. Please log in instead."
        else:
            detail = "An account with this email or mobile number already exists."

        raise HTTPException(status_code=409, detail=detail)

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
        raise HTTPException(status_code=401, detail="Invalid email/mobile or password")

    if not user.password_hash or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email/mobile or password")

    return user

@app.post("/users/send-otp", response_model=SendOtpResponse)
def send_otp(
    payload: SendOtpRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="This account is already verified.")

    # Resend cooldown — check the most recent OTP row for this user.
    last_otp = (
        db.query(UserOtp)
        .filter(UserOtp.user_id == user.id)
        .order_by(UserOtp.created_at.desc())
        .first()
    )
    if last_otp:
        created_at = last_otp.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        elapsed = (datetime.now(timezone.utc) - created_at).total_seconds()
        if elapsed < RESEND_COOLDOWN_SECONDS:
            wait = int(RESEND_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {wait} seconds before requesting another OTP."
            )

    otp = generate_otp()

    otp_row = UserOtp(
        user_id=user.id,
        otp_hash=hash_password(otp),  # reuses existing bcrypt hashing utility
        expires_at=otp_expiry(),
        is_used=False,
        attempt_count=0
    )
    db.add(otp_row)
    db.commit()

    send_otp_dev(otp, user.id)  # dev-only console log; real SMS/email provider plugs in here later

    return SendOtpResponse(
        message="OTP sent.",
        expires_in_seconds=OTP_TTL_SECONDS,
        dev_otp=otp if DEV_EXPOSE_OTP else None
    )


@app.post("/users/verify-otp", response_model=UserResponse)
def verify_otp(
    payload: VerifyOtpRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="This account is already verified.")

    otp_row = (
        db.query(UserOtp)
        .filter(UserOtp.user_id == user.id, UserOtp.is_used == False)
        .order_by(UserOtp.created_at.desc())
        .first()
    )

    if not otp_row:
        raise HTTPException(status_code=400, detail="No OTP was requested. Please request a new OTP.")

    if is_expired(otp_row.expires_at):
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if otp_row.attempt_count >= MAX_VERIFY_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Too many incorrect attempts. Please request a new OTP."
        )

    if not verify_password(payload.otp, otp_row.otp_hash):
        otp_row.attempt_count += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect OTP.")

    otp_row.is_used = True
    user.is_verified = True
    db.commit()
    db.refresh(user)

    return user


@app.get("/users/{user_id}/applicant", response_model=ApplicantResponse)
def get_user_applicant(
    user_id: int,
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(
        Applicant.user_id == user_id
    ).first()

    if not applicant:
        raise HTTPException(status_code=404, detail="No application found for this user.")

    return applicant

@app.post("/applicants", response_model=ApplicantResponse)
def create_applicant(
    applicant_data: ApplicantCreate,
    db: Session = Depends(get_db)
):
    existing_applicant = db.query(Applicant).filter(
        Applicant.user_id == applicant_data.user_id
    ).first()

    if existing_applicant:
        raise HTTPException(status_code=409, detail="An application already exists for this user.")

    # Mobile number is a USER-level, registered/verified field. Never trust
    # a mobile_number submitted in the payload — always use the value on
    # the user's own record so applicant and account can't diverge.
    owner = db.query(User).filter(User.id == applicant_data.user_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="User not found")

    applicant = Applicant(
        user_id=applicant_data.user_id,
        full_name=applicant_data.full_name,
        date_of_birth=applicant_data.date_of_birth,
        country_code=applicant_data.country_code,
        mobile_number=owner.mobile_number,
        category=applicant_data.category,
        is_nri=applicant_data.is_nri,
        nationality=applicant_data.nationality,
        status="draft"
    )

    db.add(applicant)
    db.commit()
    db.refresh(applicant)

    return applicant


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
        raise HTTPException(status_code=404, detail="Applicant not found")

    ensure_draft(applicant)

    owner = db.query(User).filter(User.id == applicant.user_id).first()

    applicant.full_name = applicant_data.full_name
    applicant.date_of_birth = applicant_data.date_of_birth
    applicant.country_code = applicant_data.country_code
    applicant.mobile_number = owner.mobile_number if owner else applicant_data.mobile_number
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
        raise HTTPException(status_code=404, detail="Applicant not found")

    ensure_draft(applicant)

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
    query = db.query(TestCentre).filter(TestCentre.is_active == True)

    if state:
        query = query.filter(TestCentre.state == state)

    return query.order_by(TestCentre.city).all()

@app.post("/applicants/{applicant_id}/test-selection")
def save_test_selection(
    applicant_id: int,
    selection: TestSelectionCreate,
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(
        Applicant.id == applicant_id
    ).first()

    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    ensure_draft(applicant)

    test_date = db.query(TestDate).filter(
        TestDate.id == selection.test_date_id,
        TestDate.is_active == True
    ).first()

    if not test_date:
        raise HTTPException(status_code=404, detail="Test date not found or inactive")

    if not 1 <= len(selection.city_preferences) <= 3:
        raise HTTPException(status_code=400, detail="You must select between 1 and 3 city preferences")

    ranks = [p.preference_rank for p in selection.city_preferences]

    if sorted(ranks) != list(range(1, len(ranks) + 1)):
        raise HTTPException(status_code=400, detail="Preference ranks must be consecutive starting from 1")

    centre_ids = [p.test_centre_id for p in selection.city_preferences]

    if len(centre_ids) != len(set(centre_ids)):
        raise HTTPException(status_code=400, detail="The same city cannot be selected more than once")

    centres = db.query(TestCentre).filter(
        TestCentre.id.in_(centre_ids),
        TestCentre.is_active == True
    ).all()

    if len(centres) != len(centre_ids):
        raise HTTPException(status_code=400, detail="One or more selected cities are invalid")

    db.query(ApplicantCityPreference).filter(
        ApplicantCityPreference.applicant_id == applicant_id,
        ApplicantCityPreference.test_date_id == selection.test_date_id
    ).delete()

    db.query(ApplicantTestSelection).filter(
        ApplicantTestSelection.applicant_id == applicant_id,
        ApplicantTestSelection.test_date_id == selection.test_date_id
    ).delete()

    test_selection = ApplicantTestSelection(
        applicant_id=applicant_id,
        test_date_id=selection.test_date_id
    )

    db.add(test_selection)

    for preference in selection.city_preferences:
        city_preference = ApplicantCityPreference(
            applicant_id=applicant_id,
            test_date_id=selection.test_date_id,
            test_centre_id=preference.test_centre_id,
            preference_rank=preference.preference_rank
        )

        db.add(city_preference)

    db.commit()

    return {"message": "Test preferences saved successfully"}


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
        raise HTTPException(status_code=404, detail="Applicant not found")

    ensure_draft(applicant)

    selection = db.query(ApplicantTestSelection).filter(
        ApplicantTestSelection.applicant_id == applicant_id,
        ApplicantTestSelection.test_date_id == test_date_id
    ).first()

    if not selection:
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
    applicant = db.query(Applicant).filter(
        Applicant.id == applicant_id
    ).first()

    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    ensure_draft(applicant)

    allowed_types = {"image/jpeg", "image/png"}

    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPG and PNG images are allowed")

    file_bytes = await file.read()

    if len(file_bytes) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be below 2 MB")

    existing_photo = db.query(ApplicantDocument).filter(
        ApplicantDocument.applicant_id == applicant_id,
        ApplicantDocument.document_type == "PHOTO"
    ).first()

    extension = file.filename.split(".")[-1]
    file_path = f"{applicant_id}/{uuid4()}.{extension}"

    print(test_storage(supabase))

    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            file_path,
            file_bytes,
            {"content-type": file.content_type}
        )
    except Exception as e:
        print("STORAGE ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    if existing_photo:
        try:
            supabase.storage.from_(BUCKET_NAME).remove([existing_photo.file_url])
        except Exception as e:
            print("STORAGE CLEANUP WARNING (old photo not removed):", repr(e))

        db.delete(existing_photo)

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
        raise HTTPException(status_code=404, detail="Applicant not found")

    education = db.query(ApplicantEducation).filter(
        ApplicantEducation.applicant_id == applicant_id
    ).first()

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
            db.query(ApplicantCityPreference, TestCentre)
            .join(TestCentre, ApplicantCityPreference.test_centre_id == TestCentre.id)
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

@app.post(
    "/applicants/{applicant_id}/submit",
    response_model=ApplicantResponse
)
def submit_application(
    applicant_id: int,
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(
        Applicant.id == applicant_id
    ).first()

    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    ensure_draft(applicant)

    missing = []

    education = db.query(ApplicantEducation).filter(
        ApplicantEducation.applicant_id == applicant_id
    ).first()
    if not education:
        missing.append("Education")

    test_selections = db.query(ApplicantTestSelection).filter(
        ApplicantTestSelection.applicant_id == applicant_id
    ).all()
    if not test_selections:
        missing.append("At least one test date")

    for selection in test_selections:
        preference_count = db.query(ApplicantCityPreference).filter(
            ApplicantCityPreference.applicant_id == applicant_id,
            ApplicantCityPreference.test_date_id == selection.test_date_id
        ).count()

        if preference_count == 0:
            test_date = db.query(TestDate).filter(
                TestDate.id == selection.test_date_id
            ).first()
            label = test_date.test_name if test_date else f"Test date {selection.test_date_id}"
            missing.append(f"Test centre preferences for {label}")

    photo = db.query(ApplicantDocument).filter(
        ApplicantDocument.applicant_id == applicant_id,
        ApplicantDocument.document_type == "PHOTO"
    ).first()
    if not photo:
        missing.append("Photo")

    if missing:
        raise HTTPException(
            status_code=400,
            detail={"message": "Application is incomplete.", "missing": missing}
        )

    applicant.status = "submitted"

    try:
        db.commit()
        db.refresh(applicant)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Application submission failed. Please try again.")

    return applicant


@app.get(
    "/applicants/{applicant_id}/payment",
    response_model=PaymentDashboardResponse
)
def get_payment_dashboard(
    applicant_id: int,
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(
        Applicant.id == applicant_id
    ).first()

    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    if applicant.status != "submitted":
        raise HTTPException(
            status_code=409,
            detail="Payment is available only after the application is submitted."
        )

    user = db.query(User).filter(User.id == applicant.user_id).first()

    test_selections = db.query(ApplicantTestSelection).filter(
        ApplicantTestSelection.applicant_id == applicant_id
    ).all()

    test_date_lines = []
    for selection in test_selections:
        test_date = db.query(TestDate).filter(TestDate.id == selection.test_date_id).first()
        if test_date:
            test_date_lines.append(PaymentTestDateLine(
                test_date_id=test_date.id,
                test_name=test_date.test_name,
                test_date=test_date.test_date,
                charges=TEST_FEE_INR
            ))

    amount_payable = calculate_amount_payable(len(test_date_lines))

    payment = db.query(Payment).filter(
        Payment.applicant_id == applicant_id
    ).order_by(Payment.created_at.desc()).first()

    return PaymentDashboardResponse(
        applicant_id=applicant.id,
        registration_id=applicant.registration_id,
        full_name=applicant.full_name,
        email=user.email if user else "",
        category=applicant.category,
        date_of_birth=applicant.date_of_birth,
        test_dates=test_date_lines,
        programme_registration_fee=PROGRAMME_REGISTRATION_FEE_INR,
        amount_payable=amount_payable,
        available_payment_methods=["BILLDESK", "EASEBUZZ", "DEMAND_DRAFT"],
        payment=payment
    )


@app.post(
    "/applicants/{applicant_id}/payment",
    response_model=PaymentResponse
)
def initiate_payment(
    applicant_id: int,
    payment_data: PaymentInitiate,
    db: Session = Depends(get_db)
):
    applicant = db.query(Applicant).filter(
        Applicant.id == applicant_id
    ).first()

    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    if applicant.status != "submitted":
        raise HTTPException(
            status_code=409,
            detail="Payment can only be started for a submitted application."
        )

    valid_methods = {"BILLDESK", "EASEBUZZ", "DEMAND_DRAFT"}
    if payment_data.payment_method not in valid_methods:
        raise HTTPException(
            status_code=400,
            detail=f"payment_method must be one of {sorted(valid_methods)}"
        )

    test_selections = db.query(ApplicantTestSelection).filter(
        ApplicantTestSelection.applicant_id == applicant_id
    ).all()
    amount = calculate_amount_payable(len(test_selections))

    payment = db.query(Payment).filter(
        Payment.applicant_id == applicant_id,
        Payment.payment_status == "PENDING"
    ).first()

    if payment:
        payment.payment_method = payment_data.payment_method
        payment.amount = amount
    else:
        payment = Payment(
            applicant_id=applicant_id,
            amount=amount,
            payment_method=payment_data.payment_method,
            payment_status="PENDING"
        )
        db.add(payment)

    db.commit()
    db.refresh(payment)

    return payment