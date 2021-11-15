require("./player-controller");

const addNotationButton = document.getElementById("add-notation");
const stopButton = document.getElementById("stop-button");
const cancelButton = document.getElementById("cancel-button");

const pianoPresetButton = document.getElementById("piano-preset");
const synthesizerPresetButton = document.getElementById("synthesizer-preset");
const drumsPresetButton = document.getElementById("drums-preset");

const presetModal = document.getElementById("select-preset-modal");

addNotationButton.addEventListener("click", handleAddNotationClick);
cancelButton.addEventListener("click", handleCancelClick);
pianoPresetButton.addEventListener("click", addPianoPreset);
synthesizerPresetButton.addEventListener("click", addSynthesizerPreset);

function handleClickOutside(event) {
  if (event.target === presetModal) {
    hideModal();
  }
}

window.addEventListener("click", handleClickOutside);
drumsPresetButton.addEventListener("click", addDrumsPreset);

function handleAddNotationClick() {
  presetModal.style.display = "flex";
}

function handleCancelClick() {
  hideModal();
}

function hideModal() {
  presetModal.style.display = "none";
}

function addPianoPreset() {
  addPlayerWithPreset("piano");
}

function addSynthesizerPreset() {
  addPlayerWithPreset("synthesizer");
}

function addDrumsPreset() {
  addPlayerWithPreset("drums");
}

/**
 *
 * @param {'piano'|'synthesizer'|'drums'} preset
 */
function addPlayerWithPreset(preset) {
  stopButton.click();

  const newNotation = document.createElement("ap-controller");
  newNotation.setAttribute("preset", preset);
  addNotationButton.insertAdjacentElement("beforebegin", newNotation);

  hideModal();
}
