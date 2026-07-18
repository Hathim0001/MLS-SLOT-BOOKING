from datetime import date, datetime, time
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class BookingBase(BaseModel):
    booking_date: date
    start_time: time
    duration_hours: Decimal = Field(..., ge=0.5, le=24)
    payment_status: str = "not_paid"
    amount_paid: Decimal = Decimal("0.00")
    payment_method: Optional[str] = None
    payer_name: str
    payer_number: str

    @field_validator("duration_hours")
    @classmethod
    def validate_duration(cls, value: Decimal) -> Decimal:
        if value < Decimal("0.5"):
            raise ValueError("Duration must be at least 0.5 hours")
        if value > 24:
            raise ValueError("Duration must be no more than 24 hours")
        if (value * 2) != int(value * 2):
            raise ValueError("Duration must be in 0.5 hour increments")
        return value


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BookingBase):
    pass


class BookingResponse(BookingBase):
    id: int
    end_time: time
    created_at: datetime
    updated_at: Optional[datetime] = None


class AvailabilitySlot(BaseModel):
    start: str
    end: str
    is_booked: bool
    booking_id: Optional[int] = None
    payer_name: Optional[str] = None


class AvailabilityResponse(BaseModel):
    date: date
    slots: list[AvailabilitySlot]
