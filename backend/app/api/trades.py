# ------------------------------------------------------------
#  TRADES ROUTER → Handles:
#   1. Executing trades  (BUY / SELL)
#   2. Returning trade history
#   3. Calculating user PNL
#
#  This file is used by frontend when user:
#   - Clicks BUY
#   - Clicks SELL
#   - Opens trade history
#   - Views dashboard PNL
# ------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import redis

from app.db import get_db
from app.models.user import User
from app.models.trade import Trade
from app.api.dependencies import get_current_user
from app.services.trading_engine import TradingEngine
from app.config import settings

router = APIRouter()

# ------------------------------------------------------------
# Pydantic REQUEST & RESPONSE MODELS
# These define how data enters and leaves this API
# ------------------------------------------------------------

class TradeRequest(BaseModel):
    tournament_id: int
    symbol: str
    side: str      # BUY or SELL
    quantity: float


class TradeResponse(BaseModel):
    success: bool
    trade_id: int
    symbol: str
    side: str
    quantity: float
    price: float
    total_value: float
    new_balance: float
    message: str = "Trade executed successfully"


class PNLResponse(BaseModel):
    user_id: int
    tournament_id: int
    cash_balance: float
    positions_value: float
    total_portfolio_value: float
    pnl: float
    pnl_percentage: float
    positions: List[dict]

# ------------------------------------------------------------
# REDIS CLIENT
# - Used by trading engine to store:
#     - Leaderboards
#     - Cached prices
#     - Cached PNL results
# ------------------------------------------------------------

redis_client = redis.from_url(settings.REDIS_URL)

# ------------------------------------------------------------
# 1. EXECUTE A TRADE → POST /api/trades/
#
# 🔥 COMPLETE FLOW:
#   Frontend → POST → /api/trades/
#   ↓
#   FastAPI validates body (Pydantic)
#   ↓
#   FastAPI validates user (JWT token)
#   ↓
#   Create TradingEngine()
#   ↓
#   engine.execute_trade()
#   ↓
#   Save trade in DB
#   ↓
#   Update wallet balance
#   ↓
#   Update redis leaderboard
#   ↓
#   Return TradeResponse to frontend
# ------------------------------------------------------------

@router.post("", response_model=TradeResponse)
def create_trade(
    trade_request: TradeRequest,
    current_user: User = Depends(get_current_user),   # verifies JWT token
    db: Session = Depends(get_db)                     # opens DB session
):
    """Execute a trade (BUY or SELL)"""

    try:
        # ----------------------------------------------
        # Step 1: Validate BUY/SELL input
        # ----------------------------------------------
        if trade_request.side.upper() not in ["BUY", "SELL"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Side must be 'BUY' or 'SELL'"
            )

        # ----------------------------------------------
        # Step 2: Validate quantity
        # ----------------------------------------------
        if trade_request.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be positive"
            )

        # ----------------------------------------------
        # Step 3: Call TradingEngine to execute trade
        # TradingEngine handles:
        #   - Fetching live price
        #   - Checking balance
        #   - Updating positions
        #   - Writing trade to DB
        #   - Updating leaderboard
        # ----------------------------------------------
        engine = TradingEngine(db, redis_client)
        result = engine.execute_trade(
            user_id=current_user.id,
            tournament_id=trade_request.tournament_id,
            symbol=trade_request.symbol.upper(),
            side=trade_request.side.upper(),
            quantity=trade_request.quantity
        )

        # ----------------------------------------------
        # Step 4: Return a clean response to frontend
        # ----------------------------------------------
        return TradeResponse(**result)

    except ValueError as e:
        # engine throws ValueError for user mistakes
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except Exception as e:
        # Unknown system problem
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trade execution failed: {str(e)}"
        )

# ------------------------------------------------------------
# 2. TRADE HISTORY → GET /api/trades/history
#
# 🔥 COMPLETE FLOW:
#   Frontend → GET → /api/trades/history?tournament_id=X
#   ↓
#   Validate JWT user
#   ↓
#   Query all trades for that tournament
#   ↓
#   Convert DB objects → JSON list
#   ↓
#   Return to frontend
# ------------------------------------------------------------

@router.get("/history")
def get_trade_history(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's trade history for a tournament"""

    # Step 1: Fetch trades from database
    trades = db.query(Trade).filter(
        Trade.user_id == current_user.id,
        Trade.tournament_id == tournament_id
    ).order_by(Trade.timestamp.desc()).all()

    # Step 2: Convert DB model → JSON dict
    return {
        "trades": [
            {
                "id": trade.id,
                "symbol": trade.symbol,
                "side": trade.side,
                "quantity": trade.quantity,
                "price": trade.price,
                "total_value": trade.quantity * trade.price,
                "timestamp": trade.timestamp.isoformat()
            }
            for trade in trades
        ]
    }


# ------------------------------------------------------------
# 3. PNL CALCULATION → GET /api/trades/pnl
#
# 🔥 COMPLETE FLOW:
#   Frontend → GET → /api/trades/pnl?tournament_id=X
#   ↓
#   Validate JWT user
#   ↓
#   TradingEngine.calculate_pnl():
#        - Reads wallet cash
#        - Reads positions
#        - Fetches latest price (from Redis or API)
#        - Calculates total value
#        - Calculates PNL + % return
#   ↓
#   Returns PNLResponse
# ------------------------------------------------------------

@router.get("/pnl", response_model=PNLResponse)
def get_pnl(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current PNL and portfolio value"""

    try:
        # Calculate PNL using trading engine
        engine = TradingEngine(db, redis_client)
        pnl_data = engine.calculate_pnl(current_user.id, tournament_id)

        # Return clean response
        return PNLResponse(**pnl_data)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
