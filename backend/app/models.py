from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Integer, Numeric, String, Time

from .database import Base


class AdminUser(Base):
    __tablename__ = "admin_user"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True)
    booking_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    duration_hours = Column(Numeric(3, 1), nullable=False)
    payment_status = Column(String(20), nullable=False)
    amount_paid = Column(Numeric(10, 2), default=0)
    payment_method = Column(String(20), nullable=True)
    payer_name = Column(String(100), nullable=False)
    payer_number = Column(String(15), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
