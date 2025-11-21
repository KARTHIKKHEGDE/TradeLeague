from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DemoWalletBase(BaseModel):
    balance: float
    currency: str = "USD"

class DemoWalletCreate(BaseModel):
    amount: float  # For deposit endpoint

class DemoWalletUpdate(BaseModel):
    balance: float

class DemoWalletResponse(BaseModel):
    id: int
    user_id: int
    balance: float
    currency: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True