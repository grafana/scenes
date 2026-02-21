import { render, screen } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { VariableRefresh } from '@grafana/data';

import { SceneFlexItem, SceneFlexLayout } from '../../components/layout/SceneFlexLayout';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneObjectState, SceneComponentProps } from '../../core/types';
import { TestVariable } from '../variants/TestVariable';

import { SceneVariableSet } from './SceneVariableSet';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';
import { sceneGraph } from '../../core/sceneGraph';
import { SceneTimeRange } from '../../core/SceneTimeRange';
import { LocalValueVariable } from '../variants/LocalValueVariable';
import { TestObjectWithVariableDependency, TestScene } from '../TestScene';
import { activateFullSceneTree } from '../../utils/test/activateFullSceneTree';
import { SceneVariable, SceneVariableState, VariableValue } from '../types';
import { ObjectVariable } from '../variants/ObjectVariable';

interface SceneTextItemState extends SceneObjectState {
  text: string;
}

class SceneTextItem extends SceneObjectBase<SceneTextItemState> {
  protected _variableDependency = new VariableDependencyConfig(this, { statePaths: ['text'] });
  public renderCount = 0;

  public static Component = ({ model }: SceneComponentProps<SceneTextItem>) => {
    const { text, key } = model.useState();

    model.renderCount += 1;

    return <div data-testid={key}>{sceneGraph.interpolate(model, text)}</div>;
  };
}

