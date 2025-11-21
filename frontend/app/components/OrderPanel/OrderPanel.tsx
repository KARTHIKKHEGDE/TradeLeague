
import { useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { api } from '../../services/api';

interface OrderPanelProps {
  symbol: string;
  currentPrice: number | null;
  onOrderPlaced: () => void;
}

export default function OrderPanel({ symbol, currentPrice, onOrderPlaced }: OrderPanelProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [size, setSize] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = useUserStore.getState().token;

  const handlePlaceOrder = async () => {
    if (!size || !currentPrice) {
      setError('Please enter order size and wait for price');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        symbol,
        side,
        size: parseFloat(size),
        stop_loss: stopLoss ? parseFloat(stopLoss) : null,
        take_profit: takeProfit ? parseFloat(takeProfit) : null,
      };
      
      console.log('📤 Sending order payload:', payload);
      
      const response = await api.post('/api/demo-trading/orders', payload);
      
      console.log('✅ Order response:', response);

      setSize('');
      setStopLoss('');
      setTakeProfit('');
      setError('');
      alert('✅ Order placed successfully!');
      onOrderPlaced();
    } catch (err: any) {
      console.error('❌ Order error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to place order';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-bold text-white mb-4">Place Order</h3>

      {/* Side selector */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setSide('BUY')}
          className={`flex-1 py-2 rounded font-bold transition ${
            side === 'BUY'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`flex-1 py-2 rounded font-bold transition ${
            side === 'SELL'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          SELL
        </button>
      </div>

      {/* Current price display */}
      <div className="mb-4 p-2 bg-gray-900 rounded text-gray-300">
        <span className="text-sm">Current Price: </span>
        <span className="text-lg font-bold text-white">
          {currentPrice ? `$${currentPrice.toFixed(2)}` : '—'}
        </span>
      </div>

      {/* Size input */}
      <div className="mb-3">
        <label className="text-sm text-gray-300 block mb-1">Size (units)</label>
        <input
          type="number"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Enter order size"
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Stop Loss input */}
      <div className="mb-3">
        <label className="text-sm text-gray-300 block mb-1">Stop Loss (optional)</label>
        <input
          type="number"
          value={stopLoss}
          onChange={(e) => setStopLoss(e.target.value)}
          placeholder="Enter stop loss price"
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Take Profit input */}
      <div className="mb-4">
        <label className="text-sm text-gray-300 block mb-1">Take Profit (optional)</label>
        <input
          type="number"
          value={takeProfit}
          onChange={(e) => setTakeProfit(e.target.value)}
          placeholder="Enter take profit price"
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Error message */}
      {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

      {/* Place Order button */}
      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        className={`w-full py-3 rounded font-bold transition ${
          side === 'BUY'
            ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600'
            : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-600'
        } text-white`}
      >
        {loading ? 'Placing...' : `Place ${side} Order`}
      </button>
    </div>
  );
}