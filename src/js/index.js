"use strict";

/**
 * @typedef {import("./notation-settings").NotationSettingsData} NotationSettingsData
 */

require("./notation-settings");
const { fromEvent, takeUntil, first } = require("rxjs");

const presetModal = document.getElementById("select-preset-modal");

function setupListeners() {
  const cancelButton = document.getElementById("cancel-button");
  cancelButton.addEventListener("click", handleCancelClick);

  const pianoPresetButton = document.getElementById("piano-preset");
  pianoPresetButton.addEventListener("click", addPianoPreset);

  const synthesizerPresetButton = document.getElementById("synthesizer-preset");
  synthesizerPresetButton.addEventListener("click", addSynthesizerPreset);

  const drumsPresetButton = document.getElementById("drums-preset");
  drumsPresetButton.addEventListener("click", addDrumsPreset);

  const addNotationButton = document.getElementById("add-notation");
  addNotationButton.addEventListener("click", handleAddNotationClick);

  window.addEventListener("click", handleClickOutside);
}

function handleClickOutside(event) {
  if (event.target === presetModal) {
    hideModal();
  }
}

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
  const stopButton = document.getElementById("stop-button");
  stopButton.click();

  const newNotation = document.createElement("ap-notation-settings");
  newNotation.setAttribute("preset", preset);

  newNotation.id = Math.random().toString();

  fromEvent(newNotation, "DOMNodeRemoved")
    .pipe(first())
    .subscribe(() => {
      notationsMap.delete(newNotation.id);
      updatePlayerButtons();
    });

  fromEvent(newNotation, "notationChange")
    .pipe(takeUntil(fromEvent(newNotation, "DOMNodeRemoved")))
    .subscribe((settings) => {
      notationsMap.set(newNotation.id, settings.detail);

      updatePlayerButtons();
    });

  const addNotationButton = document.getElementById("add-notation");
  addNotationButton.insertAdjacentElement("beforebegin", newNotation);

  hideModal();
}

function updatePlayerButtons() {
  let isValid = true;

  notationsMap.forEach((settings) => {
    isValid &&= settings.isValid;
  });

  const playButton = document.getElementById("play-button");
  playButton.disabled = !isValid;
}

/**
 * @type {Map<string, NotationSettingsData>}
 */
const notationsMap = new Map();

setupListeners();
