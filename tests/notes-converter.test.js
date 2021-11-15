/* eslint-disable no-undef */
const NotesConverter = require('../src/js/notes-converter');

describe('NotesConverter', () => {
  describe('convertNote', () => {
    test('should convert C0/4 to 16.35 with duration 1', () => {
      const converter = new NotesConverter();
      const result = converter._convertNote('C0/4');

      expect(result.frequency).toBe(16.35);
      expect(result.durationInBits).toBe(1);
    });

    test('Convert B8/12 to 7902.13 with duration 1/3', () => {
      const converter = new NotesConverter();
      const result = converter._convertNote('B8/12');

      expect(result.frequency).toBe(7902.13);
      expect(result.durationInBits).toBe(1 / 3);
    });

    test('convert c#4/4 to with duration 1', () => {
      const converter = new NotesConverter();
      const result = converter._convertNote('C#4/4');

      expect(result.frequency).toBe(277.18);
      expect(result.durationInBits).toBe(1);
    });
    test('convert e4/4 to with duration 1', () => {
      const converter = new NotesConverter();
      const result = converter._convertNote('e4/4');

      expect(result.frequency).toBe(329.63);
      expect(result.durationInBits).toBe(1);
    });
    test('convert g4/4 to with duration 1', () => {
      const converter = new NotesConverter();
      const result = converter._convertNote('g4/4');

      expect(result.frequency).toBe(392);
      expect(result.durationInBits).toBe(1);
    });
  });

  describe('_parseNote should', () => {
    test('parse C3/16', () => {
      const result = NotesConverter._parseNote('C3/16');

      expect(result.note).toBe('C');
      expect(result.octave).toBe(3);
      expect(result.durationInBits).toBe(1 / 4);
      expect(result.isPause).toBe(false);
    });

    test('parse D#7/8.', () => {
      const result = NotesConverter._parseNote('D#7/8.');

      expect(result.note).toBe('D#');
      expect(result.octave).toBe(7);
      expect(result.durationInBits).toBe(3 / 4);
      expect(result.isPause).toBe(false);
    });

    test('parse _/2', () => {
      const result = NotesConverter._parseNote('_/2');

      expect(result.isPause).toBe(true);
      expect(result.durationInBits).toBe(2);
    });
  });

  describe('_calculateDistanceFromBaseNote', () => {
    test('should return 9 for C4', () => {
      const converter = new NotesConverter();

      const result = converter._calculateDistanceFromBaseNote('C', 4);

      expect(result).toBe(-9);
    });

    test('should return -29 for E2', () => {
      const converter = new NotesConverter();

      const result = converter._calculateDistanceFromBaseNote('E', 2);

      expect(result).toBe(-29);
    });

    test('should return 2 for B4', () => {
      const converter = new NotesConverter();

      const result = converter._calculateDistanceFromBaseNote('B', 4);

      expect(result).toBe(2);
    });
  });
});