describe('SceneVariableList', () => {
  describe('When activated', () => {
    it('Should update variables in dependency order', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const B = new TestVariable({ name: 'B', query: 'A.$A', value: '', text: '', options: [] });
      const C = new TestVariable({ name: 'C', query: 'A.$A.$B.*', value: '', text: '', options: [] });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [C, B, A] }),
      });

      scene.activate();

      // Should start variables with no dependencies
      expect(A.state.loading).toBe(true);
      expect(B.state.loading).toBe(undefined);
      expect(C.state.loading).toBe(undefined);

      // When A complete should start B
      A.signalUpdateCompleted();
      expect(A.state.value).toBe('AA');
      expect(A.state.issuedQuery).toBe('A.*');
      expect(A.state.loading).toBe(false);
      expect(B.state.loading).toBe(true);

      // Should wait with C as B is not completed yet
      expect(C.state.loading).toBe(undefined);

      // When B completes should now start C
      B.signalUpdateCompleted();
      expect(B.state.loading).toBe(false);
      expect(C.state.loading).toBe(true);

      // When C completes issue correct interpolated query containing the new values for A and B
      C.signalUpdateCompleted();
      expect(C.state.issuedQuery).toBe('A.AA.AAA.*');
    });

    it('should not start lazy variable', () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] }, true);

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A] }),
      });

      scene.activate();

      expect(A.state.loading).toBe(undefined);
    });
  });

  describe('When variable changes value', () => {
    it('Should start update process', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const B = new TestVariable({ name: 'B', query: 'A.$A.*', value: '', text: '', options: [] });
      const C = new TestVariable({ name: 'C', query: 'A.$A.$B.*', value: '', text: '', options: [] });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [C, B, A] }),
      });

      scene.activate();

      A.signalUpdateCompleted();
      B.signalUpdateCompleted();
      C.signalUpdateCompleted();

      // When changing A should start B but not C (yet)
      A.changeValueTo('AB');

      expect(B.state.loading).toBe(true);
      expect(C.state.loading).toBe(false);

      B.signalUpdateCompleted();
      expect(B.state.value).toBe('ABA');
      expect(C.state.loading).toBe(true);
    });

    it('Should start update process of chained dependency', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const B = new TestVariable({ name: 'B', query: 'A.$A.*', value: '', text: '', options: [] });
      // Important here that variable C only depends on B
      const C = new TestVariable({ name: 'C', query: 'value=$B', value: '', text: '', options: [] });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [C, B, A] }),
      });

      scene.activate();

      A.signalUpdateCompleted();
      B.signalUpdateCompleted();
      C.signalUpdateCompleted();

      // When changing A should start B but not C (yet)
      A.changeValueTo('AB');

      expect(B.state.loading).toBe(true);
      expect(C.state.loading).toBe(false);

      B.signalUpdateCompleted();
      expect(B.state.value).toBe('ABA');
      expect(C.state.loading).toBe(true);

      C.signalUpdateCompleted();
      expect(C.state.value).toBe('value=ABA');
    });
  });

  describe('When deactivated', () => {
    it('Should cancel running variable queries', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const scene = new TestScene({ $variables: new SceneVariableSet({ variables: [A] }) });

      const deactivateScene = scene.activate();
      expect(A.isGettingValues).toBe(true);

      deactivateScene();
      expect(A.isGettingValues).toBe(false);
    });

    it('Can re-activate after deactivated', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const scene = new TestScene({ $variables: new SceneVariableSet({ variables: [A] }) });

      // Active and complete first variable
      const deactivateScene = scene.activate();
      expect(A.isGettingValues).toBe(true);

      // Deactivate
      deactivateScene();
      expect(A.isGettingValues).toBe(false);

      // Reactivate and complete A again
      scene.activate();
      expect(A.isGettingValues).toBe(true);
    });

    describe('When update process completed and variables have changed values', () => {
      it('Should trigger re-renders of dependent scene objects', async () => {
        const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
        const B = new TestVariable({ name: 'B', query: 'A.$A.*', value: '', text: '', options: [] });

        const helloText = new SceneTextItem({ text: 'Hello' });
        const sceneObjectWithVariable = new SceneTextItem({ text: '$A - $B', key: '' });

        const scene = new SceneFlexLayout({
          $variables: new SceneVariableSet({ variables: [B, A] }),
          children: [new SceneFlexItem({ body: helloText }), new SceneFlexItem({ body: sceneObjectWithVariable })],
        });

        render(<scene.Component model={scene} />);

        expect(screen.getByText('Hello')).toBeInTheDocument();

        act(() => {
          A.signalUpdateCompleted();
          B.signalUpdateCompleted();
        });

        expect(screen.getByText('AA - AAA')).toBeInTheDocument();
        expect((helloText as any).renderCount).toBe(1);
        expect((sceneObjectWithVariable as any).renderCount).toBe(2);

        act(() => {
          B.changeValueTo('B');
        });

        expect(screen.getByText('AA - B')).toBeInTheDocument();
        expect((helloText as any).renderCount).toBe(1);
        expect((sceneObjectWithVariable as any).renderCount).toBe(3);
      });
    });

    describe('When update process completed and variables have changed values RENDER_BEFORE_ACTIVATION = true', () => {
      beforeAll(() => (SceneObjectBase.RENDER_BEFORE_ACTIVATION_DEFAULT = true));
      afterAll(() => (SceneObjectBase.RENDER_BEFORE_ACTIVATION_DEFAULT = false));

      it('Should trigger re-renders of dependent scene objects', async () => {
        const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
        const B = new TestVariable({ name: 'B', query: 'A.$A.*', value: '', text: '', options: [] });

        const helloText = new SceneTextItem({ text: 'Hello' });
        const sceneObjectWithVariable = new SceneTextItem({ text: '$A - $B', key: '' });

        const scene = new SceneFlexLayout({
          $variables: new SceneVariableSet({ variables: [B, A] }),
          children: [new SceneFlexItem({ body: helloText }), new SceneFlexItem({ body: sceneObjectWithVariable })],
        });

        render(<scene.Component model={scene} />);

        expect(screen.getByText('Hello')).toBeInTheDocument();

        act(() => {
          A.signalUpdateCompleted();
          B.signalUpdateCompleted();
        });

        expect(screen.getByText('AA - AAA')).toBeInTheDocument();
        expect((helloText as any).renderCount).toBe(2);
        expect((sceneObjectWithVariable as any).renderCount).toBe(3);

        act(() => {
          B.changeValueTo('B');
        });

        expect(screen.getByText('AA - B')).toBeInTheDocument();
        expect((helloText as any).renderCount).toBe(2);
        expect((sceneObjectWithVariable as any).renderCount).toBe(4);
      });
    });
  });

  describe('When activated with variables update at the same time', () => {
    it('Should not start variables multiple times', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const B = new TestVariable({ name: 'B', query: 'B.*', value: '', text: '', options: [] });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A, B] }),
      });

      scene.activate();

      // Should start variables
      expect(A.state.loading).toBe(true);
      expect(B.state.loading).toBe(true);
      expect(A.getValueOptionsCount).toBe(1);

      // Complete the second one
      B.signalUpdateCompleted();

      // When B complete should not start another instance of A
      expect(A.getValueOptionsCount).toBe(1);
    });
  });

  describe('When re-activated variables should not reload if current values are ok', () => {
    it('Should not update variables again when re-activated when nothing has changed', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const B = new TestVariable({ name: 'B', query: 'A.$A', value: '', text: '', options: [] });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A, B] }),
      });

      const deactivateScene = scene.activate();

      A.signalUpdateCompleted();
      B.signalUpdateCompleted();

      expect(A.getValueOptionsCount).toBe(1);

      deactivateScene();
      scene.activate();

      expect(A.state.loading).toBe(false);
      expect(A.getValueOptionsCount).toBe(1);
    });

    it('Should not update variables again when value changed to valid value', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A] }),
      });

      const deactivate = scene.activate();

      A.signalUpdateCompleted();

      deactivate();

      A.changeValueTo('AB');

      scene.activate();

      expect(A.state.loading).toBe(false);
      expect(A.getValueOptionsCount).toBe(1);
    });

    it('Should update dependent variables if value changed while deactivated', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const B = new TestVariable({ name: 'B', query: 'A.$A', value: '', text: '', options: [] });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A, B] }),
      });

      const deactivateScene = scene.activate();

      A.signalUpdateCompleted();
      B.signalUpdateCompleted();

      expect(A.getValueOptionsCount).toBe(1);

      deactivateScene();

      A.changeValueTo('AB');

      scene.activate();

      expect(B.state.loading).toBe(true);
      expect(B.getValueOptionsCount).toBe(2);
    });

    it('Should continue update if de-activated during loading', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const B = new TestVariable({ name: 'B', query: 'A.$A', value: '', text: '', options: [] });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A, B] }),
      });

      const deactivateScene = scene.activate();

      A.signalUpdateCompleted();

      deactivateScene();

      scene.activate();

      expect(A.state.loading).toBe(false);
      expect(B.state.loading).toBe(true);
    });
  });

  describe('When variables have change when re-activated broadcast changes', () => {
    it('Should notify only active objects of change', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [], delayMs: 1 });
      const nestedObj = new TestObjectWithVariableDependency({ title: '$A', variableValueChanged: 0 });
      const inActiveSceneObject = new TestObjectWithVariableDependency({ title: '$A', variableValueChanged: 0 });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A] }),
        nested: nestedObj,
        hidden: inActiveSceneObject,
      });

      const deactivateScene = scene.activate();
      const deactivateNestedScene = nestedObj.activate();

      A.signalUpdateCompleted();

      // Deactivate scene and nested object
      deactivateScene();
      deactivateNestedScene();

      A.changeValueTo('AB');

      // reactivate
      scene.activate();
      nestedObj.activate();

      // Should not start loading A again, it has options already
      expect(A.state.loading).toBe(false);
      expect(nestedObj.state.variableValueChanged).toBe(1);
      expect(inActiveSceneObject.state.variableValueChanged).toBe(0);
    });

    it('Should notify scene objects if deactivated during chained update', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [], delayMs: 1 });
      const B = new TestVariable({ name: 'B', query: 'A.$A.*', value: '', text: '', options: [], delayMs: 1 });
      const nestedSceneObject = new TestObjectWithVariableDependency({ title: '$A', variableValueChanged: 0 });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A, B] }),
        nested: nestedSceneObject,
      });

      const deactivateScene = scene.activate();
      const deactivateNestedScene = nestedSceneObject.activate();

      A.signalUpdateCompleted();

      deactivateScene();
      deactivateNestedScene();

      scene.activate();
      nestedSceneObject.activate();

      B.signalUpdateCompleted();

      expect(nestedSceneObject.state.variableValueChanged).toBe(1);
    });

    it('Should handle being deactivated right away', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [], delayMs: 1 });
      const B = new TestVariable({ name: 'B', query: 'A.$A.*', value: '', text: '', options: [], delayMs: 1 });
      const sceneObject = new TestObjectWithVariableDependency({ title: '$A', variableValueChanged: 0 });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A, B] }),
        nested: sceneObject,
      });

      const deactivateScene = scene.activate();
      deactivateScene();

      scene.activate();

      A.signalUpdateCompleted();

      expect(B.state.loading).toBe(true);
    });

    it('Should not updateAndValidate again if current value is valid when value is multi value and ALL value', async () => {
      const A = new TestVariable({
        name: 'A',
        query: 'A.*',
        value: ALL_VARIABLE_VALUE,
        text: ALL_VARIABLE_TEXT,
        options: [],
        delayMs: 1,
        isMulti: true,
      });

      const nestedSceneObject = new TestObjectWithVariableDependency({ title: '$A', variableValueChanged: 0 });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A] }),
        nested: nestedSceneObject,
      });

      const deactivateScene = scene.activate();
      nestedSceneObject.activate();

      A.signalUpdateCompleted();

      deactivateScene();
      scene.activate();

      expect(A.state.loading).toBe(false);
      expect(nestedSceneObject.state.variableValueChanged).toBe(1);
    });
  });

  describe('Notify internal variables of changes ', () => {
    class VariableWithDependency extends SceneObjectBase<SceneVariableState> implements SceneVariable {
      public onReferencedVariableValueChangedCalled = 0;
      protected _variableDependency = new VariableDependencyConfig(this, {
        variableNames: ['A'],
        onReferencedVariableValueChanged: (variable) => this.onReferencedVariableValueChangedCalled++,
      });

      public getValue(): VariableValue | null | undefined {
        return 'A';
      }
    }

    it('Should notify internal variables of changes', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [], delayMs: 0 });
      const B = new VariableWithDependency({ name: 'B', type: 'system' });
      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A, B] }),
      });

      scene.activate();

      expect(B.onReferencedVariableValueChangedCalled).toBe(1);

      A.changeValueTo('AB');

      expect(B.onReferencedVariableValueChangedCalled).toBe(2);
    });
  });

  describe('When variables array changes', () => {
    it('Should start update process', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const B = new TestVariable({ name: 'B', query: 'A.*', value: '', text: '', options: [] });
      const nestedObj = new TestObjectWithVariableDependency({ title: '$B', variableValueChanged: 0 });
      const set = new SceneVariableSet({ variables: [A] });

      const scene = new TestScene({
        $variables: set,
        nested: nestedObj,
      });

      scene.activate();
      nestedObj.activate();

      A.signalUpdateCompleted();

      // No  variable value changed for B yet as it is not part of scene yet
      expect(nestedObj.state.variableValueChanged).toBe(0);

      // Update state with a new variable
      set.setState({ variables: [A, B] });

      // Should not start loading A again, it has options already
      expect(A.state.loading).toBe(false);
      // Should start B
      expect(B.state.loading).toBe(true);

      B.signalUpdateCompleted();

      // Depenedent scene object notified of change
      expect(nestedObj.state.variableValueChanged).toBe(1);
    });
  });

  describe('Refreshing time range dependant variables', () => {
    it('updates variables in order', () => {
      const A = new TestVariable({
        name: 'A',
        query: 'A.*',
        value: '',
        text: '',
        options: [],
        refresh: VariableRefresh.onTimeRangeChanged,
      });
      const B = new TestVariable({ name: 'B', query: 'A.$A', value: '', text: '', options: [] });
      const C = new TestVariable({
        name: 'C',
        query: 'A.$A.$B.*',
        value: '',
        text: '',
        options: [],
        refresh: VariableRefresh.onTimeRangeChanged,
      });

      const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [C, B, A] }),
        $timeRange: timeRange,
      });

      scene.activate();
      A.signalUpdateCompleted();
      B.signalUpdateCompleted();
      C.signalUpdateCompleted();

      expect(A.state.loading).toBe(false);
      expect(B.state.loading).toBe(false);
      expect(C.state.loading).toBe(false);

      timeRange.setState({ from: 'now-2h', to: 'now' });

      expect(A.state.loading).toBe(true);
      expect(B.state.loading).toBe(false);
      expect(C.state.loading).toBe(false);

      A.signalUpdateCompleted();
      expect(A.state.loading).toBe(false);
      expect(B.state.loading).toBe(false);
      expect(C.state.loading).toBe(true);

      C.signalUpdateCompleted();
      expect(A.state.loading).toBe(false);
      expect(B.state.loading).toBe(false);
      expect(C.state.loading).toBe(false);
    });
  });

  describe('isVariableLoadingOrWaitingToUpdate', () => {
    it('Should return true when variable is in state loading but not in update queue', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [], delayMs: 0 });

      const set = new SceneVariableSet({ variables: [A] });
      const scene = new TestScene({ $variables: set });

      scene.activate();

      // Should start variables with no dependencies
      expect(A.state.loading).toBe(false);

      A.setState({ loading: true });

      expect(set.isVariableLoadingOrWaitingToUpdate(A)).toBe(true);
    });

    it('Should return true when loading or waiting to update', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const B = new TestVariable({ name: 'B', query: 'A.$A', value: '', text: '', options: [] });

      const set = new SceneVariableSet({ variables: [A, B] });
      const scene = new TestScene({ $variables: set });

      scene.activate();

      // Should start variables with no dependencies
      expect(A.state.loading).toBe(true);
      expect(B.state.loading).toBe(undefined);

      expect(set.isVariableLoadingOrWaitingToUpdate(A)).toBe(true);
      expect(set.isVariableLoadingOrWaitingToUpdate(B)).toBe(true);

      A.signalUpdateCompleted();
      expect(set.isVariableLoadingOrWaitingToUpdate(A)).toBe(false);
      expect(set.isVariableLoadingOrWaitingToUpdate(B)).toBe(true);
    });

    it('Should return true if a dependency is loading', async () => {
      const A = new TestVariable({
        name: 'A',
        query: 'A.*',
        value: '',
        text: '',
        options: [],
        // this refresh option is important for this test
        refresh: VariableRefresh.onTimeRangeChanged,
      });

      const B = new TestVariable({ name: 'B', query: 'A.$A', value: '', text: '', options: [] });
      const set = new SceneVariableSet({ variables: [A, B] });
      const timeRange = new SceneTimeRange();
      const scene = new TestScene({ $variables: set, $timeRange: timeRange });

      scene.activate();

      A.signalUpdateCompleted();
      B.signalUpdateCompleted();

      // Now change time range
      timeRange.onRefresh();

      // Now verify that only A is loading
      expect(A.state.loading).toBe(true);
      expect(B.state.loading).toBe(false);

      // B should still return true here as it's dependency is loading
      expect(set.isVariableLoadingOrWaitingToUpdate(B)).toBe(true);
    });

    it('Should check ancestor set for LocalValueVariable', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const scopedA = new LocalValueVariable({ name: 'A', value: 'AA' });

      const innerSet = new SceneVariableSet({
        variables: [scopedA],
      });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A] }),
        nested: new TestScene({
          $variables: innerSet,
        }),
      });

      scene.activate();
      scene.state.nested?.activate();

      expect(innerSet.isVariableLoadingOrWaitingToUpdate(scopedA)).toBe(true);

      A.signalUpdateCompleted();

      expect(innerSet.isVariableLoadingOrWaitingToUpdate(scopedA)).toBe(false);
    });

    describe('When RENDER_BEFORE_ACTIVATION = true', () => {
      beforeAll(() => (SceneObjectBase.RENDER_BEFORE_ACTIVATION_DEFAULT = true));
      afterAll(() => (SceneObjectBase.RENDER_BEFORE_ACTIVATION_DEFAULT = false));

      it('Should return true if variable needs update / validation', async () => {
        const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
        const set = new SceneVariableSet({ variables: [A] });

        expect(set.isVariableLoadingOrWaitingToUpdate(A)).toBe(true);
      });

      it('Should return false if variable does not need update / validation', async () => {
        const A = new ObjectVariable({ name: 'A', value: { test: 'value' }, type: 'custom' });
        const set = new SceneVariableSet({ variables: [A] });

        expect(set.isVariableLoadingOrWaitingToUpdate(A)).toBe(false);
      });
    });
  });

  describe('When variable throws error', () => {
    const origError = console.error;
    beforeEach(() => (console.error = jest.fn()));
    afterEach(() => (console.error = origError));

    it('Should start update process', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [], throwError: 'Danger!' });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A] }),
      });

      scene.activate();

      expect(A.state.error).toBe('Danger!');
    });

    it('Should complete updating chained variables in case of error in all variables', () => {
      const A = new TestVariable({
        name: 'A',
        query: 'A.*',
        value: '',
        text: '',
        options: [],
        throwError: 'Error in A',
      });
      const B = new TestVariable({
        name: 'B',
        query: 'A.$A.*',
        value: '',
        text: '',
        options: [],
        throwError: 'Error in B',
      });
      const C = new TestVariable({
        name: 'C',
        query: 'value=$B',
        value: '',
        text: '',
        options: [],
        throwError: 'Error in C',
      });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [C, B, A] }),
      });

      scene.activate();

      expect(A.state.loading).toBe(false);
      expect(A.state.error).toBe('Error in A');
      expect(B.state.loading).toBe(false);
      expect(B.state.error).toBe('Error in B');
      expect(C.state.loading).toBe(false);
      expect(C.state.error).toBe('Error in C');
    });

    it('Should complete updating chained variables in case of error in the first variable', () => {
      const A = new TestVariable({
        name: 'A',
        query: 'A.*',
        value: '',
        text: '',
        options: [],
        throwError: 'Error in A',
      });
      const B = new TestVariable({
        name: 'B',
        query: 'A.$A.*',
        value: '',
        text: '',
        options: [],
      });
      const C = new TestVariable({
        name: 'C',
        query: 'value=$B',
        value: '',
        text: '',
        options: [],
      });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [C, B, A] }),
      });

      scene.activate();

      expect(A.state.loading).toBe(false);
      expect(A.state.error).toBe('Error in A');

      B.signalUpdateCompleted();
      expect(B.state.loading).toBe(false);
      expect(B.state.value).toBe('');
      expect(B.state.error).toBeUndefined();

      C.signalUpdateCompleted();
      expect(C.state.loading).toBe(false);
      expect(C.state.value).toBe('value=');
      expect(C.state.error).toBeUndefined();
    });
    it('Should complete updating chained variables in case of error in the middle variables', () => {
      const A = new TestVariable({
        name: 'A',
        query: 'A.*',
        value: '',
        text: '',
        options: [],
      });
      const B = new TestVariable({
        name: 'B',
        query: 'A.$A.*',
        value: '',
        text: '',
        options: [],
        throwError: 'Error in B',
      });
      const C = new TestVariable({
        name: 'C',
        query: 'value=$B',
        value: '',
        text: '',
        options: [],
      });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [C, B, A] }),
      });

      scene.activate();
      A.signalUpdateCompleted();

      expect(A.state.loading).toBe(false);
      expect(A.state.error).toBeUndefined();

      expect(B.state.loading).toBe(false);
      expect(B.state.value).toBe('');
      expect(B.state.error).toBe('Error in B');

      C.signalUpdateCompleted();
      expect(C.state.loading).toBe(false);
      expect(C.state.value).toBe('value=');
      expect(C.state.error).toBeUndefined();
    });
  });

  describe('When nesting SceneVariableSet', () => {
    it('Should update variables in dependency order', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const B = new TestVariable({ name: 'B', query: 'A.$A', value: '', text: '', options: [] });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A] }),

        nested: new TestScene({
          $variables: new SceneVariableSet({ variables: [B] }),
        }),
      });

      scene.activate();
      scene.state.nested!.activate();

      // Nested variable on a lower level should wait for it's dependency
      expect(A.state.loading).toBe(true);
      expect(B.state.loading).toBe(undefined);

      // When A on a higher level completes start B on the lower level
      A.signalUpdateCompleted();
      expect(B.state.loading).toBe(true);
    });

    it('Should update lower-level variable when parent changes', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const B = new TestVariable({ name: 'B', query: 'A.$A', value: '', text: '', options: [] });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A] }),

        nested: new TestScene({
          $variables: new SceneVariableSet({ variables: [B] }),
        }),
      });

      scene.activate();
      scene.state.nested!.activate();

      A.signalUpdateCompleted();
      B.signalUpdateCompleted();

      expect(B.state.value).toBe('AAA');

      // Now change variable A
      A.changeValueTo('AB');
      expect(B.state.loading).toBe(true);
    });

    it('When local value overrides parent variable changes on top level should propagate', () => {
      const topLevelVar = new TestVariable({
        name: 'test',
        options: [],
        value: 'B',
        optionsToReturn: [{ label: 'B', value: 'B' }],
        delayMs: 0,
      });

      const nestedScene = new TestObjectWithVariableDependency({
        title: '$test',
        $variables: new SceneVariableSet({
          variables: [new LocalValueVariable({ name: 'test', value: 'nestedValue' })],
        }),
      });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [topLevelVar] }),
        nested: nestedScene,
      });

      activateFullSceneTree(scene);

      nestedScene.doSomethingThatRequiresVariables();
      topLevelVar.changeValueTo('E');

      expect(nestedScene.state.didSomethingCount).toBe(2);
      expect(nestedScene.state.variableValueChanged).toBe(1);
    });
  });

  describe('When changing a dependency while variable is loading', () => {
    it('Should cancel variable and re-start it', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const B = new TestVariable({ name: 'B', query: 'A.$A.*', value: '', text: '', options: [] });
      const C = new TestVariable({ name: 'C', query: 'A.$A.$B.*', value: '', text: '', options: [] });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A, B] }),
        nested: new TestScene({
          $variables: new SceneVariableSet({ variables: [C] }),
        }),
      });

      scene.activate();
      scene.state.nested!.activate();

      A.signalUpdateCompleted();
      expect(B.state.loading).toBe(true);

      // Change A while B is loading
      A.changeValueTo('AB');

      B.signalUpdateCompleted();

      // This verifies that B was cancelled and a new query issued with the new value of A
      expect(B.state.value).toBe('ABA');

      // C should be loading
      expect(C.state.loading).toBe(true);

      B.changeValueTo('ABB');
      C.signalUpdateCompleted();

      // Change B while C is loading (They are on different levels but should behave the same as with A & B)
      expect(C.state.value).toBe('ABBA');
    });
  });
});
