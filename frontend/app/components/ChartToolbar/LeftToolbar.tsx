import React, { useState, useRef } from 'react';

interface LeftToolbarProps {
  onDrawingToolChange?: (tool: string) => void;
  onReset?: () => void;
  onFullscreen?: () => void;
}

export default function LeftToolbar({ onDrawingToolChange, onReset, onFullscreen }: LeftToolbarProps) {
  // SVG icon components for premium look
  const svgIcons = [
    // Crosshair (active, yellow)
    <svg key="crosshair" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <g stroke="#FFD600" strokeWidth="2" strokeLinecap="square">
        <line x1="12" y1="2" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
      </g>
    </svg>,
    // Line
    <svg key="line" width="24" height="24" viewBox="0 0 24 24" fill="none"><line x1="6" y1="18" x2="18" y2="6" stroke="#9BA6B2" strokeWidth="2" strokeLinecap="round"/></svg>,
    // Horizontal lines
    <svg key="horiz" width="24" height="24" viewBox="0 0 24 24" fill="none"><g stroke="#9BA6B2" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="8" x2="18" y2="8"/><line x1="6" y1="16" x2="18" y2="16"/></g></svg>,
    // Network/graph
    <svg key="network" width="24" height="24" viewBox="0 0 24 24" fill="none"><g stroke="#9BA6B2" strokeWidth="2"><circle cx="7" cy="17" r="2"/><circle cx="17" cy="7" r="2"/><circle cx="12" cy="12" r="2"/><line x1="7" y1="17" x2="12" y2="12"/><line x1="12" y1="12" x2="17" y2="7"/></g></svg>,
    // Dots/levels
    <svg key="dots" width="24" height="24" viewBox="0 0 24 24" fill="none"><g stroke="#9BA6B2" strokeWidth="2"><circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/></g></svg>,
    // Leaf/check
    <svg key="leaf" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 18C6 12 18 6 18 18" stroke="#9BA6B2" strokeWidth="2" strokeLinecap="round"/><path d="M9 15L12 18L15 12" stroke="#9BA6B2" strokeWidth="2" strokeLinecap="round"/></svg>,
    // Text
    <svg key="text" width="24" height="24" viewBox="0 0 24 24" fill="none"><text x="12" y="18" textAnchor="middle" fontSize="16" fill="#9BA6B2" fontFamily="Inter, Arial">T</text></svg>
  ];

  const fullscreenIcon = <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#9BA6B2" strokeWidth="2"/><polyline points="8,4 4,4 4,8" stroke="#9BA6B2" strokeWidth="2" fill="none"/><polyline points="16,4 20,4 20,8" stroke="#9BA6B2" strokeWidth="2" fill="none"/><polyline points="8,20 4,20 4,16" stroke="#9BA6B2" strokeWidth="2" fill="none"/><polyline points="16,20 20,20 20,16" stroke="#9BA6B2" strokeWidth="2" fill="none"/></svg>;

  const [activeTool, setActiveTool] = useState<number | null>(null);
  const [showCursorMenu, setShowCursorMenu] = useState(false);
  const [cursorType, setCursorType] = useState<'cross' | 'dot' | 'arrow'>('cross');
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Change chart cursor globally (for demo, you may want to scope this to chart container)
  React.useEffect(() => {
    if (cursorType === 'dot') {
      document.body.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=' + "'http://www.w3.org/2000/svg'" + ' width=\'16\' height=\'16\'%3E%3Ccircle cx=\'8\' cy=\'8\' r=\'3\' fill=\'%239BA6B2\'/%3E%3C/svg%3E") 8 8, auto';
    } else if (cursorType === 'arrow') {
      document.body.style.cursor = 'default';
    } else {
      document.body.style.cursor = 'crosshair';
    }
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [cursorType]);

  // Cursor options menu
  const cursorOptions = [
    { key: 'cross', label: 'Cross', icon: svgIcons[0] },
    { key: 'dot', label: 'Dot', icon: <svg width="20" height="20"><circle cx="10" cy="10" r="4" fill="#9BA6B2" /></svg> },
    { key: 'arrow', label: 'Arrow', icon: <svg width="20" height="20"><path d="M4 10h12M12 6l4 4-4 4" stroke="#9BA6B2" strokeWidth="2" fill="none"/></svg> },
  ];

  return (
    <div ref={sidebarRef} className="flex flex-col gap-1 bg-gray-900 border-r border-gray-700 p-2 w-14 h-full relative">
      {/* Toolbar Buttons */}
      <div className="flex flex-col gap-1 pb-3 border-b border-gray-700">
        {/* First button: cursor tool with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCursorMenu((v) => !v)}
            title="Cursor Tools"
            className={`flex items-center justify-center w-full h-10 rounded text-xs font-medium transition-all ${
              activeTool === 0 ? 'bg-yellow-400/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
            style={{ position: 'relative', zIndex: 2 }}
          >
            {cursorOptions.find(opt => opt.key === cursorType)?.icon}
          </button>
          {showCursorMenu && (
            <div
              className="absolute left-14 top-0 bg-[#161B22] border border-[#21262D] rounded shadow-lg flex flex-col min-w-[120px]"
              style={{ zIndex: 10 }}
            >
              {cursorOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setCursorType(opt.key as any); setShowCursorMenu(false); setActiveTool(0); }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-[#21262D] ${cursorType === opt.key ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Remaining 6 buttons */}
        {svgIcons.slice(1).map((icon, idx) => (
          <button
            key={idx+1}
            onClick={() => setActiveTool(idx+1)}
            title={`Tool ${idx + 2}`}
            className={`flex items-center justify-center w-full h-10 rounded text-xs font-medium transition-all ${
              activeTool === idx+1
                ? 'bg-yellow-400/20'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
      {/* Spacer */}
      <div className="flex-1" />
      {/* Fullscreen Button */}
      <button
        onClick={onFullscreen}
        title="Fullscreen"
        className="flex items-center justify-center w-full h-10 rounded text-xs font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
      >
        {fullscreenIcon}
      </button>
    </div>
  );
}
