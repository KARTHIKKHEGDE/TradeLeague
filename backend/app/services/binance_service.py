from binance.client import Client
from ..config import settings

class BinanceService:
    def __init__(self):
        self.client = Client(settings.BINANCE_API_KEY, settings.BINANCE_API_SECRET)
    
    def get_current_price(self, symbol: str):
        """Get current price for a symbol"""
        ticker = self.client.get_symbol_ticker(symbol=symbol)
        return float(ticker['price'])
    
    def get_klines(self, symbol: str, interval: str, limit: int = 100):
        """Get candlestick data"""
        return self.client.get_klines(symbol=symbol, interval=interval, limit=limit)
