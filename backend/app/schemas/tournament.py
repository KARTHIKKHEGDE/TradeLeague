from pydantic import BaseModel
from datetime import datetime

class TournamentBase(BaseModel):
    name: str
    description: str = ""
    start_time: datetime
    end_time: datetime
    initial_balance: float
    prize_pool: float = 0

class TournamentCreate(TournamentBase):
    pass

class TournamentResponse(TournamentBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True