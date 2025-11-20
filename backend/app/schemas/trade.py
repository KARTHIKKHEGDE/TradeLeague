from pydantic import BaseModel
from datetime import datetime

class TradeBase(BaseModel):
    symbol: str
    side: str
    quantity: float
    price: float

class TradeCreate(TradeBase):
    tournament_id: int

class TradeResponse(TradeBase):
    id: int
    user_id: int
    tournament_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True
