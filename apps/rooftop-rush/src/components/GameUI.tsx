import { Heart, Users, Timer, Building2 } from 'lucide-react';
import { BuildingData, FloorData } from '../types';

interface Props {
  building: BuildingData;
  floor: FloorData;
  totalRescuable: number;
  rescuedCount: number;
  elapsedSeconds: number;
  waterRiseSeconds: number;
}

function formatTime(s: number): string {
  const minutes = Math.floor(s / 60);
  const seconds = Math.floor(s % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function GameUI({
  building,
  floor,
  totalRescuable,
  rescuedCount,
  elapsedSeconds,
  waterRiseSeconds,
}: Props) {
  const remaining = Math.max(0, waterRiseSeconds - elapsedSeconds);
  const danger = remaining < 8;

  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-black/30 backdrop-blur-sm pointer-events-none">
      <div className="flex items-center gap-2 text-white">
        <Building2 size={18} />
        <span className="font-mono uppercase tracking-wider text-sm">
          {building.name} · Floor {floor.floorIndex + 1}/3
        </span>
      </div>

      <div className={`flex items-center gap-2 font-mono text-lg ${danger ? 'text-red-300 animate-pulse' : 'text-white'}`}>
        <Timer size={18} />
        <span>{formatTime(remaining)}</span>
      </div>

      <div className="flex items-center gap-3 text-white">
        {totalRescuable > 0 && (
          <div className="flex items-center gap-1 font-mono text-sm">
            <Users size={16} />
            <span>{rescuedCount}/{totalRescuable}</span>
          </div>
        )}
        <div className="flex items-center gap-1 font-mono text-sm">
          <Heart size={16} className="text-red-400 fill-red-400" />
          <span>1</span>
        </div>
      </div>
    </div>
  );
}
