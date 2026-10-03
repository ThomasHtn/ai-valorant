import { RoundEvent } from '@core/report/rounds.model';
import { MinimapMarker } from '@shared/minimap-canvas/minimap-canvas.model';

const SQUAD = 'var(--color-squad)';
const OPPONENT = 'var(--color-opponent)';
const VICTIM = 'var(--color-rating-bad)';

/**
 * Players of the replay at one event: living players as dots (squad blue, opponents orange), the
 * actor ringed in amber, the victim as a red cross. Squad names and the actor's name are written;
 * opponents stay anonymous to keep the map readable.
 */
export function replayMarkers(event: RoundEvent | undefined): MinimapMarker[] {
  if (!event) {
    return [];
  }
  return event.positions.flatMap((p): MinimapMarker[] => {
    if (!p.alive) {
      return p.name === event.target
        ? [
            {
              id: `x-${p.name}`,
              x: p.x,
              y: p.y,
              shape: 'cross',
              color: VICTIM,
              label: p.name,
              labelColor: VICTIM,
            },
          ]
        : [];
    }
    const actor = p.name === event.actor;
    return [
      {
        id: p.name,
        x: p.x,
        y: p.y,
        shape: 'player',
        color: p.squad ? SQUAD : OPPONENT,
        emphasis: actor,
        label: p.squad || actor ? p.name : undefined,
      },
    ];
  });
}

/** Keeps a step inside the events of the round. */
export function clampStep(step: number, count: number): number {
  return Math.max(0, Math.min(count - 1, step));
}
