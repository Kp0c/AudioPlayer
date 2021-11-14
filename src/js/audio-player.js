/**
 * @typedef { import("./notes-converter").ConvertedNote } ConvertedNote
 *
 * @typedef { import("rxjs").Observable } Observable
 */

/**
 * @typedef {Object} AdsrSettings
 * @property {number} attack
 * @property {number} decay
 * @property {number} sustain
 * @property {number} release
 */

const { Subject } = require("rxjs");

class AudioPlayer {
  /**
   *
   * @type {AudioContext}
   * @private
   */
  _audioContext = null;

  /**
   * _state of the
   *
   * @type {Subject<AudioContextState>}
   * @private
   * @readonly
   */
  _state = new Subject();

  /**
   *
   * @returns { Observable<AudioContextState>}
   */
  get state() {
    return this._state.asObservable();
  }

  /**
   *
   * @param {[ConvertedNote]} notes
   * @param {number} bpm
   * @param {AdsrSettings} adsrSettings
   * @param {OscillatorType} wave
   */
  play(notes, bpm, adsrSettings, wave) {
    this._audioContext?.close();
    this._audioContext = new AudioContext();

    const compressor = this._audioContext.createDynamicsCompressor();

    const bitDuration = 60 / bpm;
    notes.forEach((note, index) => {
      const startTime = index * bitDuration;
      const endTime = startTime + bitDuration * note.durationInBits;
      this._scheduleNote({
        frequency: note.frequency,
        startTime: startTime,
        releaseTime: endTime,
        adsrSettings: adsrSettings,
        wave: wave,
        destination: compressor,
      });
    });

    compressor.connect(this._audioContext.destination);

    this._state.next(this._audioContext.state);
  }

  /**
   * Pauses music
   */
  async pause() {
    await this._audioContext?.suspend();

    this._state.next(this._audioContext.state);
  }

  /**
   * Resumes music
   */
  async resume() {
    await this._audioContext?.resume();

    this._state.next(this._audioContext.state);
  }

  /**
   * Stops music
   */
  async stop() {
    await this._audioContext?.close();
    this._state.next(this._audioContext.state);

    this._audioContext = null;
  }

  /**
   * Closes audio context
   */
  async destroy() {
    await this._audioContext?.close();

    this._audioContext = null;
  }

  /**
   *
   * @param {number} frequency frequency to play
   * @param {number} startTime start time in seconds
   * @param {number} releaseTime stop time in seconds
   * @param {AdsrSettings} adsrSettings ADSR settings
   * @param {OscillatorType} wave
   * @param {AudioNode} destination
   * @private
   */
  _scheduleNote({
    frequency,
    startTime,
    releaseTime,
    adsrSettings,
    wave,
    destination,
  }) {
    const oscillator = this._audioContext.createOscillator();
    const gainNode = this._audioContext.createGain();
    const noteDuration = releaseTime - startTime;

    oscillator.type = wave;
    oscillator.frequency.value = frequency;

    oscillator.start(startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    // set attack
    const finishAttackTime = startTime + noteDuration * adsrSettings.attack;
    gainNode.gain.linearRampToValueAtTime(1, finishAttackTime);

    // set decay
    const finishDecayTime =
      finishAttackTime + noteDuration * adsrSettings.decay;
    gainNode.gain.linearRampToValueAtTime(
      adsrSettings.sustain,
      finishDecayTime
    );

    // sustain flat
    gainNode.gain.setValueAtTime(adsrSettings.sustain, releaseTime);

    // set release
    let finishReleaseTime = releaseTime + noteDuration * adsrSettings.release;
    gainNode.gain.linearRampToValueAtTime(0.00001, finishReleaseTime);

    oscillator.stop(finishReleaseTime);

    oscillator.connect(gainNode).connect(destination);
  }
}

module.exports = AudioPlayer;
