import React from 'react';
import { Rocket, Skull, Footprints, Brain, Zap, HelpCircle } from 'lucide-react';

export const AlienIcon = ({ className }: { className?: string }) => (
  <Skull className={`text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] ${className}`} />
);

export const MudIcon = ({ className }: { className?: string }) => (
  <div className={`text-amber-700 ${className}`}>
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8 8 8z"/>
      <circle cx="8" cy="14" r="2" />
      <circle cx="12" cy="10" r="3" />
      <circle cx="16" cy="15" r="1.5" />
    </svg>
  </div>
);

export const ShoeIcon = ({ className }: { className?: string }) => (
  <Zap className={`text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] ${className}`} />
);

export const TriviaIcon = ({ className }: { className?: string }) => (
  <Brain className={`text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)] ${className}`} />
);
