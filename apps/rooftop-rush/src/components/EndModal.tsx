import { motion } from 'motion/react';
import { Trophy, RotateCw, ArrowRight, Home } from 'lucide-react';

interface Props {
  variant: 'floor-clear' | 'building-clear' | 'win' | 'lose';
  buildingName: string;
  floorIndex: number;
  rescuedCount: number;
  totalRescuable: number;
  timeMs: number;
  bestMs?: number;
  onContinue: () => void;
  onRetry: () => void;
  onTitle: () => void;
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${m}:${sec.toString().padStart(2, '0')}.${tenths}`;
}

export default function EndModal({
  variant, buildingName, floorIndex, rescuedCount, totalRescuable, timeMs, bestMs,
  onContinue, onRetry, onTitle,
}: Props) {
  const headline = {
    'floor-clear': 'Floor Cleared!',
    'building-clear': 'Building Cleared!',
    'win': 'You Made It!',
    'lose': 'The Water Got You',
  }[variant];

  const isFail = variant === 'lose';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 18 }}
        className="title-card rounded-2xl p-6 max-w-md w-full text-center"
      >
        <div className="text-5xl mb-2">
          {isFail ? '💧' : variant === 'win' ? '🎉' : '🚪'}
        </div>
        <h2 className="text-3xl font-black text-flood-foam mb-3">{headline}</h2>

        {!isFail && (
          <div className="text-white/80 text-sm mb-4 space-y-1">
            <div>{buildingName} · Floor {floorIndex + 1}</div>
            <div className="font-mono text-lg text-white">
              ⏱ {fmt(timeMs)}
              {bestMs != null && bestMs <= timeMs && bestMs !== timeMs && (
                <span className="text-white/50 text-xs ml-2">best {fmt(bestMs)}</span>
              )}
              {bestMs != null && bestMs >= timeMs && (
                <span className="text-yellow-300 text-xs ml-2 inline-flex items-center gap-1"><Trophy size={12}/>NEW BEST</span>
              )}
            </div>
            {totalRescuable > 0 && (
              <div className="text-white">
                Rescued {rescuedCount} of {totalRescuable} {totalRescuable === 1 ? 'neighbor' : 'neighbors'}
              </div>
            )}
          </div>
        )}

        {isFail && (
          <p className="text-white/80 text-sm mb-4">
            The flood reached you. Try again — be quicker this time!
          </p>
        )}

        <div className="flex flex-col gap-2">
          {(variant === 'floor-clear' || variant === 'building-clear') && (
            <button
              onClick={onContinue}
              className="bg-flood-foam text-flood-deep font-bold rounded-full px-6 py-3 flex items-center justify-center gap-2 hover:scale-105 transition"
            >
              <ArrowRight size={18} />
              {variant === 'building-clear' ? 'Next Building' : 'Next Floor'}
            </button>
          )}
          {variant === 'win' && (
            <button
              onClick={onTitle}
              className="bg-flood-foam text-flood-deep font-bold rounded-full px-6 py-3 flex items-center justify-center gap-2 hover:scale-105 transition"
            >
              <Home size={18} /> Back to Title
            </button>
          )}
          {variant === 'lose' && (
            <button
              onClick={onRetry}
              className="bg-flood-foam text-flood-deep font-bold rounded-full px-6 py-3 flex items-center justify-center gap-2 hover:scale-105 transition"
            >
              <RotateCw size={18} /> Try Again
              <span className="ml-2 text-xs font-mono bg-flood-deep/20 text-flood-deep rounded px-2 py-0.5">Space</span>
            </button>
          )}
          {variant !== 'win' && (
            <button
              onClick={onTitle}
              className="text-white/70 hover:text-white text-sm py-2"
            >
              Title screen
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
