import redis
import asyncio
from .manager import manager

class StreamHandler:
    def __init__(self, redis_url: str):
        self.redis_client = redis.from_url(redis_url)
    
    async def subscribe_to_updates(self):
        """Subscribe to Redis and broadcast to WebSocket clients"""
        pubsub = self.redis_client.pubsub()
        pubsub.subscribe('market_updates')
        
        for message in pubsub.listen():
            if message['type'] == 'message':
                await manager.broadcast(message['data'])
