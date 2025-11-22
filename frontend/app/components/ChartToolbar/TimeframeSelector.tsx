import React, { useState } from 'react';
import IndicatorsModal from './IndicatorsModal';

interface TimeframeSelectorProps {
  activeTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export default function TimeframeSelector({ activeTimeframe, onTimeframeChange }: TimeframeSelectorProps) {
  const timeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'];
  const [showIndicators, setShowIndicators] = useState(false);

  const handleAddIndicator = (indicator: string) => {
    // TODO: Add indicator to chart logic here
    setShowIndicators(false);
  };

  return (
    <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-3 gap-1 overflow-x-auto">
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => onTimeframeChange(tf)}
          className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all ${
            activeTimeframe === tf
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
          }`}
        >
          {tf}
        </button>
      ))}
      <button
        onClick={() => setShowIndicators(true)}
        className="px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-all bg-blue-600 text-white ml-2"
        style={{ minWidth: 90, fontWeight: 600 }}
      >
        Indicators
      </button>
      <IndicatorsModal
        open={showIndicators}
        onClose={() => setShowIndicators(false)}
        onAddIndicator={handleAddIndicator}
      />
    </div>
  );
}
