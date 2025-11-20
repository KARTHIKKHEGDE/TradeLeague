from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth, tournaments, trades, admin

app = FastAPI(title="Trading Tournament API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tournaments.router, prefix="/api/tournaments", tags=["tournaments"])
app.include_router(trades.router, prefix="/api/trades", tags=["trades"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.get("/")
def read_root():
    return {"message": "Trading Tournament API"}
