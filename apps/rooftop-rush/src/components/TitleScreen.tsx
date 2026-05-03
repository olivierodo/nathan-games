import { Play, RotateCcw } from 'lucide-react';
import { BUILDINGS, FLOORS_PER_BUILDING } from '../levels';
import { PersistedProgress } from '../types';

interface Props {
  progress: PersistedProgress;
  onStart: (buildingIndex: number, floorIndex: number) => void;
  onReset: () => void;
}

export default function TitleScreen({ progress, onStart, onReset }: Props) {
  const continueB = progress.unlockedBuildingIndex;
  const continueF = progress.unlockedFloorIndex;
  const hasProgress = continueB > 0 || continueF > 0;

  return (
    <div className="relative w-full h-full flex items-center justify-center p-6">
      <div className="title-card rounded-2xl p-8 max-w-2xl w-full text-center">
        <h1 className="text-5xl md:text-6xl font-black title-pulse text-flood-foam tracking-tight mb-2">
          Rooftop Rush
        </h1>
        <p className="text-white/80 text-base md:text-lg mb-8 max-w-md mx-auto">
          Your science experiment caused the flood. Climb to the rooftop before the water catches up — and save your neighbors on the way!
        </p>

        <div className="flex flex-col gap-3 items-center mb-6">
          <button
            className="bg-flood-foam text-flood-deep font-bold rounded-full px-8 py-4 text-lg flex items-center gap-2 hover:scale-105 transition shadow-lg"
            onClick={() => onStart(hasProgress ? continueB : 0, hasProgress ? continueF : 0)}
          >
            <Play size={20} />
            {hasProgress
              ? `Continue · ${BUILDINGS[continueB].name} · Floor ${continueF + 1}`
              : 'Start'}
          </button>

          {hasProgress && (
            <button
              className="text-white/70 hover:text-white text-sm flex items-center gap-1"
              onClick={onReset}
            >
              <RotateCcw size={14} />
              Reset progress
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-left">
          {BUILDINGS.map((b, bi) => {
            const unlocked =
              bi < progress.unlockedBuildingIndex ||
              (bi === progress.unlockedBuildingIndex);
            return (
              <div
                key={b.id}
                className={`rounded-xl p-3 border-2 ${unlocked ? 'border-white/50 bg-white/10' : 'border-white/20 bg-white/5 opacity-50'}`}
              >
                <div className="text-3xl mb-1">{b.emoji}</div>
                <div className="text-white font-bold text-sm">{b.name}</div>
                <div className="text-xs text-white/70 mt-1">
                  {Array.from({ length: FLOORS_PER_BUILDING }).map((_, fi) => {
                    const floorUnlocked =
                      bi < progress.unlockedBuildingIndex ||
                      (bi === progress.unlockedBuildingIndex && fi <= progress.unlockedFloorIndex);
                    return (
                      <button
                        key={fi}
                        disabled={!floorUnlocked}
                        onClick={() => floorUnlocked && onStart(bi, fi)}
                        className={`inline-block mr-1 px-2 py-0.5 rounded ${floorUnlocked ? 'bg-flood-foam/30 text-white hover:bg-flood-foam/60' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
                      >
                        {fi + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-white/50 text-xs mt-6">
          Keyboard: ←/→ to move · Space to jump · On touch, use the on-screen buttons.
        </p>
      </div>
    </div>
  );
}
