import asyncio
import websockets
import json
import requests
from datetime import datetime
import traceback

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws"

async def test_websocket():
    """
    Complete WebSocket test:
    1. Login to get JWT token
    2. Connect to WebSocket
    3. Subscribe to tournament and price updates
    4. Listen for real-time messages
    """
    
    message_count = 0  # Initialize early to avoid UnboundLocalError
    
    print("=" * 60)
    print("🚀 WEBSOCKET TEST SUITE")
    print("=" * 60)
    
    # -------------------------
    # Step 1: Get JWT token
    # -------------------------
    print("\n1️⃣  Logging in...")
    try:
        print(f"   🔗 POST {BASE_URL}/api/auth/login")
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            params={"email": "admin@test.com", "password": "password123"},
            timeout=5
        )
        
        print(f"   📊 Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   ❌ Login failed with status {response.status_code}")
            print(f"   📄 Response: {response.text}")
            return
        
        token = response.json()["access_token"]
        print(f"   ✅ Token received: {token[:20]}...")
        
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Connection failed: Cannot connect to {BASE_URL}")
        print(f"   💡 Make sure the server is running:")
        print(f"      cd backend")
        print(f"      python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return
        
    except requests.exceptions.Timeout:
        print(f"   ❌ Request timed out")
        print(f"   💡 Server might be slow or not responding")
        return
        
    except KeyError as e:
        print(f"   ❌ Invalid response format: {e}")
        print(f"   📄 Response: {response.text}")
        return
        
    except Exception as e:
        print(f"   ❌ Login failed: {e}")
        print(f"   💡 Error details:")
        traceback.print_exc()
        return
    
    # -------------------------
    # Step 2: Connect to WebSocket
    # -------------------------
    print("\n2️⃣  Connecting to WebSocket...")
    uri = f"{WS_URL}?token={token}"
    
    try:
        async with websockets.connect(uri, ping_interval=20, ping_timeout=10) as websocket:
            print("   ✅ Connected to WebSocket")
            
            # -------------------------
            # Step 3: Wait for welcome message
            # -------------------------
            print("\n   ⏳ Waiting for welcome message...")
            welcome = await asyncio.wait_for(websocket.recv(), timeout=5)
            welcome_data = json.loads(welcome)
            print(f"   📨 {welcome_data}")
            
            # -------------------------
            # Step 4: Subscribe to tournament
            # -------------------------
            print("\n3️⃣  Subscribing to tournament...")
            await websocket.send(json.dumps({
                "type": "subscribe_tournament",
                "tournament_id": 1
            }))
            
            response = await asyncio.wait_for(websocket.recv(), timeout=5)
            print(f"   📨 {json.loads(response)}")
            
            # -------------------------
            # Step 5: Subscribe to price updates
            # -------------------------
            print("\n4️⃣  Subscribing to BTC price updates...")
            await websocket.send(json.dumps({
                "type": "subscribe_symbol",
                "symbol": "BTCUSDT"
            }))
            
            response = await asyncio.wait_for(websocket.recv(), timeout=5)
            print(f"   📨 {json.loads(response)}")
            
            # -------------------------
            # Step 6: Get current leaderboard
            # -------------------------
            print("\n5️⃣  Requesting leaderboard...")
            await websocket.send(json.dumps({
                "type": "get_leaderboard",
                "tournament_id": 1
            }))
            
            # -------------------------
            # Step 7: Listen for real-time updates
            # -------------------------
            print("\n6️⃣  Listening for real-time updates...")
            print("   📡 Press Ctrl+C to stop\n")
            
            start_time = datetime.now()
            
            while True:
                try:
                    # Wait for message with timeout
                    message = await asyncio.wait_for(websocket.recv(), timeout=30)
                    data = json.loads(message)
                    message_count += 1
                    
                    msg_type = data.get('type')
                    
                    if msg_type == 'price_update':
                        # Price update from Binance
                        price_data = data['data']
                        print(f"   💰 [{message_count}] {price_data['symbol']}: ${price_data['price']:,.2f}")
                        
                        if 'price_change_percent' in price_data:
                            change = price_data['price_change_percent']
                            emoji = "📈" if change > 0 else "📉"
                            print(f"       {emoji} 24h Change: {change:.2f}%")
                    
                    elif msg_type == 'leaderboard_data':
                        # Leaderboard data
                        leaderboard = data['data']
                        print(f"\n   🏆 LEADERBOARD:")
                        if isinstance(leaderboard, list) and len(leaderboard) > 0:
                            for entry in leaderboard[:5]:
                                print(f"       #{entry['rank']} {entry['username']}: ${entry['pnl']:.2f} ({entry['pnl_percentage']:.2f}%)")
                        else:
                            print(f"       (No entries yet)")
                        print()
                    
                    elif msg_type == 'leaderboard_update':
                        # Live leaderboard update
                        print(f"   🔄 Leaderboard updated!")
                    
                    elif msg_type == 'trade_executed':
                        # Trade notification
                        trade = data['data']
                        print(f"   🔔 Trade executed: {trade}")
                    
                    elif msg_type == 'error':
                        # Error from server
                        print(f"   ❌ Server error: {data.get('message')}")
                    
                    else:
                        # Other messages
                        print(f"   📨 {msg_type}: {data}")
                    
                    # Show stats every 10 messages
                    if message_count % 10 == 0:
                        elapsed = (datetime.now() - start_time).total_seconds()
                        rate = message_count / elapsed if elapsed > 0 else 0
                        print(f"   📊 Stats: {message_count} messages | {rate:.2f} msg/sec")
                
                except asyncio.TimeoutError:
                    # Send ping to keep connection alive
                    print("   💓 Sending heartbeat...")
                    await websocket.send(json.dumps({
                        "type": "ping",
                        "timestamp": datetime.now().isoformat()
                    }))
                
                except KeyboardInterrupt:
                    print("\n\n   ⏹️  Stopping...")
                    break
    
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"   ❌ WebSocket connection failed: {e}")
        print(f"   💡 Check if JWT token is valid and server WebSocket endpoint is working")
    
    except asyncio.TimeoutError:
        print(f"   ❌ Timeout: Server didn't respond in time")
        print(f"   💡 Check server logs for errors")
    
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print(f"   💡 Error details:")
        traceback.print_exc()
    
    finally:
        print("\n" + "=" * 60)
        print(f"✅ Test completed: {message_count} messages received")
        print("=" * 60)

if __name__ == "__main__":
    # Install required package
    print("💡 Make sure you have: pip install websockets requests\n")
    
    try:
        asyncio.run(test_websocket())
    except KeyboardInterrupt:
        print("\n\n⏹️  Test stopped by user")