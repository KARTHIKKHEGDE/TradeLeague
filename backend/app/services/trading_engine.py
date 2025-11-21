from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Dict, Optional
import redis
import json
from ..models.trade import Trade
from ..models.position import Position
from ..models.wallet import Wallet
from ..models.user import User
from ..models.tournament import Tournament
from ..services.binance_service import BinanceService
from ..utils.logger import logger

class TradingEngine:
    def __init__(self, db: Session, redis_client: redis.Redis):
        self.db = db
        self.redis = redis_client
        self.binance = BinanceService()
    
    def execute_trade(
        self, 
        user_id: int, 
        tournament_id: int, 
        symbol: str, 
        side: str, 
        quantity: float
    ) -> Dict:
        """
        Execute a trade and update user positions
        
        Flow:
        1. Get current market price from Binance
        2. Check if user has sufficient balance
        3. Begin database transaction
        4. Create trade record
        5. Update or create position
        6. Update wallet balance
        7. Commit transaction
        8. Publish update to Redis (for WebSocket)
        9. Update leaderboard
        """
        
        try:
            # Step 1: Get current price
            current_price = self.binance.get_current_price(symbol)
            logger.info(f"Current price for {symbol}: {current_price}")
            
            # Step 2: Calculate trade value
            trade_value = quantity * current_price
            
            # Step 3: Get user's wallet
            wallet = self.db.query(Wallet).filter(
                Wallet.user_id == user_id,
                Wallet.tournament_id == tournament_id
            ).first()
            
            if not wallet:
                raise ValueError("User not enrolled in this tournament")
            
            # Step 4: Check balance (for BUY orders)
            if side.upper() == "BUY":
                if wallet.balance < trade_value:
                    raise ValueError(
                        f"Insufficient balance. Required: {trade_value}, Available: {wallet.balance}"
                    )
            
            # Step 5: For SELL, check if user has the position
            if side.upper() == "SELL":
                position = self.db.query(Position).filter(
                    Position.user_id == user_id,
                    Position.tournament_id == tournament_id,
                    Position.symbol == symbol
                ).first()
                
                if not position or position.quantity < quantity:
                    available = position.quantity if position else 0
                    raise ValueError(
                        f"Insufficient position. Required: {quantity}, Available: {available}"
                    )
            
            # Step 6: Begin transaction
            try:
                # Create trade record
                new_trade = Trade(
                    user_id=user_id,
                    tournament_id=tournament_id,
                    symbol=symbol,
                    side=side.upper(),
                    quantity=quantity,
                    price=current_price,
                    timestamp=datetime.utcnow()
                )
                self.db.add(new_trade)
                
                # Update position
                if side.upper() == "BUY":
                    self._handle_buy(user_id, tournament_id, symbol, quantity, current_price)
                    # Deduct from wallet
                    wallet.balance -= trade_value
                else:  # SELL
                    self._handle_sell(user_id, tournament_id, symbol, quantity, current_price)
                    # Add to wallet
                    wallet.balance += trade_value
                
                # Commit all changes
                self.db.commit()
                self.db.refresh(new_trade)
                
                logger.info(f"Trade executed: {side} {quantity} {symbol} @ {current_price}")
                
                # Step 7: Publish to Redis for real-time updates
                self._publish_trade_update(user_id, tournament_id, new_trade, wallet.balance)
                
                # Step 8: Update leaderboard
                from .leaderboard import LeaderboardService
                leaderboard_service = LeaderboardService(self.redis, self.db)
                leaderboard_service.update_user_ranking(user_id, tournament_id)
                
                return {
                    "success": True,
                    "trade_id": new_trade.id,
                    "symbol": symbol,
                    "side": side.upper(),
                    "quantity": quantity,
                    "price": current_price,
                    "total_value": trade_value,
                    "new_balance": wallet.balance,
                    "timestamp": new_trade.timestamp.isoformat()
                }
                
            except Exception as e:
                self.db.rollback()
                logger.error(f"Trade execution failed: {str(e)}")
                raise
                
        except Exception as e:
            logger.error(f"Error in execute_trade: {str(e)}")
            raise ValueError(str(e))
    
    def _handle_buy(self, user_id: int, tournament_id: int, symbol: str, quantity: float, price: float):
        """Handle BUY order - update or create position"""
        position = self.db.query(Position).filter(
            Position.user_id == user_id,
            Position.tournament_id == tournament_id,
            Position.symbol == symbol
        ).first()
        
        if position:
            # Calculate weighted average price
            total_quantity = position.quantity + quantity
            total_cost = (position.quantity * position.average_price) + (quantity * price)
            new_average_price = total_cost / total_quantity
            
            position.quantity = total_quantity
            position.average_price = new_average_price
            logger.info(f"Updated position: {symbol}, new qty: {total_quantity}, avg price: {new_average_price}")
        else:
            # Create new position
            new_position = Position(
                user_id=user_id,
                tournament_id=tournament_id,
                symbol=symbol,
                quantity=quantity,
                average_price=price
            )
            self.db.add(new_position)
            logger.info(f"Created new position: {symbol}, qty: {quantity}, price: {price}")
    
    def _handle_sell(self, user_id: int, tournament_id: int, symbol: str, quantity: float, price: float):
        """Handle SELL order - reduce or remove position"""
        position = self.db.query(Position).filter(
            Position.user_id == user_id,
            Position.tournament_id == tournament_id,
            Position.symbol == symbol
        ).first()
        
        if position.quantity == quantity:
            # Sell entire position
            self.db.delete(position)
            logger.info(f"Closed position: {symbol}")
        else:
            # Partial sell - reduce quantity but keep average price
            position.quantity -= quantity
            logger.info(f"Reduced position: {symbol}, remaining qty: {position.quantity}")
    
    def _publish_trade_update(self, user_id: int, tournament_id: int, trade: Trade, new_balance: float):
        """Publish trade update to Redis for WebSocket broadcast"""
        message = {
            "type": "trade_executed",
            "user_id": user_id,
            "tournament_id": tournament_id,
            "trade": {
                "id": trade.id,
                "symbol": trade.symbol,
                "side": trade.side,
                "quantity": trade.quantity,
                "price": trade.price,
                "timestamp": trade.timestamp.isoformat()
            },
            "new_balance": new_balance
        }
        
        # Publish to tournament-specific channel
        self.redis.publish(f'tournament:{tournament_id}:trades', json.dumps(message))
        logger.info(f"Published trade update to Redis")
    
    def calculate_pnl(self, user_id: int, tournament_id: int) -> Dict:
        """
        Calculate profit and loss for a user in a tournament
        
        Returns:
        - cash_balance: Available cash
        - positions_value: Current value of all positions
        - total_value: Portfolio value (cash + positions)
        - pnl: Profit/loss (total_value - initial_balance)
        - pnl_percentage: PNL as percentage
        """
        
        # Get wallet
        wallet = self.db.query(Wallet).filter(
            Wallet.user_id == user_id,
            Wallet.tournament_id == tournament_id
        ).first()
        
        if not wallet:
            raise ValueError("Wallet not found")
        
        cash_balance = wallet.balance
        
        # Get all positions
        positions = self.db.query(Position).filter(
            Position.user_id == user_id,
            Position.tournament_id == tournament_id
        ).all()
        
        # Calculate current value of positions
        total_position_value = 0
        position_details = []
        
        for position in positions:
            current_price = self.binance.get_current_price(position.symbol)
            position_value = position.quantity * current_price
            unrealized_pnl = (current_price - position.average_price) * position.quantity
            
            total_position_value += position_value
            position_details.append({
                "symbol": position.symbol,
                "quantity": position.quantity,
                "average_price": position.average_price,
                "current_price": current_price,
                "current_value": position_value,
                "unrealized_pnl": unrealized_pnl
            })
        
        # Get tournament initial balance
        tournament = self.db.query(Tournament).filter(
            Tournament.id == tournament_id
        ).first()
        
        initial_balance = tournament.initial_balance if tournament else 10000.0
        
        # Calculate totals
        total_portfolio_value = cash_balance + total_position_value
        pnl = total_portfolio_value - initial_balance
        pnl_percentage = (pnl / initial_balance) * 100 if initial_balance > 0 else 0
        
        return {
            "user_id": user_id,
            "tournament_id": tournament_id,
            "cash_balance": cash_balance,
            "positions_value": total_position_value,
            "total_portfolio_value": total_portfolio_value,
            "initial_balance": initial_balance,
            "pnl": pnl,
            "pnl_percentage": pnl_percentage,
            "positions": position_details
        }