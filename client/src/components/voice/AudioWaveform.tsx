import React from 'react';

interface AudioWaveformProps {
  active: boolean;
  color?: string;
  bars?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  active,
  color = 'bg-indigo-500',
  bars = 16,
}) => {
  return (
    <div className="flex items-center justify-center gap-1.5 h-12 px-4 py-2">
      {Array.from({ length: bars }).map((_, index) => {
        // Generate varying animation delay and height
        const delay = (index % 5) * 0.15;
        const baseHeight = 6;
        const maxHeight = active ? 32 + (index % 4) * 8 : baseHeight;

        return (
          <span
            key={index}
            className={`w-1 rounded-full transition-all duration-300 ${color} ${
              active ? 'animate-pulse' : 'opacity-40'
            }`}
            style={{
              height: active ? `${maxHeight}px` : `${baseHeight}px`,
              animationDelay: `${delay}s`,
              animationDuration: active ? '0.7s' : '1.5s',
            }}
          />
        );
      })}
    </div>
  );
};

