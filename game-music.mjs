const beat = 60 / 144;
const melody = [
  [76, null, 79, 83, 81, 76, 74, null],
  [72, 76, 81, null, 79, 76, 74, 76],
  [74, 79, 86, null, 84, 81, 79, 76],
  [77, null, 81, 84, 83, 79, 74, null],
];
const bass = [[40, 47, 43, 47], [45, 48, 52, 48], [43, 50, 47, 50], [41, 48, 47, 43]];

export function createMusic() {
  let context;
  let active;

  function stop() {
    if (!active) return;
    const end = context.currentTime + 0.065;
    active.gain.gain.setTargetAtTime(0, context.currentTime, 0.012);
    for (const note of active.notes) note?.stop(end);
    active = undefined;
  }

  function start() {
    stop();
    context ??= new AudioContext();
    void context.resume().catch(() => {});

    const gain = context.createGain();
    gain.gain.value = 0.36;
    gain.connect(context.destination);
    const notes = [];
    const startAt = context.currentTime + 0.055;

    function play(pitch, position, duration, wave, volume) {
      const note = context.createOscillator();
      const envelope = context.createGain();
      const time = startAt + position * beat;
      note.type = wave;
      note.frequency.value = 440 * 2 ** ((pitch - 69) / 12);
      note.connect(envelope).connect(gain);
      envelope.gain.setValueAtTime(0, time);
      envelope.gain.linearRampToValueAtTime(volume, time + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.001, time + duration * beat);
      note.start(time);
      note.stop(time + duration * beat);
      const index = notes.push(note) - 1;
      note.onended = () => {
        note.disconnect();
        envelope.disconnect();
        notes[index] = null;
        if (notes.every((oscillator) => oscillator === null)) gain.disconnect();
      };
    }

    // Six bars cover a complete round. The two opening bars repeat at the end.
    for (let bar = 0; bar < 6; bar += 1) {
      melody[bar % melody.length].forEach((pitch, step) => {
        if (pitch !== null) play(pitch, bar * 4 + step / 2, 0.39, 'square', 0.085);
      });
      bass[bar % bass.length].forEach((pitch, step) => {
        play(pitch, bar * 4 + step, 0.6, 'triangle', 0.125);
      });
    }

    active = { gain, notes };
  }

  return { start, stop };
}
