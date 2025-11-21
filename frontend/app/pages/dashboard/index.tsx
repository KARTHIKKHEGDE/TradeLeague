import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import TournamentCard from '../../components/TournamentCard';
import { getTournaments, joinTournament } from '../../services/api';
import { Tournament } from '../../types';

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const fetchTournaments = async () => {
      try {
        const data = await getTournaments();
        setTournaments(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load tournaments');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [isAuthenticated, router]);

  const handleJoinTournament = async (id: number) => {
    try {
      await joinTournament(id);
      alert('Successfully joined tournament!');
    } catch (err: any) {
      alert(err.message || 'Failed to join tournament');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">TradeLeague</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/livemarket')}
              className="bg-yellow-500 text-black px-3 py-2 rounded hover:bg-yellow-600 transition"
            >
              Live market
            </button>
            <span className="text-gray-300">Welcome, {user?.username}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Available Tournaments
          </h2>
          <p className="text-gray-400">
            Join a tournament and start competing with traders worldwide
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-white">Loading tournaments...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Tournaments Grid */}
        {!loading && !error && tournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onJoin={handleJoinTournament}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && tournaments.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold text-white mb-2">No Tournaments Available</h3>
            <p className="text-gray-400">Check back soon for new tournaments!</p>
          </div>
        )}
      </div>
    </div>
  );
}