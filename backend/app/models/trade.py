from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from ..db import Base

class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    symbol = Column(String)
    side = Column(String)  # BUY or SELL
    quantity = Column(Float)
    price = Column(Float)
    timestamp = Column(DateTime)
