import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FLOOR_HEIGHT, FLOOR_WIDTH } from './constants';
import { BUILDINGS, FLOORS_PER_BUILDING, TOTAL_BUILDINGS, getFloor } from './levels';
import { GameStatus, PersistedProgress, PlayerState } from './types';
import { stepPlayer, InputState } from './utils/physics';
import {
  playerHazardHit,
  playerInWater,
  playerReachedExit,
  playerTouchedNpc,
} from './utils/collision';
import { loadProgress, recordBestTime, saveProgress, unlockNext } from './utils/storage';
import Player from './components/Player';
import Floor, { debrisYAt } from './components/Floor';
import GameUI from './components/GameUI';
import TouchControls from './components/TouchControls';
import TitleScreen from './components/TitleScreen';
import EndModal from './components/EndModal';

function detectTouch(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    (navigator as any).maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

function freshPlayer(spawn: { x: number; y: number }): PlayerState {
  return {
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
  };
}

interface ActiveRun {
  buildingIndex: number;
  floorIndex: number;
  startedAt: number;
  rescued: Set<string>;
  finishedTimeMs?: number;
}

export default function App() {
  const [status, setStatus] = useState<GameStatus>('title');
  const [progress, setProgress] = useState<PersistedProgress>(() => loadProgress());
  const [run, setRun] = useState<ActiveRun | null>(null);
  const [hitFlash, setHitFlash] = useState(false);
  const [, forceRender] = useState(0);
  const [isTouch, setIsTouch] = useState(false);

  // Mutable physics / loop state (refs to avoid re-renders every frame)
  const playerRef = useRef<PlayerState>({ x: 0, y: 0, vx: 0, vy: 0, facing: 1, onGround: false });
  const inputRef = useRef<{ left: boolean; right: boolean; jumpQueued: boolean }>({
    left: false, right: false, jumpQueued: false,
  });
  const elapsedRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const statusRef = useRef<GameStatus>('title');
  const runRef = useRef<ActiveRun | null>(null);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { runRef.current = run; }, [run]);

  useEffect(() => {
    setIsTouch(detectTouch());
  }, []);

  const currentFloor = useMemo(() => {
    if (!run) return null;
    return getFloor(run.buildingIndex, run.floorIndex);
  }, [run]);
  const currentBuilding = run ? BUILDINGS[run.buildingIndex] : null;

  // ---------- Lifecycle: starting / restarting a floor ----------

  const startFloor = useCallback((buildingIndex: number, floorIndex: number) => {
    const floor = getFloor(buildingIndex, floorIndex);
    playerRef.current = freshPlayer(floor.spawn);
    elapsedRef.current = 0;
    lastFrameRef.current = null;
    inputRef.current = { left: false, right: false, jumpQueued: false };
    setRun({
      buildingIndex,
      floorIndex,
      startedAt: performance.now(),
      rescued: new Set(),
    });
    setStatus('playing');
    setHitFlash(false);
  }, []);

  const handleFail = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    setStatus('lose');
    setHitFlash(true);
    setTimeout(() => setHitFlash(false), 360);
  }, []);

  const handleFloorClear = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    const r = runRef.current;
    if (!r) return;
    const floor = getFloor(r.buildingIndex, r.floorIndex);
    const timeMs = performance.now() - r.startedAt;
    setRun({ ...r, finishedTimeMs: timeMs });
    setProgress((prev) => {
      const withBest = recordBestTime(prev, floor.id, timeMs);
      const advanced = unlockNext(withBest, r.buildingIndex, r.floorIndex, FLOORS_PER_BUILDING, TOTAL_BUILDINGS);
      saveProgress(advanced);
      return advanced;
    });

    const isLastFloor = r.floorIndex === FLOORS_PER_BUILDING - 1;
    const isLastBuilding = r.buildingIndex === TOTAL_BUILDINGS - 1;
    if (isLastFloor && isLastBuilding) setStatus('win');
    else if (isLastFloor) setStatus('building-clear');
    else setStatus('floor-clear');
  }, []);

  // ---------- Game loop ----------

  useEffect(() => {
    function loop(now: number) {
      rafRef.current = requestAnimationFrame(loop);
      if (lastFrameRef.current == null) lastFrameRef.current = now;
      const dt = Math.min((now - lastFrameRef.current) / 1000, 1 / 30); // clamp
      lastFrameRef.current = now;

      if (statusRef.current !== 'playing') return;
      const r = runRef.current;
      if (!r) return;
      const floor = getFloor(r.buildingIndex, r.floorIndex);

      elapsedRef.current += dt;

      // --- Step physics
      const inputState: InputState = {
        left: inputRef.current.left,
        right: inputRef.current.right,
        jumpPressed: inputRef.current.jumpQueued,
      };
      inputRef.current.jumpQueued = false;

      playerRef.current = stepPlayer(
        playerRef.current,
        inputState,
        floor.platforms,
        FLOOR_WIDTH,
        FLOOR_HEIGHT,
        dt,
      );

      // --- Water level
      const waterTopY = waterTopYAt(elapsedRef.current, floor.waterRiseSeconds);
      if (playerInWater(playerRef.current, waterTopY)) {
        handleFail();
        return;
      }

      // --- Hazards
      for (const h of floor.hazards) {
        const hy = h.type === 'debris' ? debrisYAt(h, elapsedRef.current) : h.y;
        if (hy < -h.height - 4) continue;
        if (playerHazardHit(playerRef.current, h, hy)) {
          handleFail();
          return;
        }
      }

      // --- NPC rescue
      let rescuedNew: Set<string> | null = null;
      for (const n of floor.npcs) {
        if (r.rescued.has(n.id)) continue;
        if (playerTouchedNpc(playerRef.current, n)) {
          rescuedNew = rescuedNew ?? new Set(r.rescued);
          rescuedNew.add(n.id);
        }
      }
      if (rescuedNew) {
        runRef.current = { ...r, rescued: rescuedNew };
        setRun(runRef.current);
      }

      // --- Exit reached
      if (playerReachedExit(playerRef.current, floor.exit)) {
        handleFloorClear();
        return;
      }

      // Trigger a render every frame so the player and water position update
      forceRender((n) => (n + 1) & 0xffff);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastFrameRef.current = null;
    };
  }, [handleFail, handleFloorClear]);

  // ---------- Keyboard input ----------

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') inputRef.current.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') inputRef.current.right = true;
        return;
      }
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          inputRef.current.left = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          inputRef.current.right = true;
          break;
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          if (e.code === 'Space' && statusRef.current === 'lose') {
            const r = runRef.current;
            if (r) startFloor(r.buildingIndex, r.floorIndex);
            return;
          }
          inputRef.current.jumpQueued = true;
          break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          inputRef.current.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          inputRef.current.right = false;
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [startFloor]);

  // ---------- Touch handlers ----------

  const onTouchLeftDown = useCallback(() => { inputRef.current.left = true; }, []);
  const onTouchLeftUp = useCallback(() => { inputRef.current.left = false; }, []);
  const onTouchRightDown = useCallback(() => { inputRef.current.right = true; }, []);
  const onTouchRightUp = useCallback(() => { inputRef.current.right = false; }, []);
  const onTouchJump = useCallback(() => { inputRef.current.jumpQueued = true; }, []);

  // ---------- UI handlers ----------

  const handleResetProgress = useCallback(() => {
    const empty: PersistedProgress = { unlockedBuildingIndex: 0, unlockedFloorIndex: 0, bestTimes: {} };
    saveProgress(empty);
    setProgress(empty);
  }, []);

  const handleEndContinue = useCallback(() => {
    const r = runRef.current;
    if (!r) return;
    let nextBuilding = r.buildingIndex;
    let nextFloor = r.floorIndex + 1;
    if (nextFloor >= FLOORS_PER_BUILDING) {
      nextBuilding += 1;
      nextFloor = 0;
    }
    if (nextBuilding >= TOTAL_BUILDINGS) {
      // Last floor was just cleared and this should never fire for 'win'.
      setStatus('title');
      return;
    }
    startFloor(nextBuilding, nextFloor);
  }, [startFloor]);

  const handleEndRetry = useCallback(() => {
    const r = runRef.current;
    if (!r) return;
    startFloor(r.buildingIndex, r.floorIndex);
  }, [startFloor]);

  const handleEndTitle = useCallback(() => {
    setRun(null);
    setStatus('title');
  }, []);

  // ---------- Render ----------

  if (status === 'title' || !run || !currentFloor || !currentBuilding) {
    return (
      <div className="w-screen h-screen overflow-hidden">
        <TitleScreen
          progress={progress}
          onStart={(b, f) => startFloor(b, f)}
          onReset={handleResetProgress}
        />
      </div>
    );
  }

  const elapsed = elapsedRef.current;
  const waterTopY = waterTopYAt(elapsed, currentFloor.waterRiseSeconds);
  const totalRescuable = currentFloor.npcs.length;

  const showEnd = status === 'floor-clear' || status === 'building-clear' || status === 'win' || status === 'lose';

  return (
    <>
      <FittedStage themeClass={currentBuilding.themeClass} hitShake={hitFlash}>
        <Floor
          floor={currentFloor}
          waterTopY={waterTopY}
          rescuedNpcIds={run.rescued}
          elapsedSeconds={elapsed}
        />
        <Player
          player={playerRef.current}
          isMoving={inputRef.current.left || inputRef.current.right}
        />

        <GameUI
          building={currentBuilding}
          floor={currentFloor}
          totalRescuable={totalRescuable}
          rescuedCount={run.rescued.size}
          elapsedSeconds={elapsed}
          waterRiseSeconds={currentFloor.waterRiseSeconds}
        />

        {showEnd && (
          <EndModal
            variant={status as 'floor-clear' | 'building-clear' | 'win' | 'lose'}
            buildingName={currentBuilding.name}
            floorIndex={run.floorIndex}
            rescuedCount={run.rescued.size}
            totalRescuable={totalRescuable}
            timeMs={run.finishedTimeMs ?? performance.now() - run.startedAt}
            bestMs={progress.bestTimes[currentFloor.id]}
            onContinue={handleEndContinue}
            onRetry={handleEndRetry}
            onTitle={handleEndTitle}
          />
        )}
      </FittedStage>

      {isTouch && status === 'playing' && (
        <TouchControls
          onLeftDown={onTouchLeftDown}
          onLeftUp={onTouchLeftUp}
          onRightDown={onTouchRightDown}
          onRightUp={onTouchRightUp}
          onJump={onTouchJump}
        />
      )}
    </>
  );
}

// Wraps the world-coordinate game and CSS-scales it to fit the viewport while
// preserving aspect ratio. UI overlays inside (modals, HUD, touch controls) are
// rendered at the same scale so they look consistent.
function FittedStage({
  children,
  themeClass,
  hitShake,
}: {
  children: React.ReactNode;
  themeClass: string;
  hitShake: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const s = Math.min(w / FLOOR_WIDTH, h / FLOOR_HEIGHT);
      setScale(Math.max(0.1, s));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('orientationchange', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return (
    <div ref={wrapperRef} className={`relative w-screen h-screen overflow-hidden ${themeClass}`}>
      <div
        className={`absolute top-1/2 left-1/2 floor-stage ${hitShake ? 'hit-shake' : ''}`}
        style={{
          width: FLOOR_WIDTH,
          height: FLOOR_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function waterTopYAt(elapsed: number, totalSeconds: number): number {
  // Water starts below the floor and reaches the top at totalSeconds.
  const startY = FLOOR_HEIGHT + 30; // start a bit below
  const endY = -20;                 // a bit above the top
  const t = Math.min(1, elapsed / totalSeconds);
  return startY + (endY - startY) * t;
}
