from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from .api import auth, tournaments, trades, admin, candles
from .websocket.manager import manager
from .websocket import handlers
from .api.dependencies import get_current_user
from .models.user import User
import json
from .utils.logger import logger  
from .api import demo_trading


app = FastAPI(
    title="Trading Tournament API",
    redirect_slashes=False
)

# -------------------------
# CORS middleware (allow all origins)
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Exception handler for validation errors
# -------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Log validation errors for debugging"""
    logger.error(f"❌ Validation Error on {request.method} {request.url.path}")
    logger.error(f"   Errors: {exc.errors()}")
    logger.error(f"   Body: {await request.body()}")
    return JSONResponse(
        status_code=400,
        content={
            "detail": "Invalid request format",
            "errors": exc.errors()
        },
    )

# -------------------------
# Include API routers
# -------------------------
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tournaments.router, prefix="/api/tournaments", tags=["tournaments"])
app.include_router(trades.router, prefix="/api/trades", tags=["trades"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(demo_trading.router, prefix="/api/demo-trading", tags=["demo-trading"])
app.include_router(candles.router, prefix="/api/candles", tags=["candles"])

# -------------------------
# Root endpoint
# -------------------------
@app.get("/")
def read_root():
    return {"message": "Trading Tournament API"}

# -------------------------
# WebSocket statistics
# -------------------------
@app.get("/stats")
def get_stats():
    """
    Return statistics about active WebSocket connections
    including subscribers per tournament and symbol
    """
    return {
        "active_connections": manager.get_connection_count(),
        "tournament_subscriptions": {
            tid: manager.get_tournament_subscribers(tid)
            for tid in manager.tournament_subscriptions.keys()
        },
        "symbol_subscriptions": {
            symbol: manager.get_symbol_subscribers(symbol)
            for symbol in manager.symbol_subscriptions.keys()
        }
    }

# -------------------------
# WebSocket endpoint
# -------------------------
@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    """
    Flow Summary:
    1. Client connects using JWT token: ws://<host>/ws?token=<JWT>
    2. Token is decoded to identify the user.
    3. ConnectionManager registers the user connection.
    4. Sends initial 'connected' message.
    5. Listens in an infinite loop for messages from the client.
    6. Each message is processed by `handlers.handle_websocket_message`.
    7. Handles disconnection or errors gracefully.
    """

    from .utils.jwt_utils import decode_token
    
    user_id = None
    
    try:
        # -------------------------
        # 1. Decode JWT token
        # -------------------------
        payload = decode_token(token)
        user_id = int(payload.get("sub"))

        # -------------------------
        # 2. Register WebSocket connection
        # -------------------------
        await manager.connect(websocket, user_id)
        
        # -------------------------
        # 3. Send welcome message to client
        # -------------------------
        await manager.send_personal_message({
            "type": "connected",
            "user_id": user_id,
            "message": "WebSocket connection established"
        }, user_id)
        
        # -------------------------
        # 4. Listen for incoming messages
        # -------------------------
        while True:
            # Receive JSON message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Pass message to centralized handler
            await handlers.handle_websocket_message(websocket, user_id, message)
    
    # -------------------------
    # 5. Handle client disconnect
    # -------------------------
    except WebSocketDisconnect:
        if user_id:
            manager.disconnect(user_id)
        logger.info(f"WebSocket disconnected: user {user_id}")
    
    # -------------------------
    # 6. Handle unexpected errors
    # -------------------------
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if user_id:
            manager.disconnect(user_id)
