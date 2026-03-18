import { VariableRefresh } from '@grafana/schema';
import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectState } from '../core/types';

import { VariableDependencyConfig } from './VariableDependencyConfig';
import { ConstantVariable } from './variants/ConstantVariable';
import { TestVariable } from './variants/TestVariable';
import { TestObjectWithVariableDependency, TestScene } from './TestScene';
import { SceneVariableSet } from './sets/SceneVariableSet';
import { SceneTimeRange } from '../core/SceneTimeRange';

interface TestState extends SceneObjectState {
  query: string;
  otherProp: string;
  nested: {
    query: string;
  };
}

class TestObj extends SceneObjectBase<TestState> {
  public constructor() {
    super({
      query: 'query with ${queryVarA} ${queryVarB}',
      otherProp: 'string with ${otherPropA}',
      nested: {
        query: 'nested object with ${nestedVarA}',
      },
    });
  }
}

describe('VariableDependencyConfig', () => {
  it('Should be able to extract dependencies from all state', () => {
    const sceneObj = new TestObj();
    const deps = new VariableDependencyConfig(sceneObj, { statePaths: ['*'] });

    expect(deps.getNames()).toEqual(new Set(['queryVarA', 'queryVarB', 'nestedVarA', 'otherPropA']));
  });

  it('Should not extract dependencies from all state if no statePaths or variableName is defined', () => {
    const sceneObj = new TestObj();
    const deps = new VariableDependencyConfig(sceneObj, {});

    expect(deps.scanCount).toBe(0);
    expect(deps.getNames()).toEqual(new Set([]));
  });

  it('Should be able to extract dependencies from statePaths', () => {
    const sceneObj = new TestObj();
    const deps = new VariableDependencyConfig(sceneObj, { statePaths: ['query', 'nested'] });

    expect(deps.getNames()).toEqual(new Set(['queryVarA', 'queryVarB', 'nestedVarA']));
    expect(deps.hasDependencyOn('queryVarA')).toBe(true);
  });

  it('Should cache variable extraction', () => {
    const sceneObj = new TestObj();
    const deps = new VariableDependencyConfig(sceneObj, { statePaths: ['query', 'nested'] });

    deps.getNames();
    deps.getNames();

    expect(deps.scanCount).toBe(1);
  });

  it('Should not rescan if state changes but not any of the state paths to scan', () => {
    const sceneObj = new TestObj();
    const deps = new VariableDependencyConfig(sceneObj, { statePaths: ['query', 'nested'] });
    deps.getNames();

    sceneObj.setState({ otherProp: 'new value' });

    deps.getNames();
    expect(deps.scanCount).toBe(1);
  });

  it('Should re-scan when both state and specific state path change', () => {
    const sceneObj = new TestObj();
    const deps = new VariableDependencyConfig(sceneObj, { statePaths: ['query', 'nested'] });
    deps.getNames();

    sceneObj.setState({ query: 'new query with ${newVar}' });

    expect(deps.getNames()).toEqual(new Set(['newVar', 'nestedVarA']));
    expect(deps.scanCount).toBe(2);
  });

  it('Should not scan the state if no statePaths defined', () => {
    const sceneObj = new TestObj();
    sceneObj.setState({ query: 'new query with ${newVar}' });
    const deps = new VariableDependencyConfig(sceneObj, { variableNames: ['nonExistentVar'] });
    deps.getNames();

    expect(deps.getNames()).toEqual(new Set(['nonExistentVar']));
    expect(deps.scanCount).toBe(1);
  });

  it('variableValuesChanged should only call onReferencedVariableValueChanged if dependent variable has changed', () => {
    const sceneObj = new TestObj();
    const fn = jest.fn();
    const deps = new VariableDependencyConfig(sceneObj, { onReferencedVariableValueChanged: fn, statePaths: ['*'] });

    deps.variableUpdateCompleted(new ConstantVariable({ name: 'not-dep', value: '1' }), true);
    expect(fn.mock.calls.length).toBe(0);

    deps.variableUpdateCompleted(new ConstantVariable({ name: 'queryVarA', value: '1' }), true);
    expect(fn.mock.calls.length).toBe(1);
  });

  it('Can update explicit depenendencies and scan for variables', () => {
    const sceneObj = new TestObj();
    const deps = new VariableDependencyConfig(sceneObj, { statePaths: ['*'] });

    expect(deps.getNames()).toEqual(new Set(['queryVarA', 'queryVarB', 'otherPropA', 'nestedVarA']));

    deps.setVariableNames(['explicitDep']);
    expect(deps.getNames()).toEqual(new Set(['explicitDep', 'queryVarA', 'queryVarB', 'otherPropA', 'nestedVarA']));
  });

  describe('Should remember when an object is waiting for variables', () => {
    it('Should notify as soon as next variable completes', async () => {
      const A = new TestVariable({
        name: 'A',
        query: 'A.*',
        value: '',
        text: '',
        options: [],
        refresh: VariableRefresh.onTimeRangeChanged,
      });
      const B = new TestVariable({ name: 'B', query: '$A', value: '', text: '', options: [] });
      const C = new TestVariable({ name: 'C', query: '$B', value: '', text: '', options: [] });

      const nestedObj = new TestObjectWithVariableDependency({ title: '$C' });
      const set = new SceneVariableSet({ variables: [A, B, C] });
      const timeRange = new SceneTimeRange();
      const scene = new TestScene({
        $variables: set,
        $timeRange: timeRange,
        nested: nestedObj,
      });

      scene.activate();
      nestedObj.activate();

      nestedObj.doSomethingThatRequiresVariables();

      // Verify testObj has not done anything yet (still waiting for variables)
      expect(nestedObj.state.didSomethingCount).toBe(0);

      A.signalUpdateCompleted();
      B.signalUpdateCompleted();
      C.signalUpdateCompleted();

      // Now it can
      expect(nestedObj.state.didSomethingCount).toBe(1);

      // Do something while no variables are loading
      nestedObj.doSomethingThatRequiresVariables();
      expect(nestedObj.state.didSomethingCount).toBe(2);

      // change time range to trigger A loading
      timeRange.onRefresh();
      expect(A.state.loading).toBe(true);

      // Now do something and it should wait
      nestedObj.doSomethingThatRequiresVariables();
      expect(nestedObj.state.didSomethingCount).toBe(2);

      // B completes
      A.signalUpdateCompleted();

      // No change in value so B should not be loading
      expect(B.state.loading).toBe(false);

      // No need to wait now as no dependency loading
      expect(nestedObj.state.didSomethingCount).toBe(3);
    });

    it('When handleTimeMacros is true', () => {
      const timeRange = new SceneTimeRange();
      const scene = new TestObjectThatUsesTimeMacro({
        $timeRange: timeRange,
        title: 'title with ${__from:date} ${__to:date} and ${__timezone}',
        variableValueChanged: 0,
      });

      scene.activate();

      expect(scene.state.variableValueChanged).toBe(0);

      timeRange.onRefresh();

      expect(scene.state.variableValueChanged).toBe(1);

      timeRange.onTimeZoneChange('UTC');

      expect(scene.state.variableValueChanged).toBe(3);
    });
  });
});

interface TestSceneObjectState extends SceneObjectState {
  title: string;
  variableValueChanged: number;
}

export class TestObjectThatUsesTimeMacro extends SceneObjectBase<TestSceneObjectState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['title'],
    handleTimeMacros: true,
    onReferencedVariableValueChanged: () => {
      this.setState({ variableValueChanged: this.state.variableValueChanged + 1 });
    },
  });
}
