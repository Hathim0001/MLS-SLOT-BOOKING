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


def test_accepts_2hr_slot_starting_at_22():
    """A 2-hour booking starting at 22:00 should end at 00:00 next day and succeed."""
    payload = {
        "booking_date": date(2026, 7, 18),
        "start_time": time(22, 0),
        "duration_hours": Decimal("2.0"),
        "payment_status": "not_paid",
        "amount_paid": Decimal("0.00"),
        "payment_method": "cash",
        "payer_name": "Charlie",
        "payer_number": "1112223333",
    }

    result = validate_booking_payload(payload, [])

    assert result["end_time"] == time(0, 0)
    assert str(result["end_date"]) == "2026-07-19"


def test_accepts_overnight_booking_crossing_midnight():
    """A booking from 23:00 for 3 hours should end at 02:00 the next day."""
    payload = {
        "booking_date": date(2026, 7, 18),
        "start_time": time(23, 0),
        "duration_hours": Decimal("3.0"),
        "payment_status": "not_paid",
        "amount_paid": Decimal("0.00"),
        "payment_method": "cash",
        "payer_name": "Dave",
        "payer_number": "4445556666",
    }

    result = validate_booking_payload(payload, [])

    assert result["end_time"] == time(2, 0)
    assert str(result["end_date"]) == "2026-07-19"


def test_rejects_overlap_with_overnight_booking():
    """A new booking on next day at 01:00 should be blocked by an overnight booking from previous day."""
    overnight_booking = {
        "id": 10,
        "booking_date": date(2026, 7, 18),
        "start_time": time(23, 0),
        "end_time": time(2, 0),  # ends at 02:00 next day
    }
    payload = {
        "booking_date": date(2026, 7, 19),
        "start_time": time(1, 0),
        "duration_hours": Decimal("1.0"),
        "payment_status": "not_paid",
        "amount_paid": Decimal("0.00"),
        "payment_method": "cash",
        "payer_name": "Eve",
        "payer_number": "7778889999",
    }

    with pytest.raises(ValueError, match="overlaps"):
        validate_booking_payload(payload, [overnight_booking])
