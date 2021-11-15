/**
 * @typedef {import("./notation-settings").NotationSettingsData} NotationSettingsData
 */

import {first, fromEvent, takeUntil} from 'rxjs';

const AudioPlayer = require('./audio-player');

const presetModal = document.getElementById('select-preset-modal');

/**
 * @type {AudioPlayer}
 */
const audioPlayer = new AudioPlayer();

/**
 * @type {Map<string, NotationSettingsData>}
 */
const notationsMap = new Map();

function hideModal() {
  presetModal.style.display = 'none';
}

function handleClickOutside(event) {
  if (event.target === presetModal) {
    hideModal();
  }
}

function handleAddNotationClick() {
  presetModal.style.display = 'flex';
}

function handleCancelClick() {
  hideModal();
}

function updatePlayerButtons() {
  let isValid = true;

  notationsMap.forEach((settings) => {
    isValid = isValid && settings.isValid;
  });

  const playButton = document.getElementById('play-button');
  playButton.disabled = !isValid;
}

async function handleStop() {
  await audioPlayer.stop();
}

/**
 * @param {'piano'|'synthesizer'|'drums'} preset
 */
function addPlayerWithPreset(preset) {
  const stopButton = document.getElementById('stop-button');
  stopButton.click();

  const newNotation = document.createElement('ap-notation-settings');
  newNotation.setAttribute('preset', preset);

  newNotation.id = Math.random().toString();

  fromEvent(newNotation, 'DOMNodeRemoved')
    .pipe(first())
    .subscribe(async () => {
      notationsMap.delete(newNotation.id);
      updatePlayerButtons();

      await handleStop();
    });

  fromEvent(newNotation, 'notationChange')
    .pipe(takeUntil(fromEvent(newNotation, 'DOMNodeRemoved')))
    .subscribe((settings) => {
      notationsMap.set(newNotation.id, settings.detail);

      updatePlayerButtons();
    });

  const addNotationButton = document.getElementById('add-notation');
  addNotationButton.insertAdjacentElement('beforebegin', newNotation);

  hideModal();
}

function addPianoPreset() {
  addPlayerWithPreset('piano');
}

function addSynthesizerPreset() {
  addPlayerWithPreset('synthesizer');
}

function addDrumsPreset() {
  addPlayerWithPreset('drums');
}

async function handlePlay() {
  const notationsSettingsArray = [];
  notationsMap.forEach((settings) => notationsSettingsArray.push(settings));

  await audioPlayer.play(notationsSettingsArray);
}

async function handlePause() {
  await audioPlayer.pause();
}

async function handleResume() {
  await audioPlayer.resume();
}

function setupGlobalListeners() {
  const playButton = document.getElementById('play-button');
  playButton.addEventListener('click', handlePlay);

  const pauseButton = document.getElementById('pause-button');
  pauseButton.addEventListener('click', handlePause);

  const resumeButton = document.getElementById('resume-button');
  resumeButton.addEventListener('click', handleResume);

  const stopButton = document.getElementById('stop-button');
  stopButton.addEventListener('click', handleStop);

  const cancelButton = document.getElementById('cancel-button');
  cancelButton.addEventListener('click', handleCancelClick);

  const pianoPresetButton = document.getElementById('piano-preset');
  pianoPresetButton.addEventListener('click', addPianoPreset);

  const synthesizerPresetButton = document.getElementById('synthesizer-preset');
  synthesizerPresetButton.addEventListener('click', addSynthesizerPreset);

  const drumsPresetButton = document.getElementById('drums-preset');
  drumsPresetButton.addEventListener('click', addDrumsPreset);

  const addNotationButton = document.getElementById('add-notation');
  addNotationButton.addEventListener('click', handleAddNotationClick);

  window.addEventListener('click', handleClickOutside);

  audioPlayer.state.subscribe((state) => {
    const isRunning = state === 'running';
    const isClosed = state === 'closed';
    const isSuspended = state === 'suspended';

    pauseButton.disabled = isClosed || isSuspended;
    resumeButton.disabled = isClosed || isRunning;
    stopButton.disabled = isClosed;

    document.querySelectorAll('ap-notation-settings').forEach((element) => {
      if (isClosed) {
        element.removeAttribute('disabled');
      } else {
        element.setAttribute('disabled', '');
      }
    });
  });
}

setupGlobalListeners();
