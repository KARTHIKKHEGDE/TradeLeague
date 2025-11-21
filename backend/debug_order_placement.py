#!/usr/bin/env python
"""
Debug script: Simulate frontend order placement request
"""
import requests
import json
from app.config import settings
from app.db import SessionLocal
from app.models.user import User
from app.utils.logger import logger

# Simulate a user login and order placement
BASE_URL = "http://localhost:8000"

def test_order_placement():
    """Test complete order placement flow"""
    
    print("\n" + "="*60)
    print("COMPLETE ORDER PLACEMENT TEST")
    print("="*60)
    
    # Step 1: Create a test user if needed
    print("\n[STEP 1] Checking test user...")
    db = SessionLocal()
    test_user = db.query(User).filter(User.email == "test@example.com").first()
    if not test_user:
        print("❌ No test user found. Create one via signup first!")
        print(f"   Go to: {BASE_URL}/auth/signup")
        db.close()
        return
    
    user_id = test_user.id
    print(f"✅ Test user found: ID={user_id}, Email={test_user.email}")
    db.close()
    
    # Step 2: Login and get token
    print("\n[STEP 2] Logging in...")
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "test123"  # Change this to your password
        }
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json().get("access_token")
    print(f"✅ Login successful, token: {token[:20]}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 3: Fetch wallet
    print("\n[STEP 3] Fetching wallet...")
    wallet_response = requests.get(
        f"{BASE_URL}/api/demo-trading/wallet",
        headers=headers
    )
    
    if wallet_response.status_code != 200:
        print(f"❌ Wallet fetch failed: {wallet_response.text}")
        return
    
    wallet = wallet_response.json()
    print(f"✅ Wallet fetched: Balance=${wallet.get('balance')}")
    
    # Step 4: Fetch current price
    print("\n[STEP 4] Fetching current price...")
    price_response = requests.get(
        f"{BASE_URL}/api/demo-trading/price?symbol=BTCUSDT"
    )
    
    if price_response.status_code != 200:
        print(f"❌ Price fetch failed: {price_response.text}")
        return
    
    price_data = price_response.json()
    current_price = price_data.get("price")
    print(f"✅ Current price: ${current_price}")
    
    # Step 5: Place order
    print("\n[STEP 5] Placing order...")
    order_payload = {
        "symbol": "BTCUSDT",
        "side": "BUY",
        "size": 0.01,
        "stop_loss": current_price * 0.98,
        "take_profit": current_price * 1.02,
    }
    
    print(f"📤 Sending payload: {json.dumps(order_payload, indent=2)}")
    
    order_response = requests.post(
        f"{BASE_URL}/api/demo-trading/orders",
        json=order_payload,
        headers=headers
    )
    
    print(f"\n📊 Response status: {order_response.status_code}")
    print(f"📊 Response body: {order_response.text}")
    
    if order_response.status_code != 200:
        print(f"❌ Order placement failed!")
        return
    
    order = order_response.json()
    print(f"\n✅ Order placed successfully!")
    print(f"   Order ID: {order.get('id')}")
    print(f"   Status: {order.get('status')}")
    print(f"   Symbol: {order.get('symbol')}")
    print(f"   Side: {order.get('side')}")
    print(f"   Size: {order.get('size')}")
    print(f"   Entry Price: ${order.get('entry_price')}")
    print(f"   Stop Loss: ${order.get('stop_loss')}")
    print(f"   Take Profit: ${order.get('take_profit')}")
    
    # Step 6: Fetch orders
    print("\n[STEP 6] Fetching all orders...")
    orders_response = requests.get(
        f"{BASE_URL}/api/demo-trading/orders",
        headers=headers
    )
    
    if orders_response.status_code != 200:
        print(f"❌ Fetch orders failed: {orders_response.text}")
        return
    
    orders = orders_response.json()
    print(f"✅ Total orders: {len(orders)}")
    for o in orders:
        print(f"   - Order {o.get('id')}: {o.get('side')} {o.get('size')} {o.get('symbol')} @ ${o.get('entry_price')} (Status: {o.get('status')})")
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60)

if __name__ == '__main__':
    test_order_placement()
