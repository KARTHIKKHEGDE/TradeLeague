import React, { useState } from 'react';

const INDICATORS = [
  'Moving Average (MA)',
  'Exponential Moving Average (EMA)',
  'RSI',
  'MACD',
  'Bollinger Bands',
];

interface IndicatorsModalProps {
  open: boolean;
  onClose: () => void;
  onAddIndicator: (indicator: string) => void;
}

export default function IndicatorsModal({ open, onClose, onAddIndicator }: IndicatorsModalProps) {
  const [search, setSearch] = useState('');
  const filtered = INDICATORS.filter(ind => ind.toLowerCase().includes(search.toLowerCase()));

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(13,17,23,0.6)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#21262D',
        borderRadius: 12,
        minWidth: 400,
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 8px 32px #000a',
        padding: '32px 0 24px 0',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 18, right: 24, cursor: 'pointer', fontSize: 28, color: '#9BA6B2' }} onClick={onClose}>&times;</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#E6E8EB', textAlign: 'left', paddingLeft: 32, marginBottom: 16 }}>Indicators</div>
        <div style={{ padding: '0 32px', marginBottom: 16 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #21262D',
              background: '#161B22',
              color: '#E6E8EB',
              fontSize: 16,
              marginBottom: 8,
              outline: 'none',
            }}
          />
        </div>
        <div style={{ padding: '0 32px' }}>
          <div style={{ color: '#6C7076', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>SCRIPT NAME</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.map(ind => (
              <button
                key={ind}
                onClick={() => onAddIndicator(ind)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#E6E8EB',
                  fontSize: 17,
                  textAlign: 'left',
                  padding: '8px 0',
                  cursor: 'pointer',
                  fontWeight: 500,
                  borderRadius: 6,
                  transition: 'background 0.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#161B22')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
