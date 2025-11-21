from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..db import Base

class DemoOrder(Base):
    __tablename__ = "demo_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    symbol = Column(String, index=True)  # e.g., "BTCUSDT"
    side = Column(String)  # "BUY" or "SELL"
    size = Column(Float)  # Order size in units
    entry_price = Column(Float)  # Price at which order was placed
    current_price = Column(Float, nullable=True)  # Last known price
    stop_loss = Column(Float, nullable=True)  # Stop loss price
    take_profit = Column(Float, nullable=True)  # Take profit price
    pnl = Column(Float, default=0.0)  # Profit/Loss
    status = Column(String, default="OPEN")  # "OPEN", "CLOSED", "SL_HIT", "TP_HIT"
    close_price = Column(Float, nullable=True)  # Price at which order was closed
    created_at = Column(DateTime, server_default=func.now(), index=True)
    closed_at = Column(DateTime, nullable=True)