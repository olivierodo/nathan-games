import React from 'react';
import { SquareData, SquareType, Player } from '../types';
import { Package, Plane, Target, Bomb, Trophy, TreePine } from 'lucide-react';

interface SquareProps {
  data: SquareData;
  players: Player[];
  isCurrentTurn: boolean;
}

const Square: React.FC<SquareProps> = ({ data, players, isCurrentTurn }) => {
  const getIcon = () => {
    switch (data.type) {
      case SquareType.CHEST: return <Package className="text-amber-500 w-5 h-5 md:w-8 md:h-8 drop-shadow-sm" />;
      case SquareType.PLANE: return <Plane className="text-sky-500 w-5 h-5 md:w-8 md:h-8 drop-shadow-sm" />;
      case SquareType.MISSILE: return <Target className={`${data.used ? 'text-stone-300' : 'text-rose-500'} w-5 h-5 md:w-8 md:h-8 drop-shadow-sm`} />;
      case SquareType.BOMB: return <Bomb className={`${data.used ? 'text-stone-300' : 'text-stone-800'} w-5 h-5 md:w-8 md:h-8 drop-shadow-sm`} />;
      case SquareType.START: return <TreePine className="text-emerald-600 w-5 h-5 md:w-8 md:h-8" />;
      case SquareType.FINISH: return <Trophy className="text-yellow-500 w-6 h-6 md:w-10 md:h-10 animate-pulse" />;
      default: return null;
    }
  };

  const isPath = [SquareType.START, SquareType.FINISH, SquareType.NORMAL].includes(data.type);
  const bgColor = isPath 
    ? (data.id % 2 === 0 ? 'bg-emerald-100' : 'bg-emerald-50')
    : 'bg-orange-50';
    
  const highlight = isCurrentTurn ? 'ring-8 ring-yellow-400 z-10 scale-110 shadow-2xl border-white' : 'border-emerald-200/50 hover:border-emerald-300';

  const presentPlayers = players.filter(p => p.position === data.id && !p.isEliminated);

  return (
    <div className={`relative aspect-square rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center justify-center border-4 ${bgColor} ${highlight} transition-all duration-500 group overflow-hidden shadow-sm`}>
      <span className="absolute top-2 left-3 text-[10px] md:text-xs text-emerald-800/30 font-black">{data.id}</span>
      
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/felt.png')]" />

      <div className="z-10 flex flex-col items-center p-2">
        {getIcon()}
        {data.name && <span className="text-[6px] md:text-[9px] text-sky-600 font-black uppercase mt-1 text-center px-1 leading-tight">{data.name}</span>}
      </div>

      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 p-2 z-20 pointer-events-none">
        {presentPlayers.map((p, idx) => (
          <div 
            key={p.id} 
            className={`w-5 h-5 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-lg shadow-lg ${p.color} border-2 border-white transition-all duration-500 animate-in zoom-in slide-in-from-bottom-2`}
            style={{ 
              zIndex: 30 + idx,
              transform: presentPlayers.length > 1 ? `translate(${(idx - (presentPlayers.length-1)/2) * 4}px, ${(idx % 2 === 0 ? -4 : 4)}px)` : 'none'
            }}
            title={p.name}
          >
            {p.emoji}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Square;