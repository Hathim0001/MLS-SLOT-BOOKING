from datetime import date, time
from decimal import Decimal


def _to_minutes(value: time) -> int:
    return value.hour * 60 + value.minute


def _to_time(minutes: int) -> time:
    hour, minute = divmod(minutes, 60)
    return time(hour, minute)


def validate_booking_payload(payload, existing_bookings, exclude_id=None):
    start_time = payload["start_time"]
    duration_hours = Decimal(str(payload["duration_hours"]))

    if duration_hours < 1 or duration_hours > 24:
        raise ValueError("Duration must be between 1 and 24 hours")
    if (duration_hours * 2) != int(duration_hours * 2):
        raise ValueError("Duration must be in 0.5 hour increments")

    duration_minutes = int(duration_hours * 60)
    start_minutes = _to_minutes(start_time)
    end_minutes = start_minutes + duration_minutes

    if end_minutes > 24 * 60:
        raise ValueError("Booking cannot exceed the 24-hour window")

    if payload.get("payment_status") == "advance_paid" and Decimal(str(payload.get("amount_paid", 0))) <= 0:
        raise ValueError("Amount paid is required for advance payment bookings")

    for booking in existing_bookings:
        booking_date = booking.get("booking_date")
        if booking_date != payload.get("booking_date"):
            continue
        if exclude_id is not None and booking.get("id") == exclude_id:
            continue

        existing_start = _to_minutes(booking["start_time"])
        existing_end = _to_minutes(booking["end_time"])
        if start_minutes < existing_end and end_minutes > existing_start:
            raise ValueError("Booking overlaps an existing slot")

    return {"end_time": _to_time(end_minutes)}
