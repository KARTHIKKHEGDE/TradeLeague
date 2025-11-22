import { useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { api } from '../../services/api';

interface CompactOrderPanelProps {
  symbol: string;
  currentPrice: number | null;
  onOrderPlaced: () => void;
  walletBalance?: number;
}

export default function CompactOrderPanel({ 
  symbol, 
  currentPrice, 
  onOrderPlaced,
  walletBalance 
}: CompactOrderPanelProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [size, setSize] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = useUserStore.getState().token;

  const handlePlaceOrder = async () => {
    if (!size || !currentPrice) {
      setError('Please enter order size');
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
      
      const response = await api.post('/api/demo-trading/orders', payload);
      
      setSize('');
      setStopLoss('');
      setTakeProfit('');
      setError('');
      onOrderPlaced();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to place order';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 border-l border-gray-700 flex flex-col h-full w-64">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-700">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Place Order</h3>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {/* Current Price Display */}
        <div className="bg-gray-900 p-2.5 rounded-md border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Current Price</p>
          <p className="text-lg font-bold text-cyan-400">
            {currentPrice ? `$${currentPrice.toFixed(2)}` : '—'}
          </p>
        </div>

        {/* Wallet Balance */}
        {walletBalance !== undefined && (
          <div className="bg-gray-900 p-2.5 rounded-md border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Available</p>
            <p className="text-sm font-bold text-green-400">
              ${walletBalance.toFixed(2)}
            </p>
          </div>
        )}

        {/* Buy/Sell Buttons */}
        <div className="flex gap-2 bg-gray-900 p-1.5 rounded-md border border-gray-700">
          <button
            onClick={() => setSide('BUY')}
            className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
              side === 'BUY'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setSide('SELL')}
            className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
              side === 'SELL'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Size Input */}
        <div>
          <label className="text-xs text-gray-400 block mb-1.5 font-medium">Size</label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="0.00"
            className="w-full px-2.5 py-1.5 bg-gray-900 text-white text-sm rounded border border-teal-600 focus:border-cyan-500 outline-none transition"
          />
        </div>

        {/* Stop Loss Input */}
        <div>
          <label className="text-xs text-gray-400 block mb-1.5 font-medium">Stop Loss</label>
          <input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="Optional"
            className="w-full px-2.5 py-1.5 bg-gray-900 text-white text-sm rounded border border-teal-600 focus:border-cyan-500 outline-none transition"
          />
        </div>

        {/* Take Profit Input */}
        <div>
          <label className="text-xs text-gray-400 block mb-1.5 font-medium">Take Profit</label>
          <input
            type="number"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="Optional"
            className="w-full px-2.5 py-1.5 bg-gray-900 text-white text-sm rounded border border-teal-600 focus:border-cyan-500 outline-none transition"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-xs text-red-400 bg-red-900 bg-opacity-20 p-2 rounded border border-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Footer - Place Order Button */}
      <div className="px-3 py-2 border-t border-gray-700">
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className={`w-full py-2 rounded font-bold text-sm transition-all ${
            side === 'BUY'
              ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white'
              : 'bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white'
          }`}
        >
          {loading ? 'Placing...' : `${side}`}
        </button>
      </div>
    </div>
  );
}
