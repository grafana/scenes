import { shouldWrapInSafeSerializableSceneObject } from './wrapInSafeSerializableSceneObject';

describe('shouldWrapInSafeSerializableSceneObject', () => {
  describe('Grafana 10', () => {
    it.each(['10.4.7', '10.4.6-123', '10.4.6', '10.3.0', '10.2.0', '10.1.0'])(
      'should return false for version lower than 10.4.8 version (%s)',
      (version) => {
        expect(shouldWrapInSafeSerializableSceneObject(version)).toBe(false);
      }
    );
    it.each(['10.4.8-123', '10.4.8', '10.5.0'])(
      'should return true for version higher than 10.4.8 version (%s)',
      (version) => {
        expect(shouldWrapInSafeSerializableSceneObject(version)).toBe(true);
      }
    );
  });

  describe('Grafana 11+', () => {
    describe('11.0.x', () => {
      it.each(['11.0.2-123', '11.0.2', '11.0.1-123', '11.0.1'])(
        'should return false for version lower than 11.0.3 version (%s)',
        (version) => {
          expect(shouldWrapInSafeSerializableSceneObject(version)).toBe(false);
        }
      );
      it.each(['11.0.4-123', '11.0.4', '11.0.5'])(
        'should return true for version higher than 11.0.4 version (%s)',
        (version) => {
          expect(shouldWrapInSafeSerializableSceneObject(version)).toBe(true);
        }
      );
    });
    describe('11.1.x', () => {
      it.each(['11.1.1-123', '11.1.1'])('should return false for version lower than 11.1.2 version (%s)', (version) => {
        expect(shouldWrapInSafeSerializableSceneObject(version)).toBe(false);
      });
      it.each(['11.1.2-123', '11.1.2', '11.1.3'])(
        'should return true for version higher than 11.1.2 version (%s)',
        (version) => {
          expect(shouldWrapInSafeSerializableSceneObject(version)).toBe(true);
        }
      );
    });
    describe('11.2+', () => {
      it.each(['11.2.0-123', '11.2.0', '11.2.1', '11.3.0', '12.0.0', '12.0.0-123'])(
        'should return true for version higher than 11.2+ version (%s)',
        (version) => {
          expect(shouldWrapInSafeSerializableSceneObject(version)).toBe(true);
        }
      );
    });
  });
});
