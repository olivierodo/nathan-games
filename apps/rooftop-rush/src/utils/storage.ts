import { STORAGE_KEY } from '../constants';
import { PersistedProgress } from '../types';

const DEFAULT: PersistedProgress = {
  unlockedBuildingIndex: 0,
  unlockedFloorIndex: 0,
  bestTimes: {},
};

export function loadProgress(): PersistedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw);
    return {
      unlockedBuildingIndex: typeof parsed.unlockedBuildingIndex === 'number' ? parsed.unlockedBuildingIndex : 0,
      unlockedFloorIndex: typeof parsed.unlockedFloorIndex === 'number' ? parsed.unlockedFloorIndex : 0,
      bestTimes: parsed.bestTimes && typeof parsed.bestTimes === 'object' ? parsed.bestTimes : {},
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveProgress(progress: PersistedProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore quota / private mode errors
  }
}

export function recordBestTime(progress: PersistedProgress, floorId: string, timeMs: number): PersistedProgress {
  const previous = progress.bestTimes[floorId];
  if (previous != null && previous <= timeMs) return progress;
  return {
    ...progress,
    bestTimes: { ...progress.bestTimes, [floorId]: timeMs },
  };
}

export function unlockNext(
  progress: PersistedProgress,
  buildingIndex: number,
  floorIndex: number,
  floorsPerBuilding: number,
  totalBuildings: number,
): PersistedProgress {
  let nextBuilding = buildingIndex;
  let nextFloor = floorIndex + 1;
  if (nextFloor >= floorsPerBuilding) {
    nextBuilding += 1;
    nextFloor = 0;
  }
  if (nextBuilding >= totalBuildings) {
    // Game complete — keep highest unlock at the last floor of the last building.
    nextBuilding = totalBuildings - 1;
    nextFloor = floorsPerBuilding - 1;
  }
  // Only advance forward; never roll back unlocks.
  if (
    nextBuilding > progress.unlockedBuildingIndex ||
    (nextBuilding === progress.unlockedBuildingIndex && nextFloor > progress.unlockedFloorIndex)
  ) {
    return { ...progress, unlockedBuildingIndex: nextBuilding, unlockedFloorIndex: nextFloor };
  }
  return progress;
}
