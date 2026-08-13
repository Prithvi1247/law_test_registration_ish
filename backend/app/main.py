from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.dependencies import get_db

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