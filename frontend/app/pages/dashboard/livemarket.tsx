import { useState } from 'react';
import LivePrice from '../../components/LivePrice/LivePrice';
import { useRouter } from 'next/router';

export default function LiveMarketPage() {
  const router = useRouter();
  const [symbol, setSymbol] = useState('BTCUSDT');

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Live Market</h1>

          <div className="flex items-center gap-3">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-gray-800 text-white px-3 py-2 rounded"
            >
              {/* For now only one symbol; keep UI to support more in future */}
              <option value="BTCUSDT">BTC / USD (BTCUSDT)</option>
            </select>

            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white/5 text-white px-4 py-2 rounded hover:bg-white/10 transition"
            >
              Back to Tournaments
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <LivePrice symbol={symbol} />
        </div>
      </div>
    </div>
  );
}
