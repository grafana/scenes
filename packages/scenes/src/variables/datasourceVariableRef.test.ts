import { getSimpleVariableNameFromDatasourceUid, expandMultiValueDatasourceUids } from './datasourceVariableRef';
import { CustomVariable } from './variants/CustomVariable';
import { SceneVariableSet } from './sets/SceneVariableSet';
import { EmbeddedScene } from '../components/EmbeddedScene';
import { SceneCanvasText } from '../components/SceneCanvasText';
import { activateFullSceneTree } from '../utils/test/activateFullSceneTree';

describe('datasourceVariableRef', () => {
  describe('getSimpleVariableNameFromDatasourceUid', () => {
    it('parses $name and ${name}', () => {
      expect(getSimpleVariableNameFromDatasourceUid('$ds')).toBe('ds');
      expect(getSimpleVariableNameFromDatasourceUid('${prom_datasource}')).toBe('prom_datasource');
    });

    it('returns undefined for concrete or unsupported UIDs', () => {
      expect(getSimpleVariableNameFromDatasourceUid('prometheus')).toBeUndefined();
      expect(getSimpleVariableNameFromDatasourceUid('${ds:raw}')).toBeUndefined();
      expect(getSimpleVariableNameFromDatasourceUid(undefined)).toBeUndefined();
    });
  });

  describe('expandMultiValueDatasourceUids', () => {
    it('returns selected UIDs when multi-value datasource variable has more than one selection', () => {
      const dsVar = new CustomVariable({
        name: 'ds',
        query: 'ds1,ds2,ds3',
        isMulti: true,
        value: ['ds1', 'ds2'],
        text: ['ds1', 'ds2'],
      });
      const scene = new EmbeddedScene({
        $variables: new SceneVariableSet({ variables: [dsVar] }),
        body: new SceneCanvasText({ text: 'hello' }),
      });
      const deactivate = activateFullSceneTree(scene);

      expect(expandMultiValueDatasourceUids(scene, { uid: '$ds' })).toEqual(['ds1', 'ds2']);
      expect(expandMultiValueDatasourceUids(scene, { uid: '${ds}' })).toEqual(['ds1', 'ds2']);

      deactivate();
    });

    it('returns undefined for single selection or non-template datasource', () => {
      const dsVar = new CustomVariable({
        name: 'ds',
        query: 'ds1,ds2',
        isMulti: true,
        value: ['ds1'],
        text: ['ds1'],
      });
      const scene = new EmbeddedScene({
        $variables: new SceneVariableSet({ variables: [dsVar] }),
        body: new SceneCanvasText({ text: 'hello' }),
      });
      const deactivate = activateFullSceneTree(scene);

      expect(expandMultiValueDatasourceUids(scene, { uid: '$ds' })).toBeUndefined();
      expect(expandMultiValueDatasourceUids(scene, { uid: 'prometheus' })).toBeUndefined();

      deactivate();
    });
  });
});
