from datetime import date, datetime
from pydantic import BaseModel,ConfigDict


class PaymentInitiate(BaseModel):
    payment_method: str  # "BILLDESK" | "EASEBUZZ" | "DEMAND_DRAFT"


class PaymentTestDateLine(BaseModel):
    test_date_id: int
    test_name: str
    test_date: date
    charges: int


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    applicant_id: int
    amount: int
    payment_method: str | None
    payment_status: str
    reference_id: str | None
    created_at: datetime
    updated_at: datetime


class PaymentDashboardResponse(BaseModel):
    applicant_id: int
    registration_id: str | None
    full_name: str
    email: str
    category: str
    date_of_birth: date
    test_dates: list[PaymentTestDateLine]
    programme_registration_fee: int
    amount_payable: int
    available_payment_methods: list[str]
    payment: PaymentResponse | None