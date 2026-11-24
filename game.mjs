import { editions, pickLanguage, places } from './editions.mjs';
import { createFridayClock } from './friday.mjs';
import { advance, dropTaco, initialRound, startRound } from './game-logic.mjs';
import { createMusic } from './game-music.mjs';
import { makeScene } from './game-scene.mjs';

const translations = {
  en: {
    title: 'Catch Friday.',
    intro: 'Friday is on the run. You have one taco.',
    hint: 'Drop the taco just before Friday reaches the circle.',
    key: 'Space',
    gesture: ' or tap',
    badge: 'FRI',
    start: 'Start',
    drop: 'Drop taco',
    again: 'Play again',
    sound: 'Sound',
    caught: 'Friday caught. Your inbox can fend for itself.',
    dodged: 'Perfect taco. Wrong day. Friday only stops on Friday.',
    missed: 'Congratulations. You catered Tuesday.',
    escaped: 'Friday got away. It had plans.',
  },
  nb: {
    title: 'Fang fredag.',
    intro: 'Fredag er på rømmen. Du har én taco.',
    hint: 'Slipp tacoen rett før fredag når sirkelen.',
    key: 'Mellomrom',
    gesture: ' eller trykk',
    badge: 'FRE',
    start: 'Start',
    drop: 'Slipp tacoen',
    again: 'Spill igjen',
    sound: 'Lyd',
    caught: 'Fredag er fanget. Innboksen klarer seg selv.',
    dodged: 'Perfekt taco, feil dag. Fredag stopper bare på fredager.',
    missed: 'Gratulerer. Du serverte taco på en tirsdag.',
    escaped: 'Fredag stakk. Den hadde planer.',
  },
  ja: {
    title: '金曜日をつかまえろ。',
    intro: '金曜日が逃走中。タコスはひとつだけ。',
    hint: '金曜日が円に入る直前にタコスを落とそう。',
    key: 'スペース',
    gesture: ' またはタップ',
    badge: '金曜',
    start: 'スタート',
    drop: 'タコスを落とす',
    again: 'もう一度',
    sound: 'サウンド',
    caught: '金曜日を確保。メールは月曜の自分に任せましょう。',
    dodged: 'タコスは完璧。でも曜日が違う。金曜日にまたどうぞ。',
    missed: 'おめでとう。火曜日にタコスが届きました。',
    escaped: '金曜日は逃げました。先約があったようです。',
  },
};

