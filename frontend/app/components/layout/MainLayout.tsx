import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../common/Logo';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Navigation */}
      <nav className="bg-[#1E1E1E] border-b border-[#2A2A2A] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="text-xl font-bold text-white">
                Trade<span className="text-[#1ABC9C]">League</span>
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  router.pathname === '/dashboard'
                    ? 'text-[#1ABC9C]'
                    : 'text-[#B0B0B0] hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/tournaments"
                className={`text-sm font-medium transition-colors ${
                  router.pathname === '/tournaments'
                    ? 'text-[#1ABC9C]'
                    : 'text-[#B0B0B0] hover:text-white'
                }`}
              >
                Tournaments
              </Link>
              <Link
                href="/leaderboard"
                className={`text-sm font-medium transition-colors ${
                  router.pathname === '/leaderboard'
                    ? 'text-[#1ABC9C]'
                    : 'text-[#B0B0B0] hover:text-white'
                }`}
              >
                Leaderboard
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-white">{user?.username}</p>
                <p className="text-xs text-[#B0B0B0]">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#2A2A2A] text-white rounded-lg hover:bg-[#3A3A3A] transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#1E1E1E] border-t border-[#2A2A2A] mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-[#B0B0B0] text-sm">
            © 2024 TradeLeague. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
