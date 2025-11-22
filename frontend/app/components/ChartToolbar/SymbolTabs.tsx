import React, { useState } from 'react';

interface Symbol {
  id: string;
  label: string;
  icon: string;
}

interface SymbolTabsProps {
  activeSymbol: string;
  onSymbolChange: (symbol: string) => void;
  symbols?: Symbol[];
}

export default function SymbolTabs({ activeSymbol, onSymbolChange, symbols }: SymbolTabsProps) {
  const defaultSymbols: Symbol[] = [
    { id: 'BTCUSDT', label: 'BTC', icon: '₿' },
    { id: 'ETHUSDT', label: 'ETH', icon: 'Ξ' },
    { id: 'XAUUSD', label: 'XAU/USD', icon: '🏆' },
    { id: 'GBPUSD', label: 'GBP/USD', icon: '£' },
  ];

  const displaySymbols = symbols || defaultSymbols;
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-3 gap-2 overflow-x-auto">
      {/* Symbol Tabs */}
      {displaySymbols.map((symbol) => (
        <button
          key={symbol.id}
          onClick={() => onSymbolChange(symbol.id)}
          className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
            activeSymbol === symbol.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
          }`}
        >
          <span className="mr-1">{symbol.icon}</span>
          {symbol.label}
        </button>
      ))}

      {/* Add Symbol Button */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-2 py-1.5 rounded text-xs font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-all"
        >
          +
        </button>
        {showDropdown && (
          <div className="absolute top-full mt-1 bg-gray-700 rounded shadow-lg z-10 border border-gray-600">
            <div className="px-3 py-2 text-xs text-gray-400">More symbols</div>
            <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-600">
              More Markets
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
