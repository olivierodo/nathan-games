import React from 'react';
import { motion } from 'motion/react';
import { Tile, Entity, Player, Layer } from '../types';
import { Droplets, Mountain, Tent, Eye } from 'lucide-react';

import { GRID_COLS } from '../constants';

interface GridProps {
  grid: Tile[];
  player: Player;
  wolves: Entity[];
  moles: Entity[];
  layer: Layer;
  onTileClick?: (tile: Tile) => void;
}

export const Grid: React.FC<GridProps> = ({ grid, player, wolves, moles, layer }) => {
  return (
    <div 
      className="grid gap-0 bg-[#292524] p-2 rounded-none shadow-none border-[4px] border-[#a8a29e] w-full max-w-[85vmin] aspect-square mx-auto font-pixel"
      style={{ 
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
          imageRendering: 'pixelated'
      }}
    >
      {grid.map((tile) => {
        const isPlayerHere = player.position.x === tile.x && player.position.y === tile.y;
        
        // Check for enemies
        const isWolfHere = layer === 'surface' && wolves.some(w => w.position.x === tile.x && w.position.y === tile.y);
        
        // Mole visibility logic: Only visible if within 1 square or if we are underground
        const isMoleHere = layer === 'underground' && moles.some(m => m.position.x === tile.x && m.position.y === tile.y);
        
        // Check visibility for ANY mole on this tile
        let isMoleVisible = false;
        if (isMoleHere) {
             const moleOnTile = moles.find(m => m.position.x === tile.x && m.position.y === tile.y);
             if (moleOnTile) {
                const moleDist = Math.sqrt(Math.pow(moleOnTile.position.x - tile.x, 2) + Math.pow(moleOnTile.position.y - tile.y, 2));
                isMoleVisible = moleDist <= 1.5 || (Math.abs(player.position.x - moleOnTile.position.x) <= 1 && Math.abs(player.position.y - moleOnTile.position.y) <= 1);
             }
        }

        // Terrain Styles
        let bgClass = layer === 'surface' ? 'bg-[#4ade80]' : 'bg-[#581c87]'; // Pixel Green / Pixel Purple
        let borderClass = 'border-black/10';

        if (tile.type === 'goal') bgClass = 'bg-[#2dd4bf]';
        if (tile.type === 'water-source') bgClass = 'bg-[#3b82f6]';
        if (tile.type === 'burrow') bgClass = layer === 'surface' ? 'bg-[#92400e]' : 'bg-[#78350f]';
        if (tile.type === 'checkpoint') bgClass = 'bg-[#eab308]';

        // Predator Territory Warning (Yellow Outline)
        // Check if adjacent to a wolf
        let isNearWolf = false;
        if (layer === 'surface') {
            isNearWolf = wolves.some(w => Math.abs(w.position.x - tile.x) <= 1 && Math.abs(w.position.y - tile.y) <= 1);
            if (isNearWolf) borderClass = 'border-yellow-500 border-2';
        }

        // Reachable Tiles Logic
        const moveCost = layer === 'surface' ? 1 : 0.5;
        const maxMoves = Math.floor(player.water / moveCost);
        const distToPlayer = Math.abs(player.position.x - tile.x) + Math.abs(player.position.y - tile.y);
        const isReachable = distToPlayer <= maxMoves && distToPlayer > 0;

        return (
          <div
            key={`${tile.x}-${tile.y}`}
            className={`w-full h-full flex items-center justify-center relative ${bgClass} ${borderClass}`}
            style={{
                imageRendering: 'pixelated',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' // Grid lines
            }}
          >
            {/* Reachable Overlay */}
            {isReachable && (
                <div className="absolute inset-0 pointer-events-none bg-white/20" />
            )}

            {/* Tile Icons - Pixel Style */}
            {tile.type === 'water-source' && <div className="w-3 h-3 bg-blue-200 animate-pulse" style={{ boxShadow: '2px 2px 0 rgba(0,0,0,0.2)' }} />}
            {tile.type === 'goal' && <div className="w-4 h-4 bg-white rotate-45" style={{ border: '2px solid black' }} />}
            {tile.type === 'burrow' && <div className="w-4 h-4 bg-black/60 rounded-none" />}
            {tile.type === 'checkpoint' && <div className="w-3 h-3 bg-yellow-200" style={{ border: '1px solid black' }} />}

            {/* Entities */}
            {isPlayerHere && (
              <motion.div
                layoutId="player"
                className="absolute z-20"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className={`w-5 h-5 ${player.water < 5 ? 'bg-gray-500' : 'bg-orange-500'}`} style={{ 
                    boxShadow: '2px 2px 0 rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.5)',
                    border: '1px solid black'
                }}>
                    {/* Pixel Eyes */}
                    <div className="absolute top-1 left-1 w-1 h-1 bg-black" />
                    <div className="absolute top-1 right-1 w-1 h-1 bg-black" />
                </div>
              </motion.div>
            )}

            {isWolfHere && (
              <motion.div
                className="absolute z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <div className="w-5 h-5 bg-red-600 relative" style={{ 
                    boxShadow: '2px 2px 0 rgba(0,0,0,0.5)',
                    border: '1px solid black'
                }}>
                    <div className="absolute top-1 left-1 w-1 h-1 bg-yellow-300" />
                    <div className="absolute top-1 right-1 w-1 h-1 bg-yellow-300" />
                    <div className="absolute bottom-1 left-1.5 w-2 h-1 bg-black" />
                    
                    {/* Wolf Howl Visual if near player */}
                    {Math.abs(player.position.x - tile.x) <= 2 && Math.abs(player.position.y - tile.y) <= 2 && (
                        <div className="absolute -top-2 left-1 text-[8px] font-bold text-red-600 animate-bounce">!</div>
                    )}
                </div>
              </motion.div>
            )}

            {isMoleVisible && (
               <motion.div
               className="absolute z-10"
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
             >
               <div className="w-5 h-5 bg-pink-600 relative" style={{ 
                    boxShadow: '2px 2px 0 rgba(0,0,0,0.5)',
                    border: '1px solid black'
                }}>
                   <div className="absolute top-1.5 left-0.5 w-4 h-1 bg-black opacity-50" /> {/* Sunglasses */}
               </div>
             </motion.div>
            )}
            
            {/* Hidden Mole Hint (Dirt Mound) */}
            {isMoleHere && !isMoleVisible && (
                <div className="absolute w-3 h-3 bg-stone-800/50" />
            )}

          </div>
        );
      })}
    </div>
  );
};
