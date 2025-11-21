"""
Async-compatible Binance WebSocket service
Uses websockets library directly to avoid event loop conflicts
"""
from binance.client import Client
from typing import Callable, Dict, Optional
import asyncio
import json
import websockets
from threading import Lock
from ..config import settings
from ..utils.logger import logger


class BinanceService:
    def __init__(self):
        self.client = Client(settings.BINANCE_API_KEY, settings.BINANCE_API_SECRET)
        
        # 📊 Cache latest prices for instant access
        self.latest_prices: Dict[str, float] = {}
        self.latest_ticker_data: Dict[str, dict] = {}
        
        # 🔒 Thread-safe locks for cache updates
        self._price_lock = Lock()
        self._ticker_lock = Lock()
        
        # Active WebSocket tasks
        self.active_tasks: Dict[str, asyncio.Task] = {}
        
        # WebSocket URL (Binance Spot Testnet or Mainnet)
        if settings.BINANCE_TESTNET:
            self.ws_url = "wss://testnet.binance.vision/ws"
        else:
            self.ws_url = "wss://stream.binance.com:9443/ws"
    
    def get_current_price(self, symbol: str) -> Optional[float]:
        """Get current price via REST API with fallback to cache"""
        try:
            ticker = self.client.get_symbol_ticker(symbol=symbol)
            price = float(ticker['price'])
            
            with self._price_lock:
                self.latest_prices[symbol] = price
            
            logger.info(f"✅ Fetched {symbol} price: ${price}")
            return price
        
        except Exception as e:
            logger.warning(f"Failed to fetch price for {symbol}: {e}. Using cached price.")
            # Return cached price if available
            with self._price_lock:
                if symbol in self.latest_prices:
                    return self.latest_prices[symbol]
            logger.error(f"❌ No cached price available for {symbol}")
            return None
    
    def get_klines(self, symbol: str, interval: str, limit: int = 100):
        """Get candlestick data via REST API"""
        return self.client.get_klines(symbol=symbol, interval=interval, limit=limit)
    
    def _update_price_cache(self, symbol: str, price: float):
        """Thread-safe price cache update"""
        with self._price_lock:
            self.latest_prices[symbol] = price
    
    async def subscribe_to_ticker(self, symbol: str, callback: Callable):
        """
        Subscribe to 24hr ticker updates (async-compatible)
        """
        symbol_lower = symbol.lower()
        stream_name = f"{symbol_lower}@ticker"
        
        if stream_name in self.active_tasks:
            logger.info(f"Already subscribed to {symbol}")
            return
        
        async def ticker_listener():
            url = f"{self.ws_url}/{stream_name}"
            logger.info(f"Connecting to Binance: {url}")
            
            try:
                async with websockets.connect(url) as ws:
                    logger.info(f"✅ Connected to Binance ticker for {symbol}")
                    
                    while True:
                        try:
                            message = await ws.recv()
                            data = json.loads(message)
                            
                            ticker_data = {
                                'symbol': data['s'],
                                'price': float(data['c']),
                                'open': float(data['o']),
                                'high': float(data['h']),
                                'low': float(data['l']),
                                'volume': float(data['v']),
                                'price_change': float(data['p']),
                                'price_change_percent': float(data['P']),
                                'timestamp': data['E']
                            }
                            
                            with self._price_lock:
                                self.latest_prices[data['s']] = ticker_data['price']
                            
                            with self._ticker_lock:
                                self.latest_ticker_data[data['s']] = ticker_data
                            
                            callback(ticker_data)
                        
                        except websockets.exceptions.ConnectionClosed:
                            logger.warning(f"Binance connection closed for {symbol}")
                            break
                        except Exception as e:
                            logger.error(f"Error processing ticker: {e}")
            
            except Exception as e:
                logger.error(f"Failed to connect to Binance: {e}")
                raise
        
        task = asyncio.create_task(ticker_listener())
        self.active_tasks[stream_name] = task
        logger.info(f"✅ Subscribed to TICKER for {symbol}")

    async def subscribe_to_trade(self, symbol: str, callback: Callable):
        """
        Subscribe to real-time trade ticks (EVERY executed trade)
        
        ⚡ MUCH FASTER - receives updates in milliseconds
        📈 Best for real-time trading
        """
        symbol_lower = symbol.lower()
        stream_name = f"{symbol_lower}@trade"
        
        if stream_name in self.active_tasks:
            logger.info(f"Already subscribed to {symbol}")
            return
        
        async def trade_listener():
            url = f"{self.ws_url}/{stream_name}"
            logger.info(f"Connecting to Binance trades: {url}")
            
            try:
                async with websockets.connect(url) as ws:
                    logger.info(f"✅ Connected to Binance TRADES for {symbol}")
                    
                    while True:
                        try:
                            message = await ws.recv()
                            data = json.loads(message)
                            
                            # Parse trade tick data
                            trade_data = {
                                'symbol': data['s'],
                                'price': float(data['p']),
                                'quantity': float(data['q']),
                                'timestamp': data['T'],
                                'is_buyer_maker': data['m'],
                                'trade_id': data['t']
                            }
                            
                            # Update cache
                            with self._price_lock:
                                self.latest_prices[data['s']] = trade_data['price']
                            
                            # Call callback
                            callback(trade_data)
                        
                        except websockets.exceptions.ConnectionClosed:
                            logger.warning(f"Binance connection closed for {symbol}")
                            break
                        except Exception as e:
                            logger.error(f"Error processing trade: {e}")
            
            except Exception as e:
                logger.error(f"Failed to connect to Binance trades: {e}")
                raise
        
        task = asyncio.create_task(trade_listener())
        self.active_tasks[stream_name] = task
        logger.info(f"✅ Subscribed to TRADE TICKS for {symbol}")