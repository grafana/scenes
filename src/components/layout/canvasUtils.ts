import Selecto from 'selecto';
import Moveable from 'moveable';

export function initMoveable(container: HTMLDivElement, targetElements: HTMLElement[]) {
  const allowChanges = true;

  const selecto = new Selecto({
    container: container,
    rootContainer: container,
    selectableTargets: targetElements,
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

  return { selecto, moveable };
}
