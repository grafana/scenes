import React, { useEffect } from 'react';

import {
  EmbeddedScene,
  SceneAppPageState,
  SceneAppPage,
  SceneObjectBase,
  SceneObjectState,
  sceneGraph,
} from '@grafana/scenes';
import { BusEventWithPayload } from '@grafana/data';
import { Button, Stack, useTheme2 } from '@grafana/ui';

export function getSceneGraphEventsDemo(defaults: SceneAppPageState) {
  return new SceneAppPage({
    ...defaults,
    getScene: () => {
      const childrenKeys = Array.from('ABC');

      const parentScene = new ExampleSceneObject({
        key: 'parentScene',
        children: [
          ...childrenKeys.map((key) => new ExampleSceneObject({ key })),
          new ExampleSceneObject({
            key: 'SUB',
            children: childrenKeys.map((key) => new ExampleSceneObject({ key: `SUB-${key}` })),
          }),
        ],
      });

      return new EmbeddedScene({
        key: 'The Embedded Scene',
        body: parentScene,
      });
    },
  });
}

interface ExampleState extends SceneObjectState {
  children: ExampleSceneObject[];
  recentEvent?: string;
}

class ExampleSceneObject extends SceneObjectBase<ExampleState> {
  constructor(state: Partial<ExampleState>) {
    const behaviors = state.$behaviors || [];
    const children = state.children || [];
    super({
      ...state,
      children,
      $behaviors: [...behaviors, listen],
    });
  }

  static Component = ExampleSceneComponent;
}

const listen = (sceneObject: ExampleSceneObject) => {
  sceneObject.subscribeToEvent(ExampleEvent, (event) => {
    sceneObject.setState({ recentEvent: event.payload });
  });
};

class ExampleEvent extends BusEventWithPayload<string | undefined> {
  public static type = 'example-event';
}

function ExampleSceneComponent({ model }: { model: ExampleSceneObject }) {
  const { key, children, recentEvent } = model.useState();

  const [eventFlash, setEventFlash] = React.useState(false);

  useEffect(() => {
    const subscription = model.subscribeToEvent(ExampleEvent, (event) => {
      setEventFlash(true);
      setTimeout(() => setEventFlash(false), 500);
    });
    return subscription.unsubscribe;
  }, [model, setEventFlash]);

  const theme = useTheme2();

  const parentState = model.parent?.useState();

  const triggerNonBubbleEvent = () => model.publishEvent(new ExampleEvent(`Non-bubble by ${key}`), false);
  const triggerBubbleEvent = () => model.publishEvent(new ExampleEvent(`Bubble by ${key}`), true);
  const clearDescendentEvents = () =>
    sceneGraph.findDescendents(model, ExampleSceneObject).forEach((scene) => scene.setState({ recentEvent: '' }));

  return (
    <div style={{ border: `${theme.colors.border.strong} 4px solid`, borderRadius: 8, padding: 4, margin: 8 }}>
      <h2>
        I am: <em>{key}</em>
      </h2>
      <h4>
        My parent is: <em>{parentState?.key}</em>
      </h4>
      <Stack direction={'column'} alignItems={'flex-start'}>
        <Button fullWidth={false} onClick={triggerBubbleEvent}>
          Bubble
        </Button>
        <Button onClick={triggerNonBubbleEvent}>Non-Bubble</Button>
        <Button onClick={() => model.setState({ recentEvent: '' })}>Clear</Button>
        <Button onClick={clearDescendentEvents}>Clear Descendents</Button>
      </Stack>
      {
        <div
          style={{
            margin: 4,
            border: `${theme.colors.border.weak} solid 2px`,
            transitionDuration: '200ms',
            background: eventFlash ? theme.colors.action.selected : theme.colors.background.primary,
            transform: eventFlash ? 'scale(1.0, 1.5)' : '',
          }}
        >
          {recentEvent && (
            <>
              <h3>Event:</h3>
              <h5>{recentEvent}</h5>
            </>
          )}
        </div>
      }
      {children.length > 0 && (
        <div
          style={{
            border: `${theme.colors.border.medium} 3px solid`,
            borderRadius: 4,
            padding: 4,
            margin: 4,
            display: 'inline-block',
          }}
        >
          Children of {key}:
          <Stack>
            {children.map((child) => (
              <child.Component key={child.state.key} model={child} />
            ))}
          </Stack>
        </div>
      )}
    </div>
  );
}
