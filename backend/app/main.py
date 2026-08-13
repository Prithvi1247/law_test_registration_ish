from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from models.user import User
from schemas.user import UserResponse, UserCreate
from app.dependencies import get_db
from models.education import ApplicantEducation
from schemas.education import EducationCreate, EducationResponse
from models.applicant import Applicant
from schemas.applicant import ApplicantCreate, ApplicantResponse
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

app = FastAPI(title="SLAT Registration API")


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
    db : Session = Depends(get_db)
):
    user = User(
        email=user_data.email
    )

    db.add(user)
    db.commit()
    db.refresh(user)

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

@app.post(
    "/applicants/{applicant_id}/education",
    response_model=EducationResponse
)
def create_education(
    applicant_id: int,
    education_data: EducationCreate,
    db: Session = Depends(get_db)
):
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