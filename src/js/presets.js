/**
 * @typedef {Object} Preset
 * @property {OscillatorType} wave
 * @property {number} bpm
 * @property {number} attack
 * @property {number} decay
 * @property {number} sustain
 * @property {number} release
 */

/**
 * @type {Map<string, Preset>}
 */
const presets = new Map([
  [
    'piano',
    {
      bpm: 100,
      wave: 'sine',
      attack: 0.01,
      decay: 0.44,
      sustain: 0.01,
      release: 0.3,
    },
  ],
  [
    'synthesizer',
    {
      bpm: 200,
      wave: 'sawtooth',
      attack: 0.01,
      decay: 0.01,
      sustain: 1,
      release: 0.01,
    },
  ],
  [
    'drums',
    {
      bpm: 144,
      wave: 'triangle',
      attack: 0.01,
      decay: 0.15,
      sustain: 0.01,
      release: 0.01,
    },
  ],
]);

module.exports = presets;
