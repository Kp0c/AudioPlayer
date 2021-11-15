const {
  takeUntil, ReplaySubject, fromEvent, merge,
} = require('rxjs');
const NotesConverter = require('./notes-converter');
const presets = require('./presets');

/**
 * @typedef {Object} NotationSettingsData
 * @property {boolean} isValid
 * @property {[ConvertedNote]} notesToPlay
 * @property {number} bpm
 * @property {OscillatorType} waveType
 * @property {number} attack
 * @property {number} decay
 * @property {number} sustain
 * @property {number} release
 */

const template = document.createElement('template');
template.innerHTML = `
<style>
.player-container {
  width: 80vw;
  background: var(--surface-color);
  border-radius: 20px;
  box-shadow: 0 0 20px 8px var(--background-color-shadow);
  margin: 30px;
  padding: 16px 16px;
  display: flex;
  flex-direction: column;
}

.player-container textarea {
  width: 100%;
  box-sizing: border-box;
  resize: none;
  border-radius: 10px;
  padding: 5px;
  flex: 1;
  margin: 10px 0;
}

.bpm {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.bpm #bpm-text {
  width: 5em;
  border-radius: 5px;
  border: 1px solid var(--divider-color);
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 15px;
  border-radius: 5px;
  background: var(--divider-color);
  outline: none;
  opacity: 0.7;
  -webkit-transition: .2s;
  transition: opacity .2s;
}

.slider:hover {
  opacity: 1;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
}

.slider:disabled::-webkit-slider-thumb {
    background: var(--light-primary-color);
}

#delete-button {
  height: 16px;
  width: 16px;
  display: block;
  margin-left: auto;
  cursor: pointer;
  transition: all .4s;
}

#delete-button:hover {
  transform: scale(1.1);
}

select {
  border-radius: 5px;
  border: 1px solid var(--divider-color);  
}

.invalid {
  border: 1px solid #ea0000 !important;
}

.header-container {
  display: flex;
}

.spacer {
  flex: 1
}

.error-message {
 color: #ea0000;
}
</style>
<div class="player-container">
  <div class="header-container">
    <span class="error-message" id="error"></span>
    <div class="spacer"></div>
    <img id="delete-button" src="assets/delete-button.svg" alt="Delete button">
  </div>
  <textarea rows="10" name="notation" id="notation"></textarea>
  
  <div class="bpm">
    BPM:
    <input type="number" min="10" max="300" value="100" name="bpm-text" id="bpm-text">
    <input class="slider" type="range" id="bpm-slider" min="10" max="300" value="100">
  </div>
  <div>
  <label for="wave">Wave Type: </label>
    <select name="wave" id="wave">
      <option value="sine">sine</option>
      <option value="sawtooth">sawtooth</option>
      <option value="square">square</option>
      <option value="triangle">triangle</option>
    </select>
  </div>
  <div>
    <label for="attack">Attack</label>
    <input class="slider" type="range" name="slider" id="attack-slider" min="0.01" max="0.5" value="0.01" step="0.01">
    <label for="decay">Decay</label>
    <input class="slider" type="range" name="slider" id="decay-slider" min="0.01" max="0.5" value="0.01" step="0.01">
    <label for="sustain">Sustain</label>
    <input class="slider" type="range" name="slider" id="sustain-slider" min="0.01" max="1" value="1" step="0.01">
    <label for="release">Release</label>
    <input class="slider" type="range" name="slider" id="release-slider" min="0.01" max="1" value="0.01" step="0.01">
  </div>
</div>
`;

class NotationSettings extends HTMLElement {
  /**
   *
   * @type {ReplaySubject<void>}
   * @private
   */
  _disconnect$ = new ReplaySubject();

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.deleteButton = this.shadowRoot.getElementById('delete-button');

    this.notation = this.shadowRoot.getElementById('notation');
    this.bpmSlider = this.shadowRoot.getElementById('bpm-slider');
    this.bpmText = this.shadowRoot.getElementById('bpm-text');

