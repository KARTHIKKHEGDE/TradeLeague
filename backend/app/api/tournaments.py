from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_tournaments():
    return {"message": "List tournaments"}

@router.get("/{tournament_id}")
def get_tournament(tournament_id: int):
    return {"message": f"Get tournament {tournament_id}"}
