from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..api.dependencies import get_current_user
from ..models.user import User
from ..schemas.demo_wallet import DemoWalletCreate, DemoWalletResponse
from ..schemas.demo_order import DemoOrderCreate, DemoOrderResponse
from ..services.demo_trading_engine import DemoTradingEngine
from ..utils.logger import logger

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/wallet", response_model=DemoWalletResponse)
def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's demo wallet"""
    try:
        wallet = DemoTradingEngine.get_or_create_wallet(db, current_user.id)
        return wallet
    except Exception as e:
        logger.error(f"Error fetching wallet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/price")
def get_price(symbol: str = "BTCUSDT"):
    """Get current price for a symbol (no auth required for price feed)"""
    try:
        from ..services.binance_service import BinanceService
        binance = BinanceService()
        price = binance.get_current_price(symbol)
        
        if not price:
            raise HTTPException(status_code=400, detail=f"Could not fetch price for {symbol}")
        
        return {"symbol": symbol, "price": price}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching price: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/wallet/deposit", response_model=DemoWalletResponse)
def deposit_to_wallet(
    payload: DemoWalletCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deposit amount to demo wallet"""
    try:
        wallet = DemoTradingEngine.deposit(db, current_user.id, payload.amount)
        return wallet
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error depositing to wallet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/orders", response_model=DemoOrderResponse)
def place_order(
    order_data: DemoOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Place a new demo order"""
    try:
        logger.info(f"📋 Received order request: symbol={order_data.symbol}, side={order_data.side}, size={order_data.size}, sl={order_data.stop_loss}, tp={order_data.take_profit}")
        
        # Get current price from binance_service
        from ..services.binance_service import BinanceService
        binance = BinanceService()
        current_price = binance.get_current_price(order_data.symbol)
        
        if not current_price:
            logger.error(f"❌ Could not fetch price for {order_data.symbol}")
            raise HTTPException(status_code=400, detail=f"Could not fetch price for {order_data.symbol}. Please try again.")
        
        logger.info(f"💰 Current price: {current_price}")
        
        order = DemoTradingEngine.place_order(
            db=db,
            user_id=current_user.id,
            symbol=order_data.symbol,
            side=order_data.side,
            size=order_data.size,
            entry_price=current_price,
            stop_loss=order_data.stop_loss,
            take_profit=order_data.take_profit,
        )
        logger.info(f"✅ Order created: {order.id}")
        return order
    except ValueError as e:
        logger.error(f"❌ ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders", response_model=list[DemoOrderResponse])
def get_orders(
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's demo orders"""
    try:
        orders = DemoTradingEngine.get_user_orders(db, current_user.id, status)
        return orders
    except Exception as e:
        logger.error(f"Error fetching orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders/{order_id}", response_model=DemoOrderResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific demo order"""
    try:
        order = DemoTradingEngine.get_order_by_id(db, order_id, current_user.id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/orders/{order_id}/close", response_model=DemoOrderResponse)
def close_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually close an open order at current market price"""
    try:
        logger.info(f"🔴 User {current_user.id} requesting to close order {order_id}")
        
        # Get the order
        order = DemoTradingEngine.get_order_by_id(db, order_id, current_user.id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order.status != "OPEN":
            raise HTTPException(status_code=400, detail=f"Cannot close order with status: {order.status}")
        
        # Get current price
        from ..services.binance_service import BinanceService
        binance = BinanceService()
        current_price = binance.get_current_price(order.symbol)
        
        if not current_price:
            raise HTTPException(status_code=400, detail=f"Could not fetch current price for {order.symbol}")
        
        # Close the order
        closed_order = DemoTradingEngine.close_order_manual(db, order, current_price)
        logger.info(f"✅ Order {order_id} closed manually. PnL: ${closed_order.pnl}")
        
        return closed_order
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error closing order: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))