# ------------------------------------------------------------
#  TOURNAMENT ROUTER
#
#  Handles all tournament-related features:
#    1. Admin creates tournament
#    2. List active tournaments
#    3. Get tournament details
#    4. User joins tournament
#    5. Show leaderboard
#    6. Show logged-in user's rank
#
#  All requests come from frontend → FastAPI → Database/Redis
# ------------------------------------------------------------

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import redis

from app.db import get_db
from app.models.user import User
from app.models.tournament import Tournament
from app.models.wallet import Wallet
from app.schemas.tournament import TournamentCreate, TournamentResponse
from app.api.dependencies import get_current_user, require_admin
from app.services.leaderboard import LeaderboardService
from app.config import settings

router = APIRouter()
redis_client = redis.from_url(settings.REDIS_URL)

# ------------------------------------------------------------
# 1. CREATE TOURNAMENT → POST /api/tournaments/
#
#  FLOW:
#   - Only admin can create
#   - Save tournament in DB
#   - Set initial balance + times
# ------------------------------------------------------------

@router.post("", response_model=TournamentResponse, dependencies=[Depends(require_admin)])
def create_tournament(
    tournament: TournamentCreate,
    db: Session = Depends(get_db)
):
    """Create a new tournament (admin only)"""

    # Step 1: Create DB row
    new_tournament = Tournament(
        name=tournament.name,
        start_time=tournament.start_time,
        end_time=tournament.end_time,
        initial_balance=tournament.initial_balance,
        is_active=True
    )

    # Step 2: Save to database
    db.add(new_tournament)
    db.commit()
    db.refresh(new_tournament)

    return new_tournament


# ------------------------------------------------------------
# 2. LIST ACTIVE TOURNAMENTS → GET /api/tournaments/
#
#  FLOW:
#   - Fetch tournaments where:
#         is_active = True
#         end_time is in the future
#   - Return list to frontend
# ------------------------------------------------------------

@router.get("", response_model=List[TournamentResponse])
def list_tournaments(db: Session = Depends(get_db)):
    """List all active tournaments"""

    tournaments = db.query(Tournament).filter(
        Tournament.is_active == True,
        Tournament.end_time > datetime.utcnow()
    ).all()

    return tournaments


# ------------------------------------------------------------
# 3. GET DETAILS OF ONE TOURNAMENT → GET /api/tournaments/{id}
#
#  FLOW:
#   - Used when user opens the tournament page
#   - Fetch tournament from DB
# ------------------------------------------------------------

@router.get("/{tournament_id}", response_model=TournamentResponse)
def get_tournament(tournament_id: int, db: Session = Depends(get_db)):
    """Get tournament details"""

    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()

    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )

    return tournament


# ------------------------------------------------------------
# 4. JOIN A TOURNAMENT → POST /api/tournaments/{id}/join
#
#  FLOW:
#   - Validate tournament exists
#   - Validate tournament is active and joinable
#   - Check if user already joined
#   - Create wallet row with initial balance
#   - Return success message
# ------------------------------------------------------------

@router.post("/{tournament_id}/join")
def join_tournament(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a tournament"""

    # Step 1: Check tournament exists
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()

    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )

    # Step 2: Ensure tournament is open
    if not tournament.is_active or tournament.start_time > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tournament is not open for joining"
        )

    # Step 3: Check if user already joined
    existing_wallet = db.query(Wallet).filter(
        Wallet.user_id == current_user.id,
        Wallet.tournament_id == tournament_id
    ).first()

    if existing_wallet:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already joined this tournament"
        )

    # Step 4: Create wallet with initial balance
    wallet = Wallet(
        user_id=current_user.id,
        tournament_id=tournament_id,
        balance=tournament.initial_balance
    )

    db.add(wallet)
    db.commit()

    return {
        "message": "Successfully joined tournament",
        "tournament_id": tournament_id,
        "initial_balance": tournament.initial_balance
    }


# ------------------------------------------------------------
# 5. TOURNAMENT LEADERBOARD → GET /api/tournaments/{id}/leaderboard
#
#  FLOW:
#   - Leaderboard is stored in Redis sorted set
#   - LeaderboardService:
#         redis.zrevrange() → top PNL
#         fill user details (name, pnl %, positions)
# ------------------------------------------------------------

@router.get("/{tournament_id}/leaderboard")
def get_leaderboard(
    tournament_id: int,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get tournament leaderboard"""

    leaderboard_service = LeaderboardService(redis_client, db)
    leaderboard = leaderboard_service.get_leaderboard(tournament_id, limit)

    return {
        "tournament_id": tournament_id,
        "leaderboard": leaderboard
    }


# ------------------------------------------------------------
# 6. GET LOGGED-IN USER'S RANK → GET /api/tournaments/{id}/my-rank
#
#  FLOW:
#   - Redis keeps score (PNL) for each user
#   - redis.zrevrank → gives rank
#   - redis.zscore → gives PNL
# ------------------------------------------------------------

@router.get("/{tournament_id}/my-rank")
def get_my_rank(
    tournament_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's rank in tournament"""

    leaderboard_service = LeaderboardService(redis_client, db)
    rank_data = leaderboard_service.get_user_rank(current_user.id, tournament_id)

    return rank_data
