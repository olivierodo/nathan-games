import React from 'react';
import { TileType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Volume2, RotateCw, Zap } from 'lucide-react';

interface GameUIProps {
  deckCount: number;
  hand: (TileType | null)[];
  selectedCardIndex: number | null;
  onSelectCard: (index: number) => void;
  onRoar: () => void;
  roarCooldown: number;
  gameStatus: string;
  onRestart: () => void;
  turn: 'player' | 'ai';
}

export const TurnIndicator: React.FC<{ turn: 'player' | 'ai' }> = ({ turn }) => (
  <div className="mb-4">
    <motion.div
      key={turn}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`px-6 py-2 rounded-full border-2 font-bold uppercase tracking-[0.2em] text-sm shadow-lg ${
        turn === 'player' 
          ? 'border-neon-blue text-neon-blue bg-black/80 shadow-neon-blue/20' 
          : 'border-neon-pink text-neon-pink bg-black/80 shadow-neon-pink/20 animate-pulse'
      }`}
    >
      {turn === 'player' ? 'Your Turn' : 'Dino Thinking...'}
    </motion.div>
  </div>
);

export const GameOverOverlay: React.FC<{ gameStatus: string, onRestart: () => void }> = ({ gameStatus, onRestart }) => (
  <AnimatePresence>
    {gameStatus !== 'playing' && (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="bg-black border-2 border-neon-blue p-8 rounded-2xl text-center shadow-[0_0_50px_rgba(0,243,255,0.3)] max-w-md w-full"
        >
          <h2 className="text-4xl font-bold mb-4 uppercase tracking-widest text-neon-blue">
            {gameStatus === 'dino-win' ? 'Caught by Dino!' : 'Escaped!'}
          </h2>
          <p className="text-gray-400 mb-6">
            {gameStatus === 'dino-win' ? 'The dinosaur caught the survivor in the dense jungle.' : 
             gameStatus === 'human-win-escape' ? 'The survivor reached the rescue portal and escaped!' : 
             'The survivor is lost, but you ran out of resources.'}
          </p>
          <button 
            onClick={onRestart}
            className="px-8 py-3 bg-neon-blue text-black font-bold rounded-lg hover:bg-white transition-colors uppercase w-full"
          >
            Play Again
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const Hand: React.FC<{ 
  hand: (TileType | null)[], 
  selectedCardIndex: number | null, 
  onSelectCard: (index: number) => void,
  deckCount: number
}> = ({ hand, selectedCardIndex, onSelectCard, deckCount }) => (
  <div className="flex flex-col gap-4 items-center">
    {/* Deck */}
    <div className="dino-ui flex flex-col items-center gap-1 w-24 p-3 rounded-xl border border-mud-brown/40 bg-black/40">
      <Layers className="text-mud-brown" />
      <span className="text-2xl font-bold font-mono text-neon-blue">{deckCount}</span>
      <span className="text-[10px] uppercase opacity-60">Deck</span>
    </div>

    {/* Cards */}
    <div className="flex flex-col gap-3">
      {hand.map((type, i) => (
        <motion.div
          key={i}
          whileHover={{ x: 10, scale: 1.05 }}
          onClick={() => type && onSelectCard(i)}
          className={`w-24 h-32 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
            selectedCardIndex === i ? 'border-neon-blue bg-neon-blue/20 tile-glow' : 'border-gray-600 bg-gray-800/50'
          }`}
        >
          {type ? (
            <>
              <div className="text-[10px] uppercase font-mono mb-2 opacity-60 text-center px-1">{type}</div>
              <div className="w-12 h-12 relative border border-gray-500 rounded bg-black/20">
                {type === 'Straight' && <div className="absolute w-2 h-full bg-gray-400 left-1/2 -translate-x-1/2" />}
                {type === 'L' && <><div className="absolute w-2 h-[60%] bg-gray-400 left-1/2 -translate-x-1/2 top-0" /><div className="absolute h-2 w-[60%] bg-gray-400 top-1/2 -translate-y-1/2 right-0" /></>}
                {type === 'T' && <><div className="absolute w-2 h-[60%] bg-gray-400 left-1/2 -translate-x-1/2 top-0" /><div className="absolute h-2 w-full bg-gray-400 top-1/2 -translate-y-1/2" /></>}
                {type === 'DeadEnd' && <div className="absolute w-2 h-[50%] bg-gray-400 left-1/2 -translate-x-1/2 top-0 rounded-b-full" />}
              </div>
            </>
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-600 animate-spin" />
          )}
        </motion.div>
      ))}
    </div>
  </div>
);

export const Controls: React.FC<{ 
  onRoar: () => void, 
  onRestart: () => void,
  roarCooldown: number
}> = ({ onRoar, onRestart, roarCooldown }) => (
  <div className="flex flex-col gap-6 items-center">
    <div className="flex flex-col items-center gap-2">
      <button 
        onClick={onRoar}
        disabled={roarCooldown > 0}
        className={`p-5 rounded-full border-2 flex items-center justify-center transition-all relative ${
          roarCooldown > 0 ? 'border-gray-700 text-gray-700' : 'border-neon-pink text-neon-pink hover:bg-neon-pink/20 shadow-[0_0_15px_rgba(255,0,255,0.2)]'
        }`}
      >
        <Volume2 className="w-8 h-8" />
        {roarCooldown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full text-[10px] font-bold">
            {Math.ceil(roarCooldown / 1000)}s
          </div>
        )}
      </button>
      <span className="text-[10px] uppercase text-center text-neon-pink font-bold tracking-widest">Dino Roar</span>
    </div>
    
    <div className="flex flex-col items-center gap-2">
      <button 
        onClick={onRestart}
        className="p-5 rounded-full border-2 border-neon-blue text-neon-blue hover:bg-neon-blue/20 transition-all shadow-[0_0_15px_rgba(0,243,255,0.2)]"
        title="Restart Game"
      >
        <RotateCw className="w-8 h-8" />
      </button>
      <span className="text-[10px] uppercase text-center text-neon-blue font-bold tracking-widest">Restart</span>
    </div>
  </div>
);


