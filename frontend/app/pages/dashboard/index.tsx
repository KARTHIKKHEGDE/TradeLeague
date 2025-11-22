import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useUserStore } from '../../stores/userStore';
import TournamentCard from '../../components/TournamentCard';
import TradingNavbar from '../../components/TradingNavbar/TradingNavbar';
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navbar */}
      <TradingNavbar 
        showLiveMarketButton={true}
        onLiveMarketClick={() => router.push('/dashboard/livemarket')}
      />

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