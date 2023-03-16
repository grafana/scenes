import Moveable from 'moveable';
import React, { CSSProperties } from 'react';
import Selecto from 'selecto';

import { SceneObjectBase } from '../../core/SceneObjectBase';
import { SceneComponentProps, SceneLayoutChild, SceneLayoutState, SceneLayout } from '../../core/types';

interface SceneCanvasLayoutRootState extends SceneLayoutState {}

export class SceneCanvasRootLayout extends SceneObjectBase<SceneCanvasLayoutRootState> implements SceneLayout {
  public static Component = CanvasLayoutRenderer;
  public static Editor = CanvasRootLayoutEditor;

  public moveable?: Moveable;
  public selecto?: Selecto;

  public itemRegistry = new Map<string, SceneLayoutChild>();

  public isDraggable(): boolean {
    return false;
  }

  public initializeMoveable(container: HTMLDivElement) {
    if (!container) {
      return;
    }

    const allowChanges = true;

    const selecto = new Selecto({
      container: container,
      rootContainer: container,
      selectableTargets: ['.selectable'],
      toggleContinueSelect: 'shift',
      selectFromInside: false,
      hitRate: 0,
    });

    const moveable = new Moveable(container, {
      draggable: allowChanges,
      resizable: allowChanges,
      origin: false,
    })
      .on('drag', (event) => {
        event.target.style.transform = event.transform;
      })
      .on('dragGroup', (e) => {
        for (let event of e.events) {
          event.target.style.transform = event.transform;
        }
      })
      .on('dragEnd', (event) => {
        // Get state of node and save result to model placement
        console.log('dragEnd', event, { event });

        const key = event.target.dataset.key;

        if (!key) {
          return;
        }

        const item = this.itemRegistry.get(key);

        console.log(item);
        // update item here
      })
      .on('dragGroupEnd', (e) => {
        for (let event of e.events) {
          // Get state of node and save result to model placement
        }
      })
      // TODO: Figure out resize events
      .on('resize', (event) => {});

    let targets: Array<HTMLElement | SVGElement> = [];
    selecto
      .on('dragStart', (event) => {
        const selectedTarget = event.inputEvent.target;

        const isTargetMoveableElement =
          moveable.isMoveableElement(selectedTarget) ||
          targets.some((target) => target === selectedTarget || target.contains(selectedTarget));

        const isTargetAlreadySelected = selecto
          ?.getSelectedTargets()
          .includes(selectedTarget.parentElement.parentElement);

        if (isTargetMoveableElement || isTargetAlreadySelected || !allowChanges) {
          // Prevent drawing selection box when selected target is a moveable element or already selected
          event.stop();
        }
      })
      .on('selectEnd', (event) => {
        targets = event.selected;
        moveable.target = event.selected;
        if (event.isDragStart) {
          event.inputEvent.preventDefault();
          event.data.timer = setTimeout(() => {
            moveable!.dragStart(event.inputEvent);
          });
        }
      })
      .on('dragEnd', (event) => {
        clearTimeout(event.data.timer);
      });

    this.moveable = moveable;
    this.selecto = selecto;
  }
}

function CanvasLayoutRenderer({ model, isEditing }: SceneComponentProps<SceneCanvasRootLayout>) {
  const { children } = model.useState();
  const style: CSSProperties = {
    flexGrow: 1,
    flexDirection: 'row',
    display: 'flex',
    gap: '8px',
    alignContent: 'baseline',
  };

  return (
    <>
      <div style={style} ref={(el) => el && model.initializeMoveable(el)}>
        {children.map((item) => {
          return <item.Component model={item} isEditing={isEditing} key={item.state.key} />;
        })}
      </div>
    </>
  );
}

// @TODO implement
function CanvasRootLayoutEditor({ model }: SceneComponentProps<SceneCanvasRootLayout>) {
  return <div>EDITOR</div>;
}
