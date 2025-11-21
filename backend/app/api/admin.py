from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db import get_db
from app.models.tournament import Tournament
from app.schemas.tournament import TournamentCreate, TournamentResponse
from app.api.dependencies import get_current_user, require_admin

router = APIRouter()

@router.get("/dashboard")
def admin_dashboard(current_user = Depends(require_admin)):
    """Admin dashboard endpoint"""
    return {
        "message": "Admin dashboard",
        "user_id": current_user.id,
        "username": current_user.username
    }

@router.post("/tournaments", response_model=TournamentResponse, dependencies=[Depends(require_admin)])
def create_tournament(
    tournament: TournamentCreate,
    db: Session = Depends(get_db)
):
    """Create a new tournament (admin only)"""
    
    # Validate dates
    if tournament.start_time >= tournament.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start time must be before end time"
        )
    
    new_tournament = Tournament(
        name=tournament.name,
        description=tournament.description,
        start_time=tournament.start_time,
        end_time=tournament.end_time,
        initial_balance=tournament.initial_balance,
        prize_pool=tournament.prize_pool,
        is_active=True
    )
    
    db.add(new_tournament)
    db.commit()
    db.refresh(new_tournament)
    
    return new_tournament

@router.get("/tournaments", response_model=List[TournamentResponse], dependencies=[Depends(require_admin)])
def list_all_tournaments(db: Session = Depends(get_db)):
    """List all tournaments (admin only)"""
    tournaments = db.query(Tournament).all()
    return tournaments

@router.delete("/tournaments/{tournament_id}", dependencies=[Depends(require_admin)])
def delete_tournament(tournament_id: int, db: Session = Depends(get_db)):
    """Delete a tournament (admin only)"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    
    if not tournament:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tournament not found"
        )
    
    db.delete(tournament)
    db.commit()
    
    return {"message": "Tournament deleted successfully"}