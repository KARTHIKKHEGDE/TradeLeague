import LivePrice from '../../components/LivePrice/LivePrice';
import { useRouter } from 'next/router';

export default function BTCUSDPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">BTC / USD Live</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white/5 text-white px-4 py-2 rounded hover:bg-white/10 transition"
            >
              Back to Tournaments
            </button>
          </div>
        </div>

        <LivePrice />
      </div>
    </div>
  );
}