    this.wave = this.shadowRoot.getElementById('wave');
    this.attack = this.shadowRoot.getElementById('attack-slider');
    this.decay = this.shadowRoot.getElementById('decay-slider');
    this.sustain = this.shadowRoot.getElementById('sustain-slider');
    this.release = this.shadowRoot.getElementById('release-slider');

    this.error = this.shadowRoot.getElementById('error');
  }

  static get observedAttributes() {
    return ['preset', 'disabled'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'preset') {
      const preset = presets.get(newValue);

      if (preset === undefined) {
        return;
      }

      this.bpmText.value = preset.bpm;
      this.bpmSlider.value = preset.bpm;
      this.wave.value = preset.wave;
      this.attack.value = preset.attack;
      this.decay.value = preset.decay;
      this.sustain.value = preset.sustain;
      this.release.value = preset.release;
    }

    if (name === 'disabled') {
      const elementsToDisableOnPlaying = [
        this.notation,
        this.bpmText,
        this.bpmSlider,
        this.attack,
        this.decay,
        this.sustain,
        this.release,
        this.wave,
      ];

      elementsToDisableOnPlaying.forEach((element) => {
        // eslint-disable-next-line no-param-reassign
        element.disabled = newValue !== null;
      });
    }
  }

  connectedCallback() {
    fromEvent(this.deleteButton, 'click').pipe(takeUntil(this._disconnect$)).subscribe(() => this.delete());

    fromEvent(this.bpmSlider, 'input')
      .pipe(takeUntil(this._disconnect$))
      .subscribe((event) => {
        this.bpmText.value = event.target.value;

        this.bpmText.dispatchEvent(
          new Event('change', {
            bubbles: true,
            cancelable: true,
          }),
        );
      });

    fromEvent(this.bpmText, 'change')
      .pipe(takeUntil(this._disconnect$))
      .subscribe((event) => {
        this.bpmSlider.value = event.target.value;
      });

    merge(
      fromEvent(this.bpmText, 'change'),
      fromEvent(this.wave, 'change'),
      fromEvent(this.attack, 'change'),
      fromEvent(this.decay, 'change'),
      fromEvent(this.sustain, 'change'),
      fromEvent(this.release, 'change'),
      fromEvent(this.notation, 'change'),
    )
      .pipe(takeUntil(this._disconnect$))
      .subscribe(() => {
        this.validateAndSendEvent();
      });

    this.validateAndSendEvent();
  }

  validateAndSendEvent() {
    let notesToPlay = [];
    let isValid = true;
    this.error.innerText = '';

    try {
      this.notation.classList.remove('invalid');

      const notation = this.notation.value;
      notesToPlay = new NotesConverter().convertNotation(notation);
    } catch (err) {
      this.notation.classList.add('invalid');

      this.error.innerText = err.message;
      isValid = false;
    }

    this.bpmText.classList.remove('invalid');
    if (this.bpmText.value < 10 || this.bpmText.value > 300) {
      this.bpmText.classList.add('invalid');
      this.error.innerText = 'BPM must be between 10 and 300';
      isValid = false;
    }

    /** @type {NotationSettingsData} */
    const eventData = {
      notesToPlay,
      bpm: this.bpmText.value,
      waveType: this.wave.value,
      attack: this.attack.value,
      decay: this.decay.value,
      sustain: this.sustain.value,
      release: this.release.value,
      isValid,
    };

    this.dispatchEvent(
      new CustomEvent('notationChange', {
        detail: eventData,
      }),
    );
  }

  async disconnectedCallback() {
    this.deleteButton.removeEventListener('click', this.delete);

    this._disconnect$.next();
  }

  delete() {
    this.parentElement.removeChild(this);
  }
}

window.customElements.define('ap-notation-settings', NotationSettings);

module.exports = NotationSettings;
