import { render, screen } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';

import { SceneCanvasText } from '../../components/SceneCanvasText';
import { SceneFlexLayout } from '../../components/layout/SceneFlexLayout';
import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneObjectStatePlain, SceneLayoutChildState, SceneObject } from '../../core/types';
import { TestVariable } from '../variants/TestVariable';

import { SceneVariableSet } from './SceneVariableSet';
import { VariableDependencyConfig } from '../VariableDependencyConfig';
import { ALL_VARIABLE_TEXT, ALL_VARIABLE_VALUE } from '../constants';

interface TestSceneState extends SceneObjectStatePlain {
  nested?: SceneObject;
}

class TestScene extends SceneObjectBase<TestSceneState> {}

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
  });

  describe('When deactivated', () => {
    it('Should cancel running variable queries', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const scene = new TestScene({ $variables: new SceneVariableSet({ variables: [A] }) });

      scene.activate();
      expect(A.isGettingValues).toBe(true);

      scene.deactivate();
      expect(A.isGettingValues).toBe(false);
    });

    it('Can re-activate after deactivated', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
      const scene = new TestScene({ $variables: new SceneVariableSet({ variables: [A] }) });

      // Active and complete first variable
      scene.activate();
      expect(A.isGettingValues).toBe(true);

      // Deactivate and reactivate
      scene.deactivate();
      expect(A.isGettingValues).toBe(false);

      // Reactivate and complete A again
      scene.activate();
      expect(A.isGettingValues).toBe(true);
    });

    describe('When update process completed and variables have changed values', () => {
      it('Should trigger re-renders of dependent scene objects', async () => {
        const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
        const B = new TestVariable({ name: 'B', query: 'A.$A.*', value: '', text: '', options: [] });

        const helloText = new SceneCanvasText({ text: 'Hello' });
        const sceneObjectWithVariable = new SceneCanvasText({ text: '$A - $B' });

        const scene = new SceneFlexLayout({
          $variables: new SceneVariableSet({ variables: [B, A] }),
          children: [helloText, sceneObjectWithVariable],
        });

        render(<scene.Component model={scene} />);

        expect(screen.getByText('Hello')).toBeInTheDocument();

        act(() => {
          A.signalUpdateCompleted();
          B.signalUpdateCompleted();
        });

        expect(screen.getByText('AA - AAA')).toBeInTheDocument();
        expect((helloText as any)._renderCount).toBe(1);
        expect((sceneObjectWithVariable as any)._renderCount).toBe(2);

        act(() => {
          B.changeValueTo('B');
        });

        expect(screen.getByText('AA - B')).toBeInTheDocument();
        expect((helloText as any)._renderCount).toBe(1);
        expect((sceneObjectWithVariable as any)._renderCount).toBe(3);
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

      scene.activate();

      A.signalUpdateCompleted();
      B.signalUpdateCompleted();

      expect(A.getValueOptionsCount).toBe(1);

      scene.deactivate();
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

      scene.activate();

      A.signalUpdateCompleted();
      B.signalUpdateCompleted();

      expect(A.getValueOptionsCount).toBe(1);

      scene.deactivate();

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

      scene.activate();

      A.signalUpdateCompleted();

      scene.deactivate();
      scene.activate();

      expect(A.state.loading).toBe(false);
      expect(B.state.loading).toBe(true);
    });
  });

  describe('When variables have change when re-activated broadcast changes', () => {
    it('Should notify scene objects of change', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [], delayMs: 1 });
      const sceneObject = new TestSceneObect({ title: '$A', variableValueChanged: 0 });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A] }),
        nested: sceneObject,
      });

      scene.activate();

      A.signalUpdateCompleted();

      scene.deactivate();

      A.changeValueTo('AB');

      scene.activate();

      expect(sceneObject.state.variableValueChanged).toBe(2);
    });

    it('Should notify scene objects if deactivated during chained update', async () => {
      const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [], delayMs: 1 });
      const B = new TestVariable({ name: 'B', query: 'A.$A.*', value: '', text: '', options: [], delayMs: 1 });
      const sceneObject = new TestSceneObect({ title: '$A', variableValueChanged: 0 });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A, B] }),
        nested: sceneObject,
      });

      scene.activate();

      A.signalUpdateCompleted();

      scene.deactivate();
      scene.activate();

      B.signalUpdateCompleted();

      expect(sceneObject.state.variableValueChanged).toBe(1);
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

      const sceneObject = new TestSceneObect({ title: '$A', variableValueChanged: 0 });

      const scene = new TestScene({
        $variables: new SceneVariableSet({ variables: [A] }),
        nested: sceneObject,
      });

      scene.activate();

      A.signalUpdateCompleted();

      scene.deactivate();
      scene.activate();

      expect(A.state.loading).toBe(false);
      expect(sceneObject.state.variableValueChanged).toBe(1);
    });
  });
});

interface TestSceneObjectState extends SceneLayoutChildState {
  title: string;
  variableValueChanged: number;
}

export class TestSceneObect extends SceneObjectBase<TestSceneObjectState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    statePaths: ['title'],
    onReferencedVariableValueChanged: () => {
      this.setState({ variableValueChanged: this.state.variableValueChanged + 1 });
    },
  });
}
