import React from 'react';
import { TextOptions as TextOptionsType } from '../types';
import { Type, AlignLeft, AlignRight } from 'lucide-react';

interface TextOptionsProps {
  options: TextOptionsType;
  onChange: (options: TextOptionsType) => void;
}

const TextOptions: React.FC<TextOptionsProps> = ({ options, onChange }) => {
  const handleChange = (updates: Partial<TextOptionsType>) => {
    onChange({ ...options, ...updates });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <Type className="h-4 w-4 mr-2" />
          Display Name
        </label>
        <input
          type="checkbox"
          checked={options.enabled}
          onChange={(e) => handleChange({ enabled: e.target.checked })}
          className="rounded text-indigo-600 focus:ring-indigo-500"
        />
      </div>

      {options.enabled && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text
            </label>
            <input
              type="text"
              value={options.text}
              onChange={(e) => handleChange({ text: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Font
            </label>
            <select
              value={options.font}
              onChange={(e) => handleChange({ font: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Font Size
            </label>
            <input
              type="range"
              min={12}
              max={72}
              value={options.size}
              onChange={(e) => handleChange({ size: Number(e.target.value) })}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{options.size}px</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => handleChange({ position: pos as TextOptionsType['position'] })}
                  className={`p-2 text-sm rounded-md border ${
                    options.position === pos
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pos.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TextOptions;