/**
 * @typedef { import("./notation-settings").NotationSettingsData } NotationSettingsData
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

const { Subject } = require('rxjs');

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
   * Interval id of interval that checks if music finished playing
   * @type {number|null}
   * @private
   */
  _checkIsFinishedIntervalId = null;

  /**
   * Player state
   *
   * @returns { Observable<AudioContextState>}
   */
  get state() {
    return this._state.asObservable();
  }

  /**
   * Play the music(s) from the configurations in parallel
   *
   * @param {[NotationSettingsData]} notationSettings
   */
  async play(notationSettings) {
    await this.destroy();

    this._audioContext = new AudioContext();

    const compressor = this._audioContext.createDynamicsCompressor();

    let finishTime = 0;
    notationSettings.forEach((settings) => {
      const finish = this._scheduleNotationSettings(settings, compressor);

      finishTime = Math.max(finish, finishTime);
    });

    this._checkIsFinishedIntervalId = setInterval(() => {
      if (this._audioContext.currentTime > finishTime) {
        this.destroy();
      }
    }, 500);

    compressor.connect(this._audioContext.destination);

    this._state.next(this._audioContext.state);
  }

  /**
   *
   * @param {NotationSettingsData} settings
   * @param {AudioNode} destination
   * @private
   *
   * @returns {number} finish time
   */
  _scheduleNotationSettings(settings, destination) {
    let finishTime = 0;

    const bitDuration = 60 / settings.bpm;
    settings.notesToPlay.forEach((note, index) => {
      const startTime = index * bitDuration;
      const endTime = startTime + bitDuration * note.durationInBits;

      const finish = this._scheduleNote({
        frequency: note.frequency,
        startTime,
        releaseTime: endTime,
        adsrSettings: {
          attack: settings.attack,
          decay: settings.decay,
          sustain: settings.sustain,
          release: settings.release,
        },
        wave: settings.waveType,
        destination,
      });

      finishTime = Math.max(finish, finishTime);
    });

    return finishTime;
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
    await this.destroy();
  }

  /**
   * Closes audio context
   */
  async destroy() {
    clearInterval(this._checkIsFinishedIntervalId);
    await this._audioContext?.close();

    this._state.next('closed');
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
   *
   * @returns {number} note finish time
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
    const finishDecayTime = finishAttackTime + noteDuration * adsrSettings.decay;
    gainNode.gain.linearRampToValueAtTime(
      adsrSettings.sustain,
      finishDecayTime,
    );

    // sustain flat
    gainNode.gain.setValueAtTime(adsrSettings.sustain, releaseTime);

    // set release
    const finishReleaseTime = releaseTime + noteDuration * adsrSettings.release;
    gainNode.gain.linearRampToValueAtTime(0.00001, finishReleaseTime);

    oscillator.stop(finishReleaseTime);

    oscillator.connect(gainNode).connect(destination);

    return finishReleaseTime;
  }
}

module.exports = AudioPlayer;
