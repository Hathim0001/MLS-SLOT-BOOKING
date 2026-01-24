from datetime import date, time
from decimal import Decimal

import pytest

from app.services import validate_booking_payload


def test_accepts_valid_half_hour_increment():
    payload = {
        "booking_date": date(2026, 7, 16),
        "start_time": time(10, 0),
        "duration_hours": Decimal("1.5"),
        "payment_status": "advance_paid",
        "amount_paid": Decimal("100.00"),
        "payment_method": "gpay_number",
        "payer_name": "Alice",
        "payer_number": "1234567890",
    }

    validation = validate_booking_payload(payload, [])

    assert validation["end_time"] == time(11, 30)


def test_rejects_overlapping_booking():
    payload = {
        "booking_date": date(2026, 7, 16),
        "start_time": time(10, 30),
        "duration_hours": Decimal("1.0"),
        "payment_status": "not_paid",
        "amount_paid": Decimal("0.00"),
        "payment_method": "cash",
        "payer_name": "Bob",
        "payer_number": "0987654321",
    }
    existing_bookings = [
        {
            "booking_date": date(2026, 7, 16),
            "start_time": time(10, 0),
            "end_time": time(11, 0),
        }
    ]

    with pytest.raises(ValueError):
        validate_booking_payload(payload, existing_bookings)
