from sqlalchemy import Column, Integer, Float, ForeignKey, String
from app.db import Base

class Position(Base):
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    symbol = Column(String)
    quantity = Column(Float)
    average_price = Column(Float)