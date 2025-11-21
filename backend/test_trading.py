import requests
import json

BASE_URL = "http://localhost:8000"

def test_signup():
    """Test user signup"""
    print("\n1️⃣  Testing Signup...")
    response = requests.post(
        f"{BASE_URL}/api/auth/signup",
        json={
            "email": "admin@test.com",
            "username": "admin",
            "password": "password123"
        }
    )
    if response.status_code == 400 and "already registered" in response.text:
        print("   ⚠️  User already exists, continuing...")
        return response.json()
    print(f"   ✅ Signup successful: {response.json()}")
    return response.json()

def test_login(email, password):
    """Test login and get token"""
    print("\n2️⃣  Testing Login...")
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        params={"email": email, "password": password}
    )
    data = response.json()
    print(f"   ✅ Login successful")
    print(f"   👤 User: {data['user']['username']}")
    print(f"   🔑 Admin: {data['user']['is_admin']}")
    return data["access_token"]

def test_create_tournament(token):
    """Test tournament creation (admin)"""
    print("\n3️⃣  Creating Tournament...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/api/tournaments/",
        json={
            "name": "Weekend Crypto Challenge",
            "start_time": "2025-11-20T00:00:00",
            "end_time": "2025-11-30T23:59:59",
            "initial_balance": 10000.0
        },
        headers=headers
    )
    if response.status_code == 403:
        print(f"   ❌ User is not admin! Response: {response.json()}")
        print("\n   💡 FIX: Run this SQL command in PostgreSQL:")
        print("   docker exec -it postgres psql -U trading -d trading_tournament")
        print("   UPDATE users SET is_admin = true WHERE email = 'admin@test.com';")
        print("   \\q")
        return None
    
    data = response.json()
    print(f"   ✅ Tournament created: {data['name']}")
    print(f"   🆔 Tournament ID: {data['id']}")
    return data

def test_join_tournament(token, tournament_id):
    """Test joining tournament"""
    print("\n4️⃣  Joining Tournament...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/api/tournaments/{tournament_id}/join",
        headers=headers
    )
    data = response.json()
    print(f"   ✅ Joined tournament: {data['message']}")
    print(f"   💰 Initial Balance: ${data['initial_balance']}")

def test_execute_trade(token, tournament_id):
    """Test executing a trade"""
    print("\n5️⃣  Executing BUY Trade (0.01 BTC)...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/api/trades/",
        json={
            "tournament_id": tournament_id,
            "symbol": "BTCUSDT",
            "side": "BUY",
            "quantity": 0.01
        },
        headers=headers
    )
    data = response.json()
    if "detail" in data:
        print(f"   ❌ Trade failed: {data['detail']}")
    else:
        print(f"   ✅ Trade executed!")
        print(f"   📊 Symbol: {data['symbol']}")
        print(f"   💵 Price: ${data['price']}")
        print(f"   📈 Quantity: {data['quantity']}")
        print(f"   💰 Cost: ${data['total_value']}")
        print(f"   🏦 New Balance: ${data['new_balance']}")

def test_get_pnl(token, tournament_id):
    """Test getting PNL"""
    print("\n6️⃣  Checking Portfolio & PNL...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/api/trades/pnl",
        params={"tournament_id": tournament_id},
        headers=headers
    )
    data = response.json()
    if "detail" in data:
        print(f"   ❌ Error: {data['detail']}")
    else:
        print(f"   💵 Cash Balance: ${data['cash_balance']:.2f}")
        print(f"   📊 Positions Value: ${data['positions_value']:.2f}")
        print(f"   💼 Total Portfolio: ${data['total_portfolio_value']:.2f}")
        print(f"   📈 PNL: ${data['pnl']:.2f} ({data['pnl_percentage']:.2f}%)")
        if data['positions']:
            print(f"   🔹 Open Positions:")
            for pos in data['positions']:
                print(f"      • {pos['symbol']}: {pos['quantity']} @ ${pos['average_price']}")

def test_get_leaderboard(tournament_id):
    """Test getting leaderboard"""
    print("\n7️⃣  Viewing Leaderboard...")
    response = requests.get(f"{BASE_URL}/api/tournaments/{tournament_id}/leaderboard")
    data = response.json()
    if data['leaderboard']:
        print(f"   🏆 Top Traders:")
        for entry in data['leaderboard'][:5]:
            print(f"      #{entry['rank']} {entry['username']}: ${entry['pnl']:.2f} ({entry['pnl_percentage']:.2f}%)")
    else:
        print(f"   📋 Leaderboard is empty (no trades yet)")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 TRADING ENGINE TEST SUITE")
    print("=" * 60)
    
    try:
        # 1. Signup
        test_signup()
        
        # 2. Login
        token = test_login("admin@test.com", "password123")
        
        # 3. Create tournament
        tournament_data = test_create_tournament(token)
        if not tournament_data:
            print("\n❌ Cannot continue without admin access")
            exit(1)
        
        tournament_id = tournament_data['id']
        
        # 4. Join tournament
        test_join_tournament(token, tournament_id)
        
        # 5. Execute trade
        test_execute_trade(token, tournament_id)
        
        # 6. Get PNL
        test_get_pnl(token, tournament_id)
        
        # 7. Get leaderboard
        test_get_leaderboard(tournament_id)
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        
    except KeyError as e:
        print(f"\n❌ Error: Missing key {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")