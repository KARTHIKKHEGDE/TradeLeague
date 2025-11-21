from fastapi import WebSocket
from typing import Dict, List, Set
import json
import asyncio
from ..utils.logger import logger

class ConnectionManager:
    def __init__(self):
        # -------------------------
        # Stores all active WebSocket connections by user_id
        # {user_id: WebSocket}
        # -------------------------
        self.active_connections: Dict[int, WebSocket] = {}
        
        # -------------------------
        # Tracks which users are subscribed to each tournament
        # {tournament_id: set(user_ids)}
        # -------------------------
        self.tournament_subscriptions: Dict[int, Set[int]] = {}
        
        # -------------------------
        # Tracks which users are subscribed to each symbol
        # {symbol: set(user_ids)}
        # -------------------------
        self.symbol_subscriptions: Dict[str, Set[int]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """
        Flow:
        1. Accepts WebSocket connection from user.
        2. Stores the connection in active_connections.
        3. User can now receive personal messages or broadcast updates.
        """
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"✅ User {user_id} connected via WebSocket")
    
    def disconnect(self, user_id: int):
        """
        Flow:
        1. Removes user's WebSocket connection.
        2. Cleans up user subscriptions to tournaments and symbols.
        3. Ensures no further messages are sent to disconnected user.
        """
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            
            # Remove user from tournament subscriptions
            for tournament_id, subscribers in self.tournament_subscriptions.items():
                subscribers.discard(user_id)
            
            # Remove user from symbol subscriptions
            for symbol, subscribers in self.symbol_subscriptions.items():
                subscribers.discard(user_id)
            
            logger.info(f"❌ User {user_id} disconnected")
    
    def subscribe_to_tournament(self, user_id: int, tournament_id: int):
        """
        Flow:
        1. Adds user to the set of subscribers for a tournament.
        2. When a leaderboard or trade update occurs, only these users receive it.
        """
        if tournament_id not in self.tournament_subscriptions:
            self.tournament_subscriptions[tournament_id] = set()
        
        self.tournament_subscriptions[tournament_id].add(user_id)
        logger.info(f"🏆 User {user_id} subscribed to tournament {tournament_id}")
    
    def subscribe_to_symbol(self, user_id: int, symbol: str):
        """
        Flow:
        1. Adds user to the set of subscribers for a symbol.
        2. When a price update occurs for this symbol, only subscribed users are notified.
        """
        if symbol not in self.symbol_subscriptions:
            self.symbol_subscriptions[symbol] = set()
        
        self.symbol_subscriptions[symbol].add(user_id)
        logger.info(f"📊 User {user_id} subscribed to {symbol}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """
        Flow:
        1. Sends a JSON message to a specific user's WebSocket.
        2. Handles exceptions and disconnects user if WebSocket is invalid.
        """
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                self.disconnect(user_id)
    
    async def broadcast_to_tournament(self, message: dict, tournament_id: int):
        """
        Flow:
        1. Iterates over all users subscribed to a tournament.
        2. Sends each user the provided message using send_personal_message().
        """
        if tournament_id in self.tournament_subscriptions:
            subscribers = self.tournament_subscriptions[tournament_id].copy()
            
            for user_id in subscribers:
                await self.send_personal_message(message, user_id)
    
    async def broadcast_price_update(self, symbol: str, price_data: dict):
        """
        Flow:
        1. Checks which users are subscribed to the symbol.
        2. Constructs a price update message.
        3. Broadcasts it to all subscribed users.
        """
        if symbol in self.symbol_subscriptions:
            subscribers = self.symbol_subscriptions[symbol].copy()
            
            message = {
                "type": "price_update",
                "data": price_data
            }
            
            for user_id in subscribers:
                await self.send_personal_message(message, user_id)
    
    async def broadcast_leaderboard_update(self, tournament_id: int, leaderboard_data: list):
        """
        Flow:
        1. Creates a leaderboard_update message.
        2. Uses broadcast_to_tournament() to send it to all tournament subscribers.
        """
        message = {
            "type": "leaderboard_update",
            "tournament_id": tournament_id,
            "data": leaderboard_data
        }
        
        await self.broadcast_to_tournament(message, tournament_id)
    
    async def broadcast_trade_executed(self, tournament_id: int, trade_data: dict):
        """
        Flow:
        1. Creates a trade_executed message.
        2. Sends it to all subscribers of the tournament.
        """
        message = {
            "type": "trade_executed",
            "tournament_id": tournament_id,
            "data": trade_data
        }
        
        await self.broadcast_to_tournament(message, tournament_id)
    
    # -------------------------
    # Utility methods for metrics
    # -------------------------
    def get_connection_count(self) -> int:
        """Returns number of active WebSocket connections"""
        return len(self.active_connections)
    
    def get_tournament_subscribers(self, tournament_id: int) -> int:
        """Returns number of subscribers for a tournament"""
        if tournament_id in self.tournament_subscriptions:
            return len(self.tournament_subscriptions[tournament_id])
        return 0
    
    def get_symbol_subscribers(self, symbol: str) -> int:
        """Returns number of subscribers for a symbol"""
        if symbol in self.symbol_subscriptions:
            return len(self.symbol_subscriptions[symbol])
        return 0

# -------------------------
# Global singleton instance
# -------------------------
manager = ConnectionManager()
