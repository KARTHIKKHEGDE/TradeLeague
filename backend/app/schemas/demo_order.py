from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class DemoOrderCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    symbol: str  # e.g., "BTCUSDT"
    side: str  # "BUY" or "SELL"
    size: float  # Order size
    entry_price: Optional[float] = None  # Will be filled with current market price
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

class DemoOrderUpdate(BaseModel):
    current_price: Optional[float] = None
    pnl: Optional[float] = None
    status: Optional[str] = None
    close_price: Optional[float] = None
    closed_at: Optional[datetime] = None

class DemoOrderResponse(BaseModel):
    id: int
    user_id: int
    symbol: str
    side: str
    size: float
    entry_price: float
    current_price: Optional[float]
    stop_loss: Optional[float]
    take_profit: Optional[float]
    pnl: float
    status: str
    close_price: Optional[float]
    created_at: datetime
    closed_at: Optional[datetime]

    class Config:
        from_attributes = True