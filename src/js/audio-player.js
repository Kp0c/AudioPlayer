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
   */
  play(notes, bpm, adsrSettings) {
    this._audioContext?.close();
    this._audioContext = new AudioContext();

    const bitDuration = 60 / bpm;
    notes.forEach((note, index) => {
      const startTime = index * bitDuration;
      const endTime = startTime + bitDuration * note.durationInBits;
      this._scheduleNote(note.frequency, startTime, endTime, adsrSettings);
    });

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
   * @private
   */
  _scheduleNote(frequency, startTime, releaseTime, adsrSettings) {
    const oscillator = this._audioContext.createOscillator();
    const gainNode = this._audioContext.createGain();
    const noteDuration = releaseTime - startTime;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    oscillator.start(startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    // set attack
    gainNode.gain.linearRampToValueAtTime(
      1,
      startTime + noteDuration * adsrSettings.attack
    );

    // set decay
    const finishDecayTime = startTime + noteDuration * adsrSettings.decay;
    gainNode.gain.linearRampToValueAtTime(
      adsrSettings.sustain,
      finishDecayTime
    );

    // set sustain
    gainNode.gain.setValueAtTime(adsrSettings.sustain, finishDecayTime);

    // set release
    let finishReleaseTime = releaseTime + noteDuration * adsrSettings.release;
    gainNode.gain.linearRampToValueAtTime(0.00001, finishReleaseTime);

    oscillator.stop(finishReleaseTime);

    oscillator.connect(gainNode).connect(this._audioContext.destination);
  }
}

module.exports = AudioPlayer;
