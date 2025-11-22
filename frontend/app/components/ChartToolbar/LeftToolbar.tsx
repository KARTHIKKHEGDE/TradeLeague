import React, { useState } from 'react';

interface LeftToolbarProps {
  onDrawingToolChange?: (tool: string) => void;
  onReset?: () => void;
  onFullscreen?: () => void;
}

export default function LeftToolbar({ onDrawingToolChange, onReset, onFullscreen }: LeftToolbarProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const tools = [
    { id: 'cursor', icon: '→', label: 'Select', title: 'Cursor' },
    { id: 'crosshair', icon: '+', label: 'Crosshair', title: 'Crosshair' },
    { id: 'line', icon: '/', label: 'Line', title: 'Line Tool' },
    { id: 'horizontal', icon: '─', label: 'H-Line', title: 'Horizontal Line' },
    { id: 'vertical', icon: '│', label: 'V-Line', title: 'Vertical Line' },
    { id: 'rectangle', icon: '▭', label: 'Box', title: 'Rectangle' },
    { id: 'triangle', icon: '△', label: 'Triangle', title: 'Triangle' },
    { id: 'arrow', icon: '→', label: 'Arrow', title: 'Arrow' },
  ];

  const handleToolClick = (toolId: string) => {
    setActiveTool(activeTool === toolId ? null : toolId);
    onDrawingToolChange?.(toolId);
  };

  return (
    <div className="flex flex-col gap-1 bg-gray-900 border-r border-gray-700 p-2 w-14 h-full">
      {/* Drawing Tools Section */}
      <div className="flex flex-col gap-1 pb-3 border-b border-gray-700">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            title={tool.title}
            className={`flex items-center justify-center w-full h-10 rounded text-xs font-medium transition-all ${
              activeTool === tool.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="text-lg">{tool.icon}</span>
          </button>
        ))}
      </div>

      {/* Zoom & View Controls */}
      <div className="flex flex-col gap-1 pb-3 border-b border-gray-700">
        <button
          title="Zoom In"
          className="flex items-center justify-center w-full h-10 rounded text-xs font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
        >
          +
        </button>
        <button
          title="Zoom Out"
          className="flex items-center justify-center w-full h-10 rounded text-xs font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
        >
          −
        </button>
      </div>

      {/* Reset & Fullscreen */}
      <div className="flex flex-col gap-1 mt-auto">
        <button
          onClick={onReset}
          title="Reset Chart"
          className="flex items-center justify-center w-full h-10 rounded text-xs font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
        >
          ↺
        </button>
        <button
          onClick={onFullscreen}
          title="Fullscreen"
          className="flex items-center justify-center w-full h-10 rounded text-xs font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
        >
          ⛶
        </button>
      </div>
    </div>
  );
}
