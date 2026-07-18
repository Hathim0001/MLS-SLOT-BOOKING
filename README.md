# Slot Booking Admin System

A full-stack admin-only slot booking app with:

- FastAPI backend with SQLite and SQLAlchemy
- Hardcoded admin login for Hathim22 / Mashathim@22
- Booking CRUD with 0.5-hour duration validation and overlap protection
- Availability timeline for each date
- React + Vite + Tailwind frontend with a neon dark UI

## Run locally

Backend:

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

Then open http://localhost:5173
