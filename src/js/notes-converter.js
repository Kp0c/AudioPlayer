/**
 * @typedef {Object} ConvertedNote
 * @property {number} frequency
 * @property {number} durationInBits
 */

/**
 * @typedef {Object} Note
 * @property {string|null} note
 * @property {boolean} isPause
 * @property {number|null} octave
 * @property {number} durationInBits
 */

/**
 * Helper class to convert the note to the frequency and durationInBits
 */
class NotesConverter {
  /**
   * All possible notes
   * @private
   * @readonly
   */
  _notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  /**
   * index of base note
   *
   * @type {number} index
   * @private
   * @readonly
   */
  _baseNoteIndex = this._notes.indexOf("A");

  /**
   * octave of base note
   *
   * @type {number} index
   * @private
   * @readonly
   */
  _baseNoteOctave = 4;

  /**
   * Frequency of A4 note
   *
   * @type {number}
   * @private
   * @readonly
   */
  _baseNoteFrequency = 440;

  /**
   * converts notation to frequency + durationInBits array
   *
   * @param {string} notation
   * {@link https://en.wikipedia.org/wiki/Scientific_pitch_notation}
   *
   * @returns {[ConvertedNote]} converted notes
   */
  convertNotation(notation) {
    return notation.split(" ").map((unit) => this._convertNote(unit));
  }

  /**
   * converts notationUnit from SPN notation to frequency + durationInBits
   *
   * @param {string} notationUnit
   * {@link https://en.wikipedia.org/wiki/Scientific_pitch_notation}
   *
   * @returns {ConvertedNote} converted note
   * @private
   */
  _convertNote(notationUnit) {
    let note = this._parseNote(notationUnit);

    const distance = this._calculateDistanceFromBaseNote(
      note.note,
      note.octave
    );
    const frequency =
      this._baseNoteFrequency * 2 ** (distance / this._notes.length);

    return {
      frequency: Number(frequency.toFixed(2)),
      durationInBits: note.durationInBits,
    };
  }

  /**
   * Parse notationUnit to note object
   *
   * @param {string} notationUnit
   * @private
   *
   * @returns {Note} note
   */
  _parseNote(notationUnit) {
    const [noteWithOctave, durationInBits] = notationUnit.split("/");

    let note = null;
    let octave = null;
    let isPause = noteWithOctave === "_";

    if (!isPause) {
      if (noteWithOctave.includes("#")) {
        note = noteWithOctave.slice(0, 2);
        octave = Number(noteWithOctave.slice(2));
      } else {
        note = noteWithOctave.slice(0, 1);
        octave = Number(noteWithOctave.slice(1));
      }
    }

    const isExtended = durationInBits.includes(".");

    const durationModifier = isExtended ? 1.5 : 1;

    /**
     * 1 / 1 = 4
     * 1 / 2 = 2
     * 1 / 4 = 1
     * 1 / 8 = 0.5
     */
    return {
      note,
      octave,
      durationInBits: (4 / Number(durationInBits)) * durationModifier,
      isPause: isPause,
    };
  }

  /**
   * Search a distance from A4 note to passed note
   *
   * TODO: type from note to {'A'|'B'|'C'}
   * @param {string} note in SPN notation
   * @param {number} octave octave
   *
   * @returns {number} distance
   * @private
   */
  _calculateDistanceFromBaseNote(note, octave) {
    const noteIndex = this._notes.indexOf(note.toUpperCase());

    const noteDistance = noteIndex - this._baseNoteIndex;
    const octaveDistance = octave - this._baseNoteOctave;
    return noteDistance + octaveDistance * this._notes.length;
  }
}

module.exports = NotesConverter;