import { PLAYER_HEIGHT, PLAYER_WIDTH } from '../constants';
import { PlayerState } from '../types';

interface Props {
  player: PlayerState;
  isMoving: boolean;
}

export default function Player({ player, isMoving }: Props) {
  const flip = player.facing === -1 ? -1 : 1;
  return (
    <div
      className="absolute pointer-events-none player-shadow"
      style={{
        left: 0,
        top: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        transform: `translate(${player.x}px, ${player.y}px) scaleX(${flip})`,
      }}
    >
      <div
        className={`relative w-full h-full ${isMoving && player.onGround ? 'player-walking' : ''}`}
        style={{ fontSize: 36, lineHeight: '44px', textAlign: 'center' }}
      >
        <span style={{ display: 'inline-block' }}>🧑‍🔬</span>
      </div>
    </div>
  );
}
