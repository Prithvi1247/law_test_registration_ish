from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from models.user import User
from schemas.user import UserResponse, UserCreate
from app.dependencies import get_db

from models.applicant import Applicant
from schemas.applicant import ApplicantCreate, ApplicantResponse

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