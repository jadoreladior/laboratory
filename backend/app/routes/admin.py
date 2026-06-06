import csv
import io
import os
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Booking, BookingStatus, Employee, User
from ..schemas import EmployeeCreate, EmployeeOut

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "change-me-in-production")
OWNER_PIN = os.getenv("OWNER_PIN", "1234")


def _check_secret(x_admin_secret: str):
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(403, "Forbidden")


# ─── PIN ──────────────────────────────────────────────────────────────────────

class PinRequest(BaseModel):
    pin: str


@router.post("/owner/verify")
async def verify_owner_pin(body: PinRequest, x_admin_secret: str = Header(...)):
    _check_secret(x_admin_secret)
    if body.pin != OWNER_PIN:
        raise HTTPException(403, "Invalid PIN")
    return {"ok": True}


# ─── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_admin_stats(x_admin_secret: str = Header(...), db: AsyncSession = Depends(get_db)):
    _check_secret(x_admin_secret)

    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    today_str = today.isoformat()
    week_str = week_ago.isoformat()
    month_str = month_ago.isoformat()

    non_cancelled = Booking.status != BookingStatus.cancelled

    def rev_query(from_date: str | None = None):
        q = select(func.coalesce(func.sum(Booking.total_price), 0)).where(non_cancelled)
        if from_date:
            q = q.where(Booking.booking_date >= from_date)
        return q

    revenue_today = await db.scalar(rev_query(today_str).where(Booking.booking_date == today_str))
    revenue_week = await db.scalar(rev_query(week_str))
    revenue_month = await db.scalar(rev_query(month_str))
    revenue_total = await db.scalar(rev_query())

    total_clients = await db.scalar(
        select(func.count(func.distinct(Booking.user_id))).where(non_cancelled)
    )

    # By studio
    studio_rows = (await db.execute(
        select(Booking.studio_id, func.count(), func.coalesce(func.sum(Booking.total_price), 0))
        .where(non_cancelled)
        .group_by(Booking.studio_id)
    )).all()
    by_studio = [{"id": r[0], "count": r[1], "revenue": r[2]} for r in studio_rows]

    # By service (top 10)
    service_rows = (await db.execute(
        select(Booking.service_title, func.count(), func.coalesce(func.sum(Booking.total_price), 0))
        .where(non_cancelled)
        .group_by(Booking.service_title)
        .order_by(func.count().desc())
        .limit(10)
    )).all()
    by_service = [{"title": r[0], "count": r[1], "revenue": r[2]} for r in service_rows]

    # Peak hours
    hour_rows = (await db.execute(
        select(func.substr(Booking.booking_time, 1, 2), func.count())
        .group_by(func.substr(Booking.booking_time, 1, 2))
        .order_by(func.substr(Booking.booking_time, 1, 2))
    )).all()
    peak_hours = [{"hour": int(r[0]), "count": r[1]} for r in hour_rows]

    # Daily revenue (last 30 days)
    daily_rows = (await db.execute(
        select(Booking.booking_date, func.count(), func.coalesce(func.sum(Booking.total_price), 0))
        .where(non_cancelled, Booking.booking_date >= month_str)
        .group_by(Booking.booking_date)
        .order_by(Booking.booking_date)
    )).all()
    daily = [{"date": r[0], "count": r[1], "revenue": r[2]} for r in daily_rows]

    # Status counts
    status_rows = (await db.execute(
        select(Booking.status, func.count()).group_by(Booking.status)
    )).all()
    statuses = {r[0].value: r[1] for r in status_rows}

    return {
        "revenue": {
            "today": revenue_today,
            "week": revenue_week,
            "month": revenue_month,
            "total": revenue_total,
        },
        "total_clients": total_clients,
        "by_studio": by_studio,
        "by_service": by_service,
        "peak_hours": peak_hours,
        "daily": daily,
        "statuses": statuses,
    }


# ─── Employees ────────────────────────────────────────────────────────────────

@router.get("/employees", response_model=list[EmployeeOut])
async def list_employees(x_admin_secret: str = Header(...), db: AsyncSession = Depends(get_db)):
    _check_secret(x_admin_secret)
    rows = await db.scalars(select(Employee).order_by(Employee.created_at))
    return rows.all()


@router.post("/employees", response_model=EmployeeOut)
async def create_employee(body: EmployeeCreate, x_admin_secret: str = Header(...), db: AsyncSession = Depends(get_db)):
    _check_secret(x_admin_secret)
    emp = Employee(**body.model_dump())
    db.add(emp)
    await db.commit()
    await db.refresh(emp)
    return emp


@router.put("/employees/{emp_id}", response_model=EmployeeOut)
async def update_employee(emp_id: int, body: EmployeeCreate, x_admin_secret: str = Header(...), db: AsyncSession = Depends(get_db)):
    _check_secret(x_admin_secret)
    emp = await db.get(Employee, emp_id)
    if not emp:
        raise HTTPException(404, "Employee not found")
    for k, v in body.model_dump().items():
        setattr(emp, k, v)
    await db.commit()
    await db.refresh(emp)
    return emp


@router.delete("/employees/{emp_id}", status_code=204)
async def delete_employee(emp_id: int, x_admin_secret: str = Header(...), db: AsyncSession = Depends(get_db)):
    _check_secret(x_admin_secret)
    emp = await db.get(Employee, emp_id)
    if not emp:
        raise HTTPException(404, "Employee not found")
    await db.delete(emp)
    await db.commit()


# ─── Export ───────────────────────────────────────────────────────────────────

def _csv_response(rows: list[list], headers: list[str], filename: str) -> StreamingResponse:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(headers)
    w.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue().encode("utf-8-sig")]),  # utf-8-sig for Excel compatibility
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/bookings")
async def export_bookings(db: AsyncSession = Depends(get_db)):
    result = (await db.execute(
        select(Booking, User)
        .join(User, Booking.user_id == User.id)
        .order_by(Booking.booking_date, Booking.booking_time)
    )).all()

    rows = []
    for b, u in result:
        name = f"{u.first_name} {u.last_name or ''}".strip()
        rows.append([
            b.id, name, u.username or "", u.telegram_id,
            b.studio_id, b.service_title, b.booking_date, b.booking_time,
            b.duration_hours, b.total_price, b.prepay_amount, b.status.value,
            b.created_at.strftime("%Y-%m-%d %H:%M"),
        ])

    return _csv_response(rows, [
        "ID", "Клиент", "Username", "Telegram ID",
        "Студия", "Услуга", "Дата", "Время",
        "Длительность (ч)", "Сумма ₽", "Предоплата ₽", "Статус",
        "Создана",
    ], "bookings.csv")


@router.get("/export/financial")
async def export_financial(db: AsyncSession = Depends(get_db)):
    result = await db.scalars(
        select(Booking)
        .where(Booking.status != BookingStatus.cancelled)
        .order_by(Booking.booking_date, Booking.booking_time)
    )

    rows = [
        [b.booking_date, b.studio_id, b.service_title,
         b.duration_hours, b.total_price, b.prepay_amount, b.status.value]
        for b in result.all()
    ]

    return _csv_response(rows, [
        "Дата", "Студия", "Услуга", "Длительность (ч)",
        "Выручка ₽", "Предоплата ₽", "Статус",
    ], "financial.csv")
