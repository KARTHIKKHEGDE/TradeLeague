import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUserStore } from '../../stores/userStore';
import { WEBSOCKET_URL } from '../../constants';
import { useTradingStore } from '../../stores/tradeStore';
import { api } from '../../services/api';
import LightweightChart from '../../components/CandleChart/LightweightChart';
import CompactOrderPanel from '../../components/OrderPanel/CompactOrderPanel';
import LeftToolbar from '../../components/ChartToolbar/LeftToolbar';
import SymbolTabs from '../../components/ChartToolbar/SymbolTabs';
import TimeframeSelector from '../../components/ChartToolbar/TimeframeSelector';
import OrdersHistory from '../../components/OrdersHistory/OrdersHistory';
import TradingNavbar from '../../components/TradingNavbar/TradingNavbar';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [addMA, setAddMA] = useState(false); // MA indicator state
  const token = useUserStore.getState().token;
  const { currentPrice, ticks, orderRefreshTrigger, addTick, triggerOrderRefresh } = useTradingStore();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);

  useEffect(() => {
    fetchWallet();
    fetchOrders();
  }, [orderRefreshTrigger]);

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

  useEffect(() => {
    if (!token) {
      return;
    }

    const wsUrl = `${WEBSOCKET_URL}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe_symbol', symbol }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'price_update') {
          const payload = data.data;
          const price = payload?.price || payload?.last_price;
          const quantity = payload?.quantity || 0;
          if (typeof price === 'number') {
            addTick(price, quantity);
          }
        }

        if (data.type === 'order_closed') triggerOrderRefresh();
        if (data.type === 'wallet_updated') triggerOrderRefresh();
      } catch (err) {
        console.error('Parse error:', err);
      }
    };

    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => console.log('WebSocket closed');

    return () => {
      if (ws) ws.close();
    };
  }, [token, symbol, addTick, triggerOrderRefresh]);

  const handleOrderPlaced = () => triggerOrderRefresh();

  const handleReset = () => {
    // Reset chart functionality
    console.log('Chart reset');
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* TOP NAVBAR */}
      <TradingNavbar walletBalance={wallet?.balance} />

      {/* TOP BAR - Symbol Tabs */}
      <SymbolTabs 
        activeSymbol={symbol} 
        onSymbolChange={setSymbol}
      />

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT TOOLBAR - Drawing Tools */}
        <LeftToolbar 
          onReset={handleReset}
          onFullscreen={handleFullscreen}
        />

        {/* CENTER - CHART SECTION */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TIMEFRAME SELECTOR */}
          <TimeframeSelector
            activeTimeframe={timeframe}
            onTimeframeChange={setTimeframe}
            addMA={addMA}
            setAddMA={setAddMA}
          />

          {/* CHART CONTAINER - Full height */}
          <div className="flex-1 overflow-hidden">
            <LightweightChart 
              symbol={symbol} 
              ticks={ticks} 
              timeframe={timeframe}
              addMA={addMA}
            />
          </div>
        </div>

        {/* RIGHT PANEL - Order Panel */}
        <CompactOrderPanel 
          symbol={symbol}
          currentPrice={currentPrice}
          onOrderPlaced={handleOrderPlaced}
          walletBalance={wallet?.balance}
        />
      </div>

      {/* BOTTOM - Orders History */}
      <div className="border-t border-gray-700 max-h-48 overflow-y-auto">
        <OrdersHistory 
          refreshTrigger={orderRefreshTrigger} 
          currentPrice={currentPrice}
        />
      </div>

      {/* Back Button - Floating */}
      <button
        onClick={() => router.push('/dashboard')}
        className="fixed bottom-4 left-4 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-medium transition z-10"
      >
        Back
      </button>
    </div>
  );
}