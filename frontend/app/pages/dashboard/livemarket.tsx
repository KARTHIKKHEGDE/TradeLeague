import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUserStore } from '../../stores/userStore';
import { WEBSOCKET_URL } from '../../constants';
import { useTradingStore } from '../../stores/tradeStore';
import { api } from '../../services/api';
import LightweightChart from '../../components/CandleChart/LightweightChart';
import OrderPanel from '../../components/OrderPanel/OrderPanel';
import WalletPanel from '../../components/WalletPanel/WalletPanel';
import OrdersHistory from '../../components/OrdersHistory/OrdersHistory';

interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  currency: string;
}

export default function LiveMarketPage() {
  const router = useRouter();
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1m');
  const token = useUserStore.getState().token;
  const { currentPrice, ticks, orderRefreshTrigger, addTick, triggerOrderRefresh } = useTradingStore();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [priceLoaded, setPriceLoaded] = useState(false);

  useEffect(() => {
    fetchWallet();
    fetchOrders();
  }, [orderRefreshTrigger]);

  useEffect(() => {
    fetchInitialPrice();
  }, []);

  const fetchWallet = async () => {
    try {
      setLoadingWallet(true);
      const response = await api.get('/api/demo-trading/wallet');
      setWallet(response.data);
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setLoadingWallet(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/demo-trading/orders');
      setOrders(response.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const fetchInitialPrice = async () => {
    try {
      const response = await api.get(`/api/demo-trading/price?symbol=${symbol}`);
      if (response.data?.price) {
        addTick(response.data.price, 0);
        setPriceLoaded(true);
      }
    } catch (err) {
      console.error('Error fetching initial price:', err);
    }
  };

  useEffect(() => {
    if (!token) {
      console.log('❌ No token available');
      return;
    }

    const wsUrl = `${WEBSOCKET_URL}?token=${token}`;
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      ws.send(JSON.stringify({ type: 'subscribe_symbol', symbol }));
      console.log('📤 Subscribed to:', symbol);
    };

    ws.onmessage = (event) => {
      console.log('📨 Message:', event.data);
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'price_update') {
          const payload = data.data;
          const price = payload?.price || payload?.last_price;
          const quantity = payload?.quantity || 0;
          if (typeof price === 'number') {
            console.log(`💰 Price: $${price}, Vol: ${quantity} BTC`);
            addTick(price, quantity);
          }
        } else if (data.type === 'price_data') {
          const price = data.price;
          const quantity = data.quantity || 0;
          if (typeof price === 'number') {
            addTick(price, quantity);
          }
        }

        if (data.type === 'order_closed') triggerOrderRefresh();
        if (data.type === 'wallet_updated') triggerOrderRefresh();
      } catch (err) {
        console.error('❌ Parse error:', err);
      }
    };

    ws.onerror = (error) => console.error('❌ WebSocket error:', error);
    ws.onclose = () => console.log('🔌 WebSocket closed');

    return () => {
      if (ws) ws.close();
    };
  }, [token, symbol, addTick, triggerOrderRefresh]);

  const handleSymbolChange = (newSymbol: string) => setSymbol(newSymbol);
  const handleOrderPlaced = () => triggerOrderRefresh();

  const calculateUnrealizedPnL = () => {
    if (!currentPrice) return 0;
    return orders
      .filter(o => o.status === 'OPEN')
      .reduce((sum, o) => {
        const pnl = o.side === 'BUY' 
          ? (currentPrice - o.entry_price) * o.size
          : (o.entry_price - currentPrice) * o.size;
        return sum + pnl;
      }, 0);
  };

  const unrealizedPnL = calculateUnrealizedPnL();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Live Market</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <div className="flex justify-between items-center gap-8">
            <select
              value={symbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded"
            >
              <option value="BTCUSDT">BTC / USD (BTCUSDT)</option>
            </select>

            <div className="text-center">
              <p className="text-gray-400 text-sm">Wallet Balance</p>
              <p className="text-2xl font-bold text-blue-400">
                💰 {wallet ? `$${wallet.balance.toFixed(2)}` : '—'}
              </p>
              {unrealizedPnL !== 0 && (
                <p className={`text-sm mt-1 ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Unrealized: {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-gray-400 text-sm">Current Price</p>
              <p className="text-2xl font-bold text-green-400">
                ₿ ${currentPrice ? currentPrice.toFixed(2) : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="col-span-2 flex flex-col gap-4">
            <div className="flex gap-2 bg-gray-800 p-2 rounded-lg w-fit">
              {['1m', '3m', '5m', '15m', '30m', '1h'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <LightweightChart symbol={symbol} ticks={ticks} timeframe={timeframe} />
          </div>

          <div className="flex flex-col gap-6">
            <OrderPanel symbol={symbol} currentPrice={currentPrice} onOrderPlaced={handleOrderPlaced} />
            <WalletPanel onWalletUpdate={handleOrderPlaced} refreshTrigger={orderRefreshTrigger} />
          </div>
        </div>

        <OrdersHistory refreshTrigger={orderRefreshTrigger} currentPrice={currentPrice} />
      </div>
    </div>
  );
}