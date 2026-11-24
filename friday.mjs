import { editions } from './editions.mjs';

const dayMs = 86_400_000;
const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function createFridayClock({ timeZone = 'Europe/Oslo', language = 'nb' } = {}) {
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const calendar = new Intl.DateTimeFormat(language, {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const copy = editions[language];
  let lastMidnight;
  let state;

  function wallTime(epoch) {
    const parts = Object.fromEntries(clock.formatToParts(epoch).map(({ type, value }) => [type, value]));
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  }

  function toEpoch(wall) {
    const earlier = wall + (wall - dayMs - wallTime(wall - dayMs));
    const later = wall + (wall + dayMs - wallTime(wall + dayMs));
    // In an overlap, use the first occurrence. In a gap, use the later
    // candidate so a skipped midnight still counts down to the start of Friday.
    const valid = [earlier, later].filter((epoch) => wallTime(epoch) === wall);
    return valid.length ? Math.min(...valid) : Math.max(earlier, later);
  }

  return (epoch) => {
    const midnight = Math.floor(wallTime(epoch) / dayMs) * dayMs;
    if (midnight !== lastMidnight) {
      const weekday = new Date(midnight).getUTCDay();
      const daysUntil = (5 - weekday + 7) % 7;
      const friday = daysUntil === 0;
      state = {
        friday,
        day: weekdays[weekday],
        answer: friday ? copy.yes : copy.no,
        daysUntil,
        subtitle: copy.lines[weekday],
        dateLabel: calendar.format(epoch),
        target: toEpoch(midnight + daysUntil * dayMs + (friday ? 16 * 3_600_000 : 0)),
      };
      lastMidnight = midnight;
    }
    return { ...state, beerTime: state.friday && epoch >= state.target };
  };
}

export const getFriday = createFridayClock();

export function countdown(target, now) {
  const secondsLeft = Math.ceil(Math.max(0, target - now) / 1000);
  return [
    Math.floor(secondsLeft / 86400),
    Math.floor(secondsLeft / 3600) % 24,
    Math.floor(secondsLeft / 60) % 60,
    secondsLeft % 60,
  ].map((unit) => String(unit).padStart(2, '0'));
}
