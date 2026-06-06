from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import Employee

router = APIRouter(prefix="/role", tags=["role"])


@router.get("/{telegram_id}")
async def get_user_role(telegram_id: int, db: AsyncSession = Depends(get_db)):
    emp = await db.scalar(select(Employee).where(Employee.telegram_id == telegram_id))
    return {"role": "staff" if emp else "user"}
