import { SceneVariableSet } from '../variables/sets/SceneVariableSet';
import { TestScene } from '../variables/TestScene';
import { TestVariable } from '../variables/variants/TestVariable';
import { ActWhenVariableChanged } from './ActWhenVariableChanged';

describe('ActWhenVariableChanged', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('executes callback when variable changed', () => {
    const behaviorSpy = jest.fn();
    const testVariable = new TestVariable({ name: 'test', value: 'test' });

    const behavior = new ActWhenVariableChanged({
      variableName: 'test',
      onChange: behaviorSpy,
    });

    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [testVariable],
      }),
      $behaviors: [behavior],
    });

    scene.activate();

    expect(behaviorSpy).not.toHaveBeenCalled();

    testVariable.changeValueTo('test2');
    testVariable.signalUpdateCompleted();

    expect(behaviorSpy).toHaveBeenCalledTimes(1);
  });

  it('executes executes cancellation function when variable changed', () => {
    const behaviorSpy = jest.fn();
    const behaviorCancellationSpy = jest.fn();
    const testVariable = new TestVariable({ name: 'test', value: 'test' });

    const behavior = new ActWhenVariableChanged({
      variableName: 'test',
      onChange: () => {
        const timeout = setTimeout(() => {
          behaviorSpy();
        }, 1000);

        return () => {
          clearTimeout(timeout);
          behaviorCancellationSpy();
        };
      },
    });

    const scene = new TestScene({
      $variables: new SceneVariableSet({
        variables: [testVariable],
      }),
      $behaviors: [behavior],
    });

    scene.activate();

    expect(behaviorSpy).not.toHaveBeenCalled();

    testVariable.changeValueTo('test2');
    testVariable.signalUpdateCompleted();

    expect(behaviorSpy).not.toHaveBeenCalled();
    expect(behaviorCancellationSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    testVariable.changeValueTo('test3');
    testVariable.signalUpdateCompleted();

    expect(behaviorSpy).not.toHaveBeenCalled();
    expect(behaviorCancellationSpy).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1001);
    expect(behaviorSpy).toHaveBeenCalledTimes(1);
  });
});
