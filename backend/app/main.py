import os
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Annotated

import bcrypt
import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .models import AdminUser, Booking
from .schemas import (
    AvailabilityResponse,
    AvailabilitySlot,
    BookingCreate,
    BookingResponse,
    BookingUpdate,
    LoginRequest,
    TokenResponse,
)
from .services import validate_booking_payload

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Slot Booking Admin API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
ALGORITHM = "HS256"


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_admin_user() -> None:
    with SessionLocal() as db:
        existing = db.query(AdminUser).filter(AdminUser.username == "Hathim22").first()
        if existing is None:
            db.add(AdminUser(username="Hathim22", password_hash=hash_password("Mashathim@22")))
            db.commit()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(username: str) -> str:
    payload = {"sub": username, "exp": datetime.utcnow() + timedelta(hours=8)}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def get_current_username(authorization: Annotated[str | None, Header()] = None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except Exception as exc:  # pragma: no cover - defensive branch
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    return payload["sub"]


def booking_to_response(booking: Booking) -> BookingResponse:
    return BookingResponse(
        id=booking.id,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        duration_hours=float(booking.duration_hours),
        payment_status=booking.payment_status,
        amount_paid=float(booking.amount_paid),
        payment_method=booking.payment_method,
        payer_name=booking.payer_name,
        payer_number=booking.payer_number,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


def booking_to_payload(booking: Booking) -> dict:
    return {
        "id": booking.id,
        "booking_date": booking.booking_date,
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "duration_hours": Decimal(str(booking.duration_hours)),
        "payment_status": booking.payment_status,
        "amount_paid": Decimal(str(booking.amount_paid)),
        "payment_method": booking.payment_method,
        "payer_name": booking.payer_name,
        "payer_number": booking.payer_number,
    }


def format_time(value: time) -> str:
    return value.strftime("%H:%M")


def time_to_minutes(value: time) -> int:
    return value.hour * 60 + value.minute


seed_admin_user()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(AdminUser).filter(AdminUser.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user.username)
    return TokenResponse(access_token=token)


@app.get("/api/bookings", response_model=list[BookingResponse])
def list_bookings(
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
) -> list[BookingResponse]:
    del username
    query = db.query(Booking)
    if date_from is not None:
        query = query.filter(Booking.booking_date >= date_from)
    if date_to is not None:
        query = query.filter(Booking.booking_date <= date_to)

    bookings = query.order_by(Booking.booking_date.asc(), Booking.start_time.asc()).all()
    return [booking_to_response(booking) for booking in bookings]


@app.get("/api/bookings/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
) -> BookingResponse:
    del username
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking_to_response(booking)


@app.post("/api/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
) -> BookingResponse:
    del username
    existing_bookings = [booking_to_payload(booking) for booking in db.query(Booking).all()]
    validation = validate_booking_payload(payload.model_dump(), existing_bookings)

    booking = Booking(
        booking_date=payload.booking_date,
        start_time=payload.start_time,
        end_time=validation["end_time"],
        duration_hours=payload.duration_hours,
        payment_status=payload.payment_status,
        amount_paid=payload.amount_paid,
        payment_method=payload.payment_method,
        payer_name=payload.payer_name,
        payer_number=payload.payer_number,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking_to_response(booking)


@app.put("/api/bookings/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    payload: BookingUpdate,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
) -> BookingResponse:
    del username
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    existing_bookings = [booking_to_payload(existing) for existing in db.query(Booking).filter(Booking.id != booking_id).all()]
    validation = validate_booking_payload(payload.model_dump(), existing_bookings, exclude_id=booking_id)

    booking.booking_date = payload.booking_date
    booking.start_time = payload.start_time
    booking.end_time = validation["end_time"]
    booking.duration_hours = payload.duration_hours
    booking.payment_status = payload.payment_status
    booking.amount_paid = payload.amount_paid
    booking.payment_method = payload.payment_method
    booking.payer_name = payload.payer_name
    booking.payer_number = payload.payer_number
    booking.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(booking)
    return booking_to_response(booking)


@app.delete("/api/bookings/{booking_id}")
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
) -> dict[str, str]:
    del username
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    db.delete(booking)
    db.commit()
    return {"message": "Booking deleted"}


@app.get("/api/availability", response_model=AvailabilityResponse)
def availability(
    booking_date: Annotated[date, Query(alias="date")],
    db: Session = Depends(get_db),
    username: str = Depends(get_current_username),
) -> AvailabilityResponse:
    del username
    prev_date = booking_date - timedelta(days=1)
    # Fetch bookings for both the requested date and the previous day
    # (a booking starting yesterday may span into today)
    bookings = (
        db.query(Booking)
        .filter(Booking.booking_date.in_([prev_date, booking_date]))
        .order_by(Booking.booking_date.asc(), Booking.start_time.asc())
        .all()
    )

    base_dt = datetime.combine(booking_date, time(0, 0))

    slots: list[AvailabilitySlot] = []
    for offset in range(48):
        slot_start_dt = base_dt + timedelta(minutes=offset * 30)
        slot_end_dt = slot_start_dt + timedelta(minutes=30)
        is_booked = False
        booking_id: int | None = None
        payer_name: str | None = None
        for booking in bookings:
            b_start_dt = datetime.combine(booking.booking_date, booking.start_time)
            b_end_dt = datetime.combine(booking.booking_date, booking.end_time)
            # If end wrapped past midnight, push it to next calendar day
            if b_end_dt <= b_start_dt:
                b_end_dt += timedelta(days=1)
            if slot_start_dt < b_end_dt and slot_end_dt > b_start_dt:
                is_booked = True
                booking_id = booking.id
                payer_name = booking.payer_name
                break
        slots.append(
            AvailabilitySlot(
                start=slot_start_dt.strftime("%H:%M"),
                end=slot_end_dt.strftime("%H:%M"),
                is_booked=is_booked,
                booking_id=booking_id,
                payer_name=payer_name,
            )
        )

    return AvailabilityResponse(date=booking_date, slots=slots)
