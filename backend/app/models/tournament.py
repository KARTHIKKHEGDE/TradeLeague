from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean
from ..db import Base

class Tournament(Base):
    __tablename__ = "tournaments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    initial_balance = Column(Float)
    prize_pool = Column(Float, default=0)
    is_active = Column(Boolean, default=True)