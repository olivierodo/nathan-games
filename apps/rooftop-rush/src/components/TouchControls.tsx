import { ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react';

interface Props {
  onLeftDown: () => void;
  onLeftUp: () => void;
  onRightDown: () => void;
  onRightUp: () => void;
  onJump: () => void;
}

export default function TouchControls({
  onLeftDown, onLeftUp, onRightDown, onRightUp, onJump,
}: Props) {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-30 flex items-end justify-between px-6 pointer-events-none">
      <div className="flex gap-3 pointer-events-auto">
        <button
          aria-label="Move left"
          className="touch-btn"
          onPointerDown={(e) => { e.preventDefault(); onLeftDown(); }}
          onPointerUp={onLeftUp}
          onPointerCancel={onLeftUp}
          onPointerLeave={onLeftUp}
        >
          <ChevronLeft size={36} />
        </button>
        <button
          aria-label="Move right"
          className="touch-btn"
          onPointerDown={(e) => { e.preventDefault(); onRightDown(); }}
          onPointerUp={onRightUp}
          onPointerCancel={onRightUp}
          onPointerLeave={onRightUp}
        >
          <ChevronRight size={36} />
        </button>
      </div>
      <div className="pointer-events-auto">
        <button
          aria-label="Jump"
          className="touch-btn"
          onPointerDown={(e) => { e.preventDefault(); onJump(); }}
        >
          <ArrowUp size={36} />
        </button>
      </div>
    </div>
  );
}
