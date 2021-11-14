const NotesConverter = require("./notes-converter");
const AudioPlayer = require("./audio-player");
const { takeUntil, ReplaySubject } = require("rxjs");

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

button {
    background-color: var(--primary-color);
    border-radius: 5px;
    border-width: 0;
    color: var(--text-color);
    cursor: pointer;
    padding: 10px 25px;
}

button:disabled {
    background-color: var(--light-primary-color);
    pointer-events: none;
    cursor: none;
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

.action-buttons {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
}
</style>
<div class="player-container">
  <textarea rows="10" name="notation" id="notation">E4/4 E4/4 E4/4 D#4/8. A#4/16 E4/4 D#4/8. A#4/16 E4/2 D5/4 D5/4 D5/4 D#5/8. A#4/16 F#4/4 D#4/8. A#4/16 E4/2</textarea>
  
  <div class="bpm">
    BPM:
    <input type="number" min="10" max="300" value="100" name="bpm-text" id="bpm-text">
    <input class="slider" type="range" id="bpm-slider" min="10" max="300" value="100">
  </div>
  <div>
    <label for="attack">Attack</label>
    <input class="slider" type="range" name="slider" id="attack-slider" min="0.01" max="0.5" value="0.25" step="0.01">
    <label for="decay">Decay</label>
    <input class="slider" type="range" name="slider" id="decay-slider" min="0" max="1" value="0.5" step="0.01">
    <label for="sustain">Sustain</label>
    <input class="slider" type="range" name="slider" id="sustain-slider" min="0" max="0.5" value="0.25" step="0.01">
    <label for="release">Release</label>
    <input class="slider" type="range" name="slider" id="release-slider" min="0.01" max="1" value="0.5" step="0.01">
  </div>
  <div class="action-buttons">
    <button id="play-button">Play</button>
    <!--    TODO: add fading on pause/resume -->
    <button id="pause-button" disabled>Pause</button>
    <button id="resume-button" disabled>Resume</button>
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
  }

  handlePlay() {
    const converter = new NotesConverter();
    const notationText = this.notation.value.trim();
    const notes = converter.convertNotation(notationText);

    this._audioPlayer.play(notes, this.bpmSlider.value, {
      attack: this.attack.value,
      decay: this.decay.value,
      sustain: this.sustain.value,
      release: this.release.value,
    });
  }

  async handlePause() {
    await this._audioPlayer.pause();
  }

  async handleResume() {
    await this._audioPlayer.resume();
  }

  connectedCallback() {
    this.playButton = this.shadowRoot.getElementById("play-button");
    this.pauseButton = this.shadowRoot.getElementById("pause-button");
    this.resumeButton = this.shadowRoot.getElementById("resume-button");
    this.notation = this.shadowRoot.getElementById("notation");
    this.bpmSlider = this.shadowRoot.getElementById("bpm-slider");
    this.bpmText = this.shadowRoot.getElementById("bpm-text");

    this.attack = this.shadowRoot.getElementById("attack-slider");
    this.decay = this.shadowRoot.getElementById("decay-slider");
    this.sustain = this.shadowRoot.getElementById("sustain-slider");
    this.release = this.shadowRoot.getElementById("release-slider");

    this.playButton.addEventListener("click", this.handlePlay.bind(this));
    this.pauseButton.addEventListener("click", this.handlePause.bind(this));
    this.resumeButton.addEventListener("click", this.handleResume.bind(this));

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
      });
  }

  async disconnectedCallback() {
    this._disconnect$.next();
    await this._audioPlayer.destroy();
  }
}

window.customElements.define("ap-controller", PlayerController);

module.exports = PlayerController;
