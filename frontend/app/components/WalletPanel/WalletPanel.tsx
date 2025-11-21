import { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface WalletPanelProps {
  onWalletUpdate: () => void;
  refreshTrigger?: number;
}

interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  currency: string;
}

interface Order {
  id: number;
  pnl: number;
  status: string;
}

export default function WalletPanel({ onWalletUpdate, refreshTrigger = 0 }: WalletPanelProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Refresh wallet on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchWallet();
    fetchOrders();
  }, [refreshTrigger]);

  // Initial fetch on mount
  useEffect(() => {
    fetchWallet();
    fetchOrders();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await api.get('/api/demo-trading/wallet');
      setWallet(response.data);
    } catch (err) {
      console.error('Error fetching wallet:', err);
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

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/api/demo-trading/wallet/deposit', {
        amount: parseFloat(depositAmount),
      });

      setDepositAmount('');
      fetchWallet();
      onWalletUpdate();
      alert('✅ Deposit successful!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-gray-400">Loading wallet...</p>
      </div>
    );
  }

  // Calculate total realized P/L
  const totalRealizedPnL = orders
    .filter(o => o.status !== 'OPEN')
    .reduce((sum, o) => sum + (o.pnl || 0), 0);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-bold text-white mb-4">Demo Wallet</h3>

      {/* Balance display */}
      <div className="mb-3 p-3 bg-gray-900 rounded">
        <p className="text-sm text-gray-400 mb-1">Available Balance</p>
        <p className="text-3xl font-bold text-green-400">${wallet.balance.toFixed(2)}</p>
      </div>

      {/* Total P/L display */}
      <div className="mb-4 p-3 bg-gray-900 rounded">
        <p className="text-sm text-gray-400 mb-1">Total Realized P/L</p>
        <p className={`text-xl font-bold ${totalRealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {totalRealizedPnL >= 0 ? '+' : ''}${totalRealizedPnL.toFixed(2)}
        </p>
      </div>

      {/* Deposit section */}
      <div className="mb-3">
        <label className="text-sm text-gray-300 block mb-1">Deposit Amount</label>
        <input
          type="number"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          placeholder="Enter amount to deposit"
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 outline-none"
        />
      </div>

      {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

      <button
        onClick={handleDeposit}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded font-bold transition"
      >
        {loading ? 'Processing...' : 'Deposit'}
      </button>
    </div>
  );
}