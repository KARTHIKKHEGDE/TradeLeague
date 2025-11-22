import React, { useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { useRouter } from 'next/router';

interface WalletInfo {
  balance: number;
  currency: string;
}

interface TradingNavbarProps {
  walletBalance?: number;
  onSettingsClick?: () => void;
  showLiveMarketButton?: boolean;
  onLiveMarketClick?: () => void;
}

export default function TradingNavbar({ 
  walletBalance, 
  onSettingsClick,
  showLiveMarketButton,
  onLiveMarketClick
}: TradingNavbarProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState('User');
  const [email, setEmail] = useState('user@example.com');
  const token = useUserStore.getState().token;

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/login');
  };

  const handleSaveSettings = () => {
    // TODO: Save to backend
    setEditMode(false);
    setShowSettings(false);
  };

  return (
    <>
      {/* TOP NAVBAR */}
      <nav className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
        {/* LEFT - Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span
              className="text-2xl font-black tracking-tighter"
              style={{
                background: 'linear-gradient(135deg, #00D9FF 0%, #0099CC 50%, #006699 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.03em',
              }}
            >
              ScalarVerse
            </span>
          </div>
        </div>

        {/* CENTER - Empty Space */}
        <div className="flex-1" />

        {/* RIGHT - Account Section */}
        <div className="flex items-center gap-6">
          {/* Live Market Button */}
          {showLiveMarketButton && (
            <button
              onClick={onLiveMarketClick}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-bold rounded-lg transition-all"
            >
              Live Market
            </button>
          )}

          {/* Wallet Balance */}
          {walletBalance !== undefined && (
            <div className="flex items-center gap-2 bg-gray-900 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-xs text-gray-400 font-medium">Balance</span>
              <span className="text-sm font-bold text-green-400">
                ${walletBalance.toFixed(2)}
              </span>
            </div>
          )}

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all"
            title="Settings"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all"
            >
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-white">Account</span>
                <span className="text-xs text-gray-400">{username}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                {username.charAt(0).toUpperCase()}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg border border-gray-600 z-50">
                <div className="p-3 border-b border-gray-600">
                  <p className="text-xs text-gray-400 mb-1">Signed in as</p>
                  <p className="text-sm font-bold text-white truncate">{email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowSettings(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-teal-600 hover:text-white transition-all"
                >
                  Account Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 hover:text-red-300 transition-all border-t border-gray-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-96 max-h-96 overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Account Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Edit Toggle */}
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-all"
                >
                  Edit Profile
                </button>
              )}

              {editMode && (
                <>
                  {/* Username Field */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-teal-600 focus:border-cyan-500 outline-none transition-all text-sm"
                      placeholder="Enter username"
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-teal-600 focus:border-cyan-500 outline-none transition-all text-sm"
                      placeholder="Enter email"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2">
                      New Password (optional)
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg border border-teal-600 focus:border-cyan-500 outline-none transition-all text-sm"
                      placeholder="Leave empty to keep current"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={handleSaveSettings}
                      className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-all text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* Info Section */}
              {!editMode && (
                <>
                  <div className="pt-4 space-y-3">
                    <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Username</p>
                      <p className="text-sm font-bold text-white">{username}</p>
                    </div>

                    <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Email</p>
                      <p className="text-sm font-bold text-white">{email}</p>
                    </div>

                    <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Member Since</p>
                      <p className="text-sm font-bold text-white">
                        {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
