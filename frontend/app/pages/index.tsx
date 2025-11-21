import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          TradeLeague
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 mb-4">
          Compete. Trade. Win.
        </p>
        
        <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
          Join the ultimate trading tournament platform. Test your skills against traders worldwide.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/auth/signup"
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all text-lg"
          >
            Get Started
          </Link>
          <Link 
            href="/auth/login"
            className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-600/10 transition-all text-lg"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}