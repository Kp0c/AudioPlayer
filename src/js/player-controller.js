const NotesConverter = require("./notes-converter");
const AudioPlayer = require("./audio-player");
const { takeUntil, ReplaySubject } = require("rxjs");
const presets = require("./presets");

let template = document.createElement("template");
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
</style>
<div class="player-container">
  <img id="delete-button" src="assets/delete-button.svg" alt="Delete button">
  <textarea rows="10" name="notation" id="notation">E4/4 E4/4 E4/4 D#4/8. A#4/16 E4/4 D#4/8. A#4/16 E4/2 D5/4 D5/4 D5/4 D#5/8. A#4/16 F#4/4 D#4/8. A#4/16 E4/2</textarea>
  
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

class PlayerController extends HTMLElement {
  /**
   *
   * @type {AudioPlayer}
   * @private
   */
  _audioPlayer = new AudioPlayer();

  /**
   *
   * @type {ReplaySubject<void>}
   * @private
   */
  _disconnect$ = new ReplaySubject();

  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.playButton = document.getElementById("play-button");
    this.pauseButton = document.getElementById("pause-button");
    this.resumeButton = document.getElementById("resume-button");
    this.stopButton = document.getElementById("stop-button");

    this.deleteButton = this.shadowRoot.getElementById("delete-button");

    this.notation = this.shadowRoot.getElementById("notation");
    this.bpmSlider = this.shadowRoot.getElementById("bpm-slider");
    this.bpmText = this.shadowRoot.getElementById("bpm-text");

    this.wave = this.shadowRoot.getElementById("wave");
    this.attack = this.shadowRoot.getElementById("attack-slider");
    this.decay = this.shadowRoot.getElementById("decay-slider");
    this.sustain = this.shadowRoot.getElementById("sustain-slider");
    this.release = this.shadowRoot.getElementById("release-slider");
  }

  static get observedAttributes() {
    return ["preset"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
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

  connectedCallback() {
    this.playButton.addEventListener("click", this.handlePlay);
    this.pauseButton.addEventListener("click", this.handlePause);
    this.resumeButton.addEventListener("click", this.handleResume);
    this.stopButton.addEventListener("click", this.handleStop);

    this.deleteButton.addEventListener("click", this.delete);

    this.bpmSlider.addEventListener("input", () => {
      this.bpmText.value = this.bpmSlider.value;
    });

    this.bpmText.addEventListener("input", () => {
      this.bpmSlider.value = this.bpmText.value;
    });

    this._audioPlayer.state
      .pipe(takeUntil(this._disconnect$))
      .subscribe((state) => {
        const isRunning = state === "running";
        const isClosed = state === "closed";
        const isSuspended = state === "suspended";

        this.pauseButton.disabled = isClosed || isSuspended;
        this.resumeButton.disabled = isClosed || isRunning;
        this.stopButton.disabled = isClosed;

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
          element.disabled = !isClosed;
        });
      });
  }

  async disconnectedCallback() {
    this.playButton.removeEventListener("click", this.handlePlay);
    this.pauseButton.removeEventListener("click", this.handlePause);
    this.resumeButton.removeEventListener("click", this.handleResume);
    this.stopButton.removeEventListener("click", this.handleStop);
    this.deleteButton.removeEventListener("click", this.delete);

    this._disconnect$.next();
    await this._audioPlayer.destroy();
  }

  handlePlay = () => {
    const converter = new NotesConverter();
    const notationText = this.notation.value.trim();
    const notes = converter.convertNotation(notationText);

    this._audioPlayer.play(
      notes,
      this.bpmSlider.value,
      {
        attack: Number(this.attack.value),
        decay: Number(this.decay.value),
        sustain: Number(this.sustain.value),
        release: Number(this.release.value),
      },
      this.wave.value
    );
  };

  handlePause = async () => {
    await this._audioPlayer.pause();
  };

  handleResume = async () => {
    await this._audioPlayer.resume();
  };

  handleStop = async () => {
    await this._audioPlayer.stop();
  };

  delete = () => {
    this.parentElement.removeChild(this);
  };
}

window.customElements.define("ap-controller", PlayerController);

module.exports = PlayerController;
