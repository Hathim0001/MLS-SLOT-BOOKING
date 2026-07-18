from datetime import date, datetime, time, timedelta
from decimal import Decimal




def validate_booking_payload(payload, existing_bookings, exclude_id=None):
    start_time: time = payload["start_time"]
    booking_date: date = payload["booking_date"]
    duration_hours = Decimal(str(payload["duration_hours"]))

    if duration_hours < 0.5 or duration_hours > 24:
        raise ValueError("Duration must be between 0.5 and 24 hours")
    if (duration_hours * 2) != int(duration_hours * 2):
        raise ValueError("Duration must be in 0.5 hour increments")

    duration_minutes = int(duration_hours * 60)
    start_dt = datetime.combine(booking_date, start_time)
    end_dt = start_dt + timedelta(minutes=duration_minutes)

    if payload.get("payment_status") == "advance_paid" and Decimal(str(payload.get("amount_paid", 0))) <= 0:
        raise ValueError("Amount paid is required for advance payment bookings")

    for booking in existing_bookings:
        if exclude_id is not None and booking.get("id") == exclude_id:
            continue

        existing_booking_date = booking.get("booking_date")
        existing_start_dt = datetime.combine(existing_booking_date, booking["start_time"])
        existing_end_dt = datetime.combine(existing_booking_date, booking["end_time"])

        # If end wrapped past midnight, push it to next day
        if existing_end_dt <= existing_start_dt:
            existing_end_dt += timedelta(days=1)

        if start_dt < existing_end_dt and end_dt > existing_start_dt:
            raise ValueError("Booking overlaps an existing slot")

    end_time = end_dt.time()
    return {"end_time": end_time, "end_date": end_dt.date()}
