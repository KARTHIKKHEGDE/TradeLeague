from fastapi import WebSocket
import json
from typing import Dict
from .manager import manager
from ..services.binance_service import BinanceService
from ..services.leaderboard import LeaderboardService
from ..utils.logger import logger
import redis
from ..config import settings
import asyncio

# -------------------------
# Initialize services
# -------------------------
binance_service = BinanceService()
redis_client = redis.from_url(settings.REDIS_URL)

# Track active Binance subscriptions to avoid duplicates
_active_binance_subs = set()
# Store the main event loop for cross-thread scheduling
_main_loop = None
async def handle_websocket_message(websocket: WebSocket, user_id: int, message: dict):
    """
    Flow Summary:
    1. Receives a JSON message from a client via WebSocket.
    2. Determines message type.
    3. Performs action based on type (subscribe, fetch leaderboard, fetch price, ping).
    4. Sends response back to client using ConnectionManager.
    """
    # Store the main event loop on first message
    global _main_loop
    if _main_loop is None:
        _main_loop = asyncio.get_running_loop()
    message_type = message.get("type")
    logger.info(f"📨 Received message from user {user_id}: {message_type}")
    
    # -------------------------
    # Subscribe to a tournament
    # -------------------------
    if message_type == "subscribe_tournament":
        tournament_id = message.get("tournament_id")
        
        # Add user to tournament subscription set
        manager.subscribe_to_tournament(user_id, tournament_id)
        
        # Send confirmation back to client
        await manager.send_personal_message({
            "type": "subscription_confirmed",
            "channel": f"tournament_{tournament_id}",
            "message": f"Subscribed to tournament {tournament_id}"
        }, user_id)
    
    # -------------------------
    # Subscribe to symbol price updates
    # -------------------------
    elif message_type == "subscribe_symbol":
        symbol = message.get("symbol", "BTCUSDT")
        
        # Add user to symbol subscription set
        manager.subscribe_to_symbol(user_id, symbol)
        
        # Start Binance stream for this symbol if not already active
        if symbol not in _active_binance_subs:
            def price_callback(price_data):
                """
                Callback for Binance TRADE updates.
                Receives EVERY trade execution in real-time.
                """
                if _main_loop and not _main_loop.is_closed():
                    asyncio.run_coroutine_threadsafe(
                        manager.broadcast_price_update(symbol, price_data),
                        _main_loop
                    )
                else:
                    logger.warning(f"Cannot broadcast - main loop unavailable for {symbol}")
            
            # Use Binance ticker for UI-friendly updates (~1/sec)
            # Use Binance ticker for UI-friendly updates (~1/sec)
            try:
                await binance_service.subscribe_to_trade(symbol, price_callback)
                _active_binance_subs.add(symbol)
                logger.info(f"🚀 Started Binance stream for {symbol}")
            except Exception as e:
                logger.error(f"Failed to subscribe to Binance: {e}")
                await manager.send_personal_message({
                    "type": "error",
                    "message": f"Failed to subscribe to {symbol}: {str(e)}"
                }, user_id)
                return
            
        # Send confirmation back to client
        await manager.send_personal_message({
            "type": "subscription_confirmed",
            "channel": f"price_{symbol}",
            "message": f"Subscribed to {symbol} price updates"
        }, user_id)
    
    # -------------------------
    # Fetch current leaderboard
    # -------------------------
    elif message_type == "get_leaderboard":
        tournament_id = message.get("tournament_id")
        
        # Create a new DB session
        from sqlalchemy.orm import Session
        from ..db import SessionLocal
        db = SessionLocal()
        
        try:
            leaderboard_service = LeaderboardService(redis_client, db)
            
            # Fetch top 100 leaderboard entries
            leaderboard = leaderboard_service.get_leaderboard(tournament_id, limit=100)
            
            # Send leaderboard to client
            await manager.send_personal_message({
                "type": "leaderboard_data",
                "tournament_id": tournament_id,
                "data": leaderboard
            }, user_id)
        except Exception as e:
            logger.error(f"Error fetching leaderboard: {e}")
            await manager.send_personal_message({
                "type": "error",
                "message": f"Failed to fetch leaderboard: {str(e)}"
            }, user_id)
        finally:
            db.close()
    
    # -------------------------
    # Fetch current price for a symbol (on-demand)
    # -------------------------
    elif message_type == "get_price":
        symbol = message.get("symbol", "BTCUSDT")
        try:
            # Get current price from BinanceService (cache first, REST fallback)
            price = binance_service.get_current_price(symbol)
            
            # Send price back to client
            await manager.send_personal_message({
                "type": "price_data",
                "symbol": symbol,
                "price": price
            }, user_id)
        except Exception as e:
            logger.error(f"Error fetching price: {e}")
            await manager.send_personal_message({
                "type": "error",
                "message": f"Failed to fetch price: {str(e)}"
            }, user_id)
    
    # -------------------------
    # Heartbeat / ping
    # -------------------------
    elif message_type == "ping":
        await manager.send_personal_message({
            "type": "pong",
            "timestamp": message.get("timestamp")
        }, user_id)
    
    # -------------------------
    # Unknown message type
    # -------------------------
    else:
        logger.warning(f"⚠️ Unknown message type: {message_type}")
        await manager.send_personal_message({
            "type": "error",
            "message": f"Unknown message type: {message_type}"
        }, user_id)