let preference;
let muted = false;
try {
  const saved = localStorage.getItem('friday-place');
  if (Object.hasOwn(places, saved)) preference = places[saved];
  muted = localStorage.getItem('friday-game-muted') === 'true';
  const theme = localStorage.getItem('friday-theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {
  // Use the device preferences if browser storage is unavailable.
}
const edition = preference?.language ?? pickLanguage(navigator.languages);
const standalone = document.documentElement.hasAttribute('data-standalone');
const timeZone = preference?.timeZone ?? new Intl.DateTimeFormat().resolvedOptions().timeZone;
const fridayClock = createFridayClock({ timeZone, language: edition });
let gameEpoch = Date.now();
let clockAnchor = performance.now();
const copy = translations[edition];
document.documentElement.lang = edition;
document.title = `${copy.title} · erdetfredag.no`;
const back = document.querySelector('#game-back');
if (back) back.textContent = editions[edition].question;
document.querySelector('#game-title').textContent = copy.title;
document.querySelector('#game-intro').textContent = copy.intro;
document.querySelector('#game-key kbd').textContent = copy.key;
document.querySelector('#game-key').lastChild.textContent = copy.gesture;

const game = document.querySelector('.game');
const stage = document.querySelector('#game-stage');
const button = document.querySelector('#game-action');
const status = document.querySelector('#game-status');
const canvas = document.querySelector('#game-canvas');
const sound = document.querySelector('#game-sound');
const music = typeof AudioContext === 'function' ? createMusic() : null;
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = makeScene(canvas, copy.badge, still);
const view = scene ?? makeFlatScene(canvas);
let round = initialRound;
let frame;
let previous;
let manual = false;

async function syncGameClock() {
  const requestedAt = performance.now();
  try {
    const response = await fetch('/api', {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    });
    const stamp = response.headers.get('X-Friday-Time');
    if (response.ok && stamp && Number.isFinite(Number(stamp)) && requestedAt >= clockAnchor) {
      gameEpoch = Number(stamp);
      clockAnchor = performance.now();
    }
  } catch {
    // Keep the last clock reading if the server is unreachable.
  }
}

function isFriday() {
  const now = standalone ? Date.now() : gameEpoch + performance.now() - clockAnchor;
  return fridayClock(now).friday;
}

function updateSound() {
  sound.setAttribute('aria-pressed', String(!muted));
}

function makeFlatScene(surface) {
  const context = surface.getContext('2d');
  function resize() {
    const { width, height } = surface.getBoundingClientRect();
    surface.width = width * Math.min(devicePixelRatio, 2);
    surface.height = height * Math.min(devicePixelRatio, 2);
  }
  function draw(state) {
    const { width, height } = surface;
    const unit = Math.min(width / 9.6, height / 4.2);
    context.setTransform(unit, 0, 0, unit, width / 2, height * 0.6);
    context.fillStyle = '#dbeddf';
    context.fillRect(-width / unit, -height / unit, 2 * width / unit, 2 * height / unit);
    context.fillStyle = '#93bdab';
    context.fillRect(-4.4, -0.22, 8.8, 0.67);
    context.strokeStyle = state.phase === 'missed' ? '#9a441f' : '#24543f';
    context.lineWidth = 0.075;
    context.beginPath();
    context.ellipse(0, 0.06, 0.5, 0.18, 0, 0, 2 * Math.PI);
    context.stroke();
    context.fillStyle = '#203521';
    context.fillRect(state.x - 0.16, -1.18, 0.32, 0.22);
    context.fillStyle = '#b7dd54';
    context.fillRect(state.x - 0.56, -0.99, 1.12, 0.94);
    context.fillStyle = '#203521';
    context.textAlign = 'center';
    context.save();
    context.translate(state.x, -0.39);
    context.scale(0.01, 0.01);
    context.font = '900 35px system-ui';
    context.fillText(copy.badge, 0, 0);
    context.restore();
    if (state.phase !== 'escaped') {
      context.save();
      context.translate(0, -2 * (1 - state.fall ** 2) + 0.1);
      context.scale(0.01, 0.01);
      context.font = '70px system-ui';
      context.fillText('🌮', 0, 0);
      context.restore();
    }
  }
  return { resize, draw };
}

function updateControls() {
  const { phase } = round;
  const message = copy[phase] ?? copy.hint;
  if (status.textContent !== message) status.textContent = message;
  const label = phase === 'ready' ? copy.start
    : phase === 'running' || phase === 'dropping' ? copy.drop : copy.again;
  if (button.textContent !== label) button.textContent = label;
  button.setAttribute('aria-disabled', String(phase === 'dropping'));
}

function update(delta) {
  const current = round.phase;
  round = advance(round, delta, current === 'dropping' && isFriday());
  if (current !== round.phase) {
    music?.stop();
    updateControls();
  }
  view.draw(round);
}

function loop(now) {
  frame = undefined;
  update(previous === undefined ? 0 : Math.min(now - previous, 100));
  previous = now;
  if (round.phase === 'running' || round.phase === 'dropping') frame = requestAnimationFrame(loop);
}

function act() {
  if (button.disabled || round.phase === 'dropping') return;
  if (round.phase !== 'running' && !muted) music?.start();
  round = round.phase === 'running' ? dropTaco(round) : startRound();
  updateControls();
  view.draw(round);
  if (!manual && frame === undefined) {
    previous = undefined;
    frame = requestAnimationFrame(loop);
  }
}

function resize() {
  view.resize();
  view.draw(round);
}

if (music) {
  sound.textContent = copy.sound;
  sound.hidden = false;
  updateSound();
  sound.addEventListener('click', () => {
    muted = !muted;
    try {
      localStorage.setItem('friday-game-muted', String(muted));
    } catch {
      // The button still works when storage is unavailable.
    }
    if (muted) music.stop();
    else if (round.phase === 'running' || round.phase === 'dropping') music.start();
    updateSound();
  });
}
button.addEventListener('click', act);
canvas.addEventListener('click', act);
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && (event.target === button || event.target === document.body)) {
    event.preventDefault();
    if (!event.repeat) act();
  }
  if (event.code === 'KeyF' && !event.repeat && document.fullscreenEnabled) {
    const action = document.fullscreenElement ? document.exitFullscreen() : game.requestFullscreen();
    action.catch(() => {});
  }
});
new ResizeObserver(resize).observe(stage);
updateControls();
resize();

if (!standalone) {
  await syncGameClock();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncGameClock();
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) void syncGameClock();
  });
}
button.disabled = false;

window.advanceTime = (milliseconds) => {
  manual = true;
  cancelAnimationFrame(frame);
  frame = undefined;
  update(Math.max(0, milliseconds));
};

window.render_game_to_text = () => JSON.stringify({
  phase: round.phase,
  friday: isFriday(),
  renderer: scene ? 'three' : 'canvas2d',
  axes: 'x is horizontal, with 0 at the drop circle',
  fridayX: Number(round.x.toFixed(3)),
  tacoX: 0,
  tacoFall: Number(round.fall.toFixed(2)),
  elapsedMs: Math.round(round.elapsed),
  status: status.textContent,
});
