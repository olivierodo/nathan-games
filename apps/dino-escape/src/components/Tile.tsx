import React from 'react';
import { TileData, TileType } from '../types';
import { motion } from 'motion/react';
import { RotateCw, Zap } from 'lucide-react';

interface TileProps {
  x: number;
  y: number;
  data: TileData;
  isPortal: boolean;
  isActivePortal?: boolean;
  isSpawnZone: boolean;
  canPlace?: boolean;
  onPlace: (x: number, y: number) => void;
  onRotate: (x: number, y: number) => void;
  onTogglePortal: (x: number, y: number) => void;
  cooldownRotate: number;
  cooldownPortal: number;
}

const Tile: React.FC<TileProps> = ({
  x, y, data, isPortal, isActivePortal, isSpawnZone, canPlace,
  onPlace, onRotate, onTogglePortal,
  cooldownRotate, cooldownPortal
}) => {
  const isOccupied = data.isOccupied;

  const renderTileContent = () => {
    if (isSpawnZone) {
      return (
        <div className="w-full h-full bg-green-900/40 flex items-center justify-center border-2 border-mud-brown overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/grass.png')]" />
          <span className="text-[10px] text-green-400 font-bold uppercase tracking-tighter z-10">Clearing</span>
        </div>
      );
    }

    if (isPortal) {
      return (
        <div 
          onClick={() => onTogglePortal(x, y)}
          className={`w-full h-full flex items-center justify-center cursor-pointer transition-all duration-500 relative ${isActivePortal ? 'scale-110' : 'opacity-80'}`}
        >
          {/* Spaceship Visual */}
          <div className={`relative w-10 h-10 flex items-center justify-center transition-colors ${isActivePortal ? 'text-neon-blue' : 'text-gray-600'}`}>
            <div className="absolute w-10 h-4 bg-current rounded-full" />
            <div className="absolute w-6 h-6 bg-current rounded-full -top-1" />
            <div className={`absolute w-4 h-2 bg-white/40 rounded-full -top-0.5 ${isActivePortal ? 'animate-pulse' : ''}`} />
            {isActivePortal && (
              <div className="absolute -bottom-2 w-8 h-1 bg-neon-blue blur-sm animate-pulse" />
            )}
          </div>
        </div>
      );
    }

    if (!isOccupied) {
      return (
        <div 
          onClick={() => onPlace(x, y)}
          className={`w-full h-full cursor-crosshair flex items-center justify-center group transition-colors ${
            canPlace ? 'hover:bg-green-500/20' : 'hover:bg-red-500/10 cursor-not-allowed'
          }`}
        >
          <div className={`w-2 h-2 rounded-full group-hover:scale-150 transition-transform ${
            canPlace ? 'bg-green-400/30' : 'bg-red-500/20'
          }`} />
        </div>
      );
    }

    // Render Path Card (Jungle Path)
    return (
      <motion.div 
        animate={{ rotate: data.rotation }}
        className="w-full h-full relative path-dirt border border-mud-brown/60 flex items-center justify-center overflow-hidden"
      >
        {/* Path Visuals - Lighter and more defined */}
        {data.tileType === 'Straight' && (
          <div className="absolute w-[60%] h-full bg-[#6d4c41] shadow-[0_0_15px_rgba(109,76,65,0.4)] flex flex-col justify-around items-center border-x-2 border-mud-brown/40">
            <div className="w-full h-1 bg-green-900/40" />
            <div className="w-full h-1 bg-green-900/40" />
          </div>
        )}
        {data.tileType === 'L' && (
          <>
            <div className="absolute w-[60%] h-[80%] top-0 bg-[#6d4c41] border-x-2 border-mud-brown/40 shadow-[0_0_15px_rgba(109,76,65,0.4)]" />
            <div className="absolute h-[60%] w-[80%] right-0 bg-[#6d4c41] border-y-2 border-mud-brown/40 shadow-[0_0_15px_rgba(109,76,65,0.4)]" />
            <div className="absolute w-5 h-5 rounded-full bg-green-900/30 top-2 right-2 blur-[1px]" />
          </>
        )}
        {data.tileType === 'T' && (
          <>
            <div className="absolute w-[60%] h-[80%] top-0 bg-[#6d4c41] border-x-2 border-mud-brown/40 shadow-[0_0_15px_rgba(109,76,65,0.4)]" />
            <div className="absolute h-[60%] w-full bg-[#6d4c41] border-y-2 border-mud-brown/40 shadow-[0_0_15px_rgba(109,76,65,0.4)]" />
          </>
        )}
        {data.tileType === 'DeadEnd' && (
          <div className="absolute w-[60%] h-[70%] top-0 bg-[#6d4c41] rounded-b-3xl border-x-2 border-mud-brown/40 shadow-[0_0_15px_rgba(109,76,65,0.4)]" />
        )}

        {/* Vines decoration */}
        <div className="vine w-1 h-4 top-1 left-1 rotate-45" />
        <div className="vine w-1 h-3 bottom-2 right-1 -rotate-12" />

        {/* Rotate Tool */}
        <div 
          onClick={(e) => { e.stopPropagation(); onRotate(x, y); }}
          className="absolute bottom-1 right-1 p-1 rounded-full bg-black/60 hover:bg-green-500/40 cursor-pointer z-10"
        >
          <RotateCw className="w-3 h-3 text-green-400" />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full aspect-square border border-jungle-green/20 relative">
      {renderTileContent()}
    </div>
  );
};

export default Tile;
