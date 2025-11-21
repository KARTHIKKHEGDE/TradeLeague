import { useEffect, useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { useTradingStore } from '../../stores/tradeStore';
import { api } from '../../services/api';

interface OrdersHistoryProps {
  refreshTrigger: number;
  currentPrice?: number | null;
}

export default function OrdersHistory({ refreshTrigger, currentPrice }: OrdersHistoryProps) {
  const token = useUserStore.getState().token;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [closingOrderId, setClosingOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [refreshTrigger]);

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await api.get('/api/demo-trading/orders');
      setOrders(response.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseOrder = async (orderId: number) => {
    if (!token) return;
    
    setClosingOrderId(orderId);
    try {
      console.log(`🔴 Closing order ${orderId} at current price $${currentPrice}`);
      const response = await api.post(`/api/demo-trading/orders/${orderId}/close`, {});
      console.log('✅ Order closed:', response);
      
      alert('✅ Order closed successfully!');
      fetchOrders(); // Refresh orders list
    } catch (err: any) {
      console.error('❌ Failed to close order:', err);
      alert(`Failed to close order: ${err.response?.data?.detail || err.message}`);
    } finally {
      setClosingOrderId(null);
    }
  };

  const calculateUnrealizedPnL = (order: any, price: number | null | undefined) => {
    if (!price || order.status !== 'OPEN') return null;
    
    if (order.side === 'BUY') {
      return (price - order.entry_price) * order.size;
    } else {
      return (order.entry_price - price) * order.size;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-bold text-white mb-4">Order History</h3>

      {loading ? (
        <div className="text-gray-400 text-center py-4">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-gray-400 text-center py-4">No orders yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="text-left py-2 px-2">Symbol</th>
                <th className="text-left py-2 px-2">Side</th>
                <th className="text-left py-2 px-2">Size</th>
                <th className="text-left py-2 px-2">Entry</th>
                <th className="text-left py-2 px-2">Current</th>
                <th className="text-left py-2 px-2">Unrealized P/L</th>
                <th className="text-left py-2 px-2">P/L</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const unrealizedPnL = calculateUnrealizedPnL(order, currentPrice);
                const displayPnL = unrealizedPnL !== null ? unrealizedPnL : order.pnl;
                const isProfitable = displayPnL >= 0;
                
                return (
                  <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="py-2 px-2">{order.symbol}</td>
                    <td className={`py-2 px-2 font-bold ${order.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                      {order.side}
                    </td>
                    <td className="py-2 px-2">{order.size}</td>
                    <td className="py-2 px-2">${order.entry_price?.toFixed(2) || '—'}</td>
                    <td className="py-2 px-2">
                      ${order.status === 'OPEN' && currentPrice 
                        ? currentPrice.toFixed(2) 
                        : (order.close_price?.toFixed(2) || '—')}
                    </td>
                    <td className={`py-2 px-2 font-bold ${unrealizedPnL !== null ? (unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
                      {unrealizedPnL !== null 
                        ? `${unrealizedPnL >= 0 ? '+' : ''}$${unrealizedPnL.toFixed(2)}`
                        : '—'}
                    </td>
                    <td className={`py-2 px-2 font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                      ${displayPnL?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        order.status === 'OPEN' ? 'bg-blue-900 text-blue-200' :
                        order.status === 'CLOSED' ? 'bg-gray-900 text-gray-300' :
                        order.status === 'TP_HIT' ? 'bg-green-900 text-green-200' :
                        'bg-red-900 text-red-200'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      {order.status === 'OPEN' && (
                        <button
                          onClick={() => handleCloseOrder(order.id)}
                          disabled={closingOrderId === order.id || !currentPrice}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded text-xs font-bold transition"
                        >
                          {closingOrderId === order.id ? '...' : 'Exit'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}