import React from 'react';
import { TextOptions as TextOptionsType } from '../types';
import { Type } from 'lucide-react';

interface TextOptionsProps {
  options: TextOptionsType;
  onChange: (options: TextOptionsType) => void;
  compact?: boolean;
}

const TextOptions: React.FC<TextOptionsProps> = ({ options, onChange, compact = false }) => {
  const handleChange = (updates: Partial<TextOptionsType>) => {
    onChange({ ...options, ...updates });
  };

  return (
    <div className={`space-y-4 ${compact ? 'p-2' : 'p-4'} bg-gray-50 rounded-lg`}>
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
        <div className="space-y-2">
          <input
            type="text"
            value={options.text}
            onChange={(e) => handleChange({ text: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            placeholder="Enter name"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={options.font}
              onChange={(e) => handleChange({ font: e.target.value })}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Georgia">Georgia</option>
            </select>

            <select
              value={options.position}
              onChange={(e) => handleChange({ position: e.target.value as TextOptionsType['position'] })}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            >
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>

          <input
            type="range"
            min={12}
            max={72}
            value={options.size}
            onChange={(e) => handleChange({ size: Number(e.target.value) })}
            className="w-full"
          />
          <span className="text-xs text-gray-500">{options.size}px</span>
        </div>
      )}
    </div>
  );
};

export default TextOptions;