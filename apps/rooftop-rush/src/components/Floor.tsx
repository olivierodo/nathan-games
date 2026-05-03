import { motion } from 'motion/react';
import { DEBRIS_FALL_SPEED, DEBRIS_RESPAWN_GAP, DEBRIS_SIZE, FLOOR_HEIGHT } from '../constants';
import { FloorData, HazardData } from '../types';

interface Props {
  floor: FloorData;
  waterTopY: number;
  rescuedNpcIds: Set<string>;
  elapsedSeconds: number;
}

export function debrisYAt(hazard: HazardData, elapsedSeconds: number): number {
  // Cycle: total fall distance ≈ FLOOR_HEIGHT + DEBRIS_SIZE + 40 buffer
  const fallDistance = FLOOR_HEIGHT + DEBRIS_SIZE + 40;
  const cycle = fallDistance / DEBRIS_FALL_SPEED + DEBRIS_RESPAWN_GAP;
  const t = ((elapsedSeconds + (hazard.phase ?? 0) * cycle) % cycle + cycle) % cycle;
  if (t < fallDistance / DEBRIS_FALL_SPEED) {
    return -DEBRIS_SIZE + t * DEBRIS_FALL_SPEED;
  }
  return -FLOOR_HEIGHT; // off-screen during respawn gap
}

export default function Floor({ floor, waterTopY, rescuedNpcIds, elapsedSeconds }: Props) {
  return (
    <>
      {/* Background ambience */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* simple windows pattern */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,226,122,0.4) 0 2px, transparent 2px 70px), repeating-linear-gradient(90deg, rgba(255,226,122,0.0) 0 60px, rgba(255,226,122,0.4) 60px 62px)',
          }}
        />
      </div>

      {/* Platforms */}
      {floor.platforms.map((plat, i) => {
        const isGround = plat.y >= FLOOR_HEIGHT - 30;
        return (
          <div
            key={`p-${i}`}
            className={`absolute ${isGround ? 'ground' : 'platform'} rounded-sm`}
            style={{ left: plat.x, top: plat.y, width: plat.width, height: plat.height }}
          />
        );
      })}

      {/* Static hazards: wires, spikes */}
      {floor.hazards.filter((h) => h.type !== 'debris').map((h) => {
        if (h.type === 'wire') {
          return (
            <div
              key={h.id}
              className="absolute wire-hazard"
              style={{ left: h.x, top: h.y, width: h.width, height: h.height }}
            />
          );
        }
        return (
          <div
            key={h.id}
            className="absolute spike-hazard"
            style={{ left: h.x, top: h.y, width: h.width, height: h.height }}
          />
        );
      })}

      {/* Falling debris */}
      {floor.hazards.filter((h) => h.type === 'debris').map((h) => {
        const y = debrisYAt(h, elapsedSeconds);
        return (
          <div
            key={h.id}
            className="absolute debris-hazard"
            style={{ left: h.x, top: y, width: h.width, height: h.height }}
          />
        );
      })}

      {/* NPCs */}
      {floor.npcs.map((npc) => {
        if (rescuedNpcIds.has(npc.id)) return null;
        return (
          <div
            key={npc.id}
            className="absolute npc-wave"
            style={{ left: npc.x, top: npc.y, fontSize: 28, lineHeight: '28px' }}
            aria-label="Trapped neighbor"
          >
            <span>{npc.emoji}</span>
          </div>
        );
      })}

      {/* Exit / staircase */}
      <div
        className="absolute staircase staircase-pulse rounded-md flex items-center justify-center"
        style={{
          left: floor.exit.x,
          top: floor.exit.y,
          width: floor.exit.width,
          height: floor.exit.height,
        }}
      >
        <span style={{ fontSize: 32 }}>🚪</span>
      </div>

      {/* Water (rising from the bottom) */}
      <motion.div
        className="absolute left-0 right-0 water-surface water-bob"
        style={{ top: waterTopY, height: FLOOR_HEIGHT - waterTopY + 40 }}
        aria-hidden="true"
      />
    </>
  );
}
