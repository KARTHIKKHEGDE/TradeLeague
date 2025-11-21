import { useEffect, useRef, useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { WEBSOCKET_URL } from '../../constants';

export default function LivePrice() {
  const [price, setPrice] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const token = useUserStore.getState().token;

  useEffect(() => {
    // If we don't have a token, fallback to simple polling (in case user not logged in)
    if (!token) {
      let mounted = true;
      const fetchPrice = async () => {
        try {
          setLoading(true);
          const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const btc = data?.bitcoin?.usd;
          if (mounted && typeof btc === 'number') {
            setPrice(btc);
            setUpdatedAt(new Date().toLocaleTimeString());
            setError('');
          }
        } catch (err: any) {
          if (mounted) setError(err.message || 'Failed to fetch price');
        } finally {
          if (mounted) setLoading(false);
        }
      };

      fetchPrice();
      const id = setInterval(fetchPrice, 5000);
      return () => {
        mounted = false;
        clearInterval(id);
      };
    }

    // Connect to backend WebSocket and subscribe to BTC ticks
    const wsUrl = `${WEBSOCKET_URL}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setLoading(false);
      setError('');
      // subscribe to BTCUSDT price updates
      const msg = { type: 'subscribe_symbol', symbol: 'BTCUSDT' };
      ws.send(JSON.stringify(msg));
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const t = data.type;

        if (t === 'price_update') {
          // price data expected under data field
          const payload = data.data;
          // Attempt common fields
          const p = payload?.price || payload?.last_price || payload?.price_usd || payload?.price_usd;
          const numeric = typeof p === 'number' ? p : parseFloat(p);
          if (!Number.isNaN(numeric)) {
            setPrice(numeric);
            setUpdatedAt(new Date().toLocaleTimeString());
          }
        } else if (t === 'price_data') {
          const p = data.price;
          const numeric = typeof p === 'number' ? p : parseFloat(p);
          if (!Number.isNaN(numeric)) {
            setPrice(numeric);
            setUpdatedAt(new Date().toLocaleTimeString());
          }
        } else if (t === 'error') {
          setError(data.message || 'WebSocket error');
        }
      } catch (err: any) {
        console.error('WS parse error', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
      setError('WebSocket connection failed');
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (_) {}
      }
    };
  }, [token]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">BTC / USD</h3>
          <p className="text-sm text-gray-300">Live Price</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-white">
            {loading ? '—' : price ? `$${price.toLocaleString()}` : '—'}
          </div>
          <div className="text-xs text-gray-400">{updatedAt}</div>
        </div>
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-400">Error: {error}</div>
      )}
    </div>
  );
}
