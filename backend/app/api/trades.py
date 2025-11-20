from fastapi import APIRouter

router = APIRouter()

@router.post("/")
def create_trade():
    return {"message": "Create trade"}

@router.get("/")
def list_trades():
    return {"message": "List trades"}
