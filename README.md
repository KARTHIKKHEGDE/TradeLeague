# Trading Tournament

A real-time trading tournament platform with live market data, leaderboards, and competitive trading.

## Project Structure

- `backend/` - FastAPI backend with WebSocket support
- `frontend/` - Next.js frontend application
- `tests/` - Unit and integration tests

## Setup

### Quick Start with Docker

1. Copy `.env.example` to `.env` and configure
2. Run all services:
   ```bash
   docker-compose up
   ```
3. Access frontend at `http://localhost:3000`
4. Access backend API at `http://localhost:8000`

### Running Individual Services

To run a specific service:

```bash
docker-compose up <service-name>
```

To run services in detached mode:

```bash
docker-compose up -d
```

To view logs:

```bash
docker-compose logs -f
```

To stop services:

```bash
docker-compose down
```

## Services

- **Frontend** - Next.js on port 3000
- **Backend** - FastAPI on port 8000
- **Database** - PostgreSQL (if configured)
- **Redis** - Cache/WebSocket broker (if configured)

## Features

- Real-time trading with Binance data
- WebSocket live updates
- Leaderboard tracking
- Tournament management
- Admin dashboard
