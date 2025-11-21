from sqlalchemy.orm import Session
from datetime import datetime
from ..models.demo_wallet import DemoWallet
from ..models.demo_order import DemoOrder
from ..schemas.demo_order import DemoOrderCreate, DemoOrderResponse
from ..schemas.demo_wallet import DemoWalletResponse
from ..utils.logger import logger

class DemoTradingEngine:
    """
    Handles demo wallet and order management for simulated trading.
    """

    @staticmethod
    def get_or_create_wallet(db: Session, user_id: int) -> DemoWallet:
        """
        Get user's demo wallet or create one if it doesn't exist.
        Initial balance: $10,000
        """
        # First check if user exists
        from ..models.user import User
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} does not exist. Please login first.")
        
        wallet = db.query(DemoWallet).filter(DemoWallet.user_id == user_id).first()
        
        if not wallet:
            wallet = DemoWallet(
                user_id=user_id,
                balance=10000.0,
                currency="USD"
            )
            db.add(wallet)
            db.commit()
            db.refresh(wallet)
            logger.info(f"✅ Created demo wallet for user {user_id} with $10,000")
        
        return wallet

    @staticmethod
    def deposit(db: Session, user_id: int, amount: float) -> DemoWallet:
        """
        Deposit amount to user's demo wallet.
        """
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        
        wallet = DemoTradingEngine.get_or_create_wallet(db, user_id)
        wallet.balance += amount
        wallet.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(wallet)
        logger.info(f"💰 User {user_id} deposited ${amount}. New balance: ${wallet.balance}")
        
        return wallet

    @staticmethod
    def place_order(
        db: Session,
        user_id: int,
        symbol: str,
        side: str,
        size: float,
        entry_price: float,
        stop_loss: float = None,
        take_profit: float = None,
    ) -> DemoOrder:
        """
        Place a new demo order (BUY or SELL).
        
        Args:
            user_id: User ID
            symbol: Trading pair (e.g., "BTCUSDT")
            side: "BUY" or "SELL"
            size: Order size in units
            entry_price: Current market price (entry point)
            stop_loss: Optional stop-loss price
            take_profit: Optional take-profit price
        
        Returns:
            Created DemoOrder object
        """
        # Validate inputs
        if side not in ["BUY", "SELL"]:
            raise ValueError("Side must be 'BUY' or 'SELL'")
        if size <= 0:
            raise ValueError("Order size must be positive")
        
        # Get wallet and check balance
        wallet = DemoTradingEngine.get_or_create_wallet(db, user_id)
        order_cost = size * entry_price
        
        if wallet.balance < order_cost:
            raise ValueError(f"Insufficient balance. Need ${order_cost}, have ${wallet.balance}")
        
        # Deduct from wallet
        wallet.balance -= order_cost
        wallet.updated_at = datetime.utcnow()
        
        # Create order
        order = DemoOrder(
            user_id=user_id,
            symbol=symbol,
            side=side,
            size=size,
            entry_price=entry_price,
            current_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            pnl=0.0,
            status="OPEN",
        )
        
        db.add(order)
        db.commit()
        db.refresh(order)
        
        logger.info(
            f"📈 User {user_id} placed {side} order: {size} {symbol} @ ${entry_price}. "
            f"SL: ${stop_loss}, TP: ${take_profit}. Wallet balance: ${wallet.balance}"
        )
        
        return order

    @staticmethod
    def check_and_close_orders(db: Session, symbol: str, current_price: float) -> list:
        """
        Check all open orders for the given symbol.
        Close any that hit stop-loss or take-profit.
        
        Args:
            symbol: Trading pair (e.g., "BTCUSDT")
            current_price: Current market price
        
        Returns:
            List of closed orders
        """
        closed_orders = []
        open_orders = db.query(DemoOrder).filter(
            DemoOrder.symbol == symbol,
            DemoOrder.status == "OPEN"
        ).all()
        
        for order in open_orders:
            # Update current price and calculate P/L
            order.current_price = current_price
            order.pnl = DemoTradingEngine.calculate_pnl(order, current_price)
            
            should_close = False
            close_reason = None
            
            if order.side == "BUY":
                # BUY: profit when price goes up, loss when price goes down
                if order.take_profit and current_price >= order.take_profit:
                    should_close = True
                    close_reason = "TP_HIT"
                elif order.stop_loss and current_price <= order.stop_loss:
                    should_close = True
                    close_reason = "SL_HIT"
            
            elif order.side == "SELL":
                # SELL: profit when price goes down, loss when price goes up
                if order.take_profit and current_price <= order.take_profit:
                    should_close = True
                    close_reason = "TP_HIT"
                elif order.stop_loss and current_price >= order.stop_loss:
                    should_close = True
                    close_reason = "SL_HIT"
            
            if should_close:
                order.status = close_reason
                order.close_price = current_price
                order.closed_at = datetime.utcnow()
                
                # Update wallet: add back the proceeds
                wallet = DemoTradingEngine.get_or_create_wallet(db, order.user_id)
                proceeds = (order.size * current_price) + order.pnl
                wallet.balance += proceeds
                wallet.updated_at = datetime.utcnow()
                
                db.commit()
                db.refresh(order)
                db.refresh(wallet)
                
                closed_orders.append(order)
                logger.info(
                    f"🔴 Order {order.id} closed ({close_reason}). "
                    f"P/L: ${order.pnl}. User wallet: ${wallet.balance}"
                )
        
        return closed_orders

    @staticmethod
    def calculate_pnl(order: DemoOrder, current_price: float) -> float:
        """
        Calculate profit/loss for an order.
        
        For BUY: PnL = (current_price - entry_price) * size
        For SELL: PnL = (entry_price - current_price) * size
        """
        if order.side == "BUY":
            return (current_price - order.entry_price) * order.size
        elif order.side == "SELL":
            return (order.entry_price - current_price) * order.size
        return 0.0

    @staticmethod
    def get_user_orders(db: Session, user_id: int, status: str = None) -> list:
        """
        Get all orders for a user, optionally filtered by status.
        """
        query = db.query(DemoOrder).filter(DemoOrder.user_id == user_id)
        
        if status:
            query = query.filter(DemoOrder.status == status)
        
        return query.order_by(DemoOrder.created_at.desc()).all()

    @staticmethod
    def get_order_by_id(db: Session, order_id: int, user_id: int) -> DemoOrder:
        """
        Get a specific order by ID (user-scoped for security).
        """
        return db.query(DemoOrder).filter(
            DemoOrder.id == order_id,
            DemoOrder.user_id == user_id
        ).first()

    @staticmethod
    def close_order_manual(db: Session, order: DemoOrder, close_price: float) -> DemoOrder:
        """
        Manually close an open order at a specific price.
        Called when user clicks "Exit" button.
        """
        if order.status != "OPEN":
            raise ValueError(f"Cannot close order with status: {order.status}")
        
        # Calculate P/L
        pnl = DemoTradingEngine.calculate_pnl(order, close_price)
        
        # Update order
        order.status = "CLOSED"
        order.close_price = close_price
        order.pnl = pnl
        order.current_price = close_price
        order.closed_at = datetime.utcnow()
        
        # Update wallet
        wallet = DemoTradingEngine.get_or_create_wallet(db, order.user_id)
        proceeds = (order.size * close_price) + pnl
        wallet.balance += proceeds
        wallet.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(order)
        db.refresh(wallet)
        
        logger.info(f"🔴 Order {order.id} manually closed. Exit price: ${close_price}, PnL: ${pnl}")
        
        return order