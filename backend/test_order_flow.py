#!/usr/bin/env python
"""
Test script to trace order placement flow
"""
from app.services.demo_trading_engine import DemoTradingEngine
from app.services.binance_service import BinanceService
from app.db import SessionLocal
from app.utils.logger import logger

def test_wallet():
    """Test wallet creation"""
    db = SessionLocal()
    try:
        print("\n=== TEST 1: Wallet Creation ===")
        wallet = DemoTradingEngine.get_or_create_wallet(db, user_id=1)
        print(f"✅ Wallet ID: {wallet.id}")
        print(f"✅ User ID: {wallet.user_id}")
        print(f"✅ Balance: ${wallet.balance}")
        print(f"✅ Currency: {wallet.currency}")
        return wallet
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()

def test_price():
    """Test price fetching"""
    print("\n=== TEST 2: Binance Price Fetch ===")
    try:
        binance = BinanceService()
        price = binance.get_current_price('BTCUSDT')
        if price:
            print(f"✅ BTC/USDT Price: ${price}")
            return price
        else:
            print(f"❌ No price returned")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_order_placement(entry_price):
    """Test order placement"""
    db = SessionLocal()
    try:
        print("\n=== TEST 3: Order Placement ===")
        print(f"Placing BUY order for 0.01 BTC at ${entry_price}")
        
        order = DemoTradingEngine.place_order(
            db=db,
            user_id=1,
            symbol='BTCUSDT',
            side='BUY',
            size=0.01,
            entry_price=entry_price,
            stop_loss=entry_price * 0.98,  # 2% below entry
            take_profit=entry_price * 1.02  # 2% above entry
        )
        
        print(f"✅ Order ID: {order.id}")
        print(f"✅ Symbol: {order.symbol}")
        print(f"✅ Side: {order.side}")
        print(f"✅ Size: {order.size}")
        print(f"✅ Entry Price: ${order.entry_price}")
        print(f"✅ Stop Loss: ${order.stop_loss}")
        print(f"✅ Take Profit: ${order.take_profit}")
        print(f"✅ Status: {order.status}")
        print(f"✅ PnL: ${order.pnl}")
        
        return order
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()

def test_fetch_orders():
    """Test fetching orders"""
    db = SessionLocal()
    try:
        print("\n=== TEST 4: Fetch Orders ===")
        orders = DemoTradingEngine.get_user_orders(db, user_id=1)
        print(f"✅ Total orders: {len(orders)}")
        for order in orders:
            print(f"  - Order {order.id}: {order.side} {order.size} {order.symbol} @ ${order.entry_price} (Status: {order.status})")
        return orders
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()

if __name__ == '__main__':
    print("=" * 60)
    print("DEMO TRADING ENGINE TEST SUITE")
    print("=" * 60)
    
    # Test 1: Wallet
    wallet = test_wallet()
    
    # Test 2: Price
    price = test_price()
    
    # Test 3: Order Placement (only if we have a price)
    if price:
        order = test_order_placement(price)
    
    # Test 4: Fetch Orders
    orders = test_fetch_orders()
    
    print("\n" + "=" * 60)
    print("TESTS COMPLETE")
    print("=" * 60)
