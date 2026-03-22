import React from 'react';
import { motion } from 'motion/react';
import { User, HelpCircle } from 'lucide-react';

import { GRID_SIZE } from '../constants';

interface SurvivorProps {
  x: number;
  y: number;
  rotation: number;
  isFrozen: boolean;
  isStuck: boolean;
}

const Survivor: React.FC<SurvivorProps> = ({ x, y, rotation, isFrozen, isStuck }) => {
  return (
    <motion.div
      animate={{ 
        left: `${x * 100 / GRID_SIZE}%`, 
        top: `${y * 100 / GRID_SIZE}%`,
        rotate: rotation
      }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      className="absolute z-50 pointer-events-none flex items-center justify-center"
      style={{ width: `${100 / GRID_SIZE}%`, height: `${100 / GRID_SIZE}%` }}
    >
      <div className={`relative w-8 h-8 flex items-center justify-center ${isFrozen ? 'brightness-50' : ''}`}>
        {/* Human Character Visual */}
        <div className="relative w-full h-full flex flex-col items-center">
          {/* Head */}
          <div className="w-3 h-3 bg-orange-200 rounded-full border border-black/20 z-10" />
          {/* Body */}
          <div className="w-4 h-5 bg-blue-600 rounded-sm -mt-0.5 border border-black/20" />
          {/* Legs */}
          <div className="flex gap-0.5 -mt-0.5">
            <motion.div 
              animate={!isFrozen ? { rotate: [0, 20, -20, 0] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-1 h-2.5 bg-brown-700 rounded-full origin-top" 
            />
            <motion.div 
              animate={!isFrozen ? { rotate: [0, -20, 20, 0] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-1 h-2.5 bg-brown-700 rounded-full origin-top" 
            />
          </div>
          {/* Backpack */}
          <div className="absolute top-3 -left-0.5 w-1.5 h-3 bg-green-800 rounded-sm" />
        </div>
        
        {isStuck && (
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-8 -right-2 bg-black/80 border border-neon-pink rounded-full p-1"
          >
            <HelpCircle className="w-4 h-4 text-neon-pink animate-pulse" />
          </motion.div>
        )}

        {isFrozen && (
          <div className="absolute inset-0 bg-blue-400/30 blur-sm rounded-full" />
        )}
      </div>
    </motion.div>
  );
};

export default Survivor;
