import redis
import json
from typing import List, Dict
from sqlalchemy.orm import Session
from ..models.user import User
from ..utils.logger import logger

class LeaderboardService:
    def __init__(self, redis_client: redis.Redis, db: Session):
        # Redis client (for fast leaderboard storage) and DB session
        self.redis = redis_client
        self.db = db
    
    def update_user_ranking(self, user_id: int, tournament_id: int):
        """
        FLOW:
        1. Calculate user's PNL using TradingEngine
        2. Store user's PNL inside Redis Sorted Set (leaderboard)
        3. Cache user's detailed PNL data for faster fetch
        """
        from .trading_engine import TradingEngine
        
        try:
            # STEP 1: Calculate user's PNL
            # TradingEngine receives DB + Redis
            engine = TradingEngine(self.db, self.redis)
            pnl_data = engine.calculate_pnl(user_id, tournament_id)
            
            # STEP 2: Update Redis Sorted Set (ZADD)
            # leaderboard key: tournament:<id>:leaderboard
            # score = PNL, member = user_id
            key = f"tournament:{tournament_id}:leaderboard"
            self.redis.zadd(key, {str(user_id): pnl_data['pnl']})
            
            # STEP 3: Cache full user PNL data for 5 minutes
            user_key = f"tournament:{tournament_id}:user:{user_id}"
            self.redis.setex(
                user_key,
                300,  # TTL = 5 mins
                json.dumps(pnl_data)
            )
            
            logger.info(f"Updated leaderboard for user {user_id} in tournament {tournament_id}")
            
        except Exception as e:
            logger.error(f"Error updating leaderboard: {str(e)}")
            raise
    
    def update_all_rankings(self, tournament_id: int):
        """
        FLOW:
        1. Fetch all users in the tournament
        2. For each user → call update_user_ranking
        3. If one user fails → continue others
        """
        from ..models.wallet import Wallet
        
        # STEP 1: Get all wallets = all participants
        wallets = self.db.query(Wallet).filter(
            Wallet.tournament_id == tournament_id
        ).all()
        
        logger.info(f"Updating {len(wallets)} users for tournament {tournament_id}")
        
        # STEP 2: Loop through each user
        for wallet in wallets:
            try:
                self.update_user_ranking(wallet.user_id, tournament_id)
            except Exception as e:
                logger.error(f"Failed to update user {wallet.user_id}: {str(e)}")
                continue
        
        logger.info(f"Leaderboard update complete for tournament {tournament_id}")
    
    def get_leaderboard(self, tournament_id: int, limit: int = 100) -> List[Dict]:
        """
        FLOW:
        1. Get top N users from Redis Sorted Set
        2. For each user → fetch cached pnl or recalc
        3. Attach username + pnl + rank
        """
        key = f"tournament:{tournament_id}:leaderboard"
        
        # STEP 1: Fetch top N users from Redis (highest first)
        results = self.redis.zrevrange(
            key,
            0,
            limit - 1,
            withscores=True
        )
        
        leaderboard = []
        
        # STEP 2: Build detailed list
        for rank, (user_id_bytes, pnl) in enumerate(results, start=1):
            user_id = int(user_id_bytes.decode('utf-8'))
            
            # Fetch user info from DB
            user = self.db.query(User).filter(User.id == user_id).first()
            
            if user:
                # Try redis cache for detailed pnl
                user_key = f"tournament:{tournament_id}:user:{user_id}"
                cached_data = self.redis.get(user_key)
                
                if cached_data:
                    pnl_data = json.loads(cached_data)
                else:
                    # If no cache → recalc
                    from .trading_engine import TradingEngine
                    engine = TradingEngine(self.db, self.redis)
                    pnl_data = engine.calculate_pnl(user_id, tournament_id)
                
                leaderboard.append({
                    "rank": rank,
                    "user_id": user.id,
                    "username": user.username,
                    "pnl": pnl,
                    "pnl_percentage": pnl_data.get('pnl_percentage', 0),
                    "portfolio_value": pnl_data.get('total_portfolio_value', 0)
                })
        
        return leaderboard
    
    def get_user_rank(self, user_id: int, tournament_id: int) -> Dict:
        """
        FLOW:
        1. Check user's rank from Redis (ZREVRANK)
        2. Fetch user's pnl
        3. Fetch total participants
        """
        key = f"tournament:{tournament_id}:leaderboard"
        
        # STEP 1: Get rank (0-indexed)
        rank = self.redis.zrevrank(key, str(user_id))
        
        if rank is None:
            return {"error": "User not found in leaderboard"}
        
        # STEP 2: Fetch PNL
        pnl = self.redis.zscore(key, str(user_id))
        
        # STEP 3: Count participants
        total_participants = self.redis.zcard(key)
        
        return {
            "user_id": user_id,
            "rank": rank + 1,
            "pnl": pnl,
            "total_participants": total_participants
        }