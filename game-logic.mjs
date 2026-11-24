const edge = 3.3;
const speed = 0.0028;
const roundLimit = 8000;
const dropDuration = 275;
const catchRadius = 0.52;

export const initialRound = { phase: 'ready', elapsed: 0, x: -edge, fall: 0 };

export function startRound() {
  return { ...initialRound, phase: 'running' };
}

export function dropTaco(round) {
  return round.phase === 'running' ? { ...round, phase: 'dropping' } : round;
}

export function advance(round, delta, isFriday) {
  const dropping = round.phase === 'dropping';
  if (!dropping && round.phase !== 'running') return round;

  const remaining = dropping ? (1 - round.fall) * dropDuration : roundLimit - round.elapsed;
  const step = Math.min(remaining, delta);
  const elapsed = round.elapsed + step;
  const sweep = (elapsed * speed) % (4 * edge);
  let x = edge - Math.abs(sweep - 2 * edge);
  const fall = dropping ? Math.min(1, round.fall + step / dropDuration) : 0;
  let phase = round.phase;

  if (delta >= remaining) {
    if (!dropping) {
      phase = 'escaped';
    } else if (Math.abs(x) > catchRadius) {
      phase = 'missed';
    } else if (isFriday) {
      phase = 'caught';
    } else {
      phase = 'dodged';
      x = sweep < 2 * edge ? 1.12 : -1.12;
    }
  }
  return { phase, elapsed, x, fall };
}